// src/pages/admin/AdminDashboardPage.tsx
import { useEffect, useState } from 'react';
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
import { fetchAdminSummary, type AdminDashboardSummary } from '../../services/admin';
import './AdminDashboardPage.css';

const KPIS = [
  {
    id: 'total-users',
    label: 'Total Users',
    value: '12,824',
    delta: '+12%',
    trend: 'up' as const,
    Icon: Users,
  },
  {
    id: 'dhh',
    label: 'DHH Users',
    value: '7,046',
    delta: '+8%',
    trend: 'up' as const,
    Icon: Users,
  },
  {
    id: 'institutions',
    label: 'Institutions',
    value: '3,824',
    delta: '+4%',
    trend: 'up' as const,
    Icon: Building2,
  },
  {
    id: 'interpreters',
    label: 'Interpreters',
    value: '1,984',
    delta: '+18%',
    trend: 'up' as const,
    Icon: Video,
  },
  {
    id: 'pending',
    label: 'Pending Verifications',
    value: '984',
    delta: '-3%',
    trend: 'down' as const,
    Icon: ShieldCheck,
  },
];

const BARS = [
  { d: 'Mon', h: 42 },
  { d: 'Tue', h: 58 },
  { d: 'Wed', h: 47 },
  { d: 'Thu', h: 68 },
  { d: 'Fri', h: 74 },
  { d: 'Sat', h: 39 },
  { d: 'Sun', h: 52 },
];

const ACTIVITY = [
  { text: 'New interpreter registered', time: '5m ago' },
  { text: 'UBS assignment completed', time: '12m ago' },
  { text: 'New user registration', time: '25m ago' },
  { text: 'Institution verified', time: '45m ago' },
  { text: 'Verification requested', time: '1h ago' },
  { text: 'New support ticket created', time: '2h ago' },
];

const LOCATIONS = [
  { label: 'Kampala', value: 152, pct: 60 },
  { label: 'Wakiso', value: 128, pct: 52 },
  { label: 'Mbarara', value: 95, pct: 38 },
  { label: 'Other Regions', value: 60, pct: 24 },
];

const SESSIONS = [
  {
    id: 'S-1042',
    date: 'Today, 11:30 AM',
    client: 'Grace Nakato (DHH)',
    interpreter: 'Musa Kato',
    type: 'VRI',
    status: 'Scheduled',
  },
  {
    id: 'S-1041',
    date: 'Today, 2:00 PM',
    client: 'John Ssemakula (DHH)',
    interpreter: 'Sarah Nakato',
    type: 'On-site',
    status: 'Pending',
  },
  {
    id: 'S-1040',
    date: 'Tomorrow, 9:00 AM',
    client: 'Daniel Gombe (DHH)',
    interpreter: 'Moses Ochieng',
    type: 'VRI',
    status: 'Scheduled',
  },
  {
    id: 'S-1039',
    date: 'Tomorrow, 10:30 AM',
    client: 'Michael Tumusiime (DHH)',
    interpreter: 'Grace Atim',
    type: 'VRI',
    status: 'Completed',
  },
];

