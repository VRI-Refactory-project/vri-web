import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { setAuthToken, setRefreshHandler } from '../../services/api';
import { refreshAccessToken } from '../../services/auth';
import type { AuthSession, SelectableRole } from '../../types';
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
  const sessionRef = useRef(session);

  const apply = useCallback((next: AuthSession | null) => {
    sessionRef.current = next;
    setAuthToken(next?.token ?? null);
    saveSession(next);
    setSession(next);
  }, []);

  const login = useCallback((s: AuthSession) => apply(s), [apply]);
  const logout = useCallback(() => apply(null), [apply]);

  // When an access token expires, quietly get a new one; if that fails, sign the user out.
  useEffect(() => {
    setRefreshHandler(async () => {
      const current = sessionRef.current;
      if (!current) return null;
      try {
        const res = await refreshAccessToken(current.refreshToken);
        apply({ ...current, token: res.access, refreshToken: res.refresh ?? current.refreshToken });
        return res.access;
      } catch {
        apply(null);
        return null;
      }
    });
    return () => setRefreshHandler(null);
  }, [apply]);

  const value = useMemo(
    () => ({ session, selectedRole, selectRole: setSelectedRole, login, logout }),
    [session, selectedRole, login, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
