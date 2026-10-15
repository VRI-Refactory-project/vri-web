import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

/** The status starts with the given availability; PATCH answers with `patch`. */
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

  it('shows the saved availability and switches it through the API', async () => {
    mockProfile(true);
    renderHome();
    const toggle = screen.getByRole('switch', { name: /available for interpreting requests/i });
    await waitFor(() => expect(toggle).toBeChecked());
    expect(
      screen.getByText('You are available to receive interpreting requests'),
    ).toBeInTheDocument();
    await userEvent.click(toggle);
    await waitFor(() => expect(toggle).not.toBeChecked());
    expect(screen.getByText('You will not receive interpreting requests')).toBeInTheDocument();
    const patch = fetchMock.mock.calls.find(([, init]) => init?.method === 'PATCH');
    expect(patch?.[0]).toContain('/api/v1/interpreters/me/availability/status/');
    expect(JSON.parse(patch?.[1].body)).toEqual({ is_available: false });
  });

  it('explains why requests are not coming when the switch is on but it is outside working hours', async () => {
    mockProfile(true, undefined, 'outside_hours');
    renderHome();
    expect(await screen.findByText(/outside your working hours/i)).toBeInTheDocument();
    expect(
      screen.getByRole('switch', { name: /available for interpreting requests/i }),
    ).toBeChecked();
  });

  it('goes back and shows the API message when availability is refused', async () => {
    mockProfile(
      false,
      reply(false, 400, {
        is_available: ['You can only set yourself available after your profile is approved.'],
      }),
    );
    renderHome();
    const toggle = screen.getByRole('switch', { name: /available for interpreting requests/i });
    await waitFor(() => expect(toggle).toBeEnabled());
    await userEvent.click(toggle);
    expect(await screen.findByRole('alert')).toHaveTextContent(/after your profile is approved/i);
    expect(toggle).not.toBeChecked();
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
