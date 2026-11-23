import { Check, ChevronRight, Clock, XCircle, AlertCircle } from 'lucide-react';
import {
  dateTile,
  sessionDetail,
  STATUS_LABEL,
  type InterpreterSession,
  type SessionStatus,
} from '../../../services/interpreterSessions';
import './sessions.css';

const STATUS_ICON: Record<SessionStatus, typeof Clock> = {
  upcoming: Clock,
  completed: Check,
  cancelled: XCircle,
  failed: AlertCircle,
};

/** One row of the sessions table: date box, who it is with, type and status. */
export function SessionRow({
  session,
  now,
  mobileItemProps,
}: {
  session: InterpreterSession;
  now: Date;
  mobileItemProps?: { 'data-mobile-view-hidden'?: 'true' };
}) {
  const tile = dateTile(session.start, now);
  const StatusIcon = STATUS_ICON[session.status];

  return (
    <tr className="isn-row" {...mobileItemProps}>
      <td data-card-primary>
        <span className="isn-date">
          <span className="isn-date-top">{tile.top}</span>
          <span className="isn-date-day">{tile.day}</span>
        </span>
      </td>
      <td data-label="With">
        <strong className="isn-with">{session.withName}</strong>
        <span className="isn-detail">{sessionDetail(session)}</span>
      </td>
      <td data-label="Type">
        <span className="isn-type">{session.type}</span>
      </td>
      <td data-label="Status">
        <span className="isn-status-cell">
          <span className={`isn-badge isn-badge--${session.status}`}>
            <StatusIcon size={13} aria-hidden="true" />
            {STATUS_LABEL[session.status]}
          </span>
          <ChevronRight className="isn-chevron" size={18} aria-hidden="true" />
        </span>
      </td>
    </tr>
  );
}
