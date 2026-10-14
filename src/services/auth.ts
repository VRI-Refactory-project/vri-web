import { api } from './api';
import { toRole } from '../features/auth/roles';
import type { AuthSession, AuthUser } from '../types';

// Shapes returned by the Django API (apps/accounts: LoginView, RefreshView, UserSerializer).
interface ApiUser {
  id: number;
  full_name: string;
  phone_number: string;
  email: string | null;
  role: string;
  must_change_password: boolean;
  email_verified?: boolean;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: ApiUser;
}

interface RefreshResponse {
  access: string;
  refresh?: string;
}

export function toAuthUser(user: ApiUser): AuthUser {
  return {
    id: String(user.id),
    name: user.full_name,
    role: toRole(user.role),
    mustChangePassword: user.must_change_password,
    email: user.email,
    emailVerified: user.email_verified,
  };
}

export const toSession = (res: LoginResponse): AuthSession => ({
  token: res.access,
  refreshToken: res.refresh,
  user: toAuthUser(res.user),
});

/** `identifier` is a phone number (0772123456 or +256772123456) or an email address. */
export async function signIn(identifier: string, password: string): Promise<AuthSession> {
  const res = await api<LoginResponse>('/api/v1/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });
  return toSession(res);
}

/** Exchanges a refresh token for a new access token. */
export const refreshAccessToken = (refresh: string) =>
  api<RefreshResponse>('/api/v1/auth/token/refresh/', {
    method: 'POST',
    body: JSON.stringify({ refresh }),
  });

/**
 * Account recovery (V2-008), step 1: email a 6-digit code. The API gives the same answer whether
 * or not the account exists, so the page must not claim that an email was definitely sent.
 */
export const requestRecovery = (identifier: string) =>
  api<{ detail: string }>('/api/v1/auth/recovery/request/', {
    method: 'POST',
    body: JSON.stringify({ identifier }),
  });

/** Step 2: send the code and a new password. On success the API signs the user in. */
export async function confirmRecovery(
  identifier: string,
  code: string,
  newPassword: string,
): Promise<AuthSession> {
  const res = await api<LoginResponse>('/api/v1/auth/recovery/confirm/', {
    method: 'POST',
    body: JSON.stringify({ identifier, code, new_password: newPassword }),
  });
  return toSession(res);
}

/** Email verification: send the signed-in user a new 6-digit code. */
export const resendEmailCode = () =>
  api<{ detail: string }>('/api/v1/auth/email/resend/', { method: 'POST' });

/** Email verification: check the code from the email. Returns the updated user. */
export async function confirmEmailCode(code: string): Promise<AuthUser> {
  const user = await api<ApiUser>('/api/v1/auth/email/verify/', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
  return toAuthUser(user);
}
