import { Navigate, useLocation } from 'react-router-dom';
import { VerifyEmailModal } from '../../components/VerifyEmailModal';
import { dashboardPathFor, needsLicenceUpload } from '../../features/auth/roles';
import { needsEmailVerification } from '../../features/auth/emailGate';
import { useAuth } from '../../hooks/useAuth';
import './VerifyEmailPage.css';

const safePath = (value: unknown): string | null =>
  typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : null;

const STAFF_ONBOARDING_KEY = 'staffInvitationOnboarding';

export function VerifyEmailPage() {
  const { session, logout } = useAuth();
  const location = useLocation();

  const storedNext = sessionStorage.getItem('nextAfterVerification');
  const stateNext = safePath((location.state as { next?: unknown } | null)?.next);
  const next = safePath(storedNext) ?? stateNext;

  if (!session) return <Navigate to="/sign-in" replace />;

  if (!needsEmailVerification(session.user)) {
    // Invitation acceptance uses a temporary session only to verify the staff member's email.
    // End that session so their next step is a normal sign-in to the staff dashboard.
    if (sessionStorage.getItem(STAFF_ONBOARDING_KEY) === 'true') {
      sessionStorage.removeItem(STAFF_ONBOARDING_KEY);
      logout();
      return <Navigate to="/sign-in" replace />;
    }
    // Only the administrator registering a new institution still has its licence to upload. Staff,
    // whose accounts their administrator made, go straight to their own dashboard.
    if (needsLicenceUpload(session.user)) {
      return <Navigate to="/register/institution/upload-license" replace />;
    }

    sessionStorage.removeItem('nextAfterVerification');
    return (
      <Navigate
        to={next ?? dashboardPathFor(session.user.role, session.user.institutionRole)}
        replace
      />
    );
  }

  return (
    <main className="verify-page">
      <VerifyEmailModal required onSignOut={logout} />
    </main>
  );
}
