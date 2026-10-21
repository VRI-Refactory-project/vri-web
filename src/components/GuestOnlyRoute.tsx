import { Link, Outlet, useNavigate } from 'react-router-dom';
import { dashboardPathFor } from '../features/auth/roles';
import { useAuth } from '../hooks/useAuth';
import './GuestOnlyRoute.css';

/**
 * Pages for people who are signed out: choosing an account type and the sign-up forms.
 *
 * Signing up while signed in would quietly swap the current session for the new account and leave
 * the first one running, so a signed-in person is told who they are signed in as instead. The API
 * refuses it too (403 already_signed_in).
 */
export function GuestOnlyRoute() {
  const { session, checking, logout } = useAuth();
  const navigate = useNavigate();

  if (checking) return <p className="route-checking">Checking your session…</p>;
  if (!session) return <Outlet />;

  const signOut = () => {
    logout();
    navigate('/get-started', { replace: true });
  };

  return (
    <main className="guest-only">
      <div className="guest-only__card" role="status">
        <h1>You're already signed in</h1>
        <p>
          You're signed in as <strong>{session.user.name}</strong>. To create a new account, sign
          out first.
        </p>
        <div className="guest-only__actions">
          <Link to={dashboardPathFor(session.user.role)} className="guest-only__primary">
            Go to my dashboard
          </Link>
          <button type="button" className="guest-only__secondary" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>
    </main>
  );
}
