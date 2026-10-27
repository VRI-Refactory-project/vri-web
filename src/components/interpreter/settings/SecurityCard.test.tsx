import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../../services/api';
import { changePassword } from '../../../services/auth';
import type { AuthSession } from '../../../types';
import { SecurityCard } from './SecurityCard';

const login = vi.fn();

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ login }),
}));

vi.mock('../../../services/auth', () => ({
  changePassword: vi.fn(),
}));

const newSession = {
  token: 'new-access',
  refreshToken: 'new-refresh',
  user: { id: '7', name: 'Jane Mugeni', role: 'interpreter', mustChangePassword: false },
} as AuthSession;

const openForm = async () => {
  render(<SecurityCard />);
  await userEvent.click(screen.getByRole('button', { name: 'Change password' }));
  return screen.getByRole('dialog', { name: 'Change password' });
};

const fill = async (dialog: HTMLElement, current: string, next: string, confirm: string) => {
  const field = (label: string) => within(dialog).getByLabelText(label);
  if (current) await userEvent.type(field('Current password'), current);
  if (next) await userEvent.type(field('New password'), next);
  if (confirm) await userEvent.type(field('Confirm new password'), confirm);
};

const submit = (dialog: HTMLElement) =>
  userEvent.click(within(dialog).getByRole('button', { name: 'Change password' }));

describe('SecurityCard', () => {
  beforeEach(() => {
    login.mockClear();
    vi.mocked(changePassword).mockReset();
  });

  it('shows the password setting', () => {
    render(<SecurityCard />);

    expect(screen.getByRole('region', { name: 'Security' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Change password' })).toBeInTheDocument();
  });

  it('asks for every field before sending anything', async () => {
    const dialog = await openForm();

    await submit(dialog);

    expect(within(dialog).getByText('Enter your password.')).toBeInTheDocument();
    expect(within(dialog).getByText('Enter a password.')).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it('uses the same password rules as sign-up', async () => {
    const dialog = await openForm();

    await fill(dialog, 'Old-Pass-2026!', 'weak', 'weak');
    await submit(dialog);

    expect(within(dialog).getByText('Use at least 8 characters.')).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it('checks that the new password was typed the same twice', async () => {
    const dialog = await openForm();

    await fill(dialog, 'Old-Pass-2026!', 'New-Pass-2026!', 'New-Pass-2027!');
    await submit(dialog);

    expect(within(dialog).getByText('The passwords do not match.')).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it('changes the password, keeps the new session and confirms', async () => {
    vi.mocked(changePassword).mockResolvedValue(newSession);
    const dialog = await openForm();

    await fill(dialog, 'Old-Pass-2026!', 'New-Pass-2026!', 'New-Pass-2026!');
    await submit(dialog);

    expect(changePassword).toHaveBeenCalledWith('Old-Pass-2026!', 'New-Pass-2026!');
    expect(login).toHaveBeenCalledWith(newSession);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Password changed. Your other devices have been signed out.',
    );
  });

  it('shows what the server says when it refuses', async () => {
    vi.mocked(changePassword).mockRejectedValue(new ApiError(400, 'Incorrect password.'));
    const dialog = await openForm();

    await fill(dialog, 'Wrong-Pass-2026!', 'New-Pass-2026!', 'New-Pass-2026!');
    await submit(dialog);

    expect(within(dialog).getByRole('alert')).toHaveTextContent('Incorrect password.');
    expect(login).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes without changing anything on Cancel', async () => {
    const dialog = await openForm();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });
});
