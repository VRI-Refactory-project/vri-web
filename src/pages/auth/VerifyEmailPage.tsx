import { Navigate, useLocation } from 'react-router-dom';
import { VerifyEmailModal } from '../../components/VerifyEmailModal';
import { dashboardPathFor } from '../../features/auth/roles';
import { needsEmailVerification } from '../../features/auth/emailGate';
import { useAuth } from '../../hooks/useAuth';
import './VerifyEmailPage.css';

/** Only same-site paths are accepted as the place to continue to. */
const safePath = (value: unknown): string | null =>
  typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : null;

export function VerifyEmailPage() {
  const { session, logout } = useAuth();
  const location = useLocation();

  const storedNext = sessionStorage.getItem('nextAfterVerification');
  const stateNext = safePath((location.state as { next?: unknown } | null)?.next);
  const next = safePath(storedNext) ?? stateNext;

  if (!session) return <Navigate to="/sign-in" replace />;

  if (!needsEmailVerification(session.user)) {
    if (next) {
      sessionStorage.removeItem('nextAfterVerification');
    }
    return <Navigate to={next ?? dashboardPathFor(session.user.role)} replace />;
  }

  return (
    <main className="verify-page">
      <VerifyEmailModal required onSignOut={logout} />
    </main>
  );
}
