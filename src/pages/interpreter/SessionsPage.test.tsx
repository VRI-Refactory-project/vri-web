import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getInterpreterSessions,
  type InterpreterSession,
} from '../../services/interpreterSessions';
import { InterpreterSessionsPage } from './SessionsPage';

// Keep the real helpers (labels, ordering); only the data source is replaced.
vi.mock('../../services/interpreterSessions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/interpreterSessions')>()),
  getInterpreterSessions: vi.fn(),
}));

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
// Midday, so "in 10 minutes" is always still today.
const NOW = new Date(2026, 9, 30, 12, 0);
const from = (offset: number) => new Date(NOW.getTime() + offset).toISOString();

const SESSIONS: InterpreterSession[] = [
  {
    id: '2',
    withName: 'Mulago Hospital',
    type: 'Interpreted call',
    start: from(-17 * DAY),
    durationMinutes: 45,
    status: 'completed',
  },
  {
    id: '1',
    withName: 'Micheal Kiggundu',
    type: 'Interpreted call',
    start: from(10 * MINUTE),
    durationMinutes: 60,
    status: 'upcoming',
  },
];

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/dashboard/interpreter/sessions']}>
      <Routes>
        <Route path="/dashboard/interpreter/sessions" element={<InterpreterSessionsPage />} />
        <Route path="/dashboard/interpreter" element={<p>interpreter home</p>} />
      </Routes>
    </MemoryRouter>,
  );

describe('InterpreterSessionsPage', () => {
  beforeEach(() => {
    vi.mocked(getInterpreterSessions).mockReset();
    // Only the clock is faked; timers stay real so user events and loading still work.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the heading and goes back to the dashboard home', async () => {
    vi.mocked(getInterpreterSessions).mockResolvedValue(SESSIONS);
    renderPage();

    expect(screen.getByRole('heading', { level: 1, name: 'Sessions' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByText('interpreter home')).toBeInTheDocument();
  });

  it('shows the next session up', async () => {
    vi.mocked(getInterpreterSessions).mockResolvedValue(SESSIONS);
    renderPage();

    const card = await screen.findByRole('region', { name: 'Micheal Kiggundu' });
    expect(within(card).getByText('Up next · starts in 10 mins')).toBeInTheDocument();
    expect(within(card).getByText(/^Today at /)).toBeInTheDocument();
  });

  it('lists every session, upcoming first, without an interpreter column', async () => {
    vi.mocked(getInterpreterSessions).mockResolvedValue(SESSIONS);
    renderPage();

    const panel = await screen.findByRole('region', { name: '1 upcoming · 1 completed' });
    const rows = within(panel).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText('Micheal Kiggundu')).toBeInTheDocument();
    expect(within(rows[0]).getByText('TODAY')).toBeInTheDocument();
    expect(within(rows[0]).getByText('Yet to start')).toBeInTheDocument();
    expect(within(rows[1]).getByText('45 mins')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Completed')).toBeInTheDocument();
    expect(within(panel).queryByRole('columnheader', { name: /interpreter/i })).toBeNull();
  });

  it('searches by name', async () => {
    vi.mocked(getInterpreterSessions).mockResolvedValue(SESSIONS);
    renderPage();
    await screen.findByText('Mulago Hospital');

    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Search sessions by name' }),
      'mulago',
    );

    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(within(screen.getByRole('table')).getByText('Mulago Hospital')).toBeInTheDocument();
  });

  it('shows only the chosen status', async () => {
    vi.mocked(getInterpreterSessions).mockResolvedValue(SESSIONS);
    renderPage();
    await screen.findByText('Mulago Hospital');

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Filter' }), 'Completed');

    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(2);
    expect(within(table).queryByText('Micheal Kiggundu')).not.toBeInTheDocument();
  });

  it('says when nothing matches, instead of claiming there are no sessions', async () => {
    vi.mocked(getInterpreterSessions).mockResolvedValue(SESSIONS);
    renderPage();
    await screen.findByText('Mulago Hospital');

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search sessions by name' }), 'zzz');

    expect(screen.getByText('No sessions match your search or filter.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('keeps Reschedule and Join off until booking is live, and says why', async () => {
    vi.mocked(getInterpreterSessions).mockResolvedValue(SESSIONS);
    renderPage();

    const join = await screen.findByRole('button', { name: 'Join when ready' });
    const reschedule = screen.getByRole('button', { name: 'Reschedule' });
    expect(join).toBeDisabled();
    expect(reschedule).toBeDisabled();
    expect(join).toHaveAccessibleDescription('Joining and rescheduling open once booking is live.');
  });

  it('leaves out the Up next card when nothing is coming up', async () => {
    vi.mocked(getInterpreterSessions).mockResolvedValue([SESSIONS[0]]);
    renderPage();

    expect(await screen.findByText('Mulago Hospital')).toBeInTheDocument();
    expect(screen.queryByText(/Up next/)).not.toBeInTheDocument();
  });

  it('says when there are no sessions yet', async () => {
    vi.mocked(getInterpreterSessions).mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText('No sessions yet.')).toBeInTheDocument();
  });

  it('says plainly when booking is not live, without inventing sessions', async () => {
    vi.mocked(getInterpreterSessions).mockResolvedValue(null);
    renderPage();

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Booked sessions are not live yet.',
    );
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
