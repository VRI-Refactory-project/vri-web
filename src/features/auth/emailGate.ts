import type { AuthUser } from '../../types';

/**
 * True when this person must confirm their email before using the app: the account has an email
 * address that is not verified yet. Phone-only accounts, admins, and an API that does not report
 * verification (undefined) are never asked.
 */
export function needsEmailVerification(user: AuthUser): boolean {
  return user.role !== 'admin' && !!user.email && user.emailVerified === false;
}
