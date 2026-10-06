import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { SelectableRole } from '../../types';

const ROLES: { role: SelectableRole; label: string }[] = [
  { role: 'deaf', label: 'Deaf user' },
  { role: 'interpreter', label: 'Interpreter' },
  { role: 'institution', label: 'Institution' },
];

// V2-066: select role, store it locally, route to the matching registration form.
export function RoleSelectionPage() {
  const { selectRole } = useAuth();
  const navigate = useNavigate();

  return (
    <main className="page">
      <h1>Welcome to SignConnect</h1>
      <p>Who are you registering as?</p>
      <div className="role-options">
        {ROLES.map(({ role, label }) => (
          <button
            key={role}
            onClick={() => {
              selectRole(role);
              navigate(`/register/${role}`);
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </main>
  );
}
