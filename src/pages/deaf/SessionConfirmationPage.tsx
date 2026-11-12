import { Check, ChevronLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { latestConfirmable } from '../../features/sessions/sessionDetails';
import { describeError } from '../../services/api';
import { getMySessions, type HistoryItem } from '../../services/mySessions';
import './SessionsPages.css';

/**
 * "Ready to connect?": the newest request that still needs the person. A matched one can be
 * joined, a waiting one sends them back to the waiting screen, and otherwise there is nothing to
 * confirm.
 */
export function SessionConfirmationPage() {
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getMySessions()
      .then((list) => !cancelled && setItems(list))
      .catch((err) => !cancelled && setError(describeError(err)));
    return () => {
      cancelled = true;
    };
  }, []);

  const current = items ? latestConfirmable(items) : null;

  return (
    <div className="sh-page">
      <Link to="/dashboard/deaf/sessions" className="sh-back">
        <ChevronLeft size={18} aria-hidden /> Back
      </Link>
      <header className="sh-header">
        <h1>Ready to connect?</h1>
      </header>

      {error && (
        <p className="sh-alert" role="alert">
          {error}
        </p>
      )}
      {!error && items === null && <p className="sh-note">Checking your sessions…</p>}

      {items !== null && (
        <section className="sd-confirm" aria-label="Session confirmation">
          <span className="sd-check">
            <Check size={26} aria-hidden />
          </span>
          {current?.status === 'matched' ? (
            <>
              <h2>{current.interpreterName ?? 'Your interpreter'} is ready</h2>
              <p>Your interpreter has accepted. Connect when you are ready.</p>
              <Link
                to={`/live/deaf/${current.id}`}
                state={{ interpreterName: current.interpreterName ?? undefined }}
                className="sd-btn"
              >
                Connect now
              </Link>
            </>
          ) : current ? (
            <>
              <h2>Still looking for an interpreter</h2>
              <p>We will let you know as soon as someone accepts.</p>
              <Link to="/dashboard/deaf/sessions/new" className="sd-btn">
                See your request
              </Link>
            </>
          ) : (
            <>
              <h2>Nothing to confirm</h2>
              <p>You have no sessions waiting for you right now.</p>
              <Link to="/dashboard/deaf/sessions/new" className="sd-btn">
                Start a session
              </Link>
            </>
          )}
        </section>
      )}
    </div>
  );
}
