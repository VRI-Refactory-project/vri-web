import { CalendarClock, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { bookingLabel, useMyBookings, type MyBooking } from '../sessions/myBookings';

const LIVE_PATH = '/live/institution';

const whenOf = (b: MyBooking) =>
  new Date(`${b.date}T${b.time}`).toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

/** The sessions this staff member booked ahead: who is coming, and Join call when it is time. */
export function StaffBookedSessions() {
  const navigate = useNavigate();
  const { bookings, error, busyId, join, cancel } = useMyBookings((id) =>
    navigate(`${LIVE_PATH}/${id}`),
  );
  const shown = bookings.filter((b) => b.status !== 'CANCELLED').slice(0, 3);

  return (
    <section aria-labelledby="sd-booked" data-tour="booked-sessions">
      <div className="sd-heading-row">
        <h2 id="sd-booked" className="sd-heading">
          Booked sessions
        </h2>
        <Link to="/dashboard/staff/schedule-session" className="sd-link">
          Book a session <ChevronRight size={16} aria-hidden="true" />
        </Link>
      </div>
      <div className="sd-card">
        {error && <p role="alert">{error}</p>}
        {shown.length === 0 ? (
          <div className="sd-row">
            <span className="sd-tile">
              <CalendarClock size={18} aria-hidden="true" />
            </span>
            <span className="sd-row-text">
              <strong>No booked sessions</strong>
              <span>Sessions you schedule ahead will show here.</span>
            </span>
          </div>
        ) : (
          shown.map((b) => (
            <div className="sd-row" key={b.id}>
              <span className="sd-tile">
                <CalendarClock size={18} aria-hidden="true" />
              </span>
              <span className="sd-row-text">
                <strong>{whenOf(b)}</strong>
                <span>{bookingLabel(b)}</span>
              </span>
              {b.no_show ? null : b.can_join ? (
                <button type="button" className="sd-outline-btn" onClick={() => join(b.id)}>
                  Join call
                </button>
              ) : (
                <button
                  type="button"
                  className="sd-outline-btn"
                  disabled={busyId === b.id}
                  onClick={() => cancel(b.id)}
                >
                  Cancel
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