export function AdminDashboardPage() {
  const { session } = useAuth();
  const name = session?.user.name ?? 'Admin';
  const role = session?.user.role ?? 'admin';
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);

  useEffect(() => {
    fetchAdminSummary()
      .then(setSummary)
      .catch(() => setSummary(null));
  }, []);

  const kpis = KPIS.map((k) => {
    if (!summary) return k;
    const value =
      k.id === 'total-users'
        ? summary.totalUsers.toLocaleString()
        : k.id === 'dhh'
          ? summary.dhhUsers.toLocaleString()
          : k.id === 'institutions'
            ? summary.institutions.toLocaleString()
            : k.id === 'interpreters'
              ? summary.interpreters.toLocaleString()
              : k.id === 'pending'
                ? summary.pendingVerifications.toLocaleString()
                : k.value;
    return { ...k, value };
  });

  return (
    <div className="ad-page">
      {/* Top bar */}
      <div className="ad-topbar">
        <div className="ad-search">
          <Search size={16} aria-hidden="true" />
          <input placeholder="Search name, organization, country..." aria-label="Search" />
        </div>
        <div className="ad-actions">
          <button type="button" className="ad-date">
            <Calendar size={15} /> <span>Sep 29/2025 - Oct 5, 2025</span>
          </button>
          <button type="button" className="ad-icon-btn" aria-label="Notifications">
            <Bell size={17} />
            <span className="ad-dot" />
          </button>
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
        {kpis.map(({ id, label, value, delta, trend, Icon }) => (
          <div key={id} className="ad-kpi">
            <div className="ad-kpi-head">
              <span className="ad-kpi-icon">
                <Icon size={14} />
              </span>
              <span>{label}</span>
            </div>
            <div className="ad-kpi-value">{value}</div>
            <div className={`ad-kpi-delta ad-kpi-delta--${trend}`}>{delta}</div>
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
          <div className="ad-bars">
            {BARS.map((b) => (
              <div key={b.d}>
                <div className="ad-bar" style={{ height: `${b.h}%` }} />
                <span className="ad-bar-label">{b.d}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ad-panel">
          <div className="ad-panel-head">
            <h3>Session types</h3>
          </div>
          <div className="ad-donut-wrap">
            <div
              className="ad-donut"
              style={{
                background: 'conic-gradient(#4b34a0 0 45%, #16a34a 45% 82%, #cbd5e1 82% 100%)',
              }}
            >
              <div className="ad-donut-hole">
                <strong>892</strong>
                <small>Total</small>
              </div>
            </div>
            <div className="ad-legend">
              <div>
                <span className="ad-legend-dot" style={{ background: '#4b34a0' }} />
                Video call (VRI)
              </div>
              <div>
                <span className="ad-legend-dot" style={{ background: '#16a34a' }} />
                On-site
              </div>
              <div>
                <span className="ad-legend-dot" style={{ background: '#cbd5e1' }} />
                Still waiting
              </div>
            </div>
          </div>
        </div>

        <div className="ad-panel">
          <div className="ad-panel-head">
            <h3>Recent activity</h3>
          </div>
          <div className="ad-feed">
            {ACTIVITY.map((a, i) => (
              <div key={i} className="ad-feed-item">
                <span className="ad-feed-dot" />
                <span>{a.text}</span>
                <span className="ad-feed-time">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row: Top locations | User growth | Quick insights */}
      <div className="ad-row ad-row--mid">
        <div className="ad-panel">
          <div className="ad-panel-head">
            <h3>Top locations</h3>
            <small>Users</small>
          </div>
          <div className="ad-locations">
            {LOCATIONS.map((l) => (
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
        </div>

        <div className="ad-panel">
          <div className="ad-panel-head">
            <h3>User growth</h3>
            <small>Last 8 months</small>
          </div>
          <svg viewBox="0 0 320 140" style={{ width: '100%', height: 160 }}>
            <defs>
              <linearGradient id="ug" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4b34a0" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#4b34a0" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M10,110 C50,95 80,70 120,80 C160,90 190,40 230,45 C270,50 300,25 310,20 L310,130 L10,130 Z"
              fill="url(#ug)"
            />
            <path
              d="M10,110 C50,95 80,70 120,80 C160,90 190,40 230,45 C270,50 300,25 310,20"
              stroke="#4b34a0"
              strokeWidth="2.5"
              fill="none"
            />
          </svg>
        </div>

        <div className="ad-panel">
          <div className="ad-panel-head">
            <h3>Quick insights</h3>
          </div>
          <div className="ad-insights">
            <div className="ad-insight">
              <Lightbulb size={14} />
              <span>VRI sessions completed up 22% this week.</span>
            </div>
            <div className="ad-insight">
              <Lightbulb size={14} />
              <span>Kampala accounts for 62% of active users.</span>
            </div>
            <div className="ad-insight">
              <Lightbulb size={14} />
              <span>Interpreter sign-ups increased by 13%.</span>
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
          <div className="ad-metric">
            <span>Sessions this week</span>
            <strong>342</strong>
          </div>
          <div className="ad-metric">
            <span>Avg. duration</span>
            <strong>2h 34m</strong>
          </div>
          <div className="ad-metric">
            <span>Completion rate</span>
            <strong>96%</strong>
          </div>
        </div>

        <div className="ad-panel">
          <div className="ad-panel-head">
            <h3>Verification status</h3>
          </div>
          <div className="ad-vbar">
            <span style={{ width: '42%', background: '#16a34a' }} />
            <span style={{ width: '28%', background: '#f59e0b' }} />
            <span style={{ width: '16%', background: '#ef4444' }} />
            <span style={{ width: '14%', background: '#4b34a0' }} />
          </div>
          <div className="ad-vlegend">
            <span>
              <i style={{ background: '#16a34a' }} />
              Approved · 1,842
            </span>
            <span>
              <i style={{ background: '#f59e0b' }} />
              Pending · 984
            </span>
            <span>
              <i style={{ background: '#ef4444' }} />
              Rejected · 42
            </span>
            <span>
              <i style={{ background: '#4b34a0' }} />
              Flagged · 28
            </span>
          </div>
        </div>
      </div>

      {/* Upcoming sessions */}
      <div className="ad-panel">
        <div className="ad-panel-head">
          <h3>Upcoming sessions</h3>
          <small>Next 24 hours</small>
        </div>
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
            {SESSIONS.map((s) => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{s.date}</td>
                <td>{s.client}</td>
                <td>{s.interpreter}</td>
                <td>{s.type}</td>
                <td>
                  <span className={`ad-badge ad-badge--${s.status.toLowerCase()}`}>{s.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
