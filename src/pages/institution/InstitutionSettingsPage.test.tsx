import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InstitutionSettingsPage } from './InstitutionSettingsPage';

const logout = vi.fn();

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ session: null, logout }),
}));

vi.mock('../../components/interpreter/settings/ChangePasswordModal', () => ({
  ChangePasswordModal: ({ onClose, onChanged }: { onClose: () => void; onChanged: () => void }) => (
    <div role="dialog" aria-label="Change password">
      <button type="button" onClick={onClose}>
        Cancel
      </button>
      <button type="button" onClick={onChanged}>
        Submit password change
      </button>
    </div>
  ),
}));

describe('InstitutionSettingsPage', () => {
  beforeEach(() => {
    logout.mockClear();
  });

  it('signs the person out when Sign out is pressed', () => {
    render(
      <MemoryRouter>
        <InstitutionSettingsPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText('Sign out'));

    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('opens the change password modal', () => {
    render(
      <MemoryRouter>
        <InstitutionSettingsPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Change password' }));

    expect(screen.getByRole('dialog', { name: 'Change password' })).toBeInTheDocument();
  });

  it('closes the password modal when cancelled', () => {
    render(
      <MemoryRouter>
        <InstitutionSettingsPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Change password' }));

    const dialog = screen.getByRole('dialog');

    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows confirmation after a successful password change', () => {
    render(
      <MemoryRouter>
        <InstitutionSettingsPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Change password' }));

    fireEvent.click(screen.getByRole('button', { name: 'Submit password change' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    expect(screen.getByRole('status')).toHaveTextContent(
      'Password changed. Your other devices have been signed out.',
    );
  });
});
