import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from '../features/auth/AuthProvider';
import { ApiError } from '../services/api';
import * as auth from '../services/auth';
import type { AuthSession } from '../types';
import { ProtectedRoute } from './ProtectedRoute';

function SignInStub() {
  const state = useLocation().state as { from?: string } | null;
  return <p>sign in page, came from {state?.from ?? 'nowhere'}</p>;
}

function VerifyStub() {
  const state = useLocation().state as { next?: string } | null;
  return <p>verify email, then {state?.next ?? 'nowhere'}</p>;
}

function renderAt(session: AuthSession | null, requireVerifiedEmail = true) {
  sessionStorage.clear();
  if (session) sessionStorage.setItem('vri.session', JSON.stringify(session));
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/dashboard/interpreter']}>
        <Routes>
          <Route path="/" element={<p>landing</p>} />
          <Route path="/sign-in" element={<SignInStub />} />
          <Route path="/verify-email" element={<VerifyStub />} />
          <Route
            element={
              <ProtectedRoute allow={['interpreter']} requireVerifiedEmail={requireVerifiedEmail} />
            }
          >
            <Route path="/dashboard/interpreter" element={<p>interpreter home</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

const sessionFor = (role: AuthSession['user']['role']): AuthSession => ({
  token: 't',
  refreshToken: 'r',
  user: { id: '1', name: 'X', role, mustChangePassword: false },
});

const withEmail = (verified: boolean | undefined): AuthSession => {
  const s = sessionFor('interpreter');
  return { ...s, user: { ...s.user, email: 'a@b.com', emailVerified: verified } };
};

describe('ProtectedRoute', () => {
  // The server is asked about a stored session before it is trusted. Unless a test says otherwise,
  // it confirms what is stored.
  const serverConfirms = (session: AuthSession) =>
    vi.spyOn(auth, 'getCurrentUser').mockResolvedValue(session.user);

  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => sessionStorage.clear());

  it('sends signed-out visitors to sign in', () => {
    renderAt(null);
    expect(screen.getByText(/sign in page/)).toBeInTheDocument();
  });

  it('remembers the page a signed-out visitor was heading to', () => {
    renderAt(null);
    expect(screen.getByText('sign in page, came from /dashboard/interpreter')).toBeInTheDocument();
  });

  it('sends the wrong role home', async () => {
    const session = sessionFor('deaf');
    serverConfirms(session);
    renderAt(session);
    expect(await screen.findByText('landing')).toBeInTheDocument();
  });

  it('lets the right role in once the server confirms the stored session', async () => {
    const session = sessionFor('interpreter');
    serverConfirms(session);
    renderAt(session);
    expect(screen.queryByText('interpreter home')).not.toBeInTheDocument();
    expect(await screen.findByText('interpreter home')).toBeInTheDocument();
  });

  it('turns away a stored session the server rejects (a made-up or revoked token)', async () => {
    vi.spyOn(auth, 'getCurrentUser').mockRejectedValue(new ApiError(401, 'Invalid token'));
    renderAt(sessionFor('interpreter'));
    expect(await screen.findByText(/sign in page/)).toBeInTheDocument();
    expect(sessionStorage.getItem('vri.session')).toBeNull();
  });

  it('believes the server about the role, not the stored copy', async () => {
    // Stored as an interpreter, but the server says this person is deaf.
    vi.spyOn(auth, 'getCurrentUser').mockResolvedValue(sessionFor('deaf').user);
    renderAt(sessionFor('interpreter'));
    expect(await screen.findByText('landing')).toBeInTheDocument();
  });

  it('keeps the session when the server cannot be reached', async () => {
    vi.spyOn(auth, 'getCurrentUser').mockRejectedValue(new TypeError('Failed to fetch'));
    renderAt(sessionFor('interpreter'));
    expect(await screen.findByText('interpreter home')).toBeInTheDocument();
  });

  it('asks for email verification before the dashboard, and remembers where to go next', async () => {
    const session = withEmail(false);
    serverConfirms(session);
    renderAt(session);
    expect(
      await screen.findByText('verify email, then /dashboard/interpreter'),
    ).toBeInTheDocument();
  });

  it('lets a verified email through', async () => {
    const session = withEmail(true);
    serverConfirms(session);
    renderAt(session);
    expect(await screen.findByText('interpreter home')).toBeInTheDocument();
  });

  it('does not ask when the API does not report verification', async () => {
    const session = withEmail(undefined);
    serverConfirms(session);
    renderAt(session);
    expect(await screen.findByText('interpreter home')).toBeInTheDocument();
  });

  it('lets an unverified email through where verification comes later', async () => {
    const session = withEmail(false);
    serverConfirms(session);
    renderAt(session, false);
    expect(await screen.findByText('interpreter home')).toBeInTheDocument();
  });
});
