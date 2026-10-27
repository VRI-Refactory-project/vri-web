// src/pages/admin/ReportsPage.tsx
import { useEffect, useState } from 'react';
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
import {
  fetchAdminReportActivity,
  fetchAdminReportStats,
  fetchAdminReports,
  type AdminReport,
  type AdminReportActivity,
  type AdminReportStats,
} from '../../services/adminReports';
import { describeError } from '../../services/api';
import './ReportsPage.css';

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

export function ReportsPage() {
  const [stats, setStats] = useState<AdminReportStats | null>(null);
  const [reports, setReports] = useState<AdminReport[] | null>(null);
  const [activity, setActivity] = useState<AdminReportActivity | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchAdminReportStats(), fetchAdminReports(), fetchAdminReportActivity()])
      .then(([s, list, a]) => {
        if (cancelled) return;
        setStats(s);
        setReports(list);
        setActivity(a);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(describeError(err));
        setReports([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loading = reports === null;
  const isEmpty = !loading && reports.length === 0;

  return (
    <div className="reports-page">
      <header className="reports-header">
        <h1>Reports</h1>
        <p>Create and download platform usage, quality and financial reports.</p>
      </header>

      <section className="reports-stats">
        <article className="reports-stat">
          <div className="reports-stat__head">
            <span className="reports-stat__icon">
              <FileText size={14} />
            </span>
            <span className="reports-stat__label">Total reports</span>
          </div>
          <strong className="reports-stat__value">{stats?.totalReports ?? 0}</strong>
          <small className="reports-stat__hint">
            <span className="reports-delta reports-delta--up">
              +{stats?.totalDeltaPercent ?? 0}%
            </span>{' '}
            <span>vs last 30 days</span>
          </small>
        </article>

        <article className="reports-stat">
          <div className="reports-stat__head">
            <span className="reports-stat__icon">
              <Calendar size={14} />
            </span>
            <span className="reports-stat__label">Reports this month</span>
          </div>
          <strong className="reports-stat__value">{stats?.reportsThisMonth ?? 0}</strong>
          <small className="reports-stat__hint">
            <span className="reports-delta reports-delta--up">
              +{stats?.monthDeltaPercent ?? 0}%
            </span>{' '}
            <span>vs last month</span>
          </small>
        </article>

        <article className="reports-stat">
          <div className="reports-stat__head">
            <span className="reports-stat__icon">
              <Calendar size={14} />
            </span>
            <span className="reports-stat__label">Scheduled reports</span>
          </div>
          <strong className="reports-stat__value">{stats?.scheduledReports ?? 0}</strong>
          <small className="reports-stat__hint">Scheduled and upcoming</small>
        </article>

        <article className="reports-stat">
          <div className="reports-stat__head">
            <span className="reports-stat__icon">
              <Calendar size={14} />
            </span>
            <span className="reports-stat__label">Last generated</span>
          </div>
          <strong className="reports-stat__value" style={{ fontSize: 16 }}>
            {stats?.lastGeneratedLabel || '—'}
          </strong>
          <small className="reports-stat__hint">Monthly usage report</small>
        </article>
      </section>

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

            {loading ? (
              <p className="reports-empty">Loading reports…</p>
            ) : isEmpty ? (
              <p className="reports-empty">
                {error ? `Could not load reports: ${error}` : 'No reports yet.'}
              </p>
            ) : (
              reports.map((r) => (
                <div className="reports-table__row" key={r.id}>
                  <span className="reports-table__name">
                    <FileText size={14} />
                    <span>{r.name}</span>
                  </span>
                  <span className="reports-table__muted">{r.generatedAt}</span>
                  <span className="reports-table__muted">{r.generatedBy}</span>
                  <span className={`reports-badge reports-badge--${r.status}`}>
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
              ))
            )}
          </div>
        </article>
      </section>

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
            <div className="reports-activity-stat">
              <strong>{activity?.usersRegistered ?? 0}</strong>
              <small>Users registered</small>
              <span className="reports-delta reports-delta--up">
                +{activity?.usersDeltaPercent ?? 0}%
              </span>
            </div>
            <div className="reports-activity-stat">
              <strong>{activity?.activeSessions ?? 0}</strong>
              <small>Active sessions</small>
              <span className="reports-delta reports-delta--up">
                +{activity?.sessionsDeltaPercent ?? 0}%
              </span>
            </div>
            <div className="reports-activity-stat">
              <strong>{activity?.reportsCompleted ?? 0}</strong>
              <small>Reports completed</small>
              <span className="reports-delta reports-delta--up">
                +{activity?.reportsDeltaPercent ?? 0}%
              </span>
            </div>
            <div className="reports-activity-stat">
              <strong>{activity?.sessionsCancelled ?? 0}</strong>
              <small>Sessions cancelled</small>
              <span className="reports-delta">+{activity?.cancelledDeltaPercent ?? 0}%</span>
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
                  <span className="reports-category__arrow">›</span>
                </li>
              );
            })}
          </ul>
        </article>
      </section>
    </div>
  );
}
