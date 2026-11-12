import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
// What GET /interpreters/booked-sessions/ and GET /interpreters/me/sessions/ answer.
let booked: ReturnType<typeof reply> = reply(true, 200, []);
let mySessions: ReturnType<typeof reply> = reply(true, 200, []);

afterEach(() => {
  fetchMock.mockReset();
  notifications = noNotifications();
  booked = reply(true, 200, []);
  mySessions = reply(true, 200, []);
});

const tomorrow = () => {
  const day = new Date();
  day.setDate(day.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
};

const booking = (id: number, name: string, time = '09:00:00', extra = {}) => ({
  id,
  deaf_name: name,
  deaf_photo: null,
  date: tomorrow(),
  time,
  duration: 45,
  session_type_label: 'Medical / Healthcare',
  status: 'PENDING',
  ...extra,
});

const taken = (id: number, name: string, status: 'ASSIGNED' | 'COMPLETED', minutesAgo: number) => ({
  id,
  status,
  requester_name: name,
  requester_photo: null,
  assigned_at: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
  ended_at: status === 'COMPLETED' ? new Date().toISOString() : null,
  duration_minutes: status === 'COMPLETED' ? 12 : null,
});

/** The card with this heading. */
const card = (title: string) =>
  screen.getByRole('heading', { name: new RegExp(title) }).closest('section') as HTMLElement;

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
    if (String(url).includes('/booked-sessions/')) return booked;
    if (String(url).includes('/me/sessions/')) return mySessions;
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
  it('shows the first booked session as the upcoming session', async () => {
    booked = reply(true, 200, [
      booking(1, 'Sierah Tabbuti', '09:00:00', { status: 'CONFIRMED' }),
      booking(2, 'Brian Okello', '14:00:00'),
    ]);
    renderHome();

    const upcoming = card('Upcoming session');
    expect(await within(upcoming).findByText('Sierah Tabbuti')).toBeInTheDocument();
    expect(within(upcoming).getByText('Tomorrow, 9:00 AM')).toBeInTheDocument();
    expect(within(upcoming).getByText(/45 mins • Medical \/ Healthcare/)).toBeInTheDocument();
    expect(within(upcoming).getByText(/Confirmed/)).toBeInTheDocument();
    expect(within(upcoming).queryByText('Brian Okello')).not.toBeInTheDocument();
  });

  it('says the booking is waiting for confirmation until it is confirmed', async () => {
    booked = reply(true, 200, [booking(1, 'Sierah Tabbuti')]);
    renderHome();

    expect(
      await within(card('Upcoming session')).findByText(/Awaiting confirmation/),
    ).toBeVisible();
  });

  it('says so when nothing has been booked', async () => {
    renderHome();

    expect(await screen.findByText('No upcoming sessions booked.')).toBeInTheDocument();
    expect(screen.getByText('No sessions have been booked yet.')).toBeInTheDocument();
  });

  it('lists what different Deaf users booked, soonest first, in Booked sessions', async () => {
    booked = reply(true, 200, [
      booking(1, 'Sierah Tabbuti', '09:00:00'),
      booking(2, 'Brian Okello', '11:30:00', { session_type_label: 'Legal / Court' }),
      booking(3, 'Grace Nakato', '15:00:00', { duration: 90 }),
    ]);
    renderHome();

    const list = card('Booked sessions');
    await within(list).findByText('Brian Okello');
    const names = within(list)
      .getAllByRole('heading', { level: 4 })
      .map((heading) => heading.textContent);
    expect(names).toEqual(['Sierah Tabbuti', 'Brian Okello', 'Grace Nakato']);
    expect(within(list).getByText('Legal / Court')).toBeInTheDocument();
    expect(within(list).getByText('Tomorrow, 11:30 AM')).toBeInTheDocument();
    expect(within(list).getByText('1 hr 30 mins')).toBeInTheDocument();
  });

  it('shows only the next 4 booked sessions', async () => {
    booked = reply(
      true,
      200,
      Array.from({ length: 6 }, (_, index) => booking(index + 1, `Person ${index + 1}`)),
    );
    renderHome();

    const list = card('Booked sessions');
    await within(list).findByText('Person 4');
    expect(within(list).queryByText('Person 5')).not.toBeInTheDocument();
  });

  it('replaces Recent activity with Recent sessions, newest first, with the length', async () => {
    mySessions = reply(true, 200, [
      taken(2, 'Sierah Tabbuti', 'COMPLETED', 30),
      taken(1, 'Brian Okello', 'COMPLETED', 120),
    ]);
    renderHome();

    const recent = card('Recent sessions');
    await within(recent).findByText('Sierah Tabbuti');
    const names = within(recent)
      .getAllByRole('heading', { level: 4 })
      .map((heading) => heading.textContent);
    expect(names).toEqual(['Sierah Tabbuti', 'Brian Okello']);
    expect(within(recent).getAllByText('12 mins')).toHaveLength(2);
    expect(screen.queryByText('Recent activity')).not.toBeInTheDocument();
  });

  it('lets the interpreter rejoin a session that is still going', async () => {
    mySessions = reply(true, 200, [
      taken(5, 'Sierah Tabbuti', 'COMPLETED', 90),
      taken(9, 'Brian Okello', 'ASSIGNED', 10),
    ]);
    renderHome();

    const recent = card('Recent sessions');
    const join = await within(recent).findByRole('link', { name: 'Join session' });
    expect(join).toHaveAttribute('href', '/live/interpreter/9');
    const names = within(recent)
      .getAllByRole('heading', { level: 4 })
      .map((heading) => heading.textContent);
    expect(names[0]).toBe('Brian Okello');
  });

  it('says so when there are no sessions yet', async () => {
    renderHome();

    expect(await screen.findByText('No sessions yet.')).toBeInTheDocument();
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
