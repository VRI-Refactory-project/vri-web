import { useEffect, useState } from 'react';
import { Calendar, Check, ChevronLeft, User, Video } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSessionRequest } from '../../hooks/useSessionRequest';
import './StartSessionPage.css';

const WAITING = ['CREATED', 'QUEUED', 'OFFERED'];
const MATCHED = ['ACCEPTED', 'CONNECTING', 'ACTIVE'];

const STEPS = [
  'We’ll match you with an available interpreter who signs Ugandan Sign Language.',
  'You’ll see who you’ve been matched with before the session starts.',
  'Confirm and you’re connected — usually in under 2 minutes.',
];

/** Seconds as m:ss, for "Waiting 1:05". */
function clock(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** How long the request has been open, counted up every second from when it was made. */
function useWaited(createdAt: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return clock((now - Date.parse(createdAt)) / 1000);
}

function WhatHappensNext() {
  return (
    <aside className="ss-next" aria-labelledby="ss-next-title">
      <h2 id="ss-next-title">What happens next</h2>
      <ol>
        {STEPS.map((text, index) => (
          <li key={text}>
            <span className="ss-step" aria-hidden="true">
              {index + 1}
            </span>
            <span>{text}</span>
          </li>
        ))}
      </ol>
    </aside>
  );
}

/** The card shown while the request is open and nobody has accepted it yet. */
function Waiting({
  createdAt,
  busy,
  onCancel,
}: {
  createdAt: string;
  busy: boolean;
  onCancel: () => void;
}) {
  const waited = useWaited(createdAt);
  return (
    <section className="ss-waiting" aria-label="Request status">
      <div className="ss-pulse" aria-hidden="true">
        <span className="ss-ring" />
        <span className="ss-ring ss-ring--late" />
        <span className="ss-pulse-core">
          <Video size={30} />
        </span>
      </div>

      <p className="ss-waiting-title" role="status">
        Looking for an interpreter…
      </p>
      <p className="ss-waiting-sub">
        Waiting {waited} · Most requests are accepted in under 2 minutes
      </p>

      <ol className="ss-progress">
        <li className="ss-progress-item ss-progress-item--done">
          <span className="ss-progress-mark" aria-hidden="true">
            <Check size={14} strokeWidth={3} />
          </span>
          <span className="ss-progress-label">Request sent</span>
        </li>
        <li className="ss-progress-item ss-progress-item--current" aria-current="step">
          <span className="ss-progress-mark" aria-hidden="true">
            <span className="ss-live" />
          </span>
          <span className="ss-progress-label">Finding an interpreter</span>
        </li>
        <li className="ss-progress-item">
          <span className="ss-progress-mark" aria-hidden="true">
            3
          </span>
          <span className="ss-progress-label">Interpreter found</span>
        </li>
      </ol>

      <button
        type="button"
        className="ss-btn ss-btn--outline-lg"
        onClick={onCancel}
        disabled={busy}
      >
        Cancel request
      </button>
    </section>
  );
}

interface Props {
  /** How often to check on the request, in milliseconds. Tests shorten it. */
  pollMs?: number;
}

/**
 * Deaf user: ask for an interpreter now (V2-009). Shows the start screen, then the waiting screen
 * while the request is open, then the matched interpreter once one accepts. Joining the call
 * itself belongs to the live-session story.
 */
export function StartSessionPage({ pollMs }: Props) {
  const { request, error, busy, start, cancel } = useSessionRequest(pollMs);
  const [params] = useSearchParams();
  // The dashboard's Emergency Request button opens this page with ?priority=emergency.
  const emergency = params.get('priority') === 'emergency';
  const state = request?.state;

  if (request && state && MATCHED.includes(state)) {
    return (
      <div className="ss-page">
        <button type="button" className="ss-back" onClick={cancel} disabled={busy}>
          <ChevronLeft size={18} aria-hidden="true" /> Back
        </button>
        <h1 className="ss-title">Interpreter found</h1>
        <p className="ss-subtitle">Review and connect when you’re ready.</p>
        {error && (
          <p className="ss-alert" role="alert">
            {error}
          </p>
        )}

        <section className="ss-found" aria-label="Matched interpreter">
          <div className="ss-found-head">
            <span className="ss-avatar" aria-hidden="true">
              <User size={26} />
            </span>
            <div className="ss-found-who">
              <h2>{request.interpreter?.name ?? 'Your interpreter'}</h2>
              <p>{request.interpreter?.languages ?? 'Ugandan Sign Language ⇄ English'}</p>
            </div>
            <span className="ss-pill">
              <span className="ss-dot" aria-hidden="true" /> Available now
            </span>
          </div>
          <dl className="ss-facts">
            <div>
              <dt>Session language</dt>
              <dd>Ugandan Sign Language</dd>
            </div>
          </dl>
          <Link
            to={`/live/deaf/${request.id}`}
            state={{ interpreterName: request.interpreter?.name }}
            className="ss-btn ss-btn--primary"
          >
            <Video size={18} aria-hidden="true" /> Connect now
          </Link>
        </section>
      </div>
    );
  }

  if (request && state && WAITING.includes(state)) {
    // No Back link here: leaving the page would abandon a request that is still open.
    return (
      <div className="ss-page">
        <h1 className="ss-title">Finding an interpreter</h1>
        <p className="ss-subtitle">
          Stay on this page. We’ll show you who it is as soon as someone accepts.
        </p>
        {error && (
          <p className="ss-alert" role="alert">
            {error}
          </p>
        )}
        <div className="ss-grid">
          <Waiting createdAt={request.createdAt} busy={busy} onCancel={cancel} />
          <WhatHappensNext />
        </div>
      </div>
    );
  }

  return (
    <div className="ss-page">
      <Link to="/dashboard/deaf" className="ss-back">
        <ChevronLeft size={18} aria-hidden="true" /> Back
      </Link>
      <h1 className="ss-title">Start a VRI session</h1>
      <p className="ss-subtitle">
        {emergency
          ? 'Emergency request: you will go to the front of the queue.'
          : 'How would you like to connect?'}
      </p>

      {error && (
        <p className="ss-alert" role="alert">
          {error}
        </p>
      )}
      {state === 'FAILED' && (
        <p className="ss-alert" role="alert">
          We could not connect you to an interpreter. Please try again.
        </p>
      )}

      <div className="ss-grid">
        <div className="ss-left">
          <section className="ss-connect" aria-labelledby="ss-connect-title">
            <span className="ss-tile" aria-hidden="true">
              <Video size={22} />
            </span>
            <h2 id="ss-connect-title">Connect</h2>
            <p>Find an available Ugandan Sign Language interpreter</p>
            <button
              type="button"
              className="ss-btn ss-btn--light"
              onClick={() => start(emergency ? 'EMERGENCY' : undefined)}
              disabled={busy}
            >
              Connect now
            </button>
          </section>

          <section className="ss-schedule" aria-labelledby="ss-schedule-title">
            <span className="ss-tile ss-tile--soft" aria-hidden="true">
              <Calendar size={22} />
            </span>
            <div className="ss-schedule-text">
              <h2 id="ss-schedule-title">Schedule for later</h2>
              <p>Choose a date and time that works for you</p>
            </div>
            <button type="button" className="ss-btn ss-btn--outline" disabled>
              Schedule a session
            </button>
          </section>
        </div>

        <WhatHappensNext />
      </div>
    </div>
  );
}
