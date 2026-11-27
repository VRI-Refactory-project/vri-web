import { useState } from 'react';
import { describeError } from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Calendar, CalendarCheck, ChevronLeft, ChevronRight, Clock, Sun } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { INTERPRETER_BASE } from '../../features/interpreter/navigation';
import { reasonText, useAvailability } from '../../features/interpreter/homeData';
import {
  startBookedCall,
  upcomingBooking,
  useBookedSessions,
} from '../../features/interpreter/bookedSessions';
import { dayLabel, formatDuration } from '../../services/interpreterSessions';
import {
  recentSessions,
  sessionsOn,
  sessionsThisWeek,
  timeOf,
  useMySessions,
} from '../../features/interpreter/homeSessions';
import { useInterpreterNotifications } from '../../features/interpreter/useInterpreterNotifications';
import { NotificationDropdown } from '../../features/interpreter/NotificationDropdown';
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

/** What the "Status" column says about a booked session, and which colour it gets. */
function bookingStatus(booking: { offered: boolean; confirmed: boolean }) {
  if (booking.offered) return { label: 'Awaiting your answer', tone: 'offered' };
  if (booking.confirmed) return { label: 'Confirmed', tone: 'confirmed' };
  return { label: 'Pending', tone: 'offered' };
}

/** A person's photo, or their first letter on a coloured circle when they have none. */
function Avatar({ name, photo }: { name: string; photo: string | null }) {
  if (photo) return <img src={photo} alt={name} className="ih-avatar-md" />;
  return <span className="ih-avatar-md ih-avatar-initial">{name.charAt(0).toUpperCase()}</span>;
}

