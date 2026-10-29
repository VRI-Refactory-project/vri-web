// import { Link } from 'react-router-dom';
// import { Check } from 'lucide-react';
// import { useAuth } from '../../hooks/useAuth';
// import {
//   reasonText,
//   useAvailability,
//   useInterpreterHome,
// } from '../../features/interpreter/homeData';
// import './InterpreterHomePage.css';

// const BASE = '/dashboard/interpreter';

// function greeting(date = new Date()) {
//   const hour = date.getHours();
//   if (hour < 12) return 'Good morning';
//   if (hour < 18) return 'Good afternoon';
//   return 'Good evening';
// }

// function StatCard(props: {
//   label: string;
//   value: string | number;
//   note: string;
//   to: string;
//   cta: string;
// }) {
//   return (
//     <section className="ih-card ih-stat" aria-label={props.label}>
//       <div>
//         <p className="ih-stat-label">{props.label}</p>
//         <p className="ih-stat-value">{props.value}</p>
//         <p className="ih-note">{props.note}</p>
//       </div>
//       <Link className="ih-link" to={props.to}>
//         {props.cta} →
//       </Link>
//     </section>
//   );
// }

// export function InterpreterHomePage() {
//   const { session } = useAuth();
//   const { data } = useInterpreterHome();
//   const { available, reason, setAvailable, loading, saving, error } = useAvailability();
//   const reasonNote = available ? reasonText(reason) : '';
//   const name = session?.user.name ?? '';
//   const firstName = name.trim().split(/\s+/)[0] ?? '';
//   const initial = name.trim().charAt(0).toUpperCase() || '?';

//   return (
//     <div className="ih">
//       <header className="ih-header">
//         <div>
//           <h1 className="ih-title">{[greeting(), firstName].filter(Boolean).join(' ')}</h1>
//           <p className="ih-sub">Here&apos;s what&apos;s happening today!</p>
//         </div>
//         <span className="ih-badge" aria-hidden="true">
//           {initial}
//         </span>
//       </header>

//       <section className="ih-card ih-status" aria-label="Availability status">
//         <span className={available ? 'ih-dot ih-dot--on' : 'ih-dot'} aria-hidden="true" />
//         <div className="ih-status-text">
//           <h2 className={available ? 'ih-status-title ih-status-title--on' : 'ih-status-title'}>
//             {available ? 'Available' : 'Unavailable'}
//           </h2>
//           <p className="ih-status-note" role="status">
//             {available
//               ? 'You are available to receive interpreting requests'
//               : 'You will not receive interpreting requests'}
//           </p>
//           {reasonNote && <p className="ih-status-note">{reasonNote}</p>}
//           {error && (
//             <p className="ih-error" role="alert">
//               {error}
//             </p>
//           )}
//         </div>
//         <button
//           type="button"
//           role="switch"
//           aria-checked={available}
//           aria-label="Available for interpreting requests"
//           className={available ? 'ih-switch ih-switch--on' : 'ih-switch'}
//           disabled={loading || saving}
//           onClick={() => void setAvailable(!available)}
//         >
//           <span className="ih-switch-knob" />
//         </button>
//       </section>

//       <div className="ih-stats">
//         <StatCard
//           label="Available requests"
//           value={data.availableRequests}
//           note="Waiting for interpreter"
//           to={`${BASE}/requests`}
//           cta="View requests"
//         />
//         <StatCard
//           label="Today's Sessions"
//           value={data.todaysSessions}
//           note="Upcoming sessions"
//           to={`${BASE}/sessions`}
//           cta="View sessions"
//         />
//         {data.pendingEarnings && (
//           <StatCard
//             label="Pending Earnings"
//             value={data.pendingEarnings}
//             note="Sample figure, not real money"
//             to={`${BASE}/wallet`}
//             cta="Open wallet"
//           />
//         )}
//       </div>

