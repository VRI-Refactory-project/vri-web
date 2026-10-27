// src/pages/admin/SessionsPage.tsx
import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import {
  fetchAdminSessionStats,
  fetchAdminSessions,
  type AdminSession,
  type AdminSessionStats,
} from '../../services/adminSessions';
import { describeError } from '../../services/api';
import './SessionsPage.css';

export function SessionsPage() {
  const [stats, setStats] = useState<AdminSessionStats | null>(null);
  const [sessions, setSessions] = useState<AdminSession[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchAdminSessionStats(), fetchAdminSessions()])
      .then(([s, list]) => {
        if (cancelled) return;
        setStats(s);
        setSessions(list);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(describeError(err));
        setSessions([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loading = sessions === null;
  const isEmpty = !loading && sessions.length === 0;

  return (
    <div className="sessions-page">
      <header className="sessions-header">
        <div>
          <h1>Activation sessions</h1>
          <p>Monitor live sessions, connection health and sessions needing attention</p>
        </div>
      </header>

      <section className="sessions-stats">
        <article className="sessions-stat">
          <span className="sessions-stat__label">Live now</span>
          <strong className="sessions-stat__value">{stats?.liveNow ?? 0}</strong>
          <small className="sessions-stat__hint">{stats ? `${stats.liveStable} stable` : ''}</small>
        </article>
        <article className="sessions-stat">
          <span className="sessions-stat__label">Connecting</span>
          <strong className="sessions-stat__value">{stats?.connecting ?? 0}</strong>
          <small className="sessions-stat__hint">
            {stats ? `Average: ${stats.connectingAverageSeconds}s` : ''}
          </small>
        </article>
        <article className="sessions-stat">
          <span className="sessions-stat__label">Needs attention</span>
          <strong className="sessions-stat__value">{stats?.needsAttention ?? 0}</strong>
          <small className="sessions-stat__hint">Connection review</small>
        </article>
      </section>

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

          {loading ? (
            <p className="sessions-empty">Loading sessions…</p>
          ) : isEmpty ? (
            <p className="sessions-empty">
              {error ? `Could not load sessions: ${error}` : 'No active sessions right now.'}
            </p>
          ) : (
            sessions.map((s) => (
              <div className="sessions-row" key={s.id}>
                <div className="sessions-row__info">
                  <strong>{s.id}</strong>
                  <small>
                    {s.sector} · {s.participant} · {s.status} {s.startedAt}
                  </small>
                </div>
                <span
                  className={`sessions-badge ${
                    s.connection === 'stable' ? 'sessions-badge--stable' : 'sessions-badge--review'
                  }`}
                >
                  {s.connection === 'stable' ? 'Stable' : 'Review'}
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
