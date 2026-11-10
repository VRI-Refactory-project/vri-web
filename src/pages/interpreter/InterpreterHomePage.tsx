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
import { markerClass, timeAgo, useRecentActivity } from '../../features/interpreter/recentActivity';
import { photoSrc } from '../../services/photos';
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

export function InterpreterHomePage() {
  const { session } = useAuth();
  const firstName = session?.user.name?.split(' ')[0] || 'there';
  const { data: home } = useInterpreterHome();
  const { available, reason, setAvailable, loading, saving, error } = useAvailability();
  const { items: activity, loading: activityLoading, error: activityError } = useRecentActivity();
  const today = new Date();
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
                <span className="ih-trend trend-purple">+1 today</span>
              </div>
              <h2>3</h2>
              <p>This week&apos;s sessions</p>
            </div>

            {/* <div className="ih-stat-box">
              <div className="ih-stat-header">
                <MessageSquare size={20} className="ih-icon-teal" />
                <span className="ih-trend trend-muted">All read</span>
              </div>
              <h2>0</h2>
              <p>Unread messages</p>
            </div> */}
          </div>

          <div className="ih-dashboard-split">
            <div className="ih-split-left">
              <section className="ih-section">
                <div className="ih-next-session-wrapper">
                  <div className="ih-section-header">
                    <h3>
                      <Calendar size={18} className="ih-section-icon" /> Next session
                    </h3>
                    <Link to="#" className="ih-section-link">
                      View all <ChevronRight size={14} />
                    </Link>
                  </div>

                  <div className="ih-next-session-content">
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
                      <ChevronRight
                        size={18}
                        className="ih-chevron"
                        style={{ marginLeft: 'auto' }}
                      />
                    </div>

                    <div className="ih-next-details">
                      <p>
                        <Calendar size={14} className="ih-meta-icon" /> Today, 10:30 AM - 11:00 AM
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
                </div>
              </section>

              <section className="ih-section">
                <div className="ih-next-session-wrapper">
                  <div className="ih-section-header">
                    <h3>
                      <Calendar size={18} className="ih-section-icon" /> Upcoming sessions
                    </h3>
                    <Link to="#" className="ih-section-link">
                      View all <ChevronRight size={14} />
                    </Link>
                  </div>

                  <div className="ih-list-card-transparent">
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
                        <p className="ih-meta-inline">
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
                        <p className="ih-meta-inline">
                          <Video size={12} className="ih-meta-icon" /> Video call
                        </p>
                      </div>
                      <ChevronRight size={18} className="ih-chevron" />
                    </div>
                  </div>
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
                      <Clock size={18} className="ih-section-icon" /> Recent activity
                    </h3>
                  </div>

                  {activityLoading && <p className="ih-time-label">Loading activity...</p>}

                  {!activityLoading && activityError && (
                    <p className="ih-time-label">{activityError}</p>
                  )}

                  {!activityLoading && !activityError && activity.length === 0 && (
                    <p className="ih-time-label">No recent activity yet.</p>
                  )}

                  {activity.map((item) => {
                    const hasActor = Boolean(item.actor_name || item.actor_photo); // is it a session item?
                    const photo = photoSrc(item.actor_photo); // full photo URL, or null
                    return (
                      <div
                        className={`ih-timeline-item${hasActor ? ' ih-timeline-item-avatar' : ''}`}
                        key={item.id}
                      >
                        {hasActor ? (
                          photo ? (
                            <img
                              src={photo}
                              alt={item.actor_name ?? 'Deaf user'}
                              className="ih-timeline-avatar"
                            />
                          ) : (
                            <span className="ih-timeline-avatar ih-timeline-avatar-initial">
                              {(item.actor_name ?? '?').charAt(0).toUpperCase()}
                            </span>
                          )
                        ) : (
                          <div className={`ih-timeline-marker ${markerClass(item.category)}`}></div>
                        )}
                        <div className="ih-timeline-content">
                          <p>{item.title}</p>
                          <span className="ih-time-label">{timeAgo(item.created_at)}</span>
                        </div>
                      </div>
                    );
                  })}
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

              <p className="ih-time-label">No sessions scheduled for today.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
