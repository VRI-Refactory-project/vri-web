export type Role = 'deaf' | 'interpreter' | 'institution' | 'admin';

/** Roles a new user can pick on first open (V2-066). Admins are never self-registered. */
export type SelectableRole = Exclude<Role, 'admin'>;

/** Inside an institution account: ADMIN runs the institution, STAFF books interpreters for it. */
export type InstitutionRole = 'ADMIN' | 'STAFF';

export interface AuthUser {
  id: string;
  name: string;
  role: Role;
  /** True after an admin reset: the backend only allows changing the password until then. */
  mustChangePassword: boolean;
  /** The email address on the account, if any. Phone-only accounts have none to verify. */
  email?: string | null;
  /** Undefined when the API is older than email verification: treated as "nothing to ask". */
  emailVerified?: boolean;
  /** Only set for institution accounts. Missing is treated as ADMIN, the owner of the account. */
  institutionRole?: InstitutionRole | null;
}

export interface AuthSession {
  /** Short-lived access token, sent as `Authorization: Bearer <token>`. */
  token: string;
  /** Long-lived token used to get a new access token when the old one expires. */
  refreshToken: string;
  user: AuthUser;
}
