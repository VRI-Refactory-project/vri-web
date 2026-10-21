import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api, ApiError, setAuthToken, setRefreshHandler } from '../../services/api';
import * as authService from '../../services/auth';
import { useAuth } from '../../hooks/useAuth';
import type { AuthSession } from '../../types';
import { AuthProvider } from './AuthProvider';

const stored: AuthSession = {
  token: 'old',
  refreshToken: 'refresh-1',
  user: { id: '1', name: 'Ruth', role: 'interpreter', mustChangePassword: false },
};

const res = (status: number, body: unknown = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: 'err',
  json: async () => body,
});

function Probe() {
  const { session, sessionExpired, logout } = useAuth();
  return (
    <div>
      <p>{session ? `signed in with ${session.token}` : 'signed out'}</p>
      <p>{sessionExpired ? 'expired' : 'not expired'}</p>
      <button onClick={() => api('/api/v1/auth/me/').catch(() => undefined)}>call api</button>
      <button onClick={logout}>log out</button>
    </div>
  );
}

function renderProbe() {
  // A restored session is checked with the server on load, and signing out tells the server. These
  // tests are about refreshing and signing out, so both calls are stubbed.
  vi.spyOn(authService, 'getCurrentUser').mockResolvedValue(stored.user);
  vi.spyOn(authService, 'revokeSession').mockResolvedValue(undefined);
  sessionStorage.setItem('vri.session', JSON.stringify(stored));
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
}

describe('AuthProvider session handling', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    sessionStorage.clear();
    setAuthToken(null);
    setRefreshHandler(null);
  });

  it('restores a stored session after a reload', () => {
    renderProbe();
    expect(screen.getByText('signed in with old')).toBeInTheDocument();
  });

  it('keeps the session and the new token when a refresh works', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(res(401)).mockResolvedValueOnce(res(200)));
    vi.spyOn(authService, 'refreshAccessToken').mockResolvedValue({ access: 'new' });
    renderProbe();
    await userEvent.click(screen.getByText('call api'));
    expect(await screen.findByText('signed in with new')).toBeInTheDocument();
    expect(screen.getByText('not expired')).toBeInTheDocument();
  });

  it('signs out and records that the session ended when the server refuses the refresh', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(res(401)));
    vi.spyOn(authService, 'refreshAccessToken').mockRejectedValue(new ApiError(401, 'expired'));
    renderProbe();
    await userEvent.click(screen.getByText('call api'));
    expect(await screen.findByText('signed out')).toBeInTheDocument();
    expect(screen.getByText('expired')).toBeInTheDocument();
    expect(sessionStorage.getItem('vri.session')).toBeNull();
  });

  it('stays signed in when the refresh fails only because the network is down', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(res(401)));
    vi.spyOn(authService, 'refreshAccessToken').mockRejectedValue(new TypeError('Failed to fetch'));
    renderProbe();
    await userEvent.click(screen.getByText('call api'));
    await waitFor(() => expect(authService.refreshAccessToken).toHaveBeenCalled());
    expect(screen.getByText('signed in with old')).toBeInTheDocument();
    expect(screen.getByText('not expired')).toBeInTheDocument();
  });

  it('a deliberate log out clears the session without the expired notice', async () => {
    renderProbe();
    await userEvent.click(screen.getByText('log out'));
    expect(screen.getByText('signed out')).toBeInTheDocument();
    expect(screen.getByText('not expired')).toBeInTheDocument();
    expect(sessionStorage.getItem('vri.session')).toBeNull();
  });
});
