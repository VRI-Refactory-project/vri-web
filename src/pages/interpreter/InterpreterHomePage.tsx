import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Calendar, ChevronLeft, ChevronRight, Clock, Video, Sun } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { INTERPRETER_BASE } from '../../features/interpreter/navigation';
import {
  reasonText,
  useAvailability,
  useInterpreterHome,
} from '../../features/interpreter/homeData';
import { upcomingBooking, useBookedSessions } from '../../features/interpreter/bookedSessions';
import { dayLabel, formatDuration } from '../../services/interpreterSessions';
import {
  recentSessions,
  sessionsOn,
  sessionsThisWeek,
  timeOf,
  useMySessions,
} from '../../features/interpreter/homeSessions';
import './InterpreterHomePage.css';
import bannerImage from '../../assets/suit.png';

const calendarDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function monthGrid(month: Date): (number | null)[] {
  const blanks = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return [
    ...Array<null>(blanks).fill(null),
    ...Array.from({ length: lastDay }, (_, index) => index + 1),
  ];
}

function dayPill(date: Date) {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  return `${weekday}, ${date.getDate()} ${month} ${date.getFullYear()}`;
}

/** "Good morning", "Good afternoon" or "Good evening", from the time on the user's device. */
function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/** A person's photo, or their first letter on a coloured circle when they have none. */
function Avatar({ name, photo }: { name: string; photo: string | null }) {
  if (photo) return <img src={photo} alt={name} className="ih-avatar-md" />;
  return <span className="ih-avatar-md ih-avatar-initial">{name.charAt(0).toUpperCase()}</span>;
}

