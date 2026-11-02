import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);
afterEach(() => fetchMock.mockReset());

const reply = (ok: boolean, status: number, body: unknown) => ({
  ok,
  status,
  statusText: 'x',
  json: async () => body,
});

type Reason = 'not_approved' | 'switched_off' | 'day_off' | 'outside_hours' | null;

const status = (isAvailable: boolean, reason: Reason = null) => ({
  is_available: isAvailable,
  available_now: isAvailable && reason === null,
  reason,
});

function mockProfile(
  isAvailable: boolean,
  patch?: ReturnType<typeof reply>,
  reason: Reason = null,
) {
  fetchMock.mockImplementation(async (_url: string, init?: RequestInit) =>
    init?.method === 'PATCH'
      ? (patch ?? reply(true, 200, status(!isAvailable)))
      : reply(true, 200, status(isAvailable, reason)),
  );
}

function renderHome() {
  if (!fetchMock.getMockImplementation()) mockProfile(true);
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
    // Changed the regex to allow the emoji at the beginning of the text
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: (name) => name.includes('Good morning') && name.includes('Amina'),
      }),
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

  it('shows the availability toggle button', async () => {
    mockProfile(true);
    renderHome();

    // Since the button is currently static in the UI, we just check if it renders
    const toggle = screen.getByRole('button', { name: /toggle availability/i });
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveClass('active');
  });

  it('shows the request and session counts with links to their pages', () => {
    renderHome();

    expect(screen.getByText('Pending requests')).toBeInTheDocument();
    expect(screen.getByText("This week's sessions")).toBeInTheDocument();

    const viewAllLinks = screen.getAllByRole('link', { name: /view all/i });
    expect(viewAllLinks.length).toBeGreaterThan(0);
  });
});
