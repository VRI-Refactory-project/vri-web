import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ApiError, setAuthToken, setRefreshHandler } from '../../services/api';
import { getCurrentUser, refreshAccessToken, revokeSession } from '../../services/auth';
import type { AuthSession, AuthUser, SelectableRole } from '../../types';
import { AuthContext } from './authContext';

const STORAGE_KEY = 'vri.session';

// sessionStorage keeps the user signed in across page reloads but not after the tab is closed.
// It can be unavailable (private mode, blocked storage), so every access is wrapped.
function loadSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

function saveSession(session: AuthSession | null) {
  try {
    if (session) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(STORAGE_KEY);
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

  const apply = useCallback((next: AuthSession | null) => {
    sessionRef.current = next;
    setAuthToken(next?.token ?? null);
    saveSession(next);
    setSession(next);
  }, []);

  const login = useCallback(
    (s: AuthSession) => {
      setSessionExpired(false);
      generation.current += 1;
      apply(s);
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
    const startedAt = generation.current;
    const stillCurrent = () => !cancelled && startedAt === generation.current;
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

  // The browser's Back and Forward buttons never end a session. A session ends only when the person
  // presses Sign out, the tab is closed, or the server refuses the token. Signed-in people are kept
  // off the sign-in and sign-up pages by GuestRoute instead.

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