export function InterpreterHomePage() {
  const { session } = useAuth();
  const firstName = session?.user.name?.split(' ')[0] || 'there';
  const { data: home } = useInterpreterHome();
  const { available, reason, setAvailable, loading, saving, error } = useAvailability();
  const { sessions } = useMySessions();
  const { bookings } = useBookedSessions();
  const today = new Date();
  const next = upcomingBooking(bookings);
  const recent = recentSessions(sessions);
  const sessionsToday = sessionsOn(sessions, today);
  const sessionsWeek = sessionsThisWeek(sessions, today);
  const [viewMonth, setViewMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const monthLabel = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const isThisMonth =
    viewMonth.getFullYear() === today.getFullYear() && viewMonth.getMonth() === today.getMonth();
  const shiftMonth = (by: number) =>
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + by, 1));

  return (
    <div className="ih-page">
      <header className="ih-topbar">
        <div className="ih-topbar-actions">
          <button className="ih-icon-btn relative" aria-label="Notifications">
            <Bell size={20} className="ih-icon" />
            <span className="ih-notification-dot"></span>
          </button>
        </div>
      </header>

      <div className="ih-content-wrapper">
        <div className="ih-main-section">
          <section className="ih-banner" aria-label="Greeting">
            <div className="ih-banner-text">
              <h1>
                <span className="ih-sun-icon">
                  <Sun size={24} />
                </span>
                {greeting()}, {firstName}
              </h1>
              <p className="ih-banner-sub">Bridging communication. Expanding access.</p>
              <p className="ih-banner-desc">
                You're making a difference. Every connection helps someone get the support they
                need.
              </p>
            </div>

            <div className="ih-banner-image-container">
              <img src={bannerImage} alt="Sign language interpreter" className="ih-banner-image" />
            </div>
          </section>

          <div className="ih-stats-row">
            {/* Pending Requests Card */}
            <div className="ih-stat-box">
              <div className="ih-stat-header">
                <Clock size={20} className="ih-icon-blue" />
                <span className="ih-trend trend-green">
                  {home.availableRequests > 0 ? 'Needs reply' : 'All clear'}
                </span>
              </div>
              <h2>{home.availableRequests}</h2>
              <p>Pending requests</p>
            </div>

            <div className="ih-stat-box">
              <div className="ih-stat-header">
                <Calendar size={20} className="ih-icon-purple" />
                <span className="ih-trend trend-purple">{sessionsToday.length} today</span>
              </div>
              <h2>{sessionsWeek.length}</h2>
              <p>This week&apos;s sessions</p>
            </div>
          </div>

          <div className="ih-dashboard-split">
            <div className="ih-split-left">
              <section className="ih-section">
                <div className="ih-next-session-wrapper">
                  <div className="ih-section-header">
                    <h3>
                      <Calendar size={18} className="ih-section-icon" /> Upcoming session
                    </h3>
                    <Link to={`${INTERPRETER_BASE}/sessions`} className="ih-section-link">
                      View all <ChevronRight size={14} />
                    </Link>
                  </div>

                  {next ? (
                    <div className="ih-next-session-content">
                      <div className="ih-next-header">
                        <Avatar name={next.withName} photo={next.photo} />
                        <div>
                          <h4>{next.withName}</h4>
                          <p className="ih-meta">
                            Deaf User • {next.confirmed ? 'Confirmed' : 'Awaiting confirmation'}
                          </p>
                        </div>
                      </div>

                      <div className="ih-next-details">
                        <p>
                          <Calendar size={14} className="ih-meta-icon" />{' '}
                          {dayLabel(next.startsAt, today)}, {timeOf(next.startsAt)}
                        </p>
                        <p>
                          <Clock size={14} className="ih-meta-icon" />{' '}
                          {formatDuration(next.durationMinutes)} • {next.typeLabel}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="ih-time-label ih-empty-note">No upcoming sessions booked.</p>
                  )}
                </div>
              </section>

              <section className="ih-section">
                <div className="ih-next-session-wrapper">
                  <div className="ih-section-header">
                    <h3>
                      <Calendar size={18} className="ih-section-icon" /> Booked sessions
                    </h3>
                    <Link to={`${INTERPRETER_BASE}/sessions`} className="ih-section-link">
                      View all <ChevronRight size={14} />
                    </Link>
                  </div>

                  {bookings.length === 0 ? (
                    <p className="ih-time-label ih-empty-note">No sessions have been booked yet.</p>
                  ) : (
                    <div className="ih-list-card-transparent">
                      {bookings.slice(0, 4).map((booking, index, shown) => (
                        <div
                          className={`ih-list-item${index === shown.length - 1 ? ' ih-list-item-last' : ''}`}
                          key={booking.id}
                        >
                          <Avatar name={booking.withName} photo={booking.photo} />
                          <div className="ih-list-info">
                            <h4>{booking.withName}</h4>
                            <p className="ih-meta">{booking.typeLabel}</p>
                          </div>
                          <div className="ih-list-time">
                            <p>
                              {dayLabel(booking.startsAt, today)}, {timeOf(booking.startsAt)}
                            </p>
                            <p className="ih-meta-inline">
                              <Clock size={12} className="ih-meta-icon" />{' '}
                              {formatDuration(booking.durationMinutes)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="ih-split-right">
              <section className="ih-section">
                <div className="ih-activity-wrapper">
                  <div
                    className="ih-section-header"
                    style={{
                      marginBottom: '16px',
                      paddingBottom: '12px',
                      borderBottom: '1px solid #f1edf9',
                    }}
                  >
                    <h3>
                      <Clock size={18} className="ih-section-icon" /> Recent sessions
                    </h3>
                    <Link to={`${INTERPRETER_BASE}/sessions`} className="ih-section-link">
                      View all <ChevronRight size={14} />
                    </Link>
                  </div>

                  {recent.length === 0 && <p className="ih-time-label">No sessions yet.</p>}

                  {recent.map((session) => (
                    <div className="ih-recent-item" key={session.id}>
                      <Avatar name={session.withName} photo={session.photo} />
                      <div className="ih-list-info">
                        <h4>{session.withName}</h4>
                        <p className="ih-meta">
                          {dayLabel(session.startedAt, today)}, {timeOf(session.startedAt)}
                        </p>
                      </div>
                      {session.running ? (
                        <Link to={`/live/interpreter/${session.id}`} className="ih-recent-join">
                          Join session
                        </Link>
                      ) : (
                        <span className="ih-meta-inline">
                          <Video size={12} className="ih-meta-icon" />{' '}
                          {session.durationMinutes
                            ? formatDuration(session.durationMinutes)
                            : 'Video call'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>

        <aside className="ih-right-column">
          <div className="ih-card ih-availability-card">
            <div className="ih-availability-row">
              <div className="ih-availability-status">
                <span
                  className={`ih-availability-dot${available ? '' : ' ih-availability-dot-off'}`}
                  aria-hidden="true"
                />
                <span>{available ? 'Available for requests' : 'Not available'}</span>
              </div>

              <button
                type="button"
                className={`ih-availability-toggle${available ? ' active' : ''}`}
                aria-label="Toggle availability"
                aria-pressed={available}
                disabled={loading || saving}
                onClick={() => setAvailable(!available)}
              >
                <span className="ih-availability-knob" aria-hidden="true" />
              </button>
            </div>

            <p className="ih-availability-copy">
              {error ||
                (available
                  ? reasonText(reason) ||
                    "You'll receive connection requests and messages when you're online."
                  : "You won't receive requests while you're switched off.")}
            </p>

            <Link to={`${INTERPRETER_BASE}/availability`} className="ih-availability-button">
              Update availability
            </Link>
          </div>

          <div className="ih-card ih-calendar-card">
            <h3>
              <Calendar size={16} className="ih-calendar-icon" /> Interpreter Calendar
            </h3>

            <div className="ih-cal-header">
              <button type="button" aria-label="Previous month" onClick={() => shiftMonth(-1)}>
                <ChevronLeft size={14} />
              </button>
              <span>{monthLabel}</span>
              <button type="button" aria-label="Next month" onClick={() => shiftMonth(1)}>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="ih-cal-grid" aria-label={`${monthLabel} calendar`}>
              {calendarDays.map((day) => (
                <span key={day} className="ih-cal-day-name">
                  {day}
                </span>
              ))}
              {monthGrid(viewMonth).map((day, index) => (
                <span
                  key={`${day ?? 'empty'}-${index}`}
                  className={
                    isThisMonth && day === today.getDate()
                      ? 'ih-cal-day ih-cal-day-active'
                      : 'ih-cal-day'
                  }
                >
                  {day ?? ''}
                </span>
              ))}
            </div>

            <div className="ih-today-schedule">
              <h4>
                Today&apos;s schedule <span className="ih-date-pill">{dayPill(today)}</span>
              </h4>

              {sessionsToday.length === 0 ? (
                <p className="ih-time-label">No sessions today.</p>
              ) : (
                sessionsToday.map((session) => (
                  <p className="ih-time-label" key={session.id}>
                    {timeOf(session.startedAt)} · {session.withName}
                  </p>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
