import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, vi } from 'vitest';
import type { AuthSession } from '../../types';
import { LandingPage } from './LandingPage';

const logout = vi.fn();
let session: AuthSession | null = null;

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ session, checking: false, logout }),
}));

const signedInAdmin = {
  token: 'access',
  refreshToken: 'refresh',
  user: { id: '1', name: 'Grace Admin', role: 'admin', mustChangePassword: false },
} as AuthSession;

describe('LandingPage', () => {
  beforeEach(() => {
    session = null;
    logout.mockClear();
  });

  const renderPage = () =>
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/get-started" element={<p>role selection</p>} />
          <Route path="/sign-in" element={<p>sign in page</p>} />
          <Route path="/dashboard/admin" element={<p>admin dashboard</p>} />
        </Routes>
      </MemoryRouter>,
    );

  it('renders the hero heading', () => {
    renderPage();

    expect(
      screen.getByRole('heading', {
        name: 'Inclusive Communication. Anytime, Anywhere',
      }),
    ).toBeInTheDocument();
  });

  it('navigates to /get-started when Get Started is clicked', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /get started/i }));
    expect(screen.getByText('role selection')).toBeInTheDocument();
  });

  it('navigates to /get-started when Sign Up is clicked', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));
    expect(screen.getByText('role selection')).toBeInTheDocument();
  });

  it('navigates to /sign-in when Login is clicked', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('link', { name: /login/i }));
    expect(screen.getByText('sign in page')).toBeInTheDocument();
  });

  describe('when the person is still signed in', () => {
    beforeEach(() => {
      session = signedInAdmin;
    });

    it('offers their dashboard and sign out instead of login and sign up', () => {
      renderPage();

      expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /sign up/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /go to my dashboard/i })).toHaveLength(2);
    });

    it('takes them to their own dashboard', async () => {
      renderPage();
      await userEvent.click(screen.getAllByRole('button', { name: /go to my dashboard/i })[0]);
      expect(screen.getByText('admin dashboard')).toBeInTheDocument();
    });

    it('signs them out', async () => {
      renderPage();
      await userEvent.click(screen.getByRole('button', { name: /sign out/i }));
      expect(logout).toHaveBeenCalledTimes(1);
    });
  });
});
