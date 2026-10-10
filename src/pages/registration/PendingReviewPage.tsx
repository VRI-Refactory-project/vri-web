import { Link } from 'react-router-dom';
import { AuthShell } from '../../components/AuthShell';
import { FLOWS } from '../../features/registration/flows';
import { useAuth } from '../../hooks/useAuth';
import './CreateAccountPage.css';

// Shown after an interpreter or institution registers: their account exists but an admin has to
// approve it (V2-045 / V2-046) before they can take part. For an institution this is the last of
// its three steps; an interpreter finished their steps when they created the account.
export function PendingReviewPage() {
  const { session, logout } = useAuth();
  const isInterpreter = session?.user.role === 'interpreter';

  return (
    <AuthShell steps={isInterpreter ? undefined : FLOWS.institution} current={3}>
      <h1 className="ca-title">Thanks, {session?.user.name ?? 'we have your application'}</h1>
      <p className="ca-subtitle">
        {isInterpreter
          ? 'Your account is created and your certificates are with our team for review.'
          : 'Your institution account is created and is waiting for our team to review it.'}{' '}
        We will contact you once a decision is made.
      </p>
      <p>
        <Link to="/" onClick={logout}>
          Back to the home page
        </Link>
      </p>
    </AuthShell>
  );
}
