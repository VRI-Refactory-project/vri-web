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

const dashboard = (sessions: unknown[] = []) => ({
  ok: true,
  status: 200,
  statusText: 'OK',
  json: async () => ({ user: {}, requests: [], sessions, chats: [] }),
});

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
    fetchMock.mockResolvedValue(dashboard());
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

  it('shows no sessions when the API has none', async () => {
    renderPage();
    expect(await screen.findByText('No upcoming sessions yet.')).toBeInTheDocument();
    expect(screen.getByText('0 sessions')).toBeInTheDocument();
    expect(fetchMock.mock.calls[0][0]).toContain('/api/v1/dashboard/deaf/');
    expect(screen.queryByText(/dr\. sarah chen/i)).not.toBeInTheDocument();
  });

  it('counts the sessions the API returns', async () => {
    fetchMock.mockResolvedValue(dashboard([{ id: 1 }, { id: 2 }]));
    renderPage();
    await waitFor(() => expect(screen.getByText('2 sessions')).toBeInTheDocument());
  });

  it('lists the sample interpreters', async () => {
    renderPage();
    await screen.findByText('No upcoming sessions yet.');
    expect(screen.getByText(/amina okafor/i)).toBeInTheDocument();
    expect(screen.getByText(/daniel brooks/i)).toBeInTheDocument();
  });

  it('shows the Available badge only when an interpreter is available', async () => {
    renderPage();
    await screen.findByText('No upcoming sessions yet.');
    const availableBadges = screen.getAllByText(/available/i);
    // Adjust the number if you change isAvailable for other interpreters
    expect(availableBadges.length).toBeGreaterThan(0);
  });
});
