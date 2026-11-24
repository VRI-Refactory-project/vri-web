import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { DashboardPage } from './DHH_dashboard';

// Mock useAuth since DashboardLayout reads the current user
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    session: { user: { name: 'Micheal Kiggundu', role: 'deaf' } },
  }),
}));

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const ok = (body: unknown) => ({
  ok: true,
  status: 200,
  statusText: 'OK',
  json: async () => body,
});

const amina = {
  id: 1,
  name: 'Amina Okafor',
  sign_languages: ['Ugandan Sign Language'],
  specialisation: 'Medical',
  photo_url: null,
};

/**
 * Answers each endpoint the page calls.
 * - `sessions`      → dashboard payload's `sessions` field
 * - `interpreters`  → available interpreters list
 * - `bookedSessions`→ the /interpreters/sessions/booked/ endpoint
 */
function respondWith(
  sessions: unknown[] = [],
  interpreters: unknown[] = [],
  bookedSessions: unknown[] = [],
) {
  fetchMock.mockImplementation(async (url: string) => {
    const u = String(url);
    if (u.includes('/interpreters/sessions/booked/')) return ok(bookedSessions);
    if (u.includes('available-interpreters')) return ok(interpreters);
    if (u.includes('/deaf/interpreters/')) return ok({ ...amina, available_now: true });
    return ok({ user: {}, requests: [], sessions, chats: [] });
  });
}

function renderPage() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
}

