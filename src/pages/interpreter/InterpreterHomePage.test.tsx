import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
// What GET /api/v1/notifications/ answers. Tests replace it before rendering.
const reply = (ok: boolean, status: number, body: unknown) => ({
  ok,
  status,
  statusText: 'x',
  json: async () => body,
});
const noNotifications = () => reply(true, 200, []);
let notifications: ReturnType<typeof reply> = noNotifications();

afterEach(() => {
  fetchMock.mockReset();
  notifications = noNotifications();
});

const notification = (id: number, title: string, category = 'general', minutesAgo = 5) => ({
  id,
  title,
  body: '',
  category,
  read_at: null,
  created_at: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
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
  fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
    if (String(url).includes('/offers/')) return reply(true, 200, []);
    if (String(url).includes('/notifications/')) return notifications;
    return init?.method === 'PATCH'
      ? (patch ?? reply(true, 200, status(!isAvailable)))
      : reply(true, 200, status(isAvailable, reason));
  });
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
        name: (name) => /good (morning|afternoon|evening)/i.test(name) && name.includes('Amina'),
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

  it('shows the availability switch as on once the status has loaded', async () => {
    mockProfile(true);
    renderHome();

    const toggle = screen.getByRole('button', { name: /toggle availability/i });
    await waitFor(() => expect(toggle).toHaveClass('active'));
    expect(screen.getByText('Available for requests')).toBeInTheDocument();
  });
  it('switches availability off through the API when the toggle is clicked', async () => {
    mockProfile(true);
    renderHome();

    const toggle = screen.getByRole('button', { name: /toggle availability/i });
    await waitFor(() => expect(toggle).toHaveClass('active'));

    fireEvent.click(toggle);

    await waitFor(() => expect(toggle).not.toHaveClass('active'));
    const patchCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'PATCH');
    expect(patchCall?.[1]?.body).toBe(JSON.stringify({ is_available: false }));
    expect(screen.getByText('Not available')).toBeInTheDocument();
  });

  it('shows the request and session counts with links to their pages', () => {
    renderHome();

    expect(screen.getByText('Pending requests')).toBeInTheDocument();
    expect(screen.getByText("This week's sessions")).toBeInTheDocument();

    const viewAllLinks = screen.getAllByRole('link', { name: /view all/i });
    expect(viewAllLinks.length).toBeGreaterThan(0);
  });
  it('lists the latest notifications in Recent activity, newest first', async () => {
    notifications = reply(true, 200, [
      notification(3, 'New interpreter request', 'incoming_request', 5),
      notification(2, 'Offer expires soon', 'offer_reminder', 3 * 60),
      notification(1, 'Welcome aboard', 'general', 3 * 24 * 60),
    ]);
    renderHome();

    const first = await screen.findByText('New interpreter request');
    const second = screen.getByText('Offer expires soon');
    const third = screen.getByText('Welcome aboard');

    expect(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(second.compareDocumentPosition(third) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText('5 minutes ago')).toBeInTheDocument();
    expect(screen.getByText('3 hours ago')).toBeInTheDocument();
    expect(screen.getByText('3 days ago')).toBeInTheDocument();

    const dot = (text: string) =>
      screen.getByText(text).closest('.ih-timeline-item')?.querySelector('.ih-timeline-marker');
    expect(dot('New interpreter request')).toHaveClass('bg-purple');
    expect(dot('Offer expires soon')).toHaveClass('bg-blue');
    expect(dot('Welcome aboard')).toHaveClass('bg-green');
  });

  it('shows only the 5 newest notifications', async () => {
    notifications = reply(
      true,
      200,
      Array.from({ length: 7 }, (_, index) => notification(7 - index, `Notice ${7 - index}`)),
    );
    renderHome();

    await screen.findByText('Notice 7');
    expect(screen.getByText('Notice 3')).toBeInTheDocument();
    expect(screen.queryByText('Notice 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Notice 1')).not.toBeInTheDocument();
  });

  it('says so when there is no recent activity', async () => {
    renderHome();
    expect(await screen.findByText('No recent activity yet.')).toBeInTheDocument();
  });

  it('shows the error, not the empty message, when activity cannot be loaded', async () => {
    notifications = reply(false, 500, { detail: 'Notifications are unavailable.' });
    renderHome();

    expect(await screen.findByText('Notifications are unavailable.')).toBeInTheDocument();
    expect(screen.queryByText('No recent activity yet.')).not.toBeInTheDocument();
  });

  it('no longer shows the made-up connection requests', () => {
    renderHome();
    expect(screen.queryByText(/James Carter's connection request/)).not.toBeInTheDocument();
  });
  it('shows the real current month and highlights today', () => {
    renderHome();
    const now = new Date();
    const label = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    expect(screen.getByText(label)).toBeInTheDocument();
    expect(document.querySelector('.ih-cal-day-active')).toHaveTextContent(String(now.getDate()));
  });

  it('moves the calendar to the next month, where nothing is highlighted', () => {
    renderHome();
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const label = next.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    fireEvent.click(screen.getByRole('button', { name: /next month/i }));

    expect(screen.getByText(label)).toBeInTheDocument();
    expect(document.querySelector('.ih-cal-day-active')).toBeNull();
  });
});
