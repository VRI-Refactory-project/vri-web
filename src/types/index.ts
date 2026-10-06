export type Role = 'deaf' | 'interpreter' | 'institution' | 'admin';

/** Roles a new user can pick on first open (V2-066). Admins are never self-registered. */
export type SelectableRole = Exclude<Role, 'admin'>;

export interface AuthUser {
  id: string;
  name: string;
  role: Role;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}
