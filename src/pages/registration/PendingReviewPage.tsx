import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AuthShell } from '../../components/AuthShell';
import { needsEmailVerification } from '../../features/auth/emailGate';
import { FLOWS } from '../../features/registration/flows';
import { useAuth } from '../../hooks/useAuth';
import { getVerificationStatus } from '../../services/interpreterStatus';
import './CreateAccountPage.css';

// Shown after an interpreter or institution registers: their account exists but an admin has to
// approve it (V2-045 / V2-046) before they can take part. For an institution this is the last of
// its three steps; an interpreter gets here after account, certificates and email confirmation.
export function PendingReviewPage() {
  const { session, logout } = useAuth();
  const isInterpreter = session?.user.role === 'interpreter';
  const [rejected, setRejected] = useState(false);

  // Someone an admin has turned down is told so here, instead of "waiting" for ever.
  useEffect(() => {
    if (!isInterpreter) return;
    getVerificationStatus().then(
      (status) => setRejected(status === 'REJECTED'),
      () => {},
    );
  }, [isInterpreter]);

  // Confirm the email first; the person comes back here afterwards.
  if (session && needsEmailVerification(session.user)) {
    return <Navigate to="/verify-email" replace state={{ next: '/register/pending' }} />;
  }

  return (
    <AuthShell steps={isInterpreter ? undefined : FLOWS.institution} current={3}>
      <h1 className="ca-title">Thanks, {session?.user.name ?? 'we have your application'}</h1>
      <p className="ca-subtitle">
        {rejected
          ? 'Our team could not approve your certificates. Please contact support to try again.'
          : isInterpreter
            ? 'Your account is created and your certificates are with our team for review.'
            : 'Your institution account is created and is waiting for our team to review it.'}
        {rejected ? '' : ' We will contact you once a decision is made.'}
      </p>
      <p>
        <Link to="/" onClick={logout}>
          Back to the home page
        </Link>
      </p>
    </AuthShell>
  );
}
