import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../features/auth/AuthProvider';
import { ApiError } from '../../services/api';
import * as auth from '../../services/auth';
import type { AuthSession } from '../../types';
import { ChangeTemporaryPasswordPage } from './ChangeTemporaryPasswordPage';

const session = (mustChangePassword: boolean): AuthSession => ({
  token: 't',
  refreshToken: 'r',
  user: { id: '1', name: 'Staff', role: 'institution', mustChangePassword },
});

function renderPage(stored: AuthSession | null) {
  sessionStorage.clear();
  if (stored) sessionStorage.setItem('vri.session', JSON.stringify(stored));
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/change-password']}>
        <Routes>
          <Route path="/change-password" element={<ChangeTemporaryPasswordPage />} />
          <Route path="/sign-in" element={<p>sign in page</p>} />
          <Route path="/dashboard/institution" element={<p>institution home</p>} />
          <Route path="/dashboard/staff" element={<p>staff home</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('ChangeTemporaryPasswordPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(auth, 'getCurrentUser').mockResolvedValue(session(true).user);
  });
  afterEach(() => sessionStorage.clear());

  it('sends signed-out visitors to sign in', async () => {
    renderPage(null);
    expect(await screen.findByText('sign in page')).toBeInTheDocument();
  });

  it('sends people who already have their own password to their dashboard', async () => {
    vi.spyOn(auth, 'getCurrentUser').mockResolvedValue(session(false).user);
    renderPage(session(false));
    expect(await screen.findByText('institution home')).toBeInTheDocument();
  });

  it('changes the password and lands on the dashboard', async () => {
    const change = vi.spyOn(auth, 'changePassword').mockResolvedValue(session(false));
    renderPage(session(true));
    await userEvent.type(await screen.findByLabelText('One-time password'), 'Temp#1234');
    await userEvent.type(screen.getByLabelText('New password'), 'Brand-New-Pass9!');
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'Brand-New-Pass9!');
    await userEvent.click(screen.getByRole('button', { name: /save and continue/i }));
    expect(change).toHaveBeenCalledWith('Temp#1234', 'Brand-New-Pass9!');
    expect(await screen.findByText('institution home')).toBeInTheDocument();
  });

  it('does not submit when the two new passwords differ', async () => {
    const change = vi.spyOn(auth, 'changePassword');
    renderPage(session(true));
    await userEvent.type(await screen.findByLabelText('One-time password'), 'Temp#1234');
    await userEvent.type(screen.getByLabelText('New password'), 'Brand-New-Pass9!');
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'Different-Pass9!');
    await userEvent.click(screen.getByRole('button', { name: /save and continue/i }));
    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
    expect(change).not.toHaveBeenCalled();
  });

  it('shows the server message when the one-time password is wrong', async () => {
    vi.spyOn(auth, 'changePassword').mockRejectedValue(
      new ApiError(400, 'Current password is incorrect.'),
    );
    renderPage(session(true));
    await userEvent.type(await screen.findByLabelText('One-time password'), 'wrong');
    await userEvent.type(screen.getByLabelText('New password'), 'Brand-New-Pass9!');
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'Brand-New-Pass9!');
    await userEvent.click(screen.getByRole('button', { name: /save and continue/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Current password is incorrect.');
  });

  it('lands institution staff on their own dashboard, not the administrator’s', async () => {
    const staff = (mustChangePassword: boolean): AuthSession => ({
      ...session(mustChangePassword),
      user: { ...session(mustChangePassword).user, institutionRole: 'STAFF' },
    });
    vi.spyOn(auth, 'getCurrentUser').mockResolvedValue(staff(true).user);
    vi.spyOn(auth, 'changePassword').mockResolvedValue(staff(false));
    renderPage(staff(true));
    await userEvent.type(await screen.findByLabelText('One-time password'), 'Temp#1234');
    await userEvent.type(screen.getByLabelText('New password'), 'Brand-New-Pass9!');
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'Brand-New-Pass9!');
    await userEvent.click(screen.getByRole('button', { name: /save and continue/i }));
    expect(await screen.findByText('staff home')).toBeInTheDocument();
  });
});
