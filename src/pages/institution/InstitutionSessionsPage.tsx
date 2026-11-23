import { ChevronRight, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { describeError } from '../../services/api';
import {
  CHANNEL_LABEL,
  formatDuration,
  formatWhen,
  listInstitutionSessions,
  outcomeLabel,
  type InstitutionSession,
  type SessionState,
} from '../../services/institutionSessions';
import './InstitutionSessionsPage.css';

const BASE = '/dashboard/institution/sessions';

const TABS: { value: SessionState; label: string }[] = [
  { value: 'history', label: 'History' },
  { value: 'active', label: 'Active' },
];

/** What a search matches: the staff member, their department or the interpreter. */
const matches = (session: InstitutionSession, query: string) => {
  const q = query.trim().toLowerCase();
  return (
    !q ||
    [session.staff.name, session.staff.department, session.interpreter_name ?? ''].some((field) =>
      field.toLowerCase().includes(q),
    )
  );
};

/**
 * The institution's sessions (V2-030): past ones to look back on, and the ones happening now. One
 * row per session with when, who, how it came about, how long it ran and who interpreted. Only
 * metadata: what was said in a session is never stored or shown.
 */
export function InstitutionSessionsPage() {
  const [tab, setTab] = useState<SessionState>('history');
  const [search, setSearch] = useState('');
  // The answer for one tab. While the shown tab has no answer yet, the page is loading.
  const [result, setResult] = useState<{
    tab: SessionState;
    sessions?: InstitutionSession[];
    error?: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    listInstitutionSessions(tab).then(
      (sessions) => !cancelled && setResult({ tab, sessions }),
      (err) => !cancelled && setResult({ tab, error: describeError(err) }),
    );
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const loaded = result?.tab === tab ? result : null;
  const shown = (loaded?.sessions ?? []).filter((session) => matches(session, search));

  return (
    <div className="isp">
      <header className="isp-header">
        <h1>Sessions</h1>
        <p>Look back at your staff’s interpreting sessions, or see the ones happening now.</p>
      </header>

      <div className="isp-tabs" role="tablist" aria-label="Which sessions">
        {TABS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={tab === option.value}
            className="isp-tab"
            onClick={() => setTab(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <label className="isp-search">
        <Search size={18} aria-hidden="true" />
        <input
          type="search"
          placeholder="Search by staff member, department or interpreter"
          aria-label="Search sessions"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>

      <p className="isp-note">
        Only the details of each session are kept. What was said is never stored or shown.
      </p>

      {!loaded ? (
        <p className="isp-empty" role="status">
          Loading sessions…
        </p>
      ) : loaded.error ? (
        <p className="isp-error" role="alert">
          {loaded.error}
        </p>
      ) : shown.length === 0 ? (
        <p className="isp-empty">
          {search.trim()
            ? 'No sessions match your search.'
            : tab === 'history'
              ? 'No past sessions yet.'
              : 'No sessions are running right now.'}
        </p>
      ) : (
        <ul className="isp-list" aria-label={tab === 'history' ? 'Past sessions' : 'Active sessions'}>
          <li className="isp-row isp-row--head" aria-hidden="true">
            <span>Date</span>
            <span>Staff member</span>
            <span>Channel</span>
            <span>Duration</span>
            <span>Interpreter</span>
            <span>Outcome</span>
            <span />
          </li>
          {shown.map((session) => (
            <li key={session.id}>
              <Link to={`${BASE}/${session.id}`} className="isp-row">
                <span className="isp-when">{formatWhen(session.created_at)}</span>
                <span className="isp-staff">
                  <strong>{session.staff.name}</strong>
                  {session.staff.department && <small>{session.staff.department}</small>}
                </span>
                <span data-label="Channel">{CHANNEL_LABEL[session.channel]}</span>
                <span data-label="Duration">{formatDuration(session.duration_minutes)}</span>
                <span data-label="Interpreter">{session.interpreter_name ?? 'None'}</span>
                <span className="isp-outcome">{outcomeLabel(session)}</span>
                <ChevronRight size={18} aria-hidden="true" className="isp-arrow" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
