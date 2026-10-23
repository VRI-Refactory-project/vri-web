import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { AuthProvider } from '../features/auth/AuthProvider';
import { useAuth } from '../hooks/useAuth';
import { setAuthToken } from '../services/api';
import * as authService from '../services/auth';
import type { AuthSession } from '../types';
import { GuestRoute } from './Guestroute';

const deafSession: AuthSession = {
  token: 't',
  refreshToken: 'r',
  user: { id: '1', name: 'Amina', role: 'deaf', mustChangePassword: false },
};

// Stands in for a sign-up page: it signs the person in, then moves them on, as the real ones do.
function FakeSignUp() {
  const { login } = useAuth();
  const navigate = useNavigate();
  return (
    <button
      onClick={() => {
        login(deafSession);
        navigate('/register/welcome', { replace: true });
      }}
    >
      sign up
    </button>
  );
}

function renderAt(path: string) {
  // A session found in storage is checked with the server when the app loads, so that call is stubbed.
  vi.spyOn(authService, 'getCurrentUser').mockResolvedValue(deafSession.user);
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/get-started" element={<p>role selection</p>} />
          </Route>

          <Route element={<GuestRoute allowSessionCreatedDuringRoute />}>
            <Route path="/register/deaf" element={<FakeSignUp />} />
          </Route>

          <Route path="/register/welcome" element={<p>welcome step</p>} />
          <Route path="/dashboard/deaf" element={<p>deaf home</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('GuestRoute', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    setAuthToken(null);
  });

  it('shows the page to someone who is not signed in', () => {
    renderAt('/get-started');
    expect(screen.getByText('role selection')).toBeInTheDocument();
  });

  it('sends someone who is already signed in to their dashboard', () => {
    sessionStorage.setItem('vri.session', JSON.stringify(deafSession));
    renderAt('/get-started');
    expect(screen.getByText('deaf home')).toBeInTheDocument();
    expect(screen.queryByText('role selection')).not.toBeInTheDocument();
  });

  it('lets a sign-up page sign the person in and move them on to the next step', async () => {
    renderAt('/register/deaf');
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));
    expect(await screen.findByText('welcome step')).toBeInTheDocument();
    expect(screen.queryByText('deaf home')).not.toBeInTheDocument();
  });
});
