import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../../hooks/useAuth';
import * as auth from '../../services/auth';
import type { AuthSession } from '../../types';
import { AuthProvider } from './AuthProvider';

const session: AuthSession = {
  token: 'access-1',
  refreshToken: 'refresh-1',
  user: { id: '1', name: 'Sarah', role: 'deaf', mustChangePassword: false },
};

function Probe() {
  const { session: current, checking, logout } = useAuth();
  return (
    <div>
      <p>{checking ? 'checking' : 'checked'}</p>
      <p>{current ? `signed in as ${current.user.name}` : 'signed out'}</p>
      <button onClick={logout}>sign out</button>
    </div>
  );
}

const renderProvider = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );

describe('AuthProvider session check', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });
  afterEach(() => sessionStorage.clear());

  it('does not check anything when nobody is signed in', () => {
    const spy = vi.spyOn(auth, 'getCurrentUser');
    renderProvider();
    expect(screen.getByText('signed out')).toBeInTheDocument();
    expect(screen.getByText('checked')).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });

  it('takes the name and role from the server, not from storage', async () => {
    sessionStorage.setItem('vri.session', JSON.stringify(session));
    vi.spyOn(auth, 'getCurrentUser').mockResolvedValue({ ...session.user, name: 'Sarah Real' });
    renderProvider();
    expect(screen.getByText('checking')).toBeInTheDocument();
    expect(await screen.findByText('signed in as Sarah Real')).toBeInTheDocument();
    expect(screen.getByText('checked')).toBeInTheDocument();
  });

  it('cancels the refresh token on the server when signing out', async () => {
    sessionStorage.setItem('vri.session', JSON.stringify(session));
    vi.spyOn(auth, 'getCurrentUser').mockResolvedValue(session.user);
    const revoke = vi.spyOn(auth, 'revokeSession').mockResolvedValue(undefined);
    renderProvider();
    await screen.findByText('signed in as Sarah');
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'sign out' }));
    });
    expect(revoke).toHaveBeenCalledWith('refresh-1');
    expect(screen.getByText('signed out')).toBeInTheDocument();
    expect(sessionStorage.getItem('vri.session')).toBeNull();
  });
});
