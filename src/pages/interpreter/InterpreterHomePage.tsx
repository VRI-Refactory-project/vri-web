import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  reasonText,
  useAvailability,
  useInterpreterHome,
} from '../../features/interpreter/homeData';
import './InterpreterHomePage.css';

const BASE = '/dashboard/interpreter';

function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function StatCard(props: {
  label: string;
  value: string | number;
  note: string;
  to: string;
  cta: string;
}) {
  return (
    <section className="ih-card ih-stat" aria-label={props.label}>
      <div>
        <p className="ih-stat-label">{props.label}</p>
        <p className="ih-stat-value">{props.value}</p>
        <p className="ih-note">{props.note}</p>
      </div>
      <Link className="ih-link" to={props.to}>
        {props.cta} →
      </Link>
    </section>
  );
}

export function InterpreterHomePage() {
  const { session } = useAuth();
  const { data } = useInterpreterHome();
  const { available, reason, setAvailable, loading, saving, error } = useAvailability();
  const reasonNote = available ? reasonText(reason) : '';
  const name = session?.user.name ?? '';
  const firstName = name.trim().split(/\s+/)[0] ?? '';
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <div className="ih">
      <header className="ih-header">
        <div>
          <h1 className="ih-title">{[greeting(), firstName].filter(Boolean).join(' ')}</h1>
          <p className="ih-sub">Here&apos;s what&apos;s happening today!</p>
        </div>
        <span className="ih-badge" aria-hidden="true">
          {initial}
        </span>
      </header>

      <section className="ih-card ih-status" aria-label="Availability status">
        <span className={available ? 'ih-dot ih-dot--on' : 'ih-dot'} aria-hidden="true" />
        <div className="ih-status-text">
          <h2 className={available ? 'ih-status-title ih-status-title--on' : 'ih-status-title'}>
            {available ? 'Available' : 'Unavailable'}
          </h2>
          <p className="ih-status-note" role="status">
            {available
              ? 'You are available to receive interpreting requests'
              : 'You will not receive interpreting requests'}
          </p>
          {reasonNote && <p className="ih-status-note">{reasonNote}</p>}
          {error && (
            <p className="ih-error" role="alert">
              {error}
            </p>
          )}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={available}
          aria-label="Available for interpreting requests"
          className={available ? 'ih-switch ih-switch--on' : 'ih-switch'}
          disabled={loading || saving}
          onClick={() => void setAvailable(!available)}
        >
          <span className="ih-switch-knob" />
        </button>
      </section>

      <div className="ih-stats">
        <StatCard
          label="Available requests"
          value={data.availableRequests}
          note="Waiting for interpreter"
          to={`${BASE}/requests`}
          cta="View requests"
        />
        <StatCard
          label="Today's Sessions"
          value={data.todaysSessions}
          note="Upcoming sessions"
          to={`${BASE}/sessions`}
          cta="View sessions"
        />
        {data.pendingEarnings && (
          <StatCard
            label="Pending Earnings"
            value={data.pendingEarnings}
            note="Sample figure, not real money"
            to={`${BASE}/wallet`}
            cta="Open wallet"
          />
        )}
      </div>

      {data.recentSessions.length > 0 && (
        <ul className="ih-recent" aria-label="Recent sessions">
          {data.recentSessions.map((s) => (
            <li key={s.id} className="ih-card ih-session">
              <span className="ih-check" aria-hidden="true">
                <Check size={14} />
              </span>
              <div className="ih-session-text">
                <p className="ih-session-done">Session completed</p>
                <p className="ih-session-title">{s.title}</p>
                <p className="ih-session-client">Client: {s.client}</p>
              </div>
              <time className="ih-session-time">{s.time}</time>
            </li>
          ))}
        </ul>
      )}

      {data.nextSession && (
        <section className="ih-card ih-reminder" aria-label="Reminder">
          <div>
            <h2 className="ih-reminder-title">Reminder</h2>
            <p className="ih-reminder-text">
              Your next interpreting session starts at {data.nextSession.startsAt}. Please test your
              camera and internet connection 10 minutes before joining.
            </p>
          </div>
          <Link className="ih-button" to={`${BASE}/sessions`}>
            View calendar
          </Link>
        </section>
      )}
    </div>
  );
}
