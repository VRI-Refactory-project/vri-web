import { ChevronLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError, describeError } from '../../services/api';
import {
  CHANNEL_LABEL,
  formatDuration,
  formatWhen,
  getInstitutionSession,
  outcomeLabel,
  sessionTypeLabel,
  type InstitutionSession,
} from '../../services/institutionSessions';
import './InstitutionSessionsPage.css';

const BACK = '/dashboard/institution/sessions';

const timeOf = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—';

/**
 * One session's details (V2-030): when, who, how it came about, how long it ran and who interpreted.
 * Metadata only: what was said is never stored or shown.
 */
export function InstitutionSessionDetailPage() {
  const { id = '' } = useParams();
  const [result, setResult] = useState<{
    id: string;
    session?: InstitutionSession;
    error?: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getInstitutionSession(id).then(
      (session) => !cancelled && setResult({ id, session }),
      (err) =>
        !cancelled &&
        setResult({
          id,
          error:
            err instanceof ApiError && err.status === 404
              ? 'This session could not be found.'
              : describeError(err),
        }),
    );
    return () => {
      cancelled = true;
    };
  }, [id]);

  const loaded = result?.id === id ? result : null;
  const session = loaded?.session;

  return (
    <div className="isp">
      <Link to={BACK} className="isp-back">
        <ChevronLeft size={18} aria-hidden="true" /> All sessions
      </Link>

      {!loaded ? (
        <p className="isp-empty" role="status">
          Loading the session…
        </p>
      ) : !session ? (
        <p className="isp-error" role="alert">
          {loaded.error}
        </p>
      ) : (
        <section className="isp-detail" aria-labelledby="isp-detail-title">
          <h1 id="isp-detail-title">Session on {formatWhen(session.created_at)}</h1>
          <p className="isp-outcome isp-outcome--big">{outcomeLabel(session)}</p>

          <dl className="isp-facts">
            <div>
              <dt>Staff member</dt>
              <dd>
                {session.staff.name}
                {session.staff.department && <small>{session.staff.department}</small>}
              </dd>
            </div>
            <div>
              <dt>Interpreter</dt>
              <dd>{session.interpreter_name ?? 'None'}</dd>
            </div>
            <div>
              <dt>Channel</dt>
              <dd>{CHANNEL_LABEL[session.channel]}</dd>
            </div>
            <div>
              <dt>Session type</dt>
              <dd>
                {sessionTypeLabel(session)}
                {session.priority === 'EMERGENCY' && <small>Emergency</small>}
              </dd>
            </div>
            <div>
              <dt>Requested</dt>
              <dd>{timeOf(session.created_at)}</dd>
            </div>
            <div>
              <dt>Interpreter joined</dt>
              <dd>{timeOf(session.assigned_at)}</dd>
            </div>
            <div>
              <dt>Ended</dt>
              <dd>{timeOf(session.ended_at)}</dd>
            </div>
            <div>
              <dt>Duration</dt>
              <dd>{formatDuration(session.duration_minutes)}</dd>
            </div>
          </dl>

          <p className="isp-note">
            Only these details are kept. What was said in the session is never stored or shown.
          </p>
        </section>
      )}
    </div>
  );
}
