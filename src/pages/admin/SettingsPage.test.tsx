import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../../features/auth/authContext';
import type { AuthSession } from '../../types';
import { fetchAdminPreferences, updateAdminPreferences } from '../../services/adminSettings';
import { SettingsPage } from './SettingsPage';

vi.mock('../../services/adminSettings', () => ({
  fetchAdminPreferences: vi.fn(),
  updateAdminPreferences: vi.fn(),
}));

const session: AuthSession = {
  token: 'test-access-token',
  refreshToken: 'test-refresh-token',
  user: {
    id: '9',
    name: 'Admin User',
    role: 'admin',
    mustChangePassword: false,
  },
};

const preferences = {
  sessionAlerts: true,
  verificationAlerts: true,
  oneStepVerification: true,
};

const logout = vi.fn();

function renderSettings() {
  const router = createMemoryRouter(
    [
      {
        path: '/dashboard/admin/settings',
        element: <SettingsPage />,
      },
      {
        path: '/login',
        element: <h1>Login page</h1>,
      },
    ],
    {
      initialEntries: ['/dashboard/admin/settings'],
    },
  );

  render(
    <AuthContext.Provider
      value={{
        session,
        selectedRole: null,
        selectRole: () => {},
        login: () => {},
        logout,
        updateUser: () => {},
      }}
    >
      <RouterProvider router={router} />
    </AuthContext.Provider>,
  );

  return router;
}

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.mocked(fetchAdminPreferences).mockResolvedValue(preferences);
    vi.mocked(updateAdminPreferences).mockResolvedValue(preferences);
    logout.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('displays the administrator settings page and logout button', async () => {
    renderSettings();

    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Sign out' })).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });

  it('asks for confirmation before logging out', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderSettings();

    await userEvent.click(await screen.findByRole('button', { name: 'Logout' }));

    expect(confirmSpy).toHaveBeenCalledWith(
      'Are you sure you want to log out of your administrator account?',
    );

    expect(logout).not.toHaveBeenCalled();
  });

  it('does not log out when the administrator cancels', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderSettings();

    await userEvent.click(await screen.findByRole('button', { name: 'Logout' }));

    expect(logout).not.toHaveBeenCalled();

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
  });

  it('logs out and redirects to the login page when confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderSettings();

    await userEvent.click(await screen.findByRole('button', { name: 'Logout' }));

    expect(logout).toHaveBeenCalledTimes(1);

    expect(await screen.findByRole('heading', { name: 'Login page' })).toBeInTheDocument();
  });
});