//       {data.recentSessions.length > 0 && (
//         <ul className="ih-recent" aria-label="Recent sessions">
//           {data.recentSessions.map((s) => (
//             <li key={s.id} className="ih-card ih-session">
//               <span className="ih-check" aria-hidden="true">
//                 <Check size={14} />
//               </span>
//               <div className="ih-session-text">
//                 <p className="ih-session-done">Session completed</p>
//                 <p className="ih-session-title">{s.title}</p>
//                 <p className="ih-session-client">Client: {s.client}</p>
//               </div>
//               <time className="ih-session-time">{s.time}</time>
//             </li>
//           ))}
//         </ul>
//       )}

//       {data.nextSession && (
//         <section className="ih-card ih-reminder" aria-label="Reminder">
//           <div>
//             <h2 className="ih-reminder-title">Reminder</h2>
//             <p className="ih-reminder-text">
//               Your next interpreting session starts at {data.nextSession.startsAt}. Please test your
//               camera and internet connection 10 minutes before joining.
//             </p>
//           </div>
//           <Link className="ih-button" to={`${BASE}/sessions`}>
//             View calendar
//           </Link>
//         </section>
//       )}
//     </div>
//   );
// }


import { Link } from 'react-router-dom';
import {
  Bell,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  MessageSquare,
  SlidersHorizontal,
  Users,
  Video,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import './InterpreterHomePage.css';

const calendarDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const calendarNumbers = [
  null, null, null, null,
  5, 6, 7, 8, 9, 10, 11,
  12, 13, 14, 15, 16, 17, 18,
  19, 20, 21, 22, 23, 24, 25,
];

export function InterpreterHomePage() {
  const { session } = useAuth();
  const firstName = session?.user.name?.split(' ')[0] || 'Sarah';

  return (
    <div className="ih-page">
      
      {/* TOP NAVIGATION BAR */}
      <header className="ih-topbar">
        <div className="ih-topbar-actions">
          
          {/* Bell Icon with Red Dot */}
          <button className="ih-icon-btn relative" aria-label="Notifications">
            <Bell size={20} className="ih-icon" />
            <span className="ih-notification-dot"></span>
          </button>

          {/* Profile Info */}
          <div className="ih-user-profile">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80"
              alt="Sarah Mitchell"
              className="ih-avatar-sm"
            />
            <div className="ih-user-info">
              <span className="ih-user-name">Sarah Mitchell</span>
              <span className="ih-user-role">Interpreter</span>
            </div>
            <ChevronDown size={16} className="ih-chevron-down" />
          </div>
        </div>
      </header>

      <div className="ih-content-wrapper">
        <div className="ih-main-column">
          {/* Welcome Banner */}
          <section className="ih-banner" aria-label="Greeting">
            <div className="ih-banner-text">
              <h1>
                <span className="ih-sun-icon">☀</span> Good morning, {firstName}
              </h1>
              <p className="ih-banner-sub">Bridging communication. Expanding access.</p>
              <p className="ih-banner-desc">
                You're making a difference. Every connection helps someone get the support they need.
              </p>
            </div>

            <div className="ih-banner-image-wrap">
              {/* Replace this image with your actual asset if you have it locally */}
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1000&q=80"
                alt="Interpreter signing"
              />
            </div>
          </section>

          {/* Stats Row */}
          <div className="ih-stats-row">
            <div className="ih-stat-box">
              <Users size={20} className="ih-icon-purple" />
              <h2>12</h2>
              <p>Total connections</p>
            </div>

            <div className="ih-stat-box">
              <Clock size={20} className="ih-icon-blue" />
              <h2>5</h2>
              <p>Pending requests</p>
            </div>

            <div className="ih-stat-box">
              <Calendar size={20} className="ih-icon-purple" />
              <h2>3</h2>
              <p>This week&apos;s sessions</p>
            </div>

            <div className="ih-stat-box">
              <MessageSquare size={20} className="ih-icon-teal" />
              <h2>0</h2>
              <p>Unread messages</p>
            </div>

            <div className="ih-stat-box ih-profile-completion">
              <div className="ih-icon-purple ih-profile-icon">
                <SlidersHorizontal size={20} />
              </div>
              <p>Profile not complete</p>
              <Link to="#">View details →</Link>
            </div>
          </div>

          {/* Middle Grid: Next Session & Activity */}
          <div className="ih-middle-grid">
            <section className="ih-section">
              <div className="ih-section-header">
                <h3>Next session</h3>
                <Link to="#" className="ih-section-link">
                  View all <span aria-hidden="true">→</span>
                </Link>
              </div>

              <div className="ih-card ih-next-session-card">
                <div className="ih-next-header">
                  <img
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80"
                    alt="James Carter"
                    className="ih-avatar-md"
                  />
                  <div>
                    <h4>
                      James Carter <span className="ih-badge-verified">✓</span>
                    </h4>
                    <p className="ih-meta">Deaf User • Kampala, Uganda</p>
                  </div>
                </div>

                <div className="ih-next-details">
                  <p>
                    <span aria-hidden="true">📅</span> Today, 10:30 AM - 11:00 AM
                  </p>
                  <p>
                    <Video size={14} className="ih-meta-icon" /> Video call
                  </p>
                </div>

                <div className="ih-next-actions">
                  <button className="ih-btn-primary" type="button">
                    Join session
                  </button>
                  <button className="ih-btn-secondary" type="button">
                    View details
                  </button>
                </div>
              </div>
            </section>

            <section className="ih-section">
              <div className="ih-section-header">
                <h3>Recent activity</h3>
              </div>

              <div className="ih-card ih-activity-card">
                <div className="ih-activity-item">
                  <span className="ih-activity-dot ih-dot-purple" aria-hidden="true" />
                  <div>
                    <p>You accepted James Carter&apos;s connection request</p>
                    <span className="ih-time-label">2 hours ago</span>
                  </div>
                </div>

                <div className="ih-activity-item">
                  <span className="ih-activity-dot ih-dot-purple" aria-hidden="true" />
                  <div>
                    <p>Priya Sharma sent you a connection request</p>
                    <span className="ih-time-label">4 hours ago</span>
                  </div>
                </div>

                <div className="ih-activity-item">
                  <span className="ih-activity-dot ih-dot-blue" aria-hidden="true" />
                  <div>
                    <p>Alex Johnson accepted your connection request</p>
                    <span className="ih-time-label">Yesterday</span>
                  </div>
                </div>

                <div className="ih-activity-item">
                  <span className="ih-activity-dot ih-dot-blue" aria-hidden="true" />
                  <div>
                    <p>You started a chat with Grace Nsubuga</p>
                    <span className="ih-time-label">Yesterday</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Upcoming Sessions */}
          <section className="ih-section ih-upcoming-section">
            <div className="ih-section-header">
              <h3>Upcoming sessions</h3>
              <Link to="#" className="ih-section-link">
                View all <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="ih-card ih-list-card">
              <div className="ih-list-item">
                <img
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80"
                  alt="Priya Sharma"
                  className="ih-avatar-md"
                />
                <div className="ih-list-info">
                  <h4>
                    Priya Sharma <span className="ih-badge-verified">✓</span>
                  </h4>
                  <p className="ih-meta">Interpreter • Kampala, Uganda</p>
                </div>
                <div className="ih-list-time">
                  <p>Today, 2:00 PM - 2:30 PM</p>
                  <p className="ih-meta ih-meta-inline">
                    <Video size={12} className="ih-meta-icon" /> Video call
                  </p>
                </div>
                <ChevronRight size={18} className="ih-chevron" />
              </div>

              <div className="ih-list-item">
                <img
                  src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80"
                  alt="Alex Johnson"
                  className="ih-avatar-md"
                />
                <div className="ih-list-info">
                  <h4>
                    Alex Johnson <span className="ih-badge-verified">✓</span>
                  </h4>
                  <p className="ih-meta">Deaf User • Nairobi, Kenya</p>
                </div>
                <div className="ih-list-time">
                  <p>Tomorrow, 9:00 AM - 9:30 AM</p>
                  <p className="ih-meta ih-meta-inline">
                    <Video size={12} className="ih-meta-icon" /> Video call
                  </p>
                </div>
                <ChevronRight size={18} className="ih-chevron" />
              </div>

              <div className="ih-list-item ih-list-item-last">
                <img
                  src="https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=200&q=80"
                  alt="Grace Nsubuga"
                  className="ih-avatar-md"
                />
                <div className="ih-list-info">
                  <h4>
                    Grace Nsubuga <span className="ih-badge-verified">✓</span>
                  </h4>
                  <p className="ih-meta">Interpreter • Entebbe, Uganda</p>
                </div>
                <div className="ih-list-time">
                  <p>Tomorrow, 4:00 PM - 4:30 PM</p>
                  <p className="ih-meta ih-meta-inline">
                    <Video size={12} className="ih-meta-icon" /> Video call
                  </p>
                </div>
                <ChevronRight size={18} className="ih-chevron" />
              </div>
            </div>
          </section>

          <div className="ih-quote-banner">
            <p>“Access is not a favour, it&apos;s a right.”</p>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="ih-right-column">
          <div className="ih-card ih-availability-card">
            <div className="ih-availability-row">
              <div className="ih-availability-status">
                <span className="ih-availability-dot" aria-hidden="true" />
                <span>Available for requests</span>
              </div>

              <button
                type="button"
                className="ih-availability-toggle active"
                aria-label="Toggle availability"
              >
                <span className="ih-availability-knob" aria-hidden="true" />
              </button>
            </div>

            <p className="ih-availability-copy">
              You&apos;ll receive connection requests and messages when you&apos;re online.
            </p>

            <button type="button" className="ih-availability-button">
              Update availability
            </button>
          </div>

          <div className="ih-card ih-calendar-card">
            <h3>
              <Calendar size={16} className="ih-calendar-icon" /> Interpreter Calendar
            </h3>

            <div className="ih-cal-header">
              <button type="button" aria-label="Previous month">
                <ChevronLeft size={14} />
              </button>
              <span>October 2026</span>
              <button type="button" aria-label="Next month">
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="ih-cal-grid" aria-label="October calendar">
              {calendarDays.map((day) => (
                <span key={day} className="ih-cal-day-name">
                  {day}
                </span>
              ))}

              {calendarNumbers.map((day, index) => (
                <span
                  key={`${day ?? 'empty'}-${index}`}
                  className={day === 14 ? 'ih-cal-day ih-cal-day-active' : 'ih-cal-day'}
                >
                  {day ?? ''}
                </span>
              ))}
            </div>

            <div className="ih-today-schedule">
              <h4>
                Today&apos;s schedule <span className="ih-date-pill">Wed, 14 Oct 2026</span>
              </h4>

              <div className="ih-schedule-item">
                <span className="ih-dot ih-dot-purple" aria-hidden="true" />
                <div>
                  <p>10:30 AM - 11:00 AM &nbsp; James Carter</p>
                  <span className="ih-time-label">Video call</span>
                </div>
              </div>

              <div className="ih-schedule-item">
                <span className="ih-dot ih-dot-green" aria-hidden="true" />
                <div>
                  <p>2:00 PM - 2:30 PM &nbsp; Priya Sharma</p>
                  <span className="ih-time-label">Video call</span>
                </div>
              </div>

              <div className="ih-schedule-item">
                <span className="ih-dot ih-dot-blue" aria-hidden="true" />
                <div>
                  <p>4:00 PM - 4:30 PM &nbsp; Grace Nsubuga</p>
                  <span className="ih-time-label">Video call</span>
                </div>
              </div>
            </div>

            <button type="button" className="ih-btn-calendar">
              View full calendar <span aria-hidden="true">→</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}