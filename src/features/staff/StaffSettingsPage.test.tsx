import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StaffSettingsPage } from './StaffSettingsPage';

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  logout: vi.fn(),
  changePassword: vi.fn(),
}));
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ login: mocks.login, logout: mocks.logout }),
}));
vi.mock('../../services/auth', () => ({
  changePassword: mocks.changePassword,
}));
vi.mock('../../components/BrowserNotificationsCard', () => ({
  BrowserNotificationsCard: () => null,
}));

const GOOD = 'Str0ng!Passw0rd#';

async function fill(current: string, next: string, confirm: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Current password'), current);
  await user.type(screen.getByLabelText('New password'), next);
  await user.type(screen.getByLabelText('Confirm new password'), confirm);
  await user.click(screen.getByRole('button', { name: 'Change password' }));
}

beforeEach(() => vi.clearAllMocks());

describe('StaffSettingsPage', () => {
  it('changes the password and stores the fresh session', async () => {
    const session = { token: 't' };
    mocks.changePassword.mockResolvedValue(session);
    render(<StaffSettingsPage />);
    await fill('OldPass!1', GOOD, GOOD);
    await waitFor(() => expect(mocks.changePassword).toHaveBeenCalledWith('OldPass!1', GOOD));
    expect(mocks.login).toHaveBeenCalledWith(session);
    expect(await screen.findByText('Your password has been changed.')).toBeInTheDocument();
  });

  it('does not call the server when the passwords differ', async () => {
    render(<StaffSettingsPage />);
    await fill('OldPass!1', GOOD, GOOD + 'x');
    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
    expect(mocks.changePassword).not.toHaveBeenCalled();
  });

  it('shows an error when the server refuses', async () => {
    mocks.changePassword.mockRejectedValue(new Error('nope'));
    render(<StaffSettingsPage />);
    await fill('OldPass!1', GOOD, GOOD);
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(mocks.login).not.toHaveBeenCalled();
  });

  it('signs out', async () => {
    render(<StaffSettingsPage />);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Sign out' }));
    expect(mocks.logout).toHaveBeenCalled();
  });
});
