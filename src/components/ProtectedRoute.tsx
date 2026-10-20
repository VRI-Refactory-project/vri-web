import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { needsEmailVerification } from '../features/auth/emailGate';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '../types';

/** Role-based route guard (V2-066 / NEW-02). */
export function ProtectedRoute({
  allow,
  requireVerifiedEmail = true,
}: {
  allow: Role[];
  /** Off only for steps that come before email verification in a sign-up (certificate upload). */
  requireVerifiedEmail?: boolean;
}) {
  const { session } = useAuth();
  const location = useLocation();

  // TEMP DEV BYPASS: remove before committing
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('dev'))
    return <Outlet />;

  // Remember where the person was going, so signing in again can bring them back to it.
  if (!session) {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to="/sign-in" replace state={{ from }} />;
  }
  if (!allow.includes(session.user.role)) return <Navigate to="/" replace />;
  // Email has to be confirmed before anything inside the app, then they carry on to where they were.
  if (requireVerifiedEmail && needsEmailVerification(session.user)) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to="/verify-email" replace state={{ next }} />;
  }
  return <Outlet />;
}
