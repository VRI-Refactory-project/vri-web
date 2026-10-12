import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { AuthShell } from '../../components/AuthShell';
import { dashboardPathFor } from '../../features/auth/roles';
import { FLOWS } from '../../features/registration/flows';
import { useAuth } from '../../hooks/useAuth';
import './CreateAccountPage.css';

// The last step of the deaf sign-up: the account exists and the person is signed in.
export function WelcomePage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const role = session?.user.role ?? 'deaf';

  return (
    <AuthShell steps={FLOWS.deaf} current={3}>
      <h1 className="ca-title">Welcome{session ? `, ${session.user.name}` : ''}</h1>
      <p className="ca-subtitle">Your account is ready. You can ask for an interpreter any time.</p>
      <button
        type="button"
        className="btn-primary"
        style={{ marginTop: '16px' }}
        onClick={() => navigate(dashboardPathFor(role), { replace: true })}
      >
        Go to my dashboard <ChevronRight size={18} />
      </button>
    </AuthShell>
  );
}
