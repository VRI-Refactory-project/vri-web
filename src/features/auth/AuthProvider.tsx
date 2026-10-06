import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { setAuthToken } from '../../services/api';
import type { AuthSession, SelectableRole } from '../../types';
import { AuthContext } from './authContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [selectedRole, setSelectedRole] = useState<SelectableRole | null>(null);

  const login = useCallback((s: AuthSession) => {
    setAuthToken(s.token);
    setSession(s);
  }, []);
  const logout = useCallback(() => {
    setAuthToken(null);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, selectedRole, selectRole: setSelectedRole, login, logout }),
    [session, selectedRole, login, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
