import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LiveSessionsEvents } from '../../features/admin/liveSessionsSocket';
import {
  clearSessionFlag,
  fetchLiveSessions,
  fetchLiveStats,
  flagSession,
  markSessionSeen,
  type LiveSession,
  type LiveStats,
} from '../../services/adminSessions';
import { SessionsPage } from './SessionsPage';

vi.mock('../../services/adminSessions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/adminSessions')>();
  return {
    ...actual,
    fetchLiveStats: vi.fn(),
    fetchLiveSessions: vi.fn(),
    flagSession: vi.fn(),
    clearSessionFlag: vi.fn(),
    markSessionSeen: vi.fn(),
  };
});

const row = (over: Partial<LiveSession> = {}): LiveSession => ({
  id: 12,
  channel: 'on_demand',
  status: 'connected',
  status_label: 'Connected',
  priority: 'NORMAL',
  session_type: 'MEDICAL',
  sector: 'Demo Hospital',
  requester: { name: 'Grace Achieng', role: 'institution', role_label: 'Institution staff' },
  interpreter: { name: 'Moses Okello' },
  created_at: '2026-11-25T09:00:00Z',
  connected_at: '2026-11-25T09:01:00Z',
  minutes_running: 12,
  needs_attention: [],
  flag: null,
  seen: null,
  ...over,
});

const stats = (over: Partial<LiveStats> = {}): LiveStats => ({
  liveNow: 1,
  connecting: 1,
  connectingAverageSeconds: 14,
  needsAttention: 1,
  attention: { emergency: 1, stuck: 0, over_duration: 0, flagged: 0 },
  ...over,
});

const waiting = row({
  id: 13,
  status: 'waiting',
  status_label: 'Waiting',
  priority: 'EMERGENCY',
  sector: 'Individual',
  requester: { name: 'Peter Deaf', role: 'deaf_hoh', role_label: 'Deaf user' },
  connected_at: null,
  minutes_running: 3,
  needs_attention: ['emergency'],
});

function fakeSocket() {
  const socket = { events: null as LiveSessionsEvents | null, close: vi.fn() };
  const open = vi.fn((events: LiveSessionsEvents) => {
    socket.events = events;
    return { close: socket.close };
  });
  return { socket, open };
}

async function show(sessions = [row(), waiting]) {
  vi.mocked(fetchLiveSessions).mockResolvedValue(sessions);
  const { socket, open } = fakeSocket();
  render(<SessionsPage openSocket={open} />);
  await screen.findAllByTestId('live-session');
  return socket;
}

const rows = () => screen.getAllByTestId('live-session');

beforeEach(() => {
  vi.mocked(fetchLiveStats).mockReset().mockResolvedValue(stats());
  vi.mocked(fetchLiveSessions).mockReset();
  vi.mocked(flagSession).mockReset();
  vi.mocked(clearSessionFlag).mockReset();
  vi.mocked(markSessionSeen).mockReset();
});

