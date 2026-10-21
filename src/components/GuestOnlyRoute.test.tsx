import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthSession } from '../types';
import { GuestOnlyRoute } from './GuestOnlyRoute';

const logout = vi.fn();
let state: { session: AuthSession | null; checking: boolean } = { session: null, checking: false };

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ ...state, logout }),
}));

const signedIn = (role: string) =>
  ({
    token: 'access',
    refreshToken: 'refresh',
    user: { id: '1', name: 'Grace Nabirye', role, mustChangePassword: false },
  }) as AuthSession;

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<GuestOnlyRoute />}>
          <Route path="/get-started" element={<p>choose an account type</p>} />
          <Route path="/register/deaf" element={<p>deaf sign-up form</p>} />
        </Route>
        <Route path="/dashboard/deaf" element={<p>deaf dashboard</p>} />
      </Routes>
    </MemoryRouter>,
  );

describe('GuestOnlyRoute', () => {
  beforeEach(() => {
    state = { session: null, checking: false };
    logout.mockClear();
  });

  it('shows the sign-up pages to someone signed out', () => {
    renderAt('/register/deaf');
    expect(screen.getByText('deaf sign-up form')).toBeInTheDocument();
  });

  it('waits while a stored session is being checked', () => {
    state = { session: signedIn('deaf'), checking: true };
    renderAt('/register/deaf');
    expect(screen.getByText(/checking your session/i)).toBeInTheDocument();
    expect(screen.queryByText('deaf sign-up form')).not.toBeInTheDocument();
  });

  it('tells a signed-in person who they are signed in as, instead of the form', () => {
    state = { session: signedIn('deaf'), checking: false };
    renderAt('/register/deaf');

    expect(screen.queryByText('deaf sign-up form')).not.toBeInTheDocument();
    expect(screen.getByText(/already signed in/i)).toBeInTheDocument();
    expect(screen.getByText('Grace Nabirye')).toBeInTheDocument();
  });

  it('takes them to their dashboard', async () => {
    state = { session: signedIn('deaf'), checking: false };
    renderAt('/get-started');

    await userEvent.click(screen.getByRole('link', { name: /go to my dashboard/i }));

    expect(screen.getByText('deaf dashboard')).toBeInTheDocument();
  });

  it('lets them sign out so they can create a new account', async () => {
    state = { session: signedIn('deaf'), checking: false };
    renderAt('/register/deaf');

    await userEvent.click(screen.getByRole('button', { name: /sign out/i }));

    expect(logout).toHaveBeenCalledTimes(1);
  });
});
