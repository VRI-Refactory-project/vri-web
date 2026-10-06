import { createContext } from 'react';
import type { AuthSession, SelectableRole } from '../../types';

export interface AuthState {
  session: AuthSession | null;
  selectedRole: SelectableRole | null;
  selectRole: (role: SelectableRole) => void;
  login: (session: AuthSession) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthState | null>(null);
