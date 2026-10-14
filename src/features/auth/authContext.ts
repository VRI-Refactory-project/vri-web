import { createContext } from 'react';
import type { AuthSession, AuthUser, SelectableRole } from '../../types';

export interface AuthState {
  session: AuthSession | null;
  selectedRole: SelectableRole | null;
  selectRole: (role: SelectableRole) => void;
  login: (session: AuthSession) => void;
  logout: () => void;
  /** Updates fields of the signed-in user, e.g. after their email is verified. */
  updateUser: (user: Partial<AuthUser>) => void;
}

export const AuthContext = createContext<AuthState | null>(null);
