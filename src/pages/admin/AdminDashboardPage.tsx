

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Calendar,
  Bell,
  ChevronDown,
  Users,
  Building2,
  Video,
  ShieldCheck,
  Lightbulb,
  BarChart3,
  Clock,
  CheckCircle2,
  UserPlus,
  XCircle,
  Headphones,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  fetchAdminSummary,
  fetchSessionActivity,
  fetchActivityFeed,
  fetchUserGrowth,
  fetchInterpreterPerformance,
  fetchVerificationStatus,
  fetchUpcomingSessions,
  type AdminDashboardSummary,
  type SessionActivityPoint,
  type ActivityItem,
  type GrowthPoint,
  type InterpreterPerformance,
  type VerificationStatusBreakdown,
  type SessionRow,
} from '../../services/admin';
import {
  fetchNotifications,
  markNotificationRead,
  type AppNotification,
} from '../../services/notifications';
import { useNavigate } from 'react-router-dom';
import './AdminDashboardPage.css';

const KPI_META = [
  {
    id: 'total-users',
    label: 'Total Users',
    trend: 'up' as const,
    Icon: Users,
    color: 'purple',
  },
  {
    id: 'dhh',
    label: 'DHH Users',
    trend: 'up' as const,
    Icon: Users,
    color: 'green',
  },
  {
    id: 'institutions',
    label: 'Institutions',
    trend: 'up' as const,
    Icon: Building2,
    color: 'blue',
  },
  {
    id: 'interpreters',
    label: 'Interpreters',
    trend: 'up' as const,
    Icon: Video,
    color: 'pink',
  },
  {
    id: 'pending',
    label: 'Pending Verifications',
    trend: 'down' as const,
    Icon: ShieldCheck,
    color: 'orange',
  },
];

// Status pill colours for upcoming sessions
function statusStyle(status: string) {
  const value = status.toLowerCase();

  if (value === 'pending') {
    return { bg: '#fef3c7', text: '#b45309' };
  }

  if (value === 'cancelled') {
    return { bg: '#fee2e2', text: '#b91c1c' };
  }

  return { bg: '#dcfce7', text: '#15803d' };
}

// Select an icon and colours based on activity text
function getActivityIcon(text: string) {
  const value = text.toLowerCase();

  if (value.includes('signed in') || value.includes('sign-in')) {
    return { Icon: Users, bg: '#e0f2fe', color: '#0284c7' };
  }

  if (
    value.includes('video') ||
    value.includes('session') ||
    value.includes('call')
  ) {
    return { Icon: Video, bg: '#dcfce7', color: '#16a34a' };
  }

  if (value.includes('register') || value.includes('new user')) {
    return { Icon: UserPlus, bg: '#f3e8ff', color: '#9333ea' };
  }

  if (
    value.includes('verification') ||
    value.includes('verified') ||
    value.includes('approved')
  ) {
    return { Icon: ShieldCheck, bg: '#e0f2fe', color: '#0284c7' };
  }

  if (
    value.includes('reject') ||
    value.includes('failed') ||
    value.includes('error')
  ) {
    return { Icon: XCircle, bg: '#fee2e2', color: '#ef4444' };
  }

  if (
    value.includes('request') ||
    value.includes('offer') ||
    value.includes('interpreter')
  ) {
    return { Icon: Headphones, bg: '#fef3c7', color: '#b45309' };
  }

  return { Icon: Lightbulb, bg: '#f3f4f6', color: '#6b7280' };
}

