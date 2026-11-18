import { CircleHelp, MessageSquare, Video, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
// interpreter2.png made smaller for the web (66 KB instead of 1.8 MB); the banner shows it at ~220px.
import heroImage from '../../assets/staff-hero.jpg';
import { formatWhen, titleFor } from '../../features/sessions/sessionHistory';
import { useAuth } from '../../hooks/useAuth';
import { getInstitutionOverview } from '../../services/institutionDashboard';
import { getMySessions, type HistoryItem } from '../../services/mySessions';
import { MiniCalendar } from './MiniCalendar';
import { StaffBookedSessions } from './StaffBookedSessions';
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
  const [institution, setInstitution] = useState('');

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

  useEffect(() => {
    let cancelled = false;
    getInstitutionOverview().then(
      (overview) => !cancelled && setInstitution(overview.name),
      () => undefined, // the name is a nicety: the page works without it
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const inProgress = (items ?? []).find((i) => i.status === 'waiting' || i.status === 'matched');

  return (
    <div className="sd-page">
      <div className="sd-account" aria-label="Signed in as">
        <span className="sd-account-text">
          <strong>{name}</strong>
          {institution && <span>{institution}</span>}
        </span>
        <span className="sd-avatar" aria-hidden="true">
          {initials(name)}
        </span>
      </div>

      {/* Laid out like the interpreter dashboard's banner: words on the left, photo on the right. */}
      <section className="sd-hero" aria-label="Start a VRI session">
        <div className="sd-hero-text">
          <h1>{[greeting(), firstName].filter(Boolean).join(', ')}</h1>
          <p className="sd-hero-sub">Start a VRI session</p>
          <p className="sd-hero-desc">
            For a Deaf client who is with you: connect a certified interpreter in about two minutes.
          </p>
          <Link to={`${BASE}/start-session`} className="sd-hero-btn">
            Start Interpreter Session
          </Link>
        </div>
        <div className="sd-hero-image">
          <img src={heroImage} alt="" />
        </div>
      </section>

      {/* The calendar lists the chosen day's sessions (today to start with), so there is no separate
          "Recent sessions" card. Beside it: the active session, chat and help. */}
      <div className="sd-overview">
        <section className="sd-calendar" aria-label="Your calendar">
          <MiniCalendar items={items ?? []} detailsBase={`${BASE}/sessions`} />
          <Link to={`${BASE}/sessions`} className="sd-link sd-calendar-all">
            View all sessions <ChevronRight size={16} aria-hidden="true" />
          </Link>
        </section>

        <div className="sd-side">
          <section aria-labelledby="sd-active">
            <h2 id="sd-active" className="sd-heading">
              Active session
            </h2>
            <div className="sd-card sd-card--accent">
              {inProgress ? (
                <Link to={`${BASE}/sessions/${inProgress.id}`} className="sd-empty sd-empty--link">
                  <span className="sd-tile">
                    <Video size={20} aria-hidden="true" />
                  </span>
                  <strong>
                    {inProgress.status === 'waiting'
                      ? 'Looking for an interpreter'
                      : `Matched with ${titleFor(inProgress)}`}
                  </strong>
                  <span>Started {formatWhen(inProgress.createdAt)}</span>
                </Link>
              ) : (
                <div className="sd-empty">
                  <span className="sd-tile">
                    <Video size={20} aria-hidden="true" />
                  </span>
                  <strong>No active session</strong>
                  <span>You&apos;re not connected to an interpreter right now.</span>
                </div>
              )}
            </div>
          </section>

          <StaffBookedSessions />

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
      </div>
    </div>
  );
}
