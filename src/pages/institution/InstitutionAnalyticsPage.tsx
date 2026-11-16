import { useEffect, useMemo, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { apiBlob, describeError } from '../../services/api';
import {
  changeVsLastPeriod,
  formatDay,
  formatMinutes,
  getInstitutionUsage,
  groupDays,
  lastDays,
  type Grouping,
  type InstitutionUsage,
  type UsageCount,
} from '../../services/institutionUsage';
import { listStaff, type StaffMember } from '../../services/staff';
import './InstitutionAnalyticsPage.css';

const PERIODS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'custom', label: 'Custom dates' },
];

const OUTCOME_COLOURS: Record<string, string> = {
  COMPLETED: '#10b981',
  ASSIGNED: '#4f46e5',
  CANCELLED: '#f59e0b',
  FAILED: '#ef4444',
};

/** V2-029: how much the institution uses VRI, for a period and optionally one staff member or department. */
export function InstitutionAnalyticsPage() {
  const [period, setPeriod] = useState('7');
  const [custom, setCustom] = useState(() => lastDays(7));
  const [staffId, setStaffId] = useState('');
  const [department, setDepartment] = useState('');
  const [grouping, setGrouping] = useState<Grouping>('Daily');

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [usage, setUsage] = useState<InstitutionUsage | null>(null);
  // Which filters the last answer (usage or error) was for: anything else is still loading.
  const [answered, setAnswered] = useState({ key: '', error: '' });

  const range = period === 'custom' ? custom : lastDays(Number(period));
  const rangeProblem =
    period === 'custom' && (!custom.from || !custom.to || custom.from > custom.to)
      ? 'Choose a start date on or before the end date.'
      : '';
  const filtersKey = [range.from, range.to, staffId, department].join('|');
  const loading = !rangeProblem && answered.key !== filtersKey;
  const error = answered.key === filtersKey ? answered.error : '';
  const periodLabel = PERIODS.find((p) => p.value === period)?.label ?? '';

  // The staff filter's choices. Without them the page still works for everyone.
  useEffect(() => {
    listStaff().then(setStaff, () => undefined);
  }, []);
  const departments = useMemo(
    () => [...new Set(staff.map((s) => s.department).filter(Boolean))].sort(),
    [staff],
  );

  useEffect(() => {
    if (rangeProblem) return;
    let cancelled = false;
    getInstitutionUsage({ from: range.from, to: range.to, staff: staffId, department }).then(
      (value) => {
        if (cancelled) return;
        setUsage(value);
        setAnswered({ key: filtersKey, error: '' });
      },
      (err) => {
        if (cancelled) return;
        setAnswered({ key: filtersKey, error: describeError(err) });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [range.from, range.to, staffId, department, rangeProblem, filtersKey]);

  return (
    <div className="analytics-page">
      <header className="analytics-header">
        <div>
          <h1>Analytics</h1>
          <p>Understand SignConnect usage across your institution.</p>
        </div>
        <ExportButton />
      </header>

      <div className="analytics-filters" role="group" aria-label="Filters">
        <select
          className="filter-select"
          aria-label="Period"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          {PERIODS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        {period === 'custom' && (
          <>
            <input
              type="date"
              className="filter-select"
              aria-label="From"
              value={custom.from}
              max={custom.to}
              onChange={(e) => setCustom({ ...custom, from: e.target.value })}
            />
            <input
              type="date"
              className="filter-select"
              aria-label="To"
              value={custom.to}
              min={custom.from}
              onChange={(e) => setCustom({ ...custom, to: e.target.value })}
            />
          </>
        )}
        <select
          className="filter-select"
          aria-label="Staff member"
          value={staffId}
          onChange={(e) => setStaffId(e.target.value)}
        >
          <option value="">All staff</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          className="filter-select"
          aria-label="Department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        {loading && !rangeProblem && <span className="analytics-status">Loading…</span>}
      </div>

      {(rangeProblem || error) && (
        <p role="alert" className="analytics-alert">
          {rangeProblem || error}
        </p>
      )}

      {usage && !rangeProblem && !loading && usage.sessions === 0 && (
        <p className="analytics-note" role="status">
          No sessions match these filters in this period. Try a longer period
          {staffId || department ? ', or All staff and All departments' : ''}.
        </p>
      )}

      {usage && !rangeProblem && (
        <UsageReport
          usage={usage}
          periodLabel={
            period === 'custom' ? `${formatDay(range.from)} to ${formatDay(range.to)}` : periodLabel
          }
          grouping={grouping}
          onGrouping={setGrouping}
        />
      )}
    </div>
  );
}

interface UsageReportProps {
  usage: InstitutionUsage;
  periodLabel: string;
  grouping: Grouping;
  onGrouping: (grouping: Grouping) => void;
}

function UsageReport({ usage, periodLabel, grouping, onGrouping }: UsageReportProps) {
  const bars = groupDays(usage.overTime, grouping);
  const tallest = Math.max(1, ...bars.map((bar) => bar.count));
  // A long period has too many bars to label each one: label about 14 of them.
  const labelEvery = Math.ceil(bars.length / 14);

  return (
    <>
      <section className="analytics-metrics" aria-label="Summary">
        <Metric
          label="Total sessions"
          value={usage.sessions}
          sub={changeVsLastPeriod(usage.sessions, usage.previousPeriodSessions)}
        />
        <Metric
          label="Completed sessions"
          value={usage.completed}
          sub={`${usage.completionRate}% completion rate`}
        />
        <Metric
          label="Avg. session duration"
          value={formatMinutes(usage.avgDurationMinutes)}
          sub="Per session with an interpreter"
        />
        <Metric
          label="Total usage"
          value={formatMinutes(usage.totalMinutes)}
          sub="Time with an interpreter"
        />
        <Metric
          label="Active staff"
          value={usage.staff.usedVri}
          sub={`of ${usage.staff.total} total staff`}
        />
      </section>

      <section className="analytics-chart-card" aria-label="Sessions over time">
        <div className="chart-header">
          <div>
            <h2>Sessions over time</h2>
            <p>
              {periodLabel} · {usage.sessions} {usage.sessions === 1 ? 'session' : 'sessions'} total
            </p>
          </div>
          <div className="chart-toggles">
            {(['Daily', 'Weekly', 'Monthly'] as const).map((option) => (
              <button
                key={option}
                type="button"
                className={grouping === option ? 'active' : ''}
                aria-pressed={grouping === option}
                onClick={() => onGrouping(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        <div className="bar-chart-container">
          {bars.map((bar, i) => (
            <div key={i} className="bar-column" title={`${bar.label}: ${bar.count}`}>
              <div className="bar-value">{labelEvery === 1 ? bar.count : ''}</div>
              <div className="bar-track">
                <div className="bar" style={{ height: `${(bar.count / tallest) * 100}%` }}></div>
              </div>
              <div className="bar-label">{i % labelEvery === 0 ? bar.label : ''}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="analytics-split-layout">
        <section className="analytics-list-card">
          <h2>Sessions by department</h2>
          <BarList rows={usage.byDepartment} />
        </section>

        <section className="analytics-list-card">
          <h2>Session outcomes</h2>
          <div className="outcomes-list">
            {usage.byOutcome.length === 0 && <NoData />}
            {usage.byOutcome.map((row) => {
              const colour = OUTCOME_COLOURS[row.key] ?? '#9ca3af';
              return (
                <div key={row.key} className="outcome-item">
                  <span className="outcome-dot" style={{ backgroundColor: colour }}></span>
                  <span className="outcome-label">{row.label}</span>
                  <div className="outcome-progress-wrap">
                    <div
                      className="outcome-bar"
                      style={{ width: share(row.count, usage.sessions), backgroundColor: colour }}
                    ></div>
                  </div>
                  <span className="outcome-value">{row.count}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="analytics-metrics staff-usage" aria-label="Staff usage">
        <div className="metric-card">
          <span className="metric-value">{usage.staff.total}</span>
          <span className="metric-sub text-muted">Active staff</span>
        </div>
        <div className="metric-card bordered">
          <span className="metric-value text-success">{usage.staff.usedVri}</span>
          <span className="metric-sub text-muted">Used VRI this period</span>
        </div>
        <div className="metric-card">
          <span className="metric-value">{usage.staff.notUsed}</span>
          <span className="metric-sub text-muted">Have not used VRI</span>
        </div>
      </section>

      <section className="analytics-list-card">
        <h2>Sessions by type</h2>
        <p className="subtitle">
          The kind of interpreting asked for when the session was requested
        </p>
        <BarList rows={usage.byType} className="purpose-list" />
      </section>
    </>
  );
}

function Metric({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <div className="metric-card">
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
      <span className="metric-sub text-muted">{sub}</span>
    </div>
  );
}

/** Each row's count as a bar, against the largest row. */
function BarList({ rows, className = '' }: { rows: UsageCount[]; className?: string }) {
  const largest = Math.max(0, ...rows.map((row) => row.count));
  return (
    <div className={`progress-list ${className}`}>
      {largest === 0 && <NoData />}
      {largest > 0 &&
        rows.map((row) => (
          <div key={row.key} className="progress-item">
            <span className="progress-label">{row.label}</span>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: share(row.count, largest) }}></div>
            </div>
            <span className="progress-value">{row.count}</span>
          </div>
        ))}
    </div>
  );
}

const share = (part: number, whole: number) => `${whole ? (part / whole) * 100 : 0}%`;

function NoData() {
  return <p className="text-muted analytics-empty">No sessions in this period.</p>;
}

/** Downloads the institution's PDF report (/api/v1/dashboard/institution/export/). */
function ExportButton() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExportReport = async () => {
    try {
      setIsExporting(true);
      setExportError(null);

      const pdfBlob = await apiBlob('/api/v1/dashboard/institution/export/');

      // Create a temporary URL for the PDF.
      const pdfUrl = window.URL.createObjectURL(pdfBlob);

      // Create a temporary download link.
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = 'institution-analytics-report.pdf';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Release the temporary URL after the download starts.
      window.setTimeout(() => {
        window.URL.revokeObjectURL(pdfUrl);
      }, 1000);
    } catch (error) {
      setExportError(describeError(error));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <button className="btn-export" onClick={handleExportReport} disabled={isExporting}>
        {isExporting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Generating report...
          </>
        ) : (
          <>
            <Download size={16} />
            Export report
          </>
        )}
      </button>

      {exportError && (
        <p role="alert" className="text-error">
          {exportError}
        </p>
      )}
    </>
  );
}
