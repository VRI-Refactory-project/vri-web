import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InstitutionSettingsPage } from './InstitutionSettingsPage';

const logout = vi.fn();

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ session: null, logout }),
}));

describe('InstitutionSettingsPage sign out', () => {
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
});
