import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import './SignOutButton.css';

/** Ends the session (the server cancels the refresh token too) and goes to the sign-in page. */
export function SignOutButton() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const signOut = () => {
    logout();
    navigate('/sign-in', { replace: true });
  };

  return (
    <div className="signout-row">
      <button type="button" className="signout-btn" onClick={signOut}>
        <LogOut size={15} aria-hidden="true" />
        <span>Sign out</span>
      </button>
    </div>
  );
}
