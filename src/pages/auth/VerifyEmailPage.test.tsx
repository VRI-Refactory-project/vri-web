import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { AuthProvider } from '../../features/auth/AuthProvider';
import type { AuthSession } from '../../types';
import { VerifyEmailPage } from './VerifyEmailPage';

function renderPage(session: AuthSession | null, next?: string) {
  sessionStorage.clear();
  if (session) sessionStorage.setItem('vri.session', JSON.stringify(session));
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[{ pathname: '/verify-email', state: next ? { next } : null }]}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/sign-in" element={<p>sign in page</p>} />
          <Route path="/dashboard/deaf" element={<p>deaf home</p>} />
          <Route path="/dashboard/staff" element={<p>staff home</p>} />
          <Route path="/dashboard/institution" element={<p>institution home</p>} />
          <Route path="/register/pending" element={<p>pending review</p>} />
          <Route path="/register/institution/upload-license" element={<p>upload license page</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

const session = (user: Partial<AuthSession['user']>): AuthSession => ({
  token: 't',
  refreshToken: 'r',
  user: { id: '1', name: 'A', role: 'deaf', mustChangePassword: false, ...user },
});

describe('VerifyEmailPage', () => {
  afterEach(() => sessionStorage.clear());

  it('sends a signed-out visitor to sign in', () => {
    renderPage(null);
    expect(screen.getByText('sign in page')).toBeInTheDocument();
  });

  it('asks for the code and cannot be put off', () => {
    renderPage(session({ email: 'a@b.com', emailVerified: false }));
    expect(screen.getByRole('dialog', { name: 'Verify your email' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Not now' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Use a different account' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resend code' })).toBeEnabled();
  });

  it('goes straight on when the email is already verified', () => {
    renderPage(session({ email: 'a@b.com', emailVerified: true }));
    expect(screen.getByText('deaf home')).toBeInTheDocument();
  });

  it('goes straight on for a phone-only account', () => {
    renderPage(session({ email: null }));
    expect(screen.getByText('deaf home')).toBeInTheDocument();
  });

  it('continues to the page it was asked to', () => {
    renderPage(session({ email: 'a@b.com', emailVerified: true }), '/register/pending');
    expect(screen.getByText('pending review')).toBeInTheDocument();
  });

  it('ignores a continue-to address that leaves the site', () => {
    renderPage(session({ email: 'a@b.com', emailVerified: true }), '//evil.example');
    expect(screen.getByText('deaf home')).toBeInTheDocument();
  });

  it('sends the administrator registering a new institution on to upload its licence', () => {
    renderPage(
      session({
        email: 'a@b.com',
        emailVerified: true,
        role: 'institution',
        institutionRole: 'ADMIN',
        institutionStatus: 'PENDING',
      }),
    );
    expect(screen.getByText('upload license page')).toBeInTheDocument();
  });

  it('sends staff to their own dashboard, never to the licence page', () => {
    renderPage(
      session({
        email: 'a@b.com',
        emailVerified: true,
        role: 'institution',
        institutionRole: 'STAFF',
        institutionStatus: 'APPROVED',
      }),
    );
    expect(screen.getByText('staff home')).toBeInTheDocument();
    expect(screen.queryByText('upload license page')).not.toBeInTheDocument();
  });

  it('sends the administrator of an approved institution to their dashboard', () => {
    renderPage(
      session({
        email: 'a@b.com',
        emailVerified: true,
        role: 'institution',
        institutionRole: 'ADMIN',
        institutionStatus: 'APPROVED',
      }),
    );
    expect(screen.getByText('institution home')).toBeInTheDocument();
  });
});
