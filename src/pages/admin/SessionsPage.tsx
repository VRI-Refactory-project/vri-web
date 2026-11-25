// src/pages/admin/SessionsPage.tsx
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import { useInterval } from '../../features/community/useInterval';
import {
  openLiveSessionsSocket,
  type OpenLiveSessionsSocket,
} from '../../features/admin/liveSessionsSocket';
import {
  CHANNEL_LABEL,
  clearSessionFlag,
  fetchLiveSessions,
  fetchLiveStats,
  flagSession,
  hasWarnings,
  isLive,
  markSessionSeen,
  matchesFilter,
  matchesSearch,
  reasonLabel,
  sessionTypeLabel,
  timingLabel,
  type AttentionReason,
  type LiveFilter,
  type LiveSession,
  type LiveStats,
} from '../../services/adminSessions';
import { describeError } from '../../services/api';
import { useMobileViewMore } from '../../components/responsive/useMobileViewMore';
import './AdminDashboardPage.css'; // Import the shared admin CSS for the purple background
import './SessionsPage.css';

// While the live connection is up it delivers every change; the timer then only refreshes the
// time-based parts (minutes running, over expected time). While it is down, the timer does it all.
const REFRESH_LIVE_MS = 30000;
const REFRESH_FALLBACK_MS = 10000;

const FILTERS: { value: LiveFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'connecting', label: 'Connecting' },
  { value: 'attention', label: 'Needs attention' },
];

const SUMMARY_LABEL: Record<AttentionReason, string> = {
  emergency: 'emergency',
  stuck: 'stuck',
  over_duration: 'over time',
  flagged: 'to follow up',
};

/** "2 emergency · 1 over time", or "All clear". */
function attentionSummary(stats: LiveStats) {
  const parts = (Object.keys(SUMMARY_LABEL) as AttentionReason[])
    .filter((reason) => stats.attention?.[reason])
    .map((reason) => `${stats.attention[reason]} ${SUMMARY_LABEL[reason]}`);
  return parts.length ? parts.join(' · ') : 'All clear';
}

/** Replace the call's row, add it at the top if it is new, or drop it once it is no longer live. */
function upsert(current: LiveSession[] | null, row: LiveSession) {
  const list = current ?? [];
  if (!isLive(row)) return list.filter((session) => session.id !== row.id);
  return list.some((session) => session.id === row.id)
    ? list.map((session) => (session.id === row.id ? row : session))
    : [row, ...list];
}

interface Props {
  /** The live connection (WEB-04). Tests pass a fake. */
  openSocket?: OpenLiveSessionsSocket;
}

/**
 * The administrator's live-session monitor (V2-047): every call waiting, connecting or connected
 * across the platform, which ones need attention, and flagging them for follow-up. Metadata only:
 * what is said in a call is never shown.
 */