export function InterpreterHomePage() {
  const { session } = useAuth();
  const firstName = session?.user.name?.split(' ')[0] || 'there';

  const { notifications, unreadCount, markAllRead } = useInterpreterNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  const { available, availableNow, reason, setAvailable, loading, saving, error } =
    useAvailability();
  const { sessions } = useMySessions();
  const {
    bookings,
    answer,
    busyId,
    error: bookingError,
    loading: bookingsLoading,
    loadError,
  } = useBookedSessions();
  const navigate = useNavigate();
  const [joinError, setJoinError] = useState<string | null>(null);
  const join = async (id: number) => {
    setJoinError(null);
    try {
      navigate(`/live/interpreter/${await startBookedCall(id)}`);
    } catch (err) {
      setJoinError(describeError(err));
    }
  };
  const toAnswer = bookings.filter((b) => b.offered).length;
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
          <div style={{ position: 'relative' }}>
            <button
              className="ih-icon-btn relative"
              aria-label="Notifications"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={20} className="ih-icon" />
              {unreadCount > 0 && <span className="ih-notification-dot"></span>}
            </button>

            {showNotifications && (
              <NotificationDropdown
                notifications={notifications}
                onClose={() => setShowNotifications(false)}
                onMarkAllRead={markAllRead}
              />
            )}
          </div>
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
            <div className="ih-stat-box">
              <div className="ih-stat-header">
                <CalendarCheck size={20} className="ih-icon-blue" />
                <span className="ih-trend trend-green">
                  {bookingsLoading
                    ? 'Loading'
                    : toAnswer > 0
                      ? `${toAnswer} to answer`
                      : bookings.length > 0
                        ? 'Upcoming'
                        : 'None yet'}
                </span>
              </div>
              <h2>{bookingsLoading ? '—' : bookings.length}</h2>
              <p>Booked sessions</p>
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

                  {loadError ? (
                    <p className="ih-time-label ih-empty-note" role="alert">
                      {loadError}
                    </p>
                  ) : bookingsLoading ? (
                    <p className="ih-time-label ih-empty-note">Loading sessions…</p>
                  ) : next ? (
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

                  {recent.slice(0, 4).map((session) => (
                    <div className="ih-recent-item" key={session.id}>
                      <Avatar name={session.withName} photo={session.photo} />
                      <div className="ih-list-info">
                        <h4>{session.withName}</h4>
                        <p className="ih-meta">
                          {dayLabel(session.startedAt, today)}, {timeOf(session.startedAt)}
                          {session.durationMinutes
                            ? ` · ${formatDuration(session.durationMinutes)}`
                            : ''}
                        </p>
                      </div>
                      <Link to={`${INTERPRETER_BASE}/sessions`} className="ih-recent-details">
                        Details
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <section className="ih-section" aria-label="Booked sessions">
            <div className="ih-next-session-wrapper">
              <div className="ih-section-header">
                <h3>
                  <Calendar size={18} className="ih-section-icon" /> Booked sessions
                </h3>
                <Link to={`${INTERPRETER_BASE}/sessions`} className="ih-section-link">
                  View all <ChevronRight size={14} />
                </Link>
              </div>

              {(bookingError || joinError) && (
                <p className="ih-time-label ih-empty-note" role="alert">
                  {bookingError || joinError}
                </p>
              )}

              {!loadError && (
                <div className="ih-booked-wrap mobile-data-cards">
                  <table className="ih-booked-table">
                    <thead>
                      <tr>
                        <th scope="col">Deaf user</th>
                        <th scope="col">Date</th>
                        <th scope="col">Time</th>
                        <th scope="col">Duration</th>
                        <th scope="col">Session type</th>
                        <th scope="col">Status</th>
                        <th scope="col">
                          <span className="ih-sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookingsLoading ? (
                        <tr>
                          <td colSpan={7} className="ih-time-label ih-empty-note">
                            Loading sessions…
                          </td>
                        </tr>
                      ) : bookings.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="ih-time-label ih-empty-note">
                            No sessions have been booked yet.
                          </td>
                        </tr>
                      ) : (
                        bookings.slice(0, 4).map((booking) => (
                          <tr key={booking.id}>
                            <td data-label="Deaf user" data-card-primary>
                              <span className="ih-booked-person">
                                <Avatar name={booking.withName} photo={booking.photo} />
                                {booking.withName}
                              </span>
                            </td>
                            <td data-label="Date">{dayLabel(booking.startsAt, today)}</td>
                            <td data-label="Time">{timeOf(booking.startsAt)}</td>
                            <td data-label="Duration">{formatDuration(booking.durationMinutes)}</td>
                            <td data-label="Session type">{booking.typeLabel}</td>
                            <td data-label="Status">
                              <span
                                className={`ih-status ih-status--${bookingStatus(booking).tone}`}
                              >
                                {bookingStatus(booking).label}
                              </span>
                            </td>
                            <td data-label="Actions" data-card-actions>
                              <div className="ih-booking-actions">
                                {booking.offered ? (
                                  <>
                                    <button
                                      type="button"
                                      className="ih-btn-primary ih-btn-small"
                                      disabled={busyId === booking.id}
                                      onClick={() => answer(booking.id, 'accept')}
                                    >
                                      Accept
                                    </button>
                                    <button
                                      type="button"
                                      className="ih-btn-secondary ih-btn-small"
                                      disabled={busyId === booking.id}
                                      onClick={() => answer(booking.id, 'decline')}
                                    >
                                      Decline
                                    </button>
                                  </>
                                ) : booking.confirmed ? (
                                  booking.canJoin ? (
                                    <button
                                      type="button"
                                      className="ih-btn-primary ih-btn-small"
                                      onClick={() => join(booking.id)}
                                    >
                                      Join call
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      className="ih-btn-secondary ih-btn-small"
                                      disabled={busyId === booking.id}
                                      onClick={() => answer(booking.id, 'release')}
                                    >
                                      Give back
                                    </button>
                                  )
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="ih-right-column">
          <div className="ih-card ih-availability-card">
            <div className="ih-availability-row">
              <div className="ih-availability-status">
                <span
                  className={`ih-availability-dot${availableNow ? '' : ' ih-availability-dot-off'}`}
                  aria-hidden="true"
                />
                <span>{availableNow ? 'Available for requests' : 'Not available'}</span>
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
                (availableNow
                  ? "You'll receive connection requests and messages when you're online."
                  : reasonText(reason) || "You won't receive requests while you're switched off.")}
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
