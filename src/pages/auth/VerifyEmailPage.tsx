import { Navigate, useLocation } from 'react-router-dom';
import { VerifyEmailModal } from '../../components/VerifyEmailModal';
import { dashboardPathFor } from '../../features/auth/roles';
import { needsEmailVerification } from '../../features/auth/emailGate';
import { useAuth } from '../../hooks/useAuth';
import './VerifyEmailPage.css';

/** Only same-site paths are accepted as the place to continue to. */
const safePath = (value: unknown): string | null =>
  typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : null;

/**
 * The step between creating or signing in to an account and the dashboard: enter the code that was
 * emailed. It cannot be skipped. Once the email is confirmed (or if there is nothing to confirm)
 * the person continues to the page they were heading to.
 */
export function VerifyEmailPage() {
  const { session, logout } = useAuth();
  const location = useLocation();
  const next = safePath((location.state as { next?: unknown } | null)?.next);

  if (!session) return <Navigate to="/sign-in" replace />;
  if (!needsEmailVerification(session.user)) {
    return <Navigate to={next ?? dashboardPathFor(session.user.role)} replace />;
  }

  return (
    <main className="verify-page">
      <VerifyEmailModal required onSignOut={logout} />
    </main>
  );
}