describe('SessionsPage (V2-047 live monitor)', () => {
  it('shows each live call with its type, channel, people and timing', async () => {
    await show();

    const [first, second] = rows();
    expect(first).toHaveTextContent('#12 · Medical · On demand');
    expect(first).toHaveTextContent('Demo Hospital · Grace Achieng (Institution staff)');
    expect(first).toHaveTextContent('Interpreter: Moses Okello');
    expect(first).toHaveTextContent('Connected · 12 min');
    expect(first).toHaveTextContent('On track');
    expect(second).toHaveTextContent('Waiting · 3 min');
    expect(second).toHaveTextContent('Emergency');
  });

  it('shows the real figures at the top', async () => {
    await show();

    // On "Live now", and in the "Needs attention" breakdown.
    expect(await screen.findAllByText('1 emergency')).toHaveLength(2);
    expect(screen.getByText('Average: 14s to connect today')).toBeInTheDocument();
    expect(screen.queryByText(/stable/i)).not.toBeInTheDocument();
  });

  it('highlights calls that need attention, with their reasons', async () => {
    await show([
      row({ needs_attention: ['over_duration', 'flagged'] }),
      row({ id: 14, status: 'connecting', status_label: 'Connecting', needs_attention: ['stuck'] }),
    ]);

    const [over, stuck] = rows();
    expect(over).toHaveClass('sessions-row--attention');
    expect(over).toHaveTextContent('Over expected time');
    expect(over).toHaveTextContent('Follow up');
    expect(stuck).toHaveTextContent('Stuck connecting');
  });

  it('filters to connecting calls or calls needing attention', async () => {
    const user = userEvent.setup();
    await show();

    await user.click(screen.getByRole('button', { name: /Connecting/ }));
    expect(rows()).toHaveLength(1);
    expect(rows()[0]).toHaveTextContent('#13');

    await user.click(screen.getByRole('button', { name: /Needs attention/ }));
    expect(rows()[0]).toHaveTextContent('#13');

    await user.click(screen.getByRole('button', { name: /All/ }));
    expect(rows()).toHaveLength(2);
  });

  it('searches by session number or name', async () => {
    const user = userEvent.setup();
    await show();
    const search = screen.getByRole('searchbox', { name: 'Search live sessions' });

    await user.type(search, 'peter');
    expect(rows()).toHaveLength(1);
    expect(rows()[0]).toHaveTextContent('#13');

    await user.clear(search);
    await user.type(search, '#12');
    expect(rows()[0]).toHaveTextContent('#12');

    await user.clear(search);
    await user.type(search, 'nobody');
    expect(screen.getByText('No live sessions match your search.')).toBeInTheDocument();
  });

  it('marks a call for follow-up with a note', async () => {
    const user = userEvent.setup();
    vi.mocked(flagSession).mockResolvedValue(
      row({
        needs_attention: ['flagged'],
        flag: { flagged_by: 'Admin Ann', note: 'Check video', flagged_at: '2026-11-25T09:20:00Z' },
      }),
    );
    await show();

    await user.click(within(rows()[0]).getByRole('button', { name: 'Follow up' }));
    await user.type(
      screen.getByRole('textbox', { name: /Why session 12 needs follow-up/ }),
      'Check video',
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(flagSession).toHaveBeenCalledWith(12, 'Check video');
    expect(
      await screen.findByText('Marked for follow-up by Admin Ann: “Check video”'),
    ).toBeInTheDocument();
    expect(within(rows()[0]).getByRole('button', { name: 'Mark done' })).toBeInTheDocument();
  });

  it('marks a follow-up done', async () => {
    const user = userEvent.setup();
    const flagged = row({
      needs_attention: ['flagged'],
      flag: { flagged_by: 'Admin Ann', note: '', flagged_at: '2026-11-25T09:20:00Z' },
    });
    vi.mocked(clearSessionFlag).mockResolvedValue(row());
    await show([flagged]);

    await user.click(screen.getByRole('button', { name: 'Mark done' }));

    expect(clearSessionFlag).toHaveBeenCalledWith(12);
    await waitFor(() => expect(rows()[0]).toHaveTextContent('On track'));
  });

  it('applies live updates, and drops calls that end', async () => {
    const socket = await show();

    act(() => socket.events?.onConnectionChange(true));
    expect(screen.getByText('Live')).toBeInTheDocument();

    act(() => socket.events?.onSession(row({ minutes_running: 13 })));
    expect(rows()[0]).toHaveTextContent('Connected · 13 min');

    act(() =>
      socket.events?.onSession(row({ id: 20, status: 'waiting', status_label: 'Waiting' })),
    );
    expect(rows()).toHaveLength(3);
    expect(rows()[0]).toHaveTextContent('#20');

    act(() => socket.events?.onSession(row({ status: 'ended', status_label: 'Ended' })));
    expect(rows()).toHaveLength(2);
    expect(screen.queryByText(/#12 ·/)).not.toBeInTheDocument();
  });

  it('says it is refreshing on a timer while live updates are unavailable', async () => {
    const socket = await show();

    expect(screen.getByText('Auto-refresh')).toBeInTheDocument();
    act(() => socket.events?.onConnectionChange(true));
    act(() => socket.events?.onConnectionChange(false));
    expect(screen.getByText('Auto-refresh')).toBeInTheDocument();
  });

  it('has no arrow suggesting a row opens somewhere', async () => {
    await show();

    expect(screen.queryByText('›')).not.toBeInTheDocument();
  });

  it('marks a call’s warnings as seen, which quiets them', async () => {
    const user = userEvent.setup();
    const over = row({ minutes_running: 95, needs_attention: ['over_duration'] });
    vi.mocked(markSessionSeen).mockResolvedValue(
      row({
        minutes_running: 95,
        seen: { seen_by: 'Admin Ann', seen_at: '2026-11-25T10:00:00Z', reasons: ['over_duration'] },
      }),
    );
    await show([over]);

    await user.click(screen.getByRole('button', { name: 'Mark seen' }));

    expect(markSessionSeen).toHaveBeenCalledWith(12);
    expect(await screen.findByText('Seen by Admin Ann')).toBeInTheDocument();
    expect(rows()[0]).not.toHaveClass('sessions-row--attention');
    expect(rows()[0]).toHaveTextContent('Over expected time');
    expect(rows()[0]).not.toHaveTextContent('On track');
    expect(screen.queryByRole('button', { name: 'Mark seen' })).not.toBeInTheDocument();
  });

  it('offers Mark seen only when there is a warning', async () => {
    await show([row()]);

    expect(screen.queryByRole('button', { name: 'Mark seen' })).not.toBeInTheDocument();
  });
});
