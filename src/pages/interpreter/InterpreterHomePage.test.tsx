import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { INTERPRETER_NAV } from '../../features/interpreter/navigation';
import { InterpreterLayout } from '../../components/interpreter/InterpreterLayout';
import { AuthContext } from '../../features/auth/authContext';
import type { AuthSession } from '../../types';
import { InterpreterHomePage } from './InterpreterHomePage';

const session: AuthSession = {
  token: 't',
  refreshToken: 'r',
  user: { id: '1', name: 'Amina Okafor', role: 'interpreter', mustChangePassword: false },
};

function renderHome() {
  const router = createMemoryRouter(
    [
      {
        path: '/dashboard/interpreter',
        element: <InterpreterLayout />,
        children: [{ index: true, element: <InterpreterHomePage /> }],
      },
    ],
    { initialEntries: ['/dashboard/interpreter'] },
  );
  return render(
    <AuthContext.Provider
      value={{
        session,
        selectedRole: null,
        selectRole: () => {},
        login: () => {},
        logout: () => {},
        updateUser: () => {},
      }}
    >
      <RouterProvider router={router} />
    </AuthContext.Provider>,
  );
}

describe('InterpreterHomePage', () => {
  it('greets the signed-in interpreter by first name', () => {
    renderHome();
    expect(
      screen.getByRole('heading', { level: 1, name: /Good (morning|afternoon|evening) Amina$/ }),
    ).toBeInTheDocument();
  });

  it('shows every sidebar destination and marks Home as current', () => {
    renderHome();
    const nav = screen.getByRole('navigation', { name: 'Interpreter' });
    for (const label of [
      'Home',
      'Requests',
      'Sessions',
      'Availability',
      'Wallet',
      'Profile',
      'Settings',
    ]) {
      expect(nav).toHaveTextContent(label);
    }
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
  });

  it('shows the sidebar words defined for the role', () => {
    renderHome();
    expect(INTERPRETER_NAV.map((l) => l.label)).toEqual(
      screen
        .getAllByRole('link')
        .slice(0, INTERPRETER_NAV.length)
        .map((a) => a.textContent?.replace(/\d+$/, '')),
    );
  });

  it('switches between available and unavailable', async () => {
    renderHome();
    const toggle = screen.getByRole('switch', { name: /available for interpreting requests/i });
    expect(toggle).toBeChecked();
    expect(
      screen.getByText('You are available to receive interpreting requests'),
    ).toBeInTheDocument();
    await userEvent.click(toggle);
    expect(toggle).not.toBeChecked();
    expect(screen.getByText('You will not receive interpreting requests')).toBeInTheDocument();
  });

  it('shows the request and session counts with links to their pages', () => {
    renderHome();
    expect(screen.getByRole('link', { name: /View requests/ })).toHaveAttribute(
      'href',
      '/dashboard/interpreter/requests',
    );
    expect(screen.getByRole('link', { name: /View sessions/ })).toHaveAttribute(
      'href',
      '/dashboard/interpreter/sessions',
    );
  });

  it('shows the pending earnings card with a link to the wallet', () => {
    renderHome();
    expect(screen.getByText('Pending Earnings')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open wallet/ })).toHaveAttribute(
      'href',
      '/dashboard/interpreter/wallet',
    );
  });
});
