import { useId } from 'react';
import { CalendarDays, Video } from 'lucide-react';
import {
  startsLabel,
  whenLabel,
  type InterpreterSession,
} from '../../../services/interpreterSessions';
import './sessions.css';

/** The interpreter's next session, at the top of the Sessions page. */
export function UpNextCard({ session, now }: { session: InterpreterSession; now: Date }) {
  const hintId = useId();

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
      {/* No booking backend yet, so both actions stay off and say why. */}
      <div className="isn-next-actions">
        <div className="isn-next-buttons">
          <button type="button" className="isn-button" disabled aria-describedby={hintId}>
            Reschedule
          </button>
          <button
            type="button"
            className="isn-button isn-button--join"
            disabled
            aria-describedby={hintId}
          >
            <Video size={16} aria-hidden="true" />
            Join when ready
          </button>
        </div>
        <p className="isn-next-hint" id={hintId}>
          Joining and rescheduling open once booking is live.
        </p>
      </div>
    </section>
  );
}
