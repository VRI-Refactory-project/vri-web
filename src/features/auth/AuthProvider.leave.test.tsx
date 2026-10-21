import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { useAuth } from '../../hooks/useAuth';
import * as auth from '../../services/auth';
import type { AuthSession } from '../../types';
import { AuthProvider } from './AuthProvider';
import * as leave from './leaveDashboard';

const session: AuthSession = {
  token: 'access-1',
  refreshToken: 'refresh-1',
  user: { id: '1', name: 'Sarah', role: 'deaf', mustChangePassword: false },
};

function Probe() {
  const { session: current } = useAuth();
  return <p>{current ? 'signed in' : 'signed out'}</p>;
}

function pressBackTo(path: string) {
  window.history.pushState({}, '', path);
  act(() => {
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
}

describe('AuthProvider and the browser arrows', () => {
  let redirect: MockInstance<typeof leave.redirectToSignIn>;

  beforeEach(async () => {
    vi.restoreAllMocks();
    sessionStorage.setItem('vri.session', JSON.stringify(session));
    vi.spyOn(auth, 'getCurrentUser').mockResolvedValue(session.user);
    vi.spyOn(auth, 'revokeSession').mockResolvedValue(undefined);
    redirect = vi.spyOn(leave, 'redirectToSignIn').mockImplementation(() => undefined);
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await screen.findByText('signed in');
  });
  afterEach(() => {
    sessionStorage.clear();
    window.history.pushState({}, '', '/');
  });

  it('signs out and goes to sign-in when Back reaches a public page', () => {
    pressBackTo('/landing');
    expect(screen.getByText('signed out')).toBeInTheDocument();
    expect(auth.revokeSession).toHaveBeenCalledWith('refresh-1');
    expect(redirect).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem('vri.session')).toBeNull();
  });

  it('stays signed in when moving between dashboard pages', () => {
    pressBackTo('/dashboard/deaf/profile');
    expect(screen.getByText('signed in')).toBeInTheDocument();
    expect(redirect).not.toHaveBeenCalled();
  });
});
