// src/pages/admin/ReportsPage.tsx
import {
  Calendar,
  ChevronDown,
  Download,
  FileText,
  FlaskConical,
  Flag,
  LineChart as LineChartIcon,
  MoreVertical,
  ShieldCheck,
  Star,
  UserRound,
  Wallet,
} from 'lucide-react';
import './ReportsPage.css';

/* ---------------- Static data (API later) ---------------- */

const STATS = [
  {
    id: 'total',
    label: 'Total reports',
    value: '128',
    hint: 'vs last 30 days',
    delta: '+12%',
    up: true,
    icon: FileText,
  },
  {
    id: 'month',
    label: 'Reports this month',
    value: '24',
    hint: 'vs last month',
    delta: '+33%',
    up: true,
    icon: Calendar,
  },
  {
    id: 'scheduled',
    label: 'Scheduled reports',
    value: '6',
    hint: 'Scheduled and upcoming',
    icon: Calendar,
  },
  {
    id: 'last',
    label: 'Last generated',
    value: 'Today, 10:42 AM',
    hint: 'Monthly usage report',
    icon: Calendar,
  },
];

const RECENT = [
  {
    id: 'monthly-usage',
    name: 'Monthly usage report',
    generated: 'Sep 2026, 10:42 AM',
    by: 'Admin',
    status: 'Ready',
  },
  {
    id: 'qa',
    name: 'Session quality report',
    generated: 'May 2026, 03:15 PM',
    by: 'Admin',
    status: 'Ready',
  },
  {
    id: 'financial',
    name: 'Financial summary',
    generated: 'Aug 2026, 11:20 AM',
    by: 'Admin',
    status: 'Ready',
  },
  {
    id: 'activity',
    name: 'User activity report',
    generated: 'Jul 2026, 09:12 AM',
    by: 'Admin',
    status: 'Ready',
  },
  {
    id: 'verification',
    name: 'Verification report',
    generated: 'Jun 2026, 02:45 PM',
    by: 'Admin',
    status: 'Ready',
  },
];

const ACTIVITY_STATS = [
  { label: 'Users registered', value: '12,824', delta: '+12%' },
  { label: 'Active sessions', value: '3,421', delta: '+18%' },
  { label: 'Reports completed', value: '3,824', delta: '+8%' },
  { label: 'Sessions cancelled', value: '403', delta: '+2%' },
];

const CATEGORIES = [
  {
    id: 'usage',
    label: 'Usage reports',
    hint: 'Users, sessions and platform activity',
    icon: UserRound,
  },
  {
    id: 'quality',
    label: 'Quality reports',
    hint: 'Session quality and interpreter performance',
    icon: Star,
  },
  {
    id: 'verification',
    label: 'Verification reports',
    hint: 'Credentials, approvals and pending verification',
    icon: ShieldCheck,
  },
  {
    id: 'financial',
    label: 'Financial reports',
    hint: 'Payments, wallet and transaction summaries',
    icon: Wallet,
  },
  {
    id: 'institution',
    label: 'Institution reports',
    hint: 'Activity across organisations',
    icon: Flag,
  },
];

/* ---------------- Component ---------------- */

