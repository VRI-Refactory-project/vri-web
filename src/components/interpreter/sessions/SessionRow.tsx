import { Check, ChevronRight, Clock } from 'lucide-react';
import {
  dateTile,
  sessionDetail,
  type InterpreterSession,
  type SessionStatus,
} from '../../../services/interpreterSessions';
import './sessions.css';

const STATUS: Record<SessionStatus, { label: string; icon: typeof Clock }> = {
  upcoming: { label: 'Yet to start', icon: Clock },
  completed: { label: 'Completed', icon: Check },
};

/** One row of the sessions table: date box, who it is with, type and status. */
export function SessionRow({ session, now }: { session: InterpreterSession; now: Date }) {
  const tile = dateTile(session.start, now);
  const { label, icon: StatusIcon } = STATUS[session.status];

  return (
    <tr className="isn-row">
      <td>
        <span className="isn-date">
          <span className="isn-date-top">{tile.top}</span>
          <span className="isn-date-day">{tile.day}</span>
        </span>
      </td>
      <td>
        <strong className="isn-with">{session.withName}</strong>
        <span className="isn-detail">{sessionDetail(session)}</span>
      </td>
      <td>
        <span className="isn-type">{session.type}</span>
      </td>
      <td>
        <span className="isn-status-cell">
          <span className={`isn-badge isn-badge--${session.status}`}>
            <StatusIcon size={13} aria-hidden="true" />
            {label}
          </span>
          <ChevronRight className="isn-chevron" size={18} aria-hidden="true" />
        </span>
      </td>
    </tr>
  );
}