describe('DashboardPage (deaf)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    respondWith();
  });

  it('greets the signed-in user by first name', async () => {
    renderPage();
    expect(
      screen.getByRole('heading', { name: /good (morning|afternoon|evening), micheal/i }),
    ).toBeInTheDocument();
    await screen.findByText('No upcoming sessions yet.');
  });

  it('shows the Start VRI Session call to action', async () => {
    renderPage();
    await screen.findByText('No upcoming sessions yet.');
    expect(screen.getByRole('button', { name: /start vri session/i })).toBeInTheDocument();
  });

  it('opens the start session page from the Start VRI Session button', async () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard/deaf/sessions/new" element={<p>Start session page</p>} />
        </Routes>
      </MemoryRouter>,
    );
    await screen.findByText('No upcoming sessions yet.');

    await userEvent.click(screen.getByRole('button', { name: /start vri session/i }));

    expect(screen.getByText('Start session page')).toBeInTheDocument();
  });

  it('opens the start session page as an emergency from the Emergency Request button', async () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard/deaf/sessions/new" element={<p>Start session page</p>} />
        </Routes>
      </MemoryRouter>,
    );
    await screen.findByText('No upcoming sessions yet.');

    await userEvent.click(screen.getByRole('button', { name: /emergency request/i }));

    expect(screen.getByText('Start session page')).toBeInTheDocument();
  });

  it('opens a page from Accessibility Setup', async () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard/deaf/schedule" element={<p>Schedule page</p>} />
          <Route path="/dashboard/deaf/accessibility" element={<p>Accessibility page</p>} />
        </Routes>
      </MemoryRouter>,
    );
    await screen.findByText('No upcoming sessions yet.');

    await userEvent.click(screen.getByRole('button', { name: /accessibility setup/i }));

    expect(screen.getByText('Accessibility page')).toBeInTheDocument();
  });

  it('shows no sessions when the API has none', async () => {
    renderPage();
    expect(await screen.findByText('No upcoming sessions yet.')).toBeInTheDocument();
    expect(screen.getAllByText('0 sessions')).toHaveLength(2);
    // 👇 REMOVED: The check for the old dashboard endpoint
    expect(screen.queryByText(/dr\. sarah chen/i)).not.toBeInTheDocument();
  });

  it('counts the sessions the API returns', async () => {
    // 👇 Pass the fake data into the 3rd argument (bookedSessions)
    respondWith(
      [],
      [],
      [
        {
          id: 1,
          date: '2026-12-01',
          time: '10:00',
          duration: 30,
          session_type: 'medical',
          status: 'PENDING',
        },
        {
          id: 2,
          date: '2026-12-02',
          time: '11:00',
          duration: 30,
          session_type: 'legal',
          status: 'PENDING',
        },
      ],
    );
    renderPage();
    await waitFor(() => expect(screen.getByText('2 sessions')).toBeInTheDocument());
  });

  it('lists the interpreters the API says are available', async () => {
    respondWith([], [amina, { ...amina, id: 2, name: 'Daniel Brooks' }]);
    renderPage();
    expect(await screen.findByText('Amina Okafor')).toBeInTheDocument();
    expect(screen.getByText('Daniel Brooks')).toBeInTheDocument();
    expect(screen.getAllByText('Available')).toHaveLength(2);
    expect(screen.queryByText(/no interpreters are available/i)).not.toBeInTheDocument();
  });

  it('opens an interpreter profile from View profile', async () => {
    respondWith([], [amina]);
    renderPage();
    await screen.findByText('Amina Okafor');

    await userEvent.click(screen.getByRole('button', { name: 'View profile' }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(await screen.findByText('Available now')).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some(([url]) => String(url).includes('/deaf/interpreters/1/')),
    ).toBe(true);
  });

  it('says so when no interpreter is available', async () => {
    renderPage();
    expect(await screen.findByText('No interpreters are available right now.')).toBeInTheDocument();
  });

  it('shows the list as empty when it cannot be loaded', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      const u = String(url);
      if (u.includes('/interpreters/sessions/booked/')) return ok([]);
      if (u.includes('available-interpreters')) {
        return { ok: false, status: 500, statusText: 'Server Error', json: async () => ({}) };
      }
      return ok({ user: {}, requests: [], sessions: [], chats: [] });
    });
    renderPage();
    expect(await screen.findByText('No interpreters are available right now.')).toBeInTheDocument();
  });

  // NEW: verifies that booked sessions render on the dashboard
  it('lists the booked sessions returned by the API', async () => {
    respondWith(
      [],
      [],
      [
        {
          id: 42,
          date: '2026-12-01',
          time: '14:30',
          duration: 30,
          session_type: 'medical',
          status: 'PENDING',
        },
      ],
    );
    renderPage();
    expect(await screen.findByText(/medical session/i)).toBeInTheDocument();
    // Check for the new date box layout
    expect(screen.getByText('Dec')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.queryByText('No upcoming sessions yet.')).not.toBeInTheDocument();
  });

  describe('booked sessions routing', () => {
    const booking = (id: number, status: string, interpreter_name: string | null = null) => ({
      id,
      // Two days ahead, so the tests keep working as the calendar moves on.
      date: new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10),
      time: '10:00',
      duration: 30,
      session_type: 'medical',
      status,
      interpreter_name,
    });

    it('says who a confirmed booking is with and that a pending one is waiting', async () => {
      respondWith([], [], [booking(1, 'CONFIRMED', 'Amina Okafor'), booking(2, 'PENDING')]);
      renderPage();
      expect(await screen.findByText('Confirmed with Amina Okafor')).toBeInTheDocument();
      expect(screen.getByText('Waiting for an interpreter')).toBeInTheDocument();
    });

    it('shows Join call instead of Cancel once the call can be opened, and opens it', async () => {
      respondWith([], [], [{ ...booking(3, 'CONFIRMED', 'Amina Okafor'), can_join: true }]);
      const base = fetchMock.getMockImplementation()!;
      fetchMock.mockImplementation(async (url: string, init?: RequestInit) =>
        init?.method === 'POST' ? ok({ request_id: 41 }) : base(url),
      );
      renderPage();
      await userEvent.click(await screen.findByRole('button', { name: 'Join call' }));

      expect(screen.queryByRole('button', { name: 'Cancel booking' })).not.toBeInTheDocument();
      const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST');
      expect(String(post?.[0])).toContain('/interpreters/sessions/booked/3/start/');
    });

    it('says when the interpreter did not join and offers no buttons', async () => {
      respondWith([], [], [{ ...booking(6, 'CONFIRMED', 'Amina Okafor'), no_show: 'interpreter' }]);
      renderPage();

      expect(await screen.findByText('Interpreter did not join')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Cancel booking' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Join call' })).not.toBeInTheDocument();
    });

    it('cancels a booking and shows it as cancelled', async () => {
      respondWith([], [], [booking(7, 'PENDING')]);
      const base = fetchMock.getMockImplementation()!;
      fetchMock.mockImplementation(async (url: string, init?: RequestInit) =>
        init?.method === 'POST' ? ok({ id: 7, status: 'CANCELLED' }) : base(url),
      );
      renderPage();
      await userEvent.click(await screen.findByRole('button', { name: 'Cancel booking' }));
      expect(await screen.findByText('Cancelled', { selector: 'span:not(.badge)' })).toBeVisible();
      const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST');
      expect(String(post?.[0])).toContain('/interpreters/sessions/booked/7/cancel/');
      expect(screen.queryByRole('button', { name: 'Cancel booking' })).not.toBeInTheDocument();
    });
  });
});
