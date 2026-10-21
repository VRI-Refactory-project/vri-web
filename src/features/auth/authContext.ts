import { createContext } from 'react';
import type { AuthSession, AuthUser, SelectableRole } from '../../types';

export interface AuthState {
  session: AuthSession | null;
  /** True when the server ended the session (the refresh token expired or was refused), as
   *  opposed to the person signing out. Sign-in uses it to explain why they are back there. */
  sessionExpired?: boolean;
  /** True while a session restored from browser storage is being checked with the server. Pages
   *  that need a signed-in user wait for this to end before deciding anything. */
  checking?: boolean;
  selectedRole: SelectableRole | null;
  selectRole: (role: SelectableRole) => void;
  login: (session: AuthSession) => void;
  logout: () => void;
  /** Updates fields of the signed-in user, e.g. after their email is verified. */
  updateUser: (user: Partial<AuthUser>) => void;
}

export const AuthContext = createContext<AuthState | null>(null);
