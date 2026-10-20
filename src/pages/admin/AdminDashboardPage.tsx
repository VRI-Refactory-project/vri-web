// src/pages/admin/AdminDashboardPage.tsx
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
  MapPin,
  Lightbulb,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  fetchAdminSummary,
  fetchSessionActivity,
  fetchSessionTypes,
  fetchActivityFeed,
  fetchTopLocations,
  fetchUserGrowth,
  fetchInterpreterPerformance,
  fetchVerificationStatus,
  fetchUpcomingSessions,
  type AdminDashboardSummary,
  type SessionActivityPoint,
  type SessionTypesBreakdown,
  type ActivityItem,
  type LocationItem,
  type GrowthPoint,
  type InterpreterPerformance,
  type VerificationStatusBreakdown,
  type SessionRow,
} from '../../services/admin';
import './AdminDashboardPage.css';

const KPI_META = [
  { id: 'total-users', label: 'Total Users', trend: 'up' as const, Icon: Users },
  { id: 'dhh', label: 'DHH Users', trend: 'up' as const, Icon: Users },
  { id: 'institutions', label: 'Institutions', trend: 'up' as const, Icon: Building2 },
  { id: 'interpreters', label: 'Interpreters', trend: 'up' as const, Icon: Video },
  { id: 'pending', label: 'Pending Verifications', trend: 'down' as const, Icon: ShieldCheck },
];

