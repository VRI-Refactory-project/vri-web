import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import '../../components/Placeholder.css';

// Shown after an interpreter or institution registers: their account exists but an admin has to
// approve it (V2-045 / V2-046) before they can take part.
export function PendingReviewPage() {
  const { session, logout } = useAuth();
  const isInterpreter = session?.user.role === 'interpreter';

  return (
    <main className="page">
      <h1>Thanks, {session?.user.name ?? 'we have your application'}</h1>
      <p>
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
    </main>
  );
}
