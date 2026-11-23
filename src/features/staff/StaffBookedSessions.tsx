// import { CalendarClock, ChevronRight } from 'lucide-react';
// import { Link, useNavigate } from 'react-router-dom';
// import { bookingLabel, useMyBookings, type MyBooking } from '../sessions/myBookings';

// const LIVE_PATH = '/live/institution';

// const whenOf = (b: MyBooking) =>
//   new Date(`${b.date}T${b.time}`).toLocaleString('en-GB', {
//     weekday: 'short',
//     day: 'numeric',
//     month: 'short',
//     hour: '2-digit',
//     minute: '2-digit',
//   });

// /** The sessions this staff member booked ahead: who is coming, and Join call when it is time. */
// export function StaffBookedSessions() {
//   const navigate = useNavigate();
//   const { bookings, error, busyId, join, cancel } = useMyBookings((id) =>
//     navigate(`${LIVE_PATH}/${id}`),
//   );
//   const shown = bookings.filter((b) => b.status !== 'CANCELLED').slice(0, 3);

//   return (
//     <section aria-labelledby="sd-booked">
//       <div className="sd-heading-row">
//         <h2 id="sd-booked" className="sd-heading">
//           Booked sessions
//         </h2>
//         <Link to="/dashboard/staff/sessions" className="sd-link">
//           View all <ChevronRight size={16} aria-hidden="true" />
//         </Link>
//       </div>

//       <div className="sd-card">
//         {error && <p role="alert">{error}</p>}
//         {shown.length === 0 ? (
//           <div className="sd-row">
//             <span className="sd-tile">
//               <CalendarClock size={18} aria-hidden="true" />
//             </span>
//             <span className="sd-row-text">
//               <strong>No booked sessions</strong>
//               <span>Sessions you schedule ahead will show here.</span>
//             </span>
//           </div>
//         ) : (
//           shown.map((b) => (
//             <div className="sd-row" key={b.id}>
//               <span className="sd-tile">
//                 <CalendarClock size={18} aria-hidden="true" />
//               </span>
//               <span className="sd-row-text">
//                 <strong>{whenOf(b)}</strong>
//                 <span>{bookingLabel(b)}</span>
//               </span>
//               {b.no_show ? null : b.can_join ? (
//                 <button type="button" className="sd-outline-btn" onClick={() => join(b.id)}>
//                   Join call
//                 </button>
//               ) : (
//                 <button
//                   type="button"
//                   className="sd-outline-btn"
//                   disabled={busyId === b.id}
//                   onClick={() => cancel(b.id)}
//                 >
//                   Cancel
//                 </button>
//               )}
//             </div>
//           ))
//         )}
//       </div>
//     </section>
//   );
// }

import { CalendarClock, ChevronRight, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export function StaffBookedSessions() {
  const navigate = useNavigate();
  const { bookings, error, busyId, join, cancel } = useMyBookings((id) =>
    navigate(`${LIVE_PATH}/${id}`),
  );

  const [showAll, setShowAll] = useState(false);

  const activeBookings = bookings.filter((b) => b.status !== 'CANCELLED');

  // Show 3 by default, or all if showAll is true.
  const shown = showAll ? activeBookings : activeBookings.slice(0, 3);

  return (
    <section aria-labelledby="sd-booked">
      <div className="sd-heading-row">
        <h2 id="sd-booked" className="sd-heading">
          Booked sessions
        </h2>

        {/* Only show the toggle button if there are more than 3 active bookings */}
        {activeBookings.length > 3 && (
          <button
            type="button"
            className="sd-link"
            onClick={() => setShowAll(!showAll)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            {showAll ? (
              <>
                View less <ChevronUp size={16} aria-hidden="true" />
              </>
            ) : (
              <>
                View all <ChevronRight size={16} aria-hidden="true" />
              </>
            )}
          </button>
        )}
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
