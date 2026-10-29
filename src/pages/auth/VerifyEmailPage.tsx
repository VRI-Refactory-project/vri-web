import { Navigate, useLocation } from 'react-router-dom';
import { VerifyEmailModal } from '../../components/VerifyEmailModal';
import { dashboardPathFor } from '../../features/auth/roles';
import { needsEmailVerification } from '../../features/auth/emailGate';
import { useAuth } from '../../hooks/useAuth';
import './VerifyEmailPage.css';

const safePath = (value: unknown): string | null =>
  typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : null;

export function VerifyEmailPage() {
  const { session, logout } = useAuth();
  const location = useLocation();

  const storedNext = sessionStorage.getItem('nextAfterVerification');
  const stateNext = safePath((location.state as { next?: unknown } | null)?.next);
  let next = safePath(storedNext) ?? stateNext;

  if (!session) return <Navigate to="/sign-in" replace />;

  if (!needsEmailVerification(session.user)) {
    // If no destination is found, but they are an institution, send to upload page.
    if (!next && session.user.role === 'institution') {
      next = '/register/institution/upload-license';
    }

    sessionStorage.removeItem('nextAfterVerification');

    // Send them to their destination.
    // If it's an institution and no next was set, it goes to upload-license.
    // If it's a deaf user, it goes to their dashboard.
    return <Navigate to={next ?? dashboardPathFor(session.user.role)} replace />;
  }

  return (
    <main className="verify-page">
      <VerifyEmailModal required onSignOut={logout} />
    </main>
  );
}
