import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../../hooks/useAuth';
import * as auth from '../../services/auth';
import type { AuthSession } from '../../types';
import { AuthProvider, SESSION_MAX_AGE_MS } from './AuthProvider';

const session: AuthSession = {
  token: 'access-1',
  refreshToken: 'refresh-1',
  user: { id: '1', name: 'Sarah', role: 'deaf', mustChangePassword: false },
};

function Probe() {
  const { session: current, sessionExpired } = useAuth();
  return (
    <div>
      <p>{current ? `signed in as ${current.user.name}` : 'signed out'}</p>
      {sessionExpired && <p>session ended</p>}
    </div>
  );
}

const renderProvider = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );

/** What another tab of the site would leave in storage. */
const storeSession = (startedMsAgo: number) => {
  localStorage.setItem('vri.session', JSON.stringify(session));
  localStorage.setItem('vri.session.startedAt', String(Date.now() - startedMsAgo));
};

describe('AuthProvider: the 7 day session shared by all tabs', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(auth, 'getCurrentUser').mockResolvedValue(session.user);
  });

  it('a new tab finds the session another tab saved, so the person is still signed in', async () => {
    storeSession(60 * 60 * 1000); // signed in one hour ago
    renderProvider();
    expect(await screen.findByText('signed in as Sarah')).toBeInTheDocument();
  });

  it('asks the person to sign in again once 7 days have passed since sign-in', () => {
    storeSession(SESSION_MAX_AGE_MS + 1000);
    renderProvider();
    expect(screen.getByText('signed out')).toBeInTheDocument();
    expect(localStorage.getItem('vri.session')).toBeNull();
  });

  it('ends the session by itself when the 7 days run out while the tab is open', async () => {
    vi.useFakeTimers();
    try {
      storeSession(SESSION_MAX_AGE_MS - 5000); // 5 seconds left
      renderProvider();
      expect(screen.getByText('signed in as Sarah')).toBeInTheDocument();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(6000);
      });
      expect(screen.getByText('signed out')).toBeInTheDocument();
      expect(screen.getByText('session ended')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('signs this tab out when the person signs out in another tab', async () => {
    storeSession(1000);
    renderProvider();
    await screen.findByText('signed in as Sarah');
    act(() => {
      localStorage.removeItem('vri.session');
      localStorage.removeItem('vri.session.startedAt');
      window.dispatchEvent(new StorageEvent('storage', { key: 'vri.session' }));
    });
    expect(screen.getByText('signed out')).toBeInTheDocument();
  });
});
