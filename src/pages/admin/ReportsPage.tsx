// src/pages/admin/ReportsPage.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
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
  createAdminReport,
  fetchAdminReportActivity,
  fetchAdminReportOptions,
  fetchAdminReportStats,
  fetchAdminReports,
  type AdminReport,
  type AdminReportActivity,
  type AdminReportStats,
  type ReportOption,
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

type FileFormat = 'pdf' | 'excel' | 'csv';

export function ReportsPage() {
  const [stats, setStats] = useState<AdminReportStats | null>(null);
  const [reports, setReports] = useState<AdminReport[] | null>(null);
  const [activity, setActivity] = useState<AdminReportActivity | null>(null);
  const [error, setError] = useState('');

  const [reportTypes, setReportTypes] = useState<ReportOption[]>([]);
  const [dateRanges, setDateRanges] = useState<ReportOption[]>([]);
  const [institutions, setInstitutions] = useState<ReportOption[]>([]);
  const [optionsLoaded, setOptionsLoaded] = useState(false);

  const [reportType, setReportType] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [institution, setInstitution] = useState('');
  const [format, setFormat] = useState<FileFormat>('pdf');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchAdminReportStats(),
      fetchAdminReports(),
      fetchAdminReportActivity(),
      fetchAdminReportOptions(),
    ])
      .then(([s, list, a, options]) => {
        if (cancelled) return;
        setStats(s);
        setReports(list);
        setActivity(a);
        setReportTypes(options.reportTypes);
        setDateRanges(options.dateRanges);
        setInstitutions(options.institutions);
        setReportType(options.reportTypes[0]?.value ?? '');
        setDateRange(options.dateRanges[0]?.value ?? '');
        setInstitution(options.institutions[0]?.value ?? '');
        setOptionsLoaded(true);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(describeError(err));
        setReports([]);
        setOptionsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loading = reports === null;
  const isEmpty = !loading && reports.length === 0;
  const canGenerate = Boolean(reportType && dateRange && institution) && !generating;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    setError('');
    try {
      const created = await createAdminReport({ reportType, dateRange, institution, format });
      setReports((current) => (current ? [created, ...current] : [created]));
    } catch (err) {
      setError(describeError(err));
    } finally {
      setGenerating(false);
    }
  };

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
                <select
                  className="reports-select"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  disabled={!optionsLoaded || reportTypes.length === 0}
                >
                  {reportTypes.length === 0 ? (
                    <option value="">No options available</option>
                  ) : (
                    reportTypes.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))
                  )}
                </select>
              </label>

              <label className="reports-field">
                <span>Date range</span>
                <select
                  className="reports-select"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  disabled={!optionsLoaded || dateRanges.length === 0}
                >
                  {dateRanges.length === 0 ? (
                    <option value="">No options available</option>
                  ) : (
                    dateRanges.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))
                  )}
                </select>
              </label>

              <label className="reports-field reports-field--full">
                <span>Institution</span>
                <select
                  className="reports-select"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  disabled={!optionsLoaded || institutions.length === 0}
                >
                  {institutions.length === 0 ? (
                    <option value="">No institutions available</option>
                  ) : (
                    institutions.map((i) => (
                      <option key={i.value} value={i.value}>
                        {i.label}
                      </option>
                    ))
                  )}
                </select>
              </label>
            </div>

            <div className="reports-field">
              <span>File format</span>
              <div className="reports-pillgroup">
                <button
                  type="button"
                  className={`reports-pill ${format === 'pdf' ? 'reports-pill--active' : ''}`}
                  onClick={() => setFormat('pdf')}
                >
                  <FileText size={14} /> PDF
                </button>
                <button
                  type="button"
                  className={`reports-pill ${format === 'excel' ? 'reports-pill--active' : ''}`}
                  onClick={() => setFormat('excel')}
                >
                  <FileText size={14} /> Excel
                </button>
                <button
                  type="button"
                  className={`reports-pill ${format === 'csv' ? 'reports-pill--active' : ''}`}
                  onClick={() => setFormat('csv')}
                >
                  <FileText size={14} /> CSV
                </button>
              </div>
            </div>

            {error && (
              <p className="reports-form-error" role="alert">
                {error}
              </p>
            )}

            <div className="reports-actions">
              <button
                type="button"
                className="reports-btn reports-btn--primary"
                onClick={() => void handleGenerate()}
                disabled={!canGenerate}
              >
                <LineChartIcon size={15} />
                {generating ? 'Generating…' : 'Generate report'}
              </button>
              <button type="button" className="reports-btn reports-btn--ghost" disabled>
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
              <p className="reports-empty">No reports yet.</p>
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
            <select className="reports-select reports-select--small" defaultValue="30d">
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
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
                <li key={c.id}>
                  <Link to={`/dashboard/admin/reports/${c.id}`} className="reports-category">
                    <span className="reports-category__icon">
                      <Icon size={16} />
                    </span>
                    <div className="reports-category__text">
                      <strong>{c.label}</strong>
                      <small>{c.hint}</small>
                    </div>
                    <span className="reports-category__arrow">›</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </article>
      </section>
    </div>
  );
}