export function ReportsPage() {
  return (
    <div className="reports-page">
      {/* Header */}
      <header className="reports-header">
        <h1>Reports</h1>
        <p>Create and download platform usage, quality and financial reports.</p>
      </header>

      {/* Stat cards */}
      <section className="reports-stats">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <article className="reports-stat" key={s.id}>
              <div className="reports-stat__head">
                <span className="reports-stat__icon">
                  <Icon size={14} />
                </span>
                <span className="reports-stat__label">{s.label}</span>
              </div>
              <strong className="reports-stat__value">{s.value}</strong>
              <small className="reports-stat__hint">
                {s.delta && (
                  <span className={s.up ? 'reports-delta reports-delta--up' : 'reports-delta'}>
                    {s.up ? '↑' : '↓'} {s.delta}
                  </span>
                )}
                <span>{s.hint}</span>
              </small>
            </article>
          );
        })}
      </section>

      {/* Generate report + Recent reports */}
      <section className="reports-row reports-row--top">
        <article className="reports-panel">
          <header className="reports-panel__head">
            <div>
              <h2>Generate report</h2>
              <p>Select the information and period to include.</p>
            </div>
          </header>

          <div className="reports-form">
            <div className="reports-form__grid">
              <label className="reports-field">
                <span>Report type</span>
                <button type="button" className="reports-select">
                  Platform usage <ChevronDown size={14} />
                </button>
              </label>

              <label className="reports-field">
                <span>Date range</span>
                <button type="button" className="reports-select">
                  Last 30 days <ChevronDown size={14} />
                </button>
              </label>

              <label className="reports-field reports-field--full">
                <span>Institution</span>
                <button type="button" className="reports-select">
                  All institutions <ChevronDown size={14} />
                </button>
              </label>
            </div>

            <div className="reports-field">
              <span>File format</span>
              <div className="reports-pillgroup">
                <button type="button" className="reports-pill reports-pill--active">
                  <FileText size={14} /> PDF
                </button>
                <button type="button" className="reports-pill">
                  <FileText size={14} /> Excel
                </button>
                <button type="button" className="reports-pill">
                  <FileText size={14} /> CSV
                </button>
              </div>
            </div>

            <div className="reports-actions">
              <button type="button" className="reports-btn reports-btn--primary">
                <LineChartIcon size={15} /> Generate report
              </button>
              <button type="button" className="reports-btn reports-btn--ghost">
                <FlaskConical size={15} /> Preview report
              </button>
            </div>
          </div>
        </article>

        <article className="reports-panel">
          <header className="reports-panel__head">
            <div>
              <h2>Recent reports</h2>
              <p>Generated by administrators</p>
            </div>
            <button type="button" className="reports-link">
              View all reports
            </button>
          </header>

          <div className="reports-table">
            <div className="reports-table__head">
              <span>REPORT NAME</span>
              <span>GENERATED</span>
              <span>GENERATED BY</span>
              <span>STATUS</span>
              <span>ACTION</span>
            </div>

            {RECENT.map((r) => (
              <div className="reports-table__row" key={r.id}>
                <span className="reports-table__name">
                  <FileText size={14} />
                  <span>{r.name}</span>
                </span>
                <span className="reports-table__muted">{r.generated}</span>
                <span className="reports-table__muted">{r.by}</span>
                <span className="reports-badge reports-badge--ready">
                  <i /> {r.status}
                </span>
                <span className="reports-table__actions">
                  <button type="button" className="reports-icon-btn" aria-label="Download">
                    <Download size={14} />
                  </button>
                  <button type="button" className="reports-icon-btn" aria-label="More">
                    <MoreVertical size={14} />
                  </button>
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* Platform activity + Report categories */}
      <section className="reports-row reports-row--bottom">
        <article className="reports-panel">
          <header className="reports-panel__head">
            <div>
              <h2>Platform activity</h2>
            </div>
            <button type="button" className="reports-select reports-select--small">
              Last 30 days <ChevronDown size={14} />
            </button>
          </header>

          <div className="reports-activity-stats">
            {ACTIVITY_STATS.map((a) => (
              <div key={a.label} className="reports-activity-stat">
                <strong>{a.value}</strong>
                <small>{a.label}</small>
                <span className="reports-delta reports-delta--up">{a.delta}</span>
              </div>
            ))}
          </div>

          {/* Simple SVG line chart — no library */}
          <div className="reports-chart">
            <svg
              viewBox="0 0 640 180"
              preserveAspectRatio="none"
              role="img"
              aria-label="Sessions completed and cancelled"
            >
              <defs>
                <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4b34a0" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#4b34a0" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,120 C60,110 100,90 160,100 C220,110 260,70 320,80 C380,90 420,50 480,60 C540,70 600,40 640,50 L640,180 L0,180 Z"
                fill="url(#activityFill)"
              />
              <path
                d="M0,120 C60,110 100,90 160,100 C220,110 260,70 320,80 C380,90 420,50 480,60 C540,70 600,40 640,50"
                stroke="#4b34a0"
                strokeWidth="2.5"
                fill="none"
              />
              <path
                d="M0,150 C60,145 100,140 160,142 C220,145 260,135 320,138 C380,142 420,128 480,132 C540,138 600,120 640,126"
                stroke="#a5a2b5"
                strokeWidth="2"
                fill="none"
                strokeDasharray="4 4"
              />
            </svg>

            <div className="reports-chart__legend">
              <span>
                <i className="reports-legend-dot reports-legend-dot--done" /> Sessions completed
              </span>
              <span>
                <i className="reports-legend-dot reports-legend-dot--cancel" /> Sessions cancelled
              </span>
            </div>

            <div className="reports-chart__xaxis">
              {['Sep 1', 'Sep 5', 'Sep 10', 'Sep 15', 'Sep 20', 'Sep 25', 'Sep 30'].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
          </div>
        </article>

        <article className="reports-panel">
          <header className="reports-panel__head">
            <div>
              <h2>Report categories</h2>
            </div>
          </header>

          <ul className="reports-categories">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              return (
                <li key={c.id} className="reports-category">
                  <span className="reports-category__icon">
                    <Icon size={16} />
                  </span>
                  <div className="reports-category__text">
                    <strong>{c.label}</strong>
                    <small>{c.hint}</small>
                  </div>
                  <span className="reports-category__arrow" aria-hidden="true">
                    ›
                  </span>
                </li>
              );
            })}
          </ul>
        </article>
      </section>
    </div>
  );
}
