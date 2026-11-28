import { ChevronLeft, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { sessionType, specialisationLabel } from '../../features/sessions/sessionDetails';
import { formatWhen, STATUS_LABEL } from '../../features/sessions/sessionHistory';
import { describeError } from '../../services/api';
import { getMySession, type SessionDetail } from '../../services/mySessions';
import { cancelSessionRequest } from '../../services/sessionRequests';
import './SessionsPages.css';

/** One of the person's sessions: who, what kind, when and how it ended up. */
export function SessionDetailsPage({
  backTo = '/dashboard/deaf/sessions/history',
  allowCancel = false,
}: {
  backTo?: string;
  /** Offer to cancel a request still waiting for an interpreter (institution staff, V2-013). */
  allowCancel?: boolean;
}) {
  const { id } = useParams();
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [cancelled, setCancelled] = useState(false);

  const cancelRequest = async () => {
    if (!id) return;
    setCancelling(true);
    setCancelError('');
    try {
      await cancelSessionRequest(id);
      setDetail((current) => current && { ...current, status: 'cancelled' });
      setCancelled(true);
    } catch (err) {
      // For example an interpreter accepted a moment ago: the server says why.
      setCancelError(describeError(err));
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getMySession(id)
      .then((d) => !cancelled && setDetail(d))
      .catch((err) => !cancelled && setError(describeError(err)));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const rows: [string, string][] = detail
    ? [
        ['Session type', sessionType(detail.emergency)],
        ['Specialization', specialisationLabel(detail.specialisation)],
        ['Requested', formatWhen(detail.createdAt)],
        ...(detail.matchedAt
          ? [['Accepted', formatWhen(detail.matchedAt)] as [string, string]]
          : []),
        ...(detail.endedAt
          ? [['Ended', formatWhen(detail.endedAt)] as [string, string]]
          : []),
        ['Status', STATUS_LABEL[detail.status]],
        ...(detail.description ? [['Notes', detail.description] as [string, string]] : []),
      ]
    : [];

  return (
    <div className="sh-page">
      <Link to={backTo} className="sh-back">
        <ChevronLeft size={18} aria-hidden /> Back
      </Link>
      <header className="sh-header">
        <h1>Session details</h1>
        <p>Everything about this session.</p>
      </header>

      {error && (
        <p className="sh-alert" role="alert">
          {error}
        </p>
      )}
      {!error && !detail && <p className="sh-note">Loading the session…</p>}

      {detail && (
        <section className="sdp-card" aria-label="Session">
          <div className="sdp-who">
            <span className="sh-card-icon">
              <User size={22} aria-hidden />
            </span>
            <div>
              <strong>{detail.interpreterName ?? 'No interpreter yet'}</strong>
              <span>{detail.languages || 'Ugandan Sign Language'}</span>
            </div>
          </div>
          <dl className="sdp-rows">
            {rows.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          {cancelled && (
            <p className="sdp-ok" role="status">
              Request cancelled. You can start a new one whenever you are ready.
            </p>
          )}
          {cancelError && (
            <p className="sh-alert" role="alert">
              {cancelError}
            </p>
          )}
          {allowCancel && detail.status === 'waiting' && (
            <div className="sdp-actions">
              <p>Still waiting for an interpreter? You can cancel this request.</p>
              <button
                type="button"
                className="sdp-cancel"
                onClick={cancelRequest}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling…' : 'Cancel request'}
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
