import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ApiError, setAuthToken, setRefreshHandler } from '../../services/api';
import { getCurrentUser, refreshAccessToken, revokeSession } from '../../services/auth';
import type { AuthSession, AuthUser, SelectableRole } from '../../types';
import { AuthContext } from './authContext';

const STORAGE_KEY = 'vri.session';
// When the person signed in (milliseconds). Kept apart from the session so AuthSession stays the same.
const STARTED_KEY = 'vri.session.startedAt';
// A signed-in person stays signed in for 7 days after signing in, then has to sign in again.
// The server enforces the same limit on the refresh token (REFRESH_TOKEN_LIFETIME, 7 days, in vri-api).
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// localStorage is shared by every tab of the site, so a new tab finds the session and goes straight
// to the dashboard. It can be unavailable (private mode, blocked storage), so every access is wrapped.
function clearStored() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STARTED_KEY);
  } catch {
    /* storage unavailable */
  }
}

function startedAt(): number {
  try {
    return Number(localStorage.getItem(STARTED_KEY)) || 0;
  } catch {
    return 0;
  }
}

function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const started = startedAt();
    if (started && Date.now() - started > SESSION_MAX_AGE_MS) {
      // More than 7 days since sign-in: the session is over.
      clearStored();
      return null;
    }
    // A session saved without a start time is counted from now.
    if (!started) localStorage.setItem(STARTED_KEY, String(Date.now()));
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

// `newSignIn` is true only when the person actually signs in. Refreshing a token or editing the
// profile saves the session again but must not restart the 7 days.
function saveSession(session: AuthSession | null, newSignIn = false) {
  try {
    if (!session) {
      clearStored();
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    if (newSignIn) localStorage.setItem(STARTED_KEY, String(Date.now()));
  } catch {
    /* storage unavailable: the session just lasts until reload */
  }
}

function restoreSession(): AuthSession | null {
  const session = loadSession();
  // Runs before any child renders, so early API calls already carry the token.
  setAuthToken(session?.token ?? null);
  return session;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(restoreSession);
  const [selectedRole, setSelectedRole] = useState<SelectableRole | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  // A session found in storage has not been proven yet. Until the server confirms it, treat it as unchecked.
  const [checking, setChecking] = useState(session !== null);
  const sessionRef = useRef(session);
  // Counts sign-ins and sign-outs, so a slow check of an old stored session cannot overwrite a newer one.
  const generation = useRef(0);

  const apply = useCallback((next: AuthSession | null, newSignIn = false) => {
    sessionRef.current = next;
    setAuthToken(next?.token ?? null);
    saveSession(next, newSignIn);
    setSession(next);
  }, []);

  const login = useCallback(
    (s: AuthSession) => {
      setSessionExpired(false);
      generation.current += 1;
      apply(s, true);
    },
    [apply],
  );
  const logout = useCallback(() => {
    setSessionExpired(false);
    // Cancel the refresh token on the server too, so a copy of it stops working.
    const refresh = sessionRef.current?.refreshToken;
    if (refresh) void revokeSession(refresh);
    generation.current += 1;
    apply(null);
  }, [apply]);
  const updateUser = useCallback(
    (user: Partial<AuthUser>) => {
      const current = sessionRef.current;
      if (current) apply({ ...current, user: { ...current.user, ...user } });
    },
    [apply],
  );

  // When an access token expires, quietly get a new one. If the server refuses the refresh token
  // the session is over, so sign the user out and remember why. A network failure is not that:
  // the person stays signed in and can try again once they are back online.
  useEffect(() => {
    setRefreshHandler(async () => {
      const current = sessionRef.current;
      if (!current) return null;
      try {
        const res = await refreshAccessToken(current.refreshToken);
        apply({ ...current, token: res.access, refreshToken: res.refresh ?? current.refreshToken });
        return res.access;
      } catch (err) {
        if (err instanceof ApiError && [400, 401, 403].includes(err.status)) {
          apply(null);
          setSessionExpired(true);
        }
        return null;
      }
    });
    return () => setRefreshHandler(null);
  }, [apply]);

  // Check a session restored from storage with the server before trusting it. This also replaces the
  // stored name, role and email status with what the server says. A rejected token ends the session;
  // a network failure does not (the person may just be offline, and the server still guards the data).
  useEffect(() => {
    if (!sessionRef.current) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    const startedAtGeneration = generation.current;
    const stillCurrent = () => !cancelled && startedAtGeneration === generation.current;
    getCurrentUser()
      .then((user) => {
        const current = sessionRef.current;
        if (stillCurrent() && current) apply({ ...current, user });
      })
      .catch((err) => {
        if (stillCurrent() && err instanceof ApiError && err.status === 401) apply(null);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apply]);

  // End the session 7 days after sign-in, even if the tab stays open the whole time.
  // Depends on the token, so a new sign-in starts a fresh timer.
  const accessToken = session?.token ?? null;
  useEffect(() => {
    if (!accessToken) return;
    const started = startedAt() || Date.now();
    const remaining = Math.max(started + SESSION_MAX_AGE_MS - Date.now(), 0);
    const timer = window.setTimeout(() => {
      generation.current += 1;
      apply(null);
      setSessionExpired(true);
    }, remaining);
    return () => window.clearTimeout(timer);
  }, [accessToken, apply]);

  // Keep every open tab in step. Signing out in one tab signs out the others, and signing in (or a
  // renewed token) in one tab is picked up by the others. The browser only sends this event to the
  // tabs that did not make the change, so it cannot loop.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== null && e.key !== STORAGE_KEY && e.key !== STARTED_KEY) return;
      const stored = loadSession();
      if (JSON.stringify(stored) === JSON.stringify(sessionRef.current)) return;
      generation.current += 1;
      sessionRef.current = stored;
      setAuthToken(stored?.token ?? null);
      setSession(stored);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // The browser's Back and Forward buttons never end a session. A session ends only when the person
  // presses Sign out, 7 days pass since they signed in, or the server refuses the token. Signed-in
  // people are kept off the sign-in and sign-up pages by GuestRoute instead.

  const value = useMemo(
    () => ({
      session,
      sessionExpired,
      checking,
      selectedRole,
      selectRole: setSelectedRole,
      login,
      logout,
      updateUser,
    }),
    [session, sessionExpired, checking, selectedRole, login, logout, updateUser],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