function todayLabel() {
  return new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function AdminDashboardPage() {
  const { session } = useAuth();
  const name = session?.user.name ?? 'Admin';
  const role = session?.user.role ?? 'admin';
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [activity, setActivity] = useState<SessionActivityPoint[] | null>(null);
  const [types, setTypes] = useState<SessionTypesBreakdown | null>(null);
  const [feed, setFeed] = useState<ActivityItem[] | null>(null);
  const [locations, setLocations] = useState<LocationItem[] | null>(null);
  const [growth, setGrowth] = useState<GrowthPoint[] | null>(null);
  const [performance, setPerformance] = useState<InterpreterPerformance | null>(null);
  const [verification, setVerification] = useState<VerificationStatusBreakdown | null>(null);
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [query, setQuery] = useState('');
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchAdminSummary()
      .then(setSummary)
      .catch(() => setSummary(null));
    fetchSessionActivity()
      .then(setActivity)
      .catch(() => setActivity([]));
    fetchSessionTypes()
      .then(setTypes)
      .catch(() => setTypes(null));
    fetchActivityFeed()
      .then(setFeed)
      .catch(() => setFeed([]));
    fetchTopLocations()
      .then(setLocations)
      .catch(() => setLocations([]));
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
  }, []);

  useEffect(() => {
    if (!bellOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [bellOpen]);

  const kpiValues: Record<string, string> = {
    'total-users': (summary?.totalUsers ?? 0).toLocaleString(),
    dhh: (summary?.dhhUsers ?? 0).toLocaleString(),
    institutions: (summary?.institutions ?? 0).toLocaleString(),
    interpreters: (summary?.interpreters ?? 0).toLocaleString(),
    pending: (summary?.pendingVerifications ?? 0).toLocaleString(),
  };

  const totalSessions = types?.total ?? 0;
  const vriPct = totalSessions ? Math.round(((types?.vri ?? 0) / totalSessions) * 100) : 0;
  const onsitePct = totalSessions ? Math.round(((types?.onsite ?? 0) / totalSessions) * 100) : 0;
  const donutBg = `conic-gradient(#4b34a0 0 ${vriPct}%, #16a34a ${vriPct}% ${vriPct + onsitePct}%, #cbd5e1 ${vriPct + onsitePct}% 100%)`;

  const vTotal = verification?.total ?? 0;
  const bar = (n: number) => (vTotal ? `${Math.round((n / vTotal) * 100)}%` : '0%');

  const needle = query.trim().toLowerCase();

  const filteredFeed = useMemo(() => {
    if (!feed) return feed;
    if (!needle) return feed;
    return feed.filter((a) => a.text.toLowerCase().includes(needle));
  }, [feed, needle]);

  const filteredSessions = useMemo(() => {
    if (!sessions) return sessions;
    if (!needle) return sessions;
    return sessions.filter((s) =>
      [s.id, s.client, s.interpreter, s.type, s.status].some((v) =>
        v.toLowerCase().includes(needle),
      ),
    );
  }, [sessions, needle]);

  return (
    <div className="ad-page">
      {/* Top bar */}
      <div className="ad-topbar">
        <div className="ad-search">
          <Search size={16} aria-hidden="true" />
          <input
            placeholder="Search sessions or activity..."
            aria-label="Search sessions or activity"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="ad-actions">
          <button type="button" className="ad-date">
            <Calendar size={15} /> <span>{todayLabel()}</span>
          </button>

          <div className="ad-bell-wrap" ref={bellRef}>
            <button
              type="button"
              className="ad-icon-btn"
              aria-label="Notifications"
              onClick={() => setBellOpen((v) => !v)}
            >
              <Bell size={17} />
              {feed && feed.length > 0 && <span className="ad-dot" />}
            </button>
            {bellOpen && (
              <div className="ad-bell-panel" role="dialog" aria-label="Notifications">
                <div className="ad-bell-header">Notifications</div>
                {feed && feed.length > 0 ? (
                  <ul className="ad-bell-list">
                    {feed.slice(0, 6).map((a, i) => (
                      <li key={i}>
                        <span className="ad-bell-dot" />
                        <div>
                          <strong>{a.text}</strong>
                          <small>{a.time}</small>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="ad-bell-empty">No notifications yet.</p>
                )}
              </div>
            )}
          </div>

          <button type="button" className="ad-user">
            <span className="ad-avatar">{initial}</span>
            <span className="ad-user-text">
              <strong>{name}</strong>
              <small>{role.charAt(0).toUpperCase() + role.slice(1)}</small>
            </span>
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="ad-title">
        <h1>Admin dashboard</h1>
        <p>Here's what's happening today.</p>
      </div>

      {/* KPI cards */}
      <div className="ad-kpis">
        {KPI_META.map(({ id, label, trend, Icon }) => (
          <div key={id} className="ad-kpi">
            <div className="ad-kpi-head">
              <span className="ad-kpi-icon">
                <Icon size={14} />
              </span>
              <span>{label}</span>
            </div>
            <div className="ad-kpi-value">{kpiValues[id] ?? '0'}</div>
            <div className={`ad-kpi-delta ad-kpi-delta--${trend}`}></div>
          </div>
        ))}
      </div>

      {/* Row: Session activity | Session types | Recent activity */}
      <div className="ad-row ad-row--top">
        <div className="ad-panel">
          <div className="ad-panel-head">
            <h3>Session activity</h3>
            <small>Last 7 days</small>
          </div>
          {activity && activity.length > 0 ? (
            <div className="ad-bars">
              {activity.map((b) => {
                const max = Math.max(1, ...activity.map((x) => x.value));
                return (
                  <div key={b.label}>
                    <div className="ad-bar" style={{ height: `${(b.value / max) * 100}%` }} />
                    <span className="ad-bar-label">{b.label}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="ad-empty">No data yet.</p>
          )}
        </div>

        <div className="ad-panel">
          <div className="ad-panel-head">
            <h3>Session types</h3>
          </div>
          {types ? (
            <div className="ad-donut-wrap">
              <div className="ad-donut" style={{ background: donutBg }}>
                <div className="ad-donut-hole">
                  <strong>{totalSessions}</strong>
                  <small>Total</small>
                </div>
              </div>
              <div className="ad-legend">
                <div>
                  <span className="ad-legend-dot" style={{ background: '#4b34a0' }} />
                  Video call (VRI) · {types.vri}
                </div>
                <div>
                  <span className="ad-legend-dot" style={{ background: '#16a34a' }} />
                  On-site · {types.onsite}
                </div>
                <div>
                  <span className="ad-legend-dot" style={{ background: '#cbd5e1' }} />
                  Still waiting · {types.pending}
                </div>
              </div>
            </div>
          ) : (
            <p className="ad-empty">No data yet.</p>
          )}
        </div>

        <div className="ad-panel">
          <div className="ad-panel-head">
            <h3>Recent activity</h3>
          </div>
          {filteredFeed && filteredFeed.length > 0 ? (
            <div className="ad-feed">
              {filteredFeed.map((a, i) => (
                <div key={i} className="ad-feed-item">
                  <span className="ad-feed-dot" />
                  <span>{a.text}</span>
                  <span className="ad-feed-time">{a.time}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="ad-empty">
              {feed && feed.length > 0 && needle
                ? 'No activity matches your search.'
                : 'No data yet.'}
            </p>
          )}
        </div>
      </div>

      {/* Row: Top locations | User growth | Quick insights */}
      <div className="ad-row ad-row--mid">
        <div className="ad-panel">
          <div className="ad-panel-head">
            <h3>Top locations</h3>
            <small>Users</small>
          </div>
          {locations && locations.length > 0 ? (
            <div className="ad-locations">
              {locations.map((l) => (
                <div key={l.label}>
                  <div className="ad-loc-row">
                    <span>
                      <MapPin size={12} /> {l.label}
                    </span>
                    <span>{l.value}</span>
                  </div>
                  <div className="ad-loc-bar">
                    <span style={{ width: `${l.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="ad-empty">No data yet.</p>
          )}
        </div>

        <div className="ad-panel">
          <div className="ad-panel-head">
            <h3>User growth</h3>
            <small>Last 8 months</small>
          </div>
          {growth && growth.length > 1 ? (
            <svg viewBox="0 0 320 140" style={{ width: '100%', height: 160 }}>
              <defs>
                <linearGradient id="ug" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4b34a0" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#4b34a0" stopOpacity="0" />
                </linearGradient>
              </defs>
              {(() => {
                const max = Math.max(1, ...growth.map((g) => g.value));
                const stepX = 300 / Math.max(1, growth.length - 1);
                const points = growth.map((g, i) => {
                  const x = 10 + i * stepX;
                  const y = 130 - (g.value / max) * 110;
                  return { x, y };
                });
                const line = points
                  .map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`))
                  .join(' ');
                const area = `${line} L${points[points.length - 1].x},130 L${points[0].x},130 Z`;
                return (
                  <>
                    <path d={area} fill="url(#ug)" />
                    <path d={line} stroke="#4b34a0" strokeWidth="2.5" fill="none" />
                  </>
                );
              })()}
            </svg>
          ) : (
            <p className="ad-empty">No data yet.</p>
          )}
        </div>

        <div className="ad-panel">
          <div className="ad-panel-head">
            <h3>Quick insights</h3>
          </div>
          <div className="ad-insights">
            <div className="ad-insight">
              <Lightbulb size={14} />
              <span>
                {summary
                  ? `${summary.pendingVerifications} interpreter verification${summary.pendingVerifications === 1 ? '' : 's'} pending.`
                  : 'Insights will appear once data is available.'}
              </span>
            </div>
            <div className="ad-insight">
              <Lightbulb size={14} />
              <span>
                {summary
                  ? `${summary.institutions} institution${summary.institutions === 1 ? '' : 's'} in the platform.`
                  : 'Insights will appear once data is available.'}
              </span>
            </div>
            <div className="ad-insight">
              <Lightbulb size={14} />
              <span>
                {summary
                  ? `${summary.interpreters} interpreter${summary.interpreters === 1 ? '' : 's'} registered.`
                  : 'Insights will appear once data is available.'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row: Interpreter performance | Verification status */}
      <div className="ad-row ad-row--bottom">
        <div className="ad-panel">
          <div className="ad-panel-head">
            <h3>Interpreter performance</h3>
            <small>Avg. session duration</small>
          </div>
          {performance ? (
            <>
              <div className="ad-metric">
                <span>Sessions this week</span>
                <strong>{performance.sessionsThisWeek}</strong>
              </div>
              <div className="ad-metric">
                <span>Avg. duration</span>
                <strong>{performance.avgDuration}</strong>
              </div>
              <div className="ad-metric">
                <span>Completion rate</span>
                <strong>{performance.completionRate}</strong>
              </div>
            </>
          ) : (
            <p className="ad-empty">No data yet.</p>
          )}
        </div>

        <div className="ad-panel">
          <div className="ad-panel-head">
            <h3>Verification status</h3>
          </div>
          {verification ? (
            <>
              <div className="ad-vbar">
                <span style={{ width: bar(verification.approved), background: '#16a34a' }} />
                <span style={{ width: bar(verification.pending), background: '#f59e0b' }} />
                <span style={{ width: bar(verification.rejected), background: '#ef4444' }} />
                <span style={{ width: bar(verification.flagged), background: '#4b34a0' }} />
              </div>
              <div className="ad-vlegend">
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
            </>
          ) : (
            <p className="ad-empty">No data yet.</p>
          )}
        </div>
      </div>

      {/* Upcoming sessions */}
      <div className="ad-panel">
        <div className="ad-panel-head">
          <h3>Upcoming sessions</h3>
          <small>Next 24 hours</small>
        </div>
        {filteredSessions && filteredSessions.length > 0 ? (
          <table className="ad-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date / Time</th>
                <th>Client</th>
                <th>Interpreter</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.date}</td>
                  <td>{s.client}</td>
                  <td>{s.interpreter}</td>
                  <td>{s.type}</td>
                  <td>
                    <span className={`ad-badge ad-badge--${s.status.toLowerCase()}`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="ad-empty">
            {sessions && sessions.length > 0 && needle
              ? 'No sessions match your search.'
              : 'No upcoming sessions yet.'}
          </p>
        )}
      </div>
    </div>
  );
}
