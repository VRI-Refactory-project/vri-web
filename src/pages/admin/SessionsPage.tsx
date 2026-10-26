// src/pages/admin/SessionsPage.tsx
import { Search, SlidersHorizontal } from 'lucide-react';
import './SessionsPage.css';

type ConnectionStatus = 'Stable' | 'Review';

interface SessionRow {
  id: string;
  sector: string;
  participants: string;
  status: string;
  time: string;
  connection: ConnectionStatus;
}

// Static sample — will come from the API in a follow-up.
const SESSIONS: SessionRow[] = [
  {
    id: 'SC-90218',
    sector: 'Healthcare',
    participants: 'Amina Okafor',
    status: 'Live',
    time: '08:42',
    connection: 'Stable',
  },
  {
    id: 'SC-90217',
    sector: 'Education',
    participants: 'Daniel Njovu',
    status: 'Live',
    time: '14:19',
    connection: 'Stable',
  },
  {
    id: 'SC-90216',
    sector: 'Legal',
    participants: 'Grace Nalubega',
    status: 'Connecting',
    time: '02:08',
    connection: 'Review',
  },
  {
    id: 'SC-90215',
    sector: 'Healthcare',
    participants: 'Luis Martinez',
    status: 'Live',
    time: '21:04',
    connection: 'Stable',
  },
];

const STATS = [
  { label: 'Live now', value: '84', hint: '79 stable' },
  { label: 'Connecting', value: '6', hint: 'Average: 1m 56s' },
  { label: 'Needs attention', value: '2', hint: 'Connection review' },
];

export function SessionsPage() {
  return (
    <div className="sessions-page">
      {/* Header */}
      <header className="sessions-header">
        <div>
          <h1>Activation sessions</h1>
          <p>Monitor live sessions, connection health and sessions needing attention</p>
        </div>
      </header>

      {/* Stat cards */}
      <section className="sessions-stats">
        {STATS.map((s) => (
          <article className="sessions-stat" key={s.label}>
            <span className="sessions-stat__label">{s.label}</span>
            <strong className="sessions-stat__value">{s.value}</strong>
            <small className="sessions-stat__hint">{s.hint}</small>
          </article>
        ))}
      </section>

      {/* Session monitoring card */}
      <section className="sessions-panel">
        <div className="sessions-panel__header">
          <div>
            <h2>Session monitoring</h2>
            <p>Live connection status updates automatically</p>
          </div>
          <span className="sessions-live-dot">
            <i /> Live
          </span>
        </div>

        <div className="sessions-toolbar">
          <label className="sessions-search">
            <Search size={16} />
            <input type="search" placeholder="Search by session ID" />
          </label>
          <button type="button" className="sessions-btn sessions-btn--ghost">
            <SlidersHorizontal size={15} />
            Filter
          </button>
        </div>

        <div className="sessions-list">
          <div className="sessions-list__head">
            <span>SESSION</span>
            <span>CONNECTION</span>
          </div>

          {SESSIONS.length === 0 ? (
            <p className="sessions-empty">No active sessions right now.</p>
          ) : (
            SESSIONS.map((s) => (
              <div className="sessions-row" key={s.id}>
                <div className="sessions-row__info">
                  <strong>{s.id}</strong>
                  <small>
                    {s.sector} · {s.participants} · {s.status} {s.time}
                  </small>
                </div>
                <span
                  className={`sessions-badge ${
                    s.connection === 'Stable' ? 'sessions-badge--stable' : 'sessions-badge--review'
                  }`}
                >
                  {s.connection}
                </span>
                <span className="sessions-row__arrow" aria-hidden="true">
                  ›
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
