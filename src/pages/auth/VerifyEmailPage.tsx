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

  // 1. Try to get the next path from sessionStorage or location state
  const storedNext = sessionStorage.getItem('nextAfterVerification');
  const stateNext = safePath((location.state as { next?: unknown } | null)?.next);
  let next = safePath(storedNext) ?? stateNext;

  if (!session) return <Navigate to="/sign-in" replace />;

  // 2. Once the email is verified (or if it didn't need verification)
  if (!needsEmailVerification(session.user)) {
    // 3. FALLBACK: If no next path was found, but this is an institution,
    //    assume they need to upload their license.
    if (!next && session.user.role === 'institution') {
      next = '/register/institution/upload-license';
    }

    // 4. Clear the storage so it doesn't interfere next time
    sessionStorage.removeItem('nextAfterVerification');

    return <Navigate to={next ?? dashboardPathFor(session.user.role)} replace />;
  }

  return (
    <main className="verify-page">
      <VerifyEmailModal required onSignOut={logout} />
    </main>
  );
}