export function AdminDashboardPage() {
  const { session } = useAuth();
  const navigate = useNavigate();

  const name = session?.user.name ?? 'Admin';
  const role = session?.user.role ?? 'admin';
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  // Dashboard data
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [activity, setActivity] = useState<SessionActivityPoint[] | null>(null);
  const [feed, setFeed] = useState<ActivityItem[] | null>(null);
  const [growth, setGrowth] = useState<GrowthPoint[] | null>(null);
  const [performance, setPerformance] =
    useState<InterpreterPerformance | null>(null);
  const [verification, setVerification] =
    useState<VerificationStatusBreakdown | null>(null);
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);

  // Notification data
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement | null>(null);

  // Search
  const [query, setQuery] = useState('');

  // Fetch dashboard data
  useEffect(() => {
    fetchAdminSummary()
      .then((data) => {
        setSummary(data);
        setUnreadCount(data.unread_notifications ?? 0);
      })
      .catch(() => setSummary(null));

    fetchSessionActivity()
      .then(setActivity)
      .catch(() => setActivity([]));

    fetchActivityFeed()
      .then(setFeed)
      .catch(() => setFeed([]));

    fetchUserGrowth()
      .then(setGrowth)
      .catch(() => setGrowth([]));

    fetchInterpreterPerformance()
      .then(setPerformance)
      .catch(() => setPerformance(null));

    fetchVerificationStatus()
      .then(setVerification)
      .catch(() => setVerification(null));

    fetchUpcomingSessions()
      .then(setSessions)
      .catch(() => setSessions([]));

    fetchNotifications()
      .then(setNotifications)
      .catch(() => setNotifications([]));
  }, []);

  // Close notification panel when clicking outside it
  useEffect(() => {
    if (!bellOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        bellRef.current &&
        !bellRef.current.contains(event.target as Node)
      ) {
        setBellOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [bellOpen]);

  // Mark a notification as read
  const handleNotificationClick = async (notification: AppNotification) => {
    if (notification.read_at) return;

    setNotifications((previous) =>
      previous.map((item) =>
        item.id === notification.id
          ? { ...item, read_at: new Date().toISOString() }
          : item,
      ),
    );

    setUnreadCount((count) => Math.max(0, count - 1));

    try {
      await markNotificationRead(notification.id);
    } catch {
      // Restore unread status if the request fails
      setNotifications((previous) =>
        previous.map((item) =>
          item.id === notification.id
            ? { ...item, read_at: null }
            : item,
        ),
      );

      setUnreadCount((count) => count + 1);
    }
  };

  // KPI values from the backend
  const kpiValues: Record<string, string> = {
    'total-users': (summary?.totalUsers ?? 0).toLocaleString(),
    dhh: (summary?.dhhUsers ?? 0).toLocaleString(),
    institutions: (summary?.institutions ?? 0).toLocaleString(),
    interpreters: (summary?.interpreters ?? 0).toLocaleString(),
    pending: (summary?.pendingVerifications ?? 0).toLocaleString(),
  };

  // Verification percentages
  const verificationTotal = verification?.total ?? 0;

  const getVerificationPercentage = (value: number) =>
    verificationTotal
      ? `${Math.round((value / verificationTotal) * 100)}%`
      : '0%';

  // Search filtering
  const searchTerm = query.trim().toLowerCase();

  const filteredFeed = useMemo(() => {
    if (!feed || !searchTerm) return feed;

    return feed.filter((item) =>
      item.text.toLowerCase().includes(searchTerm),
    );
  }, [feed, searchTerm]);

  const filteredSessions = useMemo(() => {
    if (!sessions || !searchTerm) return sessions;

    return sessions.filter((item) =>
      [
        item.id,
        item.client,
        item.interpreter,
        item.type,
        item.status,
      ].some((value) => value.toLowerCase().includes(searchTerm)),
    );
  }, [sessions, searchTerm]);

  // Session activity chart scale
  const activityMax = Math.max(
    1,
    ...(activity ?? []).map((item) => item.value),
  );

  const yMax = Math.ceil(activityMax / 50) * 50 || 250;

  // Interpreter availability
  const totalInterps = summary?.interpreters ?? 0;
  const availableInterps = summary?.available_interpreters ?? 0;
  const offlineInterps = summary?.offline_interpreters ?? 0;

  // Busy status is not currently supplied by the backend
  const busyInterps = 0;

  const availPct = totalInterps
    ? Math.round((availableInterps / totalInterps) * 100)
    : 0;

  const busyPct = 0;

  const offlinePct = totalInterps
    ? 100 - availPct
    : 0;

  const availabilityDonut = `conic-gradient(
    #4b34a0 0 ${availPct}%,
    #16a34a ${availPct}% ${availPct + busyPct}%,
    #cbd5e1 ${availPct + busyPct}% 100%
  )`;

  return (
    <div className="ad-page">
      {/* Top bar */}
      <div className="ad-topbar">
        <div className="ad-search">
          <Search size={16} aria-hidden="true" />

          <input
            placeholder="Search name, organization, country..."
            aria-label="Search dashboard"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="ad-actions">
          <button type="button" className="ad-date">
            <Calendar size={15} />
            <span>Sep 29/2025 - Oct 5, 2025</span>
          </button>

          {/* Notifications */}
          <div className="ad-bell-wrap" ref={bellRef}>
            <button
              type="button"
              className="ad-icon-btn"
              aria-label="Notifications"
              aria-expanded={bellOpen}
              onClick={() => setBellOpen((previous) => !previous)}
            >
              <Bell size={17} />
              {unreadCount > 0 && <span className="ad-dot" />}
            </button>

            {bellOpen && (
              <div
                className="ad-bell-panel"
                role="dialog"
                aria-label="Notifications"
              >
                <div className="ad-bell-header">
                  Notifications

                  {unreadCount > 0 && (
                    <span
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        borderRadius: '999px',
                        padding: '1px 8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        marginLeft: '8px',
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </div>

                {notifications.length > 0 ? (
                  <ul className="ad-bell-list">
                    {notifications.slice(0, 6).map((notification) => {
                      const isUnread = !notification.read_at;

                      return (
                        <li
                          key={notification.id}
                          onClick={() =>
                            handleNotificationClick(notification)
                          }
                          style={{
                            cursor: isUnread ? 'pointer' : 'default',
                            background: isUnread ? '#f8fafc' : 'white',
                          }}
                        >
                          <span
                            className="ad-bell-dot"
                            style={{
                              background: isUnread
                                ? '#ef4444'
                                : '#cbd5e1',
                            }}
                          />

                          <div>
                            <strong>{notification.title}</strong>

                            {notification.body && (
                              <small
                                style={{
                                  display: 'block',
                                  color: '#6b7280',
                                }}
                              >
                                {notification.body}
                              </small>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="ad-bell-empty">
                    No notifications yet.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Admin profile */}
          <button type="button" className="ad-user">
            <span className="ad-avatar">{initial}</span>

            <span className="ad-user-text">
              <strong>{name}</strong>
              <small>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </small>
            </span>

            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Dashboard title */}
      <div className="ad-title">
        <h1>Admin dashboard</h1>
        <p>Here's what's happening today.</p>
      </div>

      {/* KPI cards */}
      <div className="ad-kpis">
        {KPI_META.map(({ id, label, Icon, color }) => (
          <div key={id} className="ad-kpi">
            <div className="ad-kpi-head">
              <span className={`ad-kpi-icon ad-kpi-icon--${color}`}>
                <Icon size={14} />
              </span>

              <span>{label}</span>
            </div>

            <div className="ad-kpi-value">
              {kpiValues[id]}
            </div>
          </div>
        ))}
      </div>

      {/* Row 1: Session activity, interpreter availability and recent activity */}
      <div
        className="ad-row ad-row--top"
        style={{ alignItems: 'stretch' }}
      >
        {/* Session activity */}
        <div
          className="ad-panel"
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          <div
            className="ad-panel-head"
            style={{ alignItems: 'flex-start' }}
          >
            <div>
              <h3 style={{ margin: 0 }}>Session activity</h3>
            </div>

            <div
              style={{
                fontSize: '13px',
                color: '#9ca3af',
                fontWeight: 500,
                marginTop: '2px',
              }}
            >
              Last 7 days
            </div>
          </div>

          {activity && activity.length > 0 ? (
            <div
              style={{
                display: 'flex',
                marginTop: '20px',
                height: '260px',
                flex: 1,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  paddingBottom: '24px',
                  fontSize: '11px',
                  color: '#9ca3af',
                  width: '30px',
                }}
              >
                {[
                  yMax,
                  Math.round(yMax * 0.8),
                  Math.round(yMax * 0.6),
                  Math.round(yMax * 0.4),
                  Math.round(yMax * 0.2),
                  0,
                ].map((value) => (
                  <span key={value}>{value}</span>
                ))}
              </div>

              <div style={{ flex: 1, position: 'relative' }}>
                {/* Chart grid lines */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  {[0, 1, 2, 3, 4].map((index) => (
                    <div
                      key={index}
                      style={{
                        borderBottom: '1px dashed #f1f5f9',
                        width: '100%',
                      }}
                    />
                  ))}

                  <div
                    style={{
                      borderBottom: '1px solid #e2e8f0',
                      width: '100%',
                    }}
                  />
                </div>

                {/* Chart bars */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: '24px',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-around',
                    zIndex: 1,
                    gap: '8px',
                  }}
                >
                  {activity.map((item) => {
                    const heightPct = Math.min(
                      100,
                      (item.value / yMax) * 100,
                    );

                    return (
                      <div
                        key={item.label}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          height: '100%',
                          justifyContent: 'flex-end',
                          flex: 1,
                          maxWidth: '40px',
                        }}
                      >
                        <div
                          style={{
                            height: `${heightPct}%`,
                            width: '100%',
                            background: '#4b34a0',
                            borderRadius: '6px 6px 0 0',
                            transition: 'height 0.5s ease',
                            minHeight: '4px',
                          }}
                          title={`${item.label}: ${item.value}`}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Chart labels */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    display: 'flex',
                    justifyContent: 'space-around',
                    fontSize: '11px',
                    color: '#9ca3af',
                    gap: '8px',
                  }}
                >
                  {activity.map((item) => (
                    <span
                      key={item.label}
                      style={{ flex: 1, textAlign: 'center' }}
                    >
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="ad-empty">No data yet.</p>
          )}
        </div>

        {/* Interpreter availability */}
        <div
          className="ad-panel"
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          <div className="ad-panel-head">
            <div>
              <h3 style={{ margin: 0 }}>Interpreter availability</h3>

              <small
                style={{
                  color: '#9ca3af',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                Right now
              </small>
            </div>
          </div>

          <div
            className="ad-donut-wrap"
            style={{
              marginTop: '24px',
              height: '100%',
              alignItems: 'center',
            }}
          >
            <div
              className="ad-donut"
              style={{ background: availabilityDonut }}
            >
              <div className="ad-donut-hole">
                <strong>{totalInterps}</strong>
                <small>Total</small>
              </div>
            </div>

            <div className="ad-legend" style={{ gap: '16px' }}>
              <div>
                <span
                  className="ad-legend-dot"
                  style={{ background: '#4b34a0' }}
                />

                <div>
                  <strong
                    style={{
                      display: 'block',
                      color: '#111827',
                      fontSize: '13px',
                    }}
                  >
                    Available
                  </strong>

                  <small style={{ color: '#9ca3af' }}>
                    {availPct}% · {availableInterps}
                  </small>
                </div>
              </div>

              <div>
                <span
                  className="ad-legend-dot"
                  style={{ background: '#16a34a' }}
                />

                <div>
                  <strong
                    style={{
                      display: 'block',
                      color: '#111827',
                      fontSize: '13px',
                    }}
                  >
                    In session / Busy
                  </strong>

                  <small style={{ color: '#9ca3af' }}>
                    {busyPct}% · {busyInterps}
                  </small>
                </div>
              </div>

              <div>
                <span
                  className="ad-legend-dot"
                  style={{ background: '#cbd5e1' }}
                />

                <div>
                  <strong
                    style={{
                      display: 'block',
                      color: '#111827',
                      fontSize: '13px',
                    }}
                  >
                    Offline
                  </strong>

                  <small style={{ color: '#9ca3af' }}>
                    {offlinePct}% · {offlineInterps}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div
          className="ad-panel"
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          <div
            className="ad-panel-head"
            style={{ alignItems: 'center' }}
          >
            <h3>Recent activity</h3>

            <button
              type="button"
              onClick={() => navigate('/dashboard/admin/audit-logs')}
              style={{
                background: 'none',
                border: 'none',
                color: '#4b34a0',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              View all
            </button>
          </div>

          {filteredFeed && filteredFeed.length > 0 ? (
            <div className="ad-feed">
              {filteredFeed.slice(0, 5).map((item, index) => {
                const { Icon, bg, color } = getActivityIcon(item.text);

                return (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '12px 0',
                      borderBottom: '1px solid #f1f5f9',
                    }}
                  >
                    <div
                      style={{
                        background: bg,
                        color,
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={16} />
                    </div>

                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '13px',
                          color: '#111827',
                          fontWeight: 500,
                          lineHeight: 1.4,
                        }}
                      >
                        {item.text}
                      </p>
                    </div>

                    <span
                      style={{
                        fontSize: '11px',
                        color: '#9ca3af',
                        whiteSpace: 'nowrap',
                        marginTop: '2px',
                      }}
                    >
                      {item.time}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="ad-empty">
              {feed && feed.length > 0 && searchTerm
                ? 'No activity matches your search.'
                : 'No data yet.'}
            </p>
          )}
        </div>
      </div>

      {/* Row 2: Top session types, user growth and quick insights */}
      <div
        className="ad-row ad-row--mid"
        style={{ alignItems: 'stretch' }}
      >
        {/* Top session types */}
        <div className="ad-panel">
          <div className="ad-panel-head">
            <h3>Top session types</h3>
            <small>All time</small>
          </div>

          {summary?.top_session_types &&
          summary.top_session_types.length > 0 ? (
            <div
              className="ad-locations"
              style={{ marginTop: '20px' }}
            >
              {(() => {
                const total = summary.top_session_types.reduce(
                  (sum, item) => sum + item.count,
                  0,
                );

                const colors = [
                  '#4b34a0',
                  '#8b5cf6',
                  '#c4b5fd',
                  '#e5e7eb',
                ];

                return summary.top_session_types
                  .slice(0, 4)
                  .map((item, index) => {
                    const percentage =
                      total > 0
                        ? Math.round((item.count / total) * 100)
                        : 0;

                    const label =
                      item.type.charAt(0).toUpperCase() +
                      item.type.slice(1);

                    return (
                      <div
                        key={index}
                        style={{
                          marginBottom:
                            index === 3 ? 0 : '16px',
                        }}
                      >
                        <div className="ad-loc-row">
                          <span
                            style={{
                              fontWeight: 600,
                              color: '#111827',
                            }}
                          >
                            {label}
                          </span>

                          <span style={{ color: '#6b7280' }}>
                            {percentage}%
                          </span>
                        </div>

                        <div
                          className="ad-loc-bar"
                          style={{
                            background: '#f3f4f6',
                            height: '8px',
                            borderRadius: '4px',
                            marginTop: '6px',
                          }}
                        >
                          <span
                            style={{
                              width: `${percentage}%`,
                              background: colors[index % colors.length],
                              display: 'block',
                              height: '100%',
                              borderRadius: '4px',
                              transition: 'width 0.5s ease-in-out',
                            }}
                          />
                        </div>
                      </div>
                    );
                  });
              })()}
            </div>
          ) : (
            <p className="ad-empty">No session data yet.</p>
          )}
        </div>

        {/* User growth */}
        <div className="ad-panel">
          <div
            className="ad-panel-head"
            style={{ alignItems: 'flex-start' }}
          >
            <div
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  background: '#f3e8ff',
                  padding: '8px',
                  borderRadius: '8px',
                  color: '#4b34a0',
                }}
              >
                <BarChart3 size={18} />
              </div>

              <div>
                <h3 style={{ margin: 0 }}>User growth</h3>

                <small
                  style={{
                    color: '#6b7280',
                    fontSize: '12px',
                  }}
                >
                  Last 30 days
                </small>
              </div>
            </div>

            <div
              style={{
                background: '#4b34a0',
                color: 'white',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 'bold',
              }}
            >
              {(summary?.totalUsers ?? 0).toLocaleString()}
            </div>
          </div>

          {growth && growth.length > 1 ? (
            <div
              style={{
                position: 'relative',
                marginTop: '20px',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 30,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  color: '#9ca3af',
                }}
              >
                {(() => {
                  const max = Math.max(
                    1,
                    ...growth.map((item) => item.value),
                  );

                  const formatY = (value: number) => {
                    if (value >= 1000000) {
                      return `${(value / 1000000).toFixed(1)}M`;
                    }

                    if (value >= 1000) {
                      return `${Math.round(value / 1000)}K`;
                    }

                    return Math.round(value).toString();
                  };

                  return (
                    <>
                      <span>{formatY(max)}</span>
                      <span>{formatY(max * 0.66)}</span>
                      <span>{formatY(max * 0.33)}</span>
                      <span>0</span>
                    </>
                  );
                })()}
              </div>

              <svg
                viewBox="0 0 320 160"
                style={{
                  width: '100%',
                  height: 180,
                  marginLeft: '25px',
                }}
              >
                <defs>
                  <linearGradient
                    id="ug"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#4b34a0"
                      stopOpacity="0.2"
                    />
                    <stop
                      offset="100%"
                      stopColor="#4b34a0"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>

                <line
                  x1="0"
                  y1="10"
                  x2="320"
                  y2="10"
                  stroke="#f3f4f6"
                  strokeWidth="1"
                />

                <line
                  x1="0"
                  y1="50"
                  x2="320"
                  y2="50"
                  stroke="#f3f4f6"
                  strokeWidth="1"
                />

                <line
                  x1="0"
                  y1="90"
                  x2="320"
                  y2="90"
                  stroke="#f3f4f6"
                  strokeWidth="1"
                />

                <line
                  x1="0"
                  y1="130"
                  x2="320"
                  y2="130"
                  stroke="#f3f4f6"
                  strokeWidth="1"
                />

                {(() => {
                  const max = Math.max(
                    1,
                    ...growth.map((item) => item.value),
                  );

                  const stepX =
                    300 / Math.max(1, growth.length - 1);

                  const points = growth.map((item, index) => {
                    const x = 10 + index * stepX;
                    const y = 130 - (item.value / max) * 110;

                    return { x, y };
                  });

                  const line = points
                    .map((point, index) =>
                      index === 0
                        ? `M${point.x},${point.y}`
                        : `L${point.x},${point.y}`,
                    )
                    .join(' ');

                  const lastPoint = points[points.length - 1];

                  const area = `${line} L${lastPoint.x},130 L${points[0].x},130 Z`;

                  return (
                    <>
                      <path d={area} fill="url(#ug)" />

                      <path
                        d={line}
                        stroke="#4b34a0"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      <circle
                        cx={lastPoint.x}
                        cy={lastPoint.y}
                        r="4"
                        fill="#4b34a0"
                        stroke="white"
                        strokeWidth="2"
                      />
                    </>
                  );
                })()}
              </svg>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginLeft: '25px',
                  marginTop: '8px',
                  fontSize: '11px',
                  color: '#9ca3af',
                }}
              >
                {growth.map((item, index) => (
                  <span key={index}>{item.label}</span>
                ))}
              </div>
            </div>
          ) : (
            <p className="ad-empty">No data yet.</p>
          )}
        </div>

        {/* Quick insights */}
        <div className="ad-panel">
          <div className="ad-panel-head">
            <h3>Quick insights</h3>
          </div>

          <div className="ad-insights">
            <div className="ad-insight">
              <Lightbulb size={14} />
              <span>
                VRI sessions completed up 22% this week.
              </span>
            </div>

            <div className="ad-insight">
              <Lightbulb size={14} />
              <span>
                Kampala accounts for 62% of active users.
              </span>
            </div>

            <div className="ad-insight">
              <Lightbulb size={14} />
              <span>
                Interpreter sign-ups increased by 13%.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Interpreter performance and verification status */}
      <div
        className="ad-row ad-row--bottom"
        style={{ alignItems: 'stretch' }}
      >
        {/* Interpreter performance */}
        <div className="ad-panel">
          <div className="ad-panel-head">
            <div>
              <h3 style={{ margin: 0 }}>
                Interpreter performance
              </h3>

              <small
                style={{
                  color: '#6b7280',
                  fontSize: '13px',
                }}
              >
                Average response time & session completion rate
              </small>
            </div>
          </div>

          {performance ? (
            <div
              style={{
                display: 'flex',
                gap: '16px',
                marginTop: '20px',
              }}
            >
              {/* Response time */}
              <div
                style={{
                  flex: 1,
                  background: '#f8fafc',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #f1f5f9',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      background: '#ede9fe',
                      color: '#6d28d9',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Clock size={20} />
                  </div>

                  <div>
                    <span
                      style={{
                        fontSize: '12px',
                        color: '#64748b',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Avg. response time
                    </span>

                    <h2
                      style={{
                        margin: '2px 0',
                        fontSize: '24px',
                        color: '#111827',
                      }}
                    >
                      {performance.avgResponseTime}
                    </h2>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: '12px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#16a34a',
                  }}
                >
                  ↑ {performance.responseTrend}{' '}

                  <span
                    style={{
                      color: '#9ca3af',
                      fontWeight: 400,
                    }}
                  >
                    vs. last 7 days
                  </span>
                </div>
              </div>

              {/* Completion rate */}
              <div
                style={{
                  flex: 1,
                  background: '#f8fafc',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #f1f5f9',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      background: '#dcfce7',
                      color: '#16a34a',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircle2 size={20} />
                  </div>

                  <div>
                    <span
                      style={{
                        fontSize: '12px',
                        color: '#64748b',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Session completion rate
                    </span>

                    <h2
                      style={{
                        margin: '2px 0',
                        fontSize: '24px',
                        color: '#111827',
                      }}
                    >
                      {performance.completionRate}
                    </h2>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: '12px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#16a34a',
                  }}
                >
                  ↑ {performance.completionTrend}{' '}

                  <span
                    style={{
                      color: '#9ca3af',
                      fontWeight: 400,
                    }}
                  >
                    vs. last 7 days
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="ad-empty">No data yet.</p>
          )}
        </div>

        {/* Verification status */}
        <div
          className="ad-panel"
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          <div className="ad-panel-head">
            <h3>Verification status</h3>
          </div>

          {verification ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                flex: 1,
              }}
            >
              <div className="ad-vbar">
                <span
                  style={{
                    width: getVerificationPercentage(
                      verification.approved,
                    ),
                    background: '#16a34a',
                  }}
                />

                <span
                  style={{
                    width: getVerificationPercentage(
                      verification.pending,
                    ),
                    background: '#f59e0b',
                  }}
                />

                <span
                  style={{
                    width: getVerificationPercentage(
                      verification.rejected,
                    ),
                    background: '#ef4444',
                  }}
                />

                <span
                  style={{
                    width: getVerificationPercentage(
                      verification.flagged,
                    ),
                    background: '#4b34a0',
                  }}
                />
              </div>

              <div
                className="ad-vlegend"
                style={{ marginTop: '24px' }}
              >
                <span>
                  <i style={{ background: '#16a34a' }} />
                  Approved · {verification.approved}
                </span>

                <span>
                  <i style={{ background: '#f59e0b' }} />
                  Pending · {verification.pending}
                </span>

                <span>
                  <i style={{ background: '#ef4444' }} />
                  Rejected · {verification.rejected}
                </span>

                <span>
                  <i style={{ background: '#4b34a0' }} />
                  Flagged · {verification.flagged}
                </span>
              </div>
            </div>
          ) : (
            <p className="ad-empty">No data yet.</p>
          )}
        </div>
      </div>

      {/* Upcoming sessions */}
      <div className="ad-panel">
        <div
          className="ad-panel-head"
          style={{ alignItems: 'center' }}
        >
          <div
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
            }}
          >
            <div style={{ color: '#4b34a0' }}>
              <Calendar size={20} />
            </div>

            <h3 style={{ margin: 0 }}>Upcoming sessions</h3>
          </div>

          <a
            href="/dashboard/admin/sessions"
            style={{
              color: '#4b34a0',
              fontWeight: 600,
              fontSize: '13px',
              textDecoration: 'none',
            }}
          >
            View all
          </a>
        </div>

        {filteredSessions && filteredSessions.length > 0 ? (
          <table className="ad-table">
            <thead>
              <tr>
                {[
                  'Time',
                  'User',
                  'Interpreter',
                  'Session type',
                  'Status',
                ].map((heading) => (
                  <th
                    key={heading}
                    style={{
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: '#9ca3af',
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredSessions.map((item) => {
                const typeLabel = item.type
                  ? item.type.charAt(0).toUpperCase() +
                    item.type.slice(1)
                  : '—';

                const status = statusStyle(item.status);

                return (
                  <tr key={item.id}>
                    <td
                      style={{
                        color: '#6b7280',
                        fontSize: '13px',
                      }}
                    >
                      {item.date}
                    </td>

                    <td
                      style={{
                        fontWeight: 600,
                        color: '#111827',
                        fontSize: '13px',
                      }}
                    >
                      {item.client}
                    </td>

                    <td
                      style={{
                        color: '#6b7280',
                        fontSize: '13px',
                      }}
                    >
                      {item.interpreter || '—'}
                    </td>

                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: '#f4f1fa',
                          color: '#4b34a0',
                          fontSize: '12px',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                        }}
                      >
                        {typeLabel}
                      </span>
                    </td>

                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: status.bg,
                          color: status.text,
                          fontSize: '12px',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="ad-empty">
            {sessions && sessions.length > 0 && searchTerm
              ? 'No sessions match your search.'
              : 'No upcoming sessions yet.'}
          </p>
        )}
      </div>
    </div>
  );
}

