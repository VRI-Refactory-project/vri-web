import { act, render, screen } from '@testing-library/react';
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
  const { session: current } = useAuth();
  return <p>{current ? 'signed in' : 'signed out'}</p>;
}


describe('AuthProvider and the browser arrows', () => {


  beforeEach(async () => {
    vi.restoreAllMocks();
    sessionStorage.setItem('vri.session', JSON.stringify(session));
    vi.spyOn(auth, 'getCurrentUser').mockResolvedValue(session.user);
    vi.spyOn(auth, 'revokeSession').mockResolvedValue(undefined);

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

 it('stays signed in when browser navigation reaches a public page', () => {
   act(() => {
     window.history.pushState({}, '', '/landing');
     window.dispatchEvent(new PopStateEvent('popstate'));
   });

   expect(screen.getByText('signed in')).toBeInTheDocument();
   expect(auth.revokeSession).not.toHaveBeenCalled();
   expect(sessionStorage.getItem('vri.session')).not.toBeNull();
 });

 it('stays signed in when moving between dashboard pages', () => {
   act(() => {
     window.history.pushState({}, '', '/dashboard/deaf/profile');
     window.dispatchEvent(new PopStateEvent('popstate'));
   });

   expect(screen.getByText('signed in')).toBeInTheDocument();
   expect(auth.revokeSession).not.toHaveBeenCalled();
 });
});
