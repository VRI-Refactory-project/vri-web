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

/** Answers each endpoint the page calls; the interpreters list is empty unless a test sets it. */
function respondWith(sessions: unknown[] = [], interpreters: unknown[] = []) {
  fetchMock.mockImplementation(async (url: string) => {
    if (String(url).includes('available-interpreters')) return ok(interpreters);
    if (String(url).includes('/deaf/interpreters/')) return ok({ ...amina, available_now: true });
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
    expect(fetchMock.mock.calls[0][0]).toContain('/api/v1/dashboard/deaf/');
    expect(screen.queryByText(/dr\. sarah chen/i)).not.toBeInTheDocument();
  });

  it('counts the sessions the API returns', async () => {
    respondWith([{ id: 1 }, { id: 2 }]);
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
    fetchMock.mockImplementation(async (url: string) =>
      String(url).includes('available-interpreters')
        ? { ok: false, status: 500, statusText: 'Server Error', json: async () => ({}) }
        : ok({ user: {}, requests: [], sessions: [], chats: [] }),
    );
    renderPage();
    expect(await screen.findByText('No interpreters are available right now.')).toBeInTheDocument();
  });
});
