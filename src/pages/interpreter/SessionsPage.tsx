import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SessionRow } from '../../components/interpreter/sessions/SessionRow';
import { UpNextCard } from '../../components/interpreter/sessions/UpNextCard';
import { INTERPRETER_BASE } from '../../features/interpreter/navigation';
import {
  countLabel,
  getInterpreterSessions,
  nextSession,
  orderSessions,
  type InterpreterSession,
} from '../../services/interpreterSessions';
import './SessionsPage.css';

/** The interpreter's booked sessions: the next one up, then the full list. */
export function InterpreterSessionsPage() {
  const navigate = useNavigate();
  // undefined while loading, null while booking is not live
  const [sessions, setSessions] = useState<InterpreterSession[] | null | undefined>(undefined);
  // Read once per load, so every label on the page agrees on what "now" is.
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let cancelled = false;
    void getInterpreterSessions().then((list) => {
      if (cancelled) return;
      setSessions(list);
      setNow(new Date());
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const all = useMemo(() => orderSessions(sessions ?? []), [sessions]);
  const upNext = useMemo(() => nextSession(all), [all]);

  return (
    <div className="isn-page">
      <header className="isn-header">
        <div>
          <h1>Sessions</h1>
          <p>Your booked interpreting sessions and history</p>
        </div>
        <button type="button" className="isn-back" onClick={() => navigate(INTERPRETER_BASE)}>
          <ArrowLeft size={16} aria-hidden="true" />
          Back
        </button>
      </header>

      {sessions === null && (
        <p className="isn-notice" role="status">
          Booked sessions are not live yet. Your sessions will appear here once they are.
        </p>
      )}

      {upNext && <UpNextCard session={upNext} now={now} />}

      <section className="isn-panel" aria-labelledby="isn-list-title">
        <div className="isn-panel-top">
          <h2 className="isn-panel-title" id="isn-list-title">
            {countLabel(all)}
          </h2>
        </div>
        {all.length === 0 ? (
          <p className="isn-empty">No sessions yet.</p>
        ) : (
          <div className="isn-table-wrap">
            <table className="isn-table">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">With</th>
                  <th scope="col">Type</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {all.map((session) => (
                  <SessionRow key={session.id} session={session} now={now} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
