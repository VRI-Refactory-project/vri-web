import { CircleHelp, MessageSquare, Video, ChevronRight, Hand } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatWhen, STATUS_LABEL, titleFor } from '../../features/sessions/sessionHistory';
import { useAuth } from '../../hooks/useAuth';
import { getMySessions, type HistoryItem } from '../../services/mySessions';
import './StaffDashboardPage.css';

const BASE = '/dashboard/staff';

function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

/** Home of an institution staff member (Figma: signconnect-staff-dashboard). */
export function StaffDashboardPage() {
  const { session } = useAuth();
  const name = session?.user.name ?? '';
  const firstName = name.trim().split(/\s+/)[0] ?? '';
  // null while loading; an empty list when the request fails, so the page still opens.
  const [items, setItems] = useState<HistoryItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMySessions().then(
      (list) => !cancelled && setItems(list),
      () => !cancelled && setItems([]),
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const recent = (items ?? []).slice(0, 3);
  const inProgress = (items ?? []).find((i) => i.status === 'waiting' || i.status === 'matched');

  return (
    <div className="sd-page">
      <div className="sd-account" aria-label="Signed in as">
        <strong>{name}</strong>
        <span className="sd-avatar" aria-hidden="true">
          {initials(name)}
        </span>
      </div>

      <header className="sd-welcome">
        <h1>{[greeting(), firstName].filter(Boolean).join(', ')}</h1>
        <p>Connect with an interpreter whenever you need communication support.</p>
      </header>

      <section className="sd-hero" aria-labelledby="sd-hero-title">
        <div>
          <h2 id="sd-hero-title">Start a VRI session</h2>
          <Link to={`${BASE}/start-session`} className="sd-hero-btn">
            Start Session
          </Link>
        </div>
        <p>Get connected to a certified interpreter in under two minutes.</p>
        <Hand className="sd-hero-icon" size={44} aria-hidden="true" />
      </section>

      <section aria-labelledby="sd-active">
        <h2 id="sd-active" className="sd-heading">
          Active session
        </h2>
        <div className="sd-card sd-card--accent">
          <div className="sd-empty">
            <span className="sd-tile">
              <Video size={20} aria-hidden="true" />
            </span>
            {inProgress ? (
              <>
                <strong>
                  {inProgress.status === 'waiting'
                    ? 'Looking for an interpreter'
                    : `Matched with ${titleFor(inProgress)}`}
                </strong>
                <span>Started {formatWhen(inProgress.createdAt)}</span>
              </>
            ) : (
              <>
                <strong>No active session</strong>
                <span>You&apos;re not connected to an interpreter right now.</span>
              </>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="sd-recent">
        <div className="sd-heading-row">
          <h2 id="sd-recent" className="sd-heading">
            Recent sessions
          </h2>
          <Link to={`${BASE}/sessions`} className="sd-link">
            View all sessions <ChevronRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="sd-card">
          {items === null && <p className="sd-note">Loading your sessions…</p>}
          {items !== null && recent.length === 0 && (
            <p className="sd-note">You have no sessions yet.</p>
          )}
          {recent.length > 0 && (
            <ul className="sd-list">
              {recent.map((item) => (
                <li key={item.id} className="sd-row">
                  <span className="sd-tile">
                    <Video size={18} aria-hidden="true" />
                  </span>
                  <span className="sd-row-text">
                    <strong>{formatWhen(item.createdAt)}</strong>
                    <span>{titleFor(item)}</span>
                  </span>
                  <span className={`sd-pill sd-pill--${item.status}`}>
                    {STATUS_LABEL[item.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section aria-labelledby="sd-chat">
        <div className="sd-heading-row">
          <h2 id="sd-chat" className="sd-heading">
            Chat
          </h2>
          <Link to={`${BASE}/chat`} className="sd-link">
            View chat <ChevronRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="sd-card">
          <div className="sd-row">
            <span className="sd-tile">
              <MessageSquare size={18} aria-hidden="true" />
            </span>
            <span className="sd-row-text">
              <strong>No conversations yet</strong>
              <span>Messages with interpreters and support will show here.</span>
            </span>
          </div>
        </div>
      </section>

      <section className="sd-card sd-help" aria-labelledby="sd-help-title">
        <span className="sd-tile">
          <CircleHelp size={20} aria-hidden="true" />
        </span>
        <span className="sd-row-text">
          <strong id="sd-help-title">Need help?</strong>
          <span>Find answers or contact support.</span>
        </span>
        <Link to={`${BASE}/help`} className="sd-outline-btn">
          Get Help
        </Link>
      </section>
    </div>
  );
}
