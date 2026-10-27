import { CalendarDays, Video } from 'lucide-react';
import {
  startsLabel,
  whenLabel,
  type InterpreterSession,
} from '../../../services/interpreterSessions';
import './sessions.css';

/** The interpreter's next session, at the top of the Sessions page. */
export function UpNextCard({ session, now }: { session: InterpreterSession; now: Date }) {
  return (
    <section className="isn-next" aria-labelledby="isn-next-name">
      <span className="isn-next-icon">
        <Video size={24} aria-hidden="true" />
      </span>
      <div className="isn-next-text">
        <span className="isn-next-pill">
          <span className="isn-next-dot" aria-hidden="true" />
          Up next · {startsLabel(session.start, now)}
        </span>
        <h2 id="isn-next-name">{session.withName}</h2>
        <span className="isn-next-when">
          <CalendarDays size={15} aria-hidden="true" />
          {whenLabel(session, now)}
        </span>
      </div>
    </section>
  );
}
