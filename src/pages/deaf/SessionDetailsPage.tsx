import { ChevronLeft, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { sessionType, specialisationLabel } from '../../features/sessions/sessionDetails';
import { formatWhen, STATUS_LABEL } from '../../features/sessions/sessionHistory';
import { describeError } from '../../services/api';
import { getMySession, type SessionDetail } from '../../services/mySessions';
import './SessionsPages.css';

/** One of the person's sessions: who, what kind, when and how it ended up. */
export function SessionDetailsPage() {
  const { id } = useParams();
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [error, setError] = useState('');

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
        ['Status', STATUS_LABEL[detail.status]],
        ...(detail.description ? [['Notes', detail.description] as [string, string]] : []),
      ]
    : [];

  return (
    <div className="sh-page">
      <Link to="/dashboard/deaf/sessions/history" className="sh-back">
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
        <section className="sd-card" aria-label="Session">
          <div className="sd-who">
            <span className="sh-card-icon">
              <User size={22} aria-hidden />
            </span>
            <div>
              <strong>{detail.interpreterName ?? 'No interpreter yet'}</strong>
              <span>{detail.languages || 'Ugandan Sign Language'}</span>
            </div>
          </div>
          <dl className="sd-rows">
            {rows.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}
