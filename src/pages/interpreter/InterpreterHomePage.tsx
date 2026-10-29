
import { Link } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MessageSquare,
  // SlidersHorizontal,
  // Users,
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
          </section>

          {/* Stats Row */}
          <div className="ih-stats-row">
            
            <div className="ih-stat-box">
              <div className="ih-stat-header">
                <Clock size={20} className="ih-icon-blue" />
                <span className="ih-trend trend-green">+2 new</span>
              </div>
              <h2>5</h2>
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

            <div className="ih-stat-box">
              <div className="ih-stat-header">
                <MessageSquare size={20} className="ih-icon-teal" />
                <span className="ih-trend trend-muted">All read</span>
              </div>
              <h2>0</h2>
              <p>Unread messages</p>
            </div>

          </div>

          {/* Middle Grid: Next Session & Activity */}
          <div className="ih-middle-grid">
            <section className="ih-section">
              <div className="ih-section-header">
                <h3>Next session</h3>
                <Link to="#" className="ih-section-link">
                   View all <ChevronRight size={14} />
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
                   <Calendar size={14} className="ih-meta-icon" /> Today, 10:30 AM - 11:00 AM
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
                <h3>
                  <Clock size={18} className="ih-section-icon" /> Recent activity
                </h3>
              </div>

              <div className="ih-card ih-activity-card">
                
                <div className="ih-timeline-item">
                  <div className="ih-timeline-marker bg-green"></div>
                  <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80" alt="James" className="ih-timeline-avatar" />
                  <div className="ih-timeline-content">
                    <p>You accepted James Carter's connection request</p>
                    <span className="ih-time-label">2 hours ago</span>
                  </div>
                </div>

                <div className="ih-timeline-item">
                  <div className="ih-timeline-marker bg-purple"></div>
                  <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80" alt="Priya" className="ih-timeline-avatar" />
                  <div className="ih-timeline-content">
                    <p>Priya Sharma sent you a connection request</p>
                    <span className="ih-time-label">4 hours ago</span>
                  </div>
                </div>

                <div className="ih-timeline-item">
                  <div className="ih-timeline-marker bg-purple"></div>
                  <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80" alt="Alex" className="ih-timeline-avatar" />
                  <div className="ih-timeline-content">
                    <p>Alex Johnson accepted your connection request</p>
                    <span className="ih-time-label">Yesterday</span>
                  </div>
                </div>

                <div className="ih-timeline-item">
                  <div className="ih-timeline-marker bg-purple"></div>
                  <img src="https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=100&q=80" alt="Grace" className="ih-timeline-avatar" />
                  <div className="ih-timeline-content">
                    <p>You started a chat with Grace Nsubuga</p>
                    <span className="ih-time-label">Yesterday</span>
                  </div>
                </div>

                <div className="ih-timeline-item">
                  <div className="ih-timeline-marker bg-blue"></div>
                  <img src="https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&w=100&q=80" alt="Daniel" className="ih-timeline-avatar" />
                  <div className="ih-timeline-content">
                    <p>You received a connection request from Daniel Ochieng</p>
                    <span className="ih-time-label">2 days ago</span>
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
                  View all <ChevronRight size={14} />
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