export function SessionsPage({ openSocket = openLiveSessionsSocket }: Props) {
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [sessions, setSessions] = useState<LiveSession[] | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<LiveFilter>('all');
  const [search, setSearch] = useState('');
  const [liveConnected, setLiveConnected] = useState(false);
  // The row whose "flag for follow-up" form is open, and its note.
  const [flagging, setFlagging] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<number | null>(null);
  const [actionError, setActionError] = useState<{ id: number; message: string } | null>(null);

  const loadStats = useCallback(() => {
    fetchLiveStats().then(setStats, () => {});
  }, []);

  const load = useCallback(() => {
    Promise.all([fetchLiveStats(), fetchLiveSessions()])
      .then(([s, list]) => {
        setStats(s);
        setSessions(list);
        setError('');
      })
      .catch((err) => {
        setError(describeError(err));
        setSessions((current) => current ?? []); // keep the last list if a refresh fails
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useInterval(load, liveConnected ? REFRESH_LIVE_MS : REFRESH_FALLBACK_MS);

  useEffect(() => {
    const socket = openSocket({
      onSession: (row) => {
        setSessions((current) => upsert(current, row));
        loadStats();
      },
      onConnectionChange: setLiveConnected,
    });
    return () => socket.close();
  }, [openSocket, loadStats]);

  const applyRow = (row: LiveSession) => {
    setSessions((current) => upsert(current, row));
    loadStats();
  };

  const runAction = async (id: number, action: () => Promise<LiveSession>) => {
    setBusy(id);
    setActionError(null);
    try {
      applyRow(await action());
      setFlagging(null);
      setNote('');
    } catch (err) {
      setActionError({ id, message: describeError(err) });
      load(); // someone else may have flagged or cleared it meanwhile
    } finally {
      setBusy(null);
    }
  };

  const submitFlag = (event: FormEvent, id: number) => {
    event.preventDefault();
    void runAction(id, () => flagSession(id, note.trim()));
  };

  const loading = sessions === null;
  const all = sessions ?? [];
  const shown = all.filter((s) => matchesFilter(s, filter) && matchesSearch(s, search));
  const mobileRows = useMobileViewMore(shown.length, `${filter}|${search}|${shown.length}`);
  const countFor = (value: LiveFilter) => all.filter((s) => matchesFilter(s, value)).length;
  const emergencies = stats?.attention?.emergency ?? 0;

  return (
    //  Changed to `ad-page` so it sits on the purple background
    <main className="ad-page" style={{ width: '100%', maxWidth: '100%' }}>
      {/*  Changed to `ad-title` */}
      <header className="ad-title">
        <h1>Live sessions</h1>
        <p>Monitor live sessions, connection health and sessions needing attention</p>
      </header>

      <section className="sessions-stats">
        <article className="sessions-stat">
          <span className="sessions-stat__label">Live now</span>
          <strong className="sessions-stat__value">{stats?.liveNow ?? 0}</strong>
          <small className="sessions-stat__hint">
            {stats ? (emergencies ? `${emergencies} emergency` : 'No emergencies') : ''}
          </small>
        </article>
        <article className="sessions-stat">
          <span className="sessions-stat__label">Connecting</span>
          <strong className="sessions-stat__value">{stats?.connecting ?? 0}</strong>
          <small className="sessions-stat__hint">
            {stats ? `Average: ${stats.connectingAverageSeconds}s to connect today` : ''}
          </small>
        </article>
        <article className="sessions-stat">
          <span className="sessions-stat__label">Needs attention</span>
          <strong className="sessions-stat__value">{stats?.needsAttention ?? 0}</strong>
          <small className="sessions-stat__hint">{stats ? attentionSummary(stats) : ''}</small>
        </article>
      </section>

      <section className="sessions-panel">
        <div className="sessions-panel__header">
          <div>
            <h2>Session monitoring</h2>
            <p>
              {liveConnected ? 'Updates the moment a call changes' : 'Refreshes every 10 seconds'}.
              Only session details are shown, never what is said.
            </p>
          </div>
          <span
            className={`sessions-live-dot${liveConnected ? '' : ' sessions-live-dot--polling'}`}
            title={
              liveConnected
                ? 'Connected for live updates'
                : 'Live updates unavailable; refreshing on a timer'
            }
          >
            <i /> {liveConnected ? 'Live' : 'Auto-refresh'}
          </span>
        </div>

        <div className="sessions-toolbar">
          <label className="sessions-search">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search by session number, name or institution"
              aria-label="Search live sessions"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <div className="sessions-filters" role="group" aria-label="Show">
            {FILTERS.map((option) => (
              <button
                key={option.value}
                type="button"
                className="sessions-filter"
                aria-pressed={filter === option.value}
                onClick={() => setFilter(option.value)}
              >
                {option.label}
                {sessions && (
                  <span className="sessions-filter__count">{countFor(option.value)}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {error && sessions && sessions.length > 0 && (
          <p className="sessions-error" role="alert">
            Could not refresh: {error}
          </p>
        )}

        <div className="sessions-list">
          <div className="sessions-list__head">
            <span>SESSION</span>
            <span>STATUS</span>
          </div>

          {loading ? (
            <p className="sessions-empty">Loading sessions…</p>
          ) : shown.length === 0 ? (
            <p className="sessions-empty">
              {error && all.length === 0
                ? `Could not load sessions: ${error}`
                : search.trim()
                  ? 'No live sessions match your search.'
                  : filter === 'attention'
                    ? 'No sessions need attention right now.'
                    : filter === 'connecting'
                      ? 'No sessions are connecting right now.'
                      : 'No active sessions right now.'}
            </p>
          ) : (
            shown.map((s, index) => (
              <div
                className={`sessions-row${s.needs_attention.length ? ' sessions-row--attention' : ''}`}
                key={s.id}
                data-testid="live-session"
                {...mobileRows.itemProps(index)}
              >
                <div className="sessions-row__info">
                  <strong>
                    #{s.id} · {sessionTypeLabel(s)} · {CHANNEL_LABEL[s.channel]}
                  </strong>
                  <small>
                    {s.sector} · {s.requester.name} ({s.requester.role_label}) · Interpreter:{' '}
                    {s.interpreter?.name ?? 'None yet'}
                  </small>
                  <small>{timingLabel(s)}</small>
                  {s.flag && (
                    <small className="sessions-row__flag">
                      Marked for follow-up by {s.flag.flagged_by || 'an administrator'}
                      {s.flag.note ? `: “${s.flag.note}”` : ''}
                    </small>
                  )}
                  {s.seen && (
                    <small className="sessions-row__seen">
                      Seen by {s.seen.seen_by || 'an administrator'}
                    </small>
                  )}
                </div>

                <div className="sessions-row__reasons">
                  {s.needs_attention.map((reason) => (
                    <span key={reason} className={`sessions-badge sessions-badge--${reason}`}>
                      {reasonLabel(reason, s)}
                    </span>
                  ))}
                  {s.seen?.reasons.map((reason) => (
                    <span
                      key={`seen-${reason}`}
                      className="sessions-badge sessions-badge--seen"
                      title="Marked as seen"
                    >
                      {reasonLabel(reason, s)}
                    </span>
                  ))}
                  {!s.needs_attention.length && !s.seen && (
                    <span className="sessions-badge sessions-badge--stable">On track</span>
                  )}
                </div>

                <div className="sessions-row__actions">
                  {!s.flag && flagging !== s.id && hasWarnings(s) && (
                    <button
                      type="button"
                      className="sessions-action"
                      disabled={busy === s.id}
                      onClick={() => void runAction(s.id, () => markSessionSeen(s.id))}
                    >
                      Mark seen
                    </button>
                  )}
                  {s.flag ? (
                    <button
                      type="button"
                      className="sessions-action"
                      disabled={busy === s.id}
                      onClick={() => void runAction(s.id, () => clearSessionFlag(s.id))}
                    >
                      Mark done
                    </button>
                  ) : (
                    flagging !== s.id && (
                      <button
                        type="button"
                        className="sessions-action"
                        onClick={() => {
                          setFlagging(s.id);
                          setNote('');
                          setActionError(null);
                        }}
                      >
                        Follow up
                      </button>
                    )
                  )}
                </div>

                {flagging === s.id && !s.flag && (
                  <form className="sessions-flag-form" onSubmit={(e) => submitFlag(e, s.id)}>
                    <input
                      type="text"
                      maxLength={300}
                      placeholder="Why it needs follow-up (optional)"
                      aria-label={`Why session ${s.id} needs follow-up (optional)`}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="sessions-btn sessions-btn--ghost"
                      disabled={busy === s.id}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="sessions-action"
                      onClick={() => setFlagging(null)}
                    >
                      Cancel
                    </button>
                  </form>
                )}

                {actionError?.id === s.id && (
                  <p className="sessions-row__error" role="alert">
                    {actionError.message}
                  </p>
                )}
              </div>
            ))
          )}
          {mobileRows.button}
        </div>
      </section>
    </main>
  );
}
