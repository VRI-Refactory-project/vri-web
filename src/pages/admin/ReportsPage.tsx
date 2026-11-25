// src/pages/admin/ReportsPage.tsx
import { useEffect, useState } from 'react';
import {
  REPORT_RANGES,
  fetchResponseTimesReport,
  fetchUsageReport,
  formatSeconds,
  type ReportRange,
  type ResponseTimesReport,
  type UsageReport,
} from '../../services/adminReports';
import { describeError } from '../../services/api';
import './ReportsPage.css';
import { exportReportCsv, exportReportExcel, previewReportPdf } from '../../services/reportExports';

type Tab = 'usage' | 'response-times';

const TABS: { id: Tab; label: string }[] = [
  { id: 'usage', label: 'Usage' },
  { id: 'response-times', label: 'Response times' },
];

const STATUS_LABELS: Record<string, string> = {
  CREATED: 'Created',
  PENDING: 'Waiting for an interpreter',
  OFFERED: 'Offered',
  ASSIGNED: 'In session',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  FAILED: 'Nobody available',
};

const SPECIALISATION_LABELS: Record<string, string> = {
  GENERAL: 'General',
  MEDICAL: 'Medical',
  LEGAL: 'Legal',
  OTHER: 'Other',
};

/** What was last loaded, and for which tab and range, so a slow answer never shows under the wrong tab. */
interface Loaded {
  key: string;
  error: string;
  usage: UsageReport | null;
  times: ResponseTimesReport | null;
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <article className="reports-stat">
      <span className="reports-stat__label">{label}</span>
      <strong className="reports-stat__value">{value}</strong>
      {hint && <small className="reports-stat__hint">{hint}</small>}
    </article>
  );
}

/** One horizontal bar per row, scaled to the biggest value. */
function BarList({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  if (rows.length === 0) return <p className="reports-empty">No requests in this period.</p>;
  return (
    <ul className="reports-bars">
      {rows.map((row) => (
        <li key={row.label}>
          <span className="reports-bars__label">{row.label}</span>
          <span className="reports-bars__track">
            <span className="reports-bars__fill" style={{ width: `${(row.value / max) * 100}%` }} />
          </span>
          <strong className="reports-bars__value">{row.value}</strong>
        </li>
      ))}
    </ul>
  );
}

/** One vertical column per item (a day or an hour), scaled to the tallest. */
function Columns({
  items,
  caption,
}: {
  items: { label: string; value: number; title: string }[];
  caption: string;
}) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <div className="reports-columns" role="img" aria-label={caption}>
      {items.map((item) => (
        <span key={item.label} className="reports-columns__item" title={item.title}>
          <span
            className="reports-columns__bar"
            style={{ height: `${Math.max(2, (item.value / max) * 100)}%` }}
          />
        </span>
      ))}
    </div>
  );
}

/** The big numbers at the top of a report, like the headline strip on a finance dashboard. */
function Headline({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: { label: string; value: string | number; hint?: string }[];
}) {
  return (
    <section className="reports-card reports-headline">
      <header className="reports-headline__head">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </header>
      <div className="reports-headline__grid">
        {items.map((item) => (
          <div key={item.label} className="reports-headline__item">
            <span className="reports-headline__label">{item.label}</span>
            <strong className="reports-headline__value">{item.value}</strong>
            {item.hint && <small className="reports-headline__hint">{item.hint}</small>}
          </div>
        ))}
      </div>
    </section>
  );
}

function percent(part: number, whole: number): string {
  return whole === 0 ? '—' : `${Math.round((part / whole) * 100)}%`;
}

function formatDay(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** A compact table with a totals row: newest day first. */
function DailyTable({ rows }: { rows: UsageReport['byDay'] }) {
  if (rows.length === 0) return <p className="reports-empty">No requests in this period.</p>;

  const sorted = [...rows].sort((a, b) => b.date.localeCompare(a.date));
  const totalRequests = rows.reduce((sum, row) => sum + row.requests, 0);
  const totalSessions = rows.reduce((sum, row) => sum + row.sessions, 0);

  return (
    <div className="reports-table-wrap">
      <table className="reports-table">
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col" className="reports-table__num">
              Requests
            </th>
            <th scope="col" className="reports-table__num">
              Sessions
            </th>
            <th scope="col" className="reports-table__num">
              Answered
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.date}>
              <td>{formatDay(row.date)}</td>
              <td className="reports-table__num">{row.requests}</td>
              <td className="reports-table__num">{row.sessions}</td>
              <td className="reports-table__num">{percent(row.sessions, row.requests)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total</th>
            <td className="reports-table__num">{totalRequests}</td>
            <td className="reports-table__num">{totalSessions}</td>
            <td className="reports-table__num">{percent(totalSessions, totalRequests)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function UsageView({ report }: { report: UsageReport }) {
  const { summary } = report;
  return (
    <>
      <Headline
        title="Usage summary"
        subtitle={`Last ${report.rangeDays} days`}
        items={[
          { label: 'Requests', value: summary.requests, hint: 'Asked for an interpreter' },
          { label: 'Sessions', value: summary.sessions, hint: 'An interpreter accepted' },
          {
            label: 'Answered',
            value: percent(summary.sessions, summary.requests),
            hint: 'Requests that got an interpreter',
          },
        ]}
      />

      <section className="reports-stats">
        <StatCard label="Completed" value={summary.completed} />
        <StatCard label="Cancelled" value={summary.cancelled} />
        <StatCard label="Nobody available" value={summary.failed} />
        <StatCard label="Emergency" value={summary.emergency} />
      </section>

      <section className="reports-panel">
        <header className="reports-panel__head">
          <h2>Requests per day</h2>
          <p>Last {report.rangeDays} days. Hover a column to see the day.</p>
        </header>
        <Columns
          caption={`Requests per day over the last ${report.rangeDays} days`}
          items={report.byDay.map((row) => ({
            label: row.date,
            value: row.requests,
            title: `${row.date}: ${row.requests} requests, ${row.sessions} sessions`,
          }))}
        />
      </section>

      <section className="reports-panel">
        <header className="reports-panel__head">
          <h2>Day by day</h2>
          <p>Newest first, with the totals for the period at the bottom.</p>
        </header>
        <DailyTable rows={report.byDay} />
      </section>

      <section className="reports-row">
        <article className="reports-panel">
          <header className="reports-panel__head">
            <h2>By specialisation</h2>
          </header>
          <BarList
            rows={report.bySpecialisation.map((row) => ({
              label: SPECIALISATION_LABELS[row.specialisation] ?? row.specialisation,
              value: row.count,
            }))}
          />
        </article>
        <article className="reports-panel">
          <header className="reports-panel__head">
            <h2>By status</h2>
          </header>
          <BarList
            rows={report.byStatus.map((row) => ({
              label: STATUS_LABELS[row.status] ?? row.status,
              value: row.count,
            }))}
          />
        </article>
      </section>
    </>
  );
}

function ResponseTimesView({ report }: { report: ResponseTimesReport }) {
  const { summary, offers } = report;
  return (
    <>
      <Headline
        title="Response summary"
        subtitle={`Last ${report.rangeDays} days`}
        items={[
          {
            label: 'Average time to accept',
            value: formatSeconds(summary.avgSecondsToAccept),
            hint: 'From request to an interpreter accepting',
          },
          {
            label: 'Average time in queue',
            value: formatSeconds(summary.avgSecondsInQueue),
            hint: 'From request to the first offer',
          },
          {
            label: 'Answered',
            value: summary.answered,
            hint: `of ${summary.requests} requests`,
          },
        ]}
      />

      <section className="reports-stats">
        <StatCard
          label="Abandoned"
          value={summary.abandoned}
          hint="Cancelled before anyone accepted"
        />
        <StatCard label="Nobody available" value={summary.failed} />
        <StatCard
          label="Specialist not found"
          value={summary.matchedByFallback}
          hint="A general interpreter was offered"
        />
      </section>

      <section className="reports-panel">
        <header className="reports-panel__head">
          <h2>Busiest hours</h2>
          <p>Requests by hour of the day (Kampala time). Hover a column to see the hour.</p>
        </header>
        <Columns
          caption="Requests by hour of the day"
          items={report.peakHours.map((row) => ({
            label: String(row.hour),
            value: row.requests,
            title: `${String(row.hour).padStart(2, '0')}:00: ${row.requests} requests`,
          }))}
        />
      </section>

      <section className="reports-panel">
        <header className="reports-panel__head">
          <h2>How interpreters answered offers</h2>
          <p>
            Acceptance rate:{' '}
            <strong>
              {offers.acceptanceRatePercent === null ? '—' : `${offers.acceptanceRatePercent}%`}
            </strong>
          </p>
        </header>
        <BarList
          rows={[
            { label: 'Accepted', value: offers.accepted },
            { label: 'Declined', value: offers.declined },
            { label: 'Not answered in time', value: offers.expired },
          ]}
        />
      </section>
    </>
  );
}

export function ReportsPage() {
  const [tab, setTab] = useState<Tab>('usage');
  const [days, setDays] = useState<ReportRange>(30);
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  const key = `${tab}-${days}`;
  const updatedOn = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  useEffect(() => {
    let cancelled = false;
    const done = (patch: Partial<Loaded>) => {
      if (!cancelled) setLoaded({ key, error: '', usage: null, times: null, ...patch });
    };

    if (tab === 'usage') {
      fetchUsageReport(days)
        .then((usage) => done({ usage }))
        .catch((err) => done({ error: describeError(err) }));
    } else {
      fetchResponseTimesReport(days)
        .then((times) => done({ times }))
        .catch((err) => done({ error: describeError(err) }));
    }

    return () => {
      cancelled = true;
    };
  }, [tab, days, key]);

  const current = loaded?.key === key ? loaded : null;
  const loading = current === null;
  const usage = tab === 'usage' ? (current?.usage ?? null) : null;
  const times = tab === 'response-times' ? (current?.times ?? null) : null;

  const getCurrentReport = () => {
    if (usage) {
      return { type: 'usage' as const, report: usage };
    }

    if (times) {
      return { type: 'response-times' as const, report: times };
    }

    return null;
  };

  const handlePreviewPdf = () => {
    const data = getCurrentReport();
    if (data) previewReportPdf(data);
  };

  const handleExportCsv = () => {
    const data = getCurrentReport();
    if (data) exportReportCsv(data);
  };

  const handleExportExcel = () => {
    const data = getCurrentReport();
    if (data) exportReportExcel(data);
  };

  return (
    <div className="reports-page">
      <header className="reports-header">
        <div>
          <h1>Reports</h1>
          <p>How the platform is being used, and how quickly requests are answered.</p>
        </div>
        <span className="reports-updated">Updated {updatedOn}</span>
      </header>

      <section className="reports-controls">
        <div className="reports-card reports-option">
          <h2 className="reports-option__title">Report</h2>
          <div className="reports-choices" role="tablist" aria-label="Report">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={`reports-choice ${tab === t.id ? 'reports-choice--active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="reports-card reports-option">
          <h2 className="reports-option__title">Period</h2>
          <div className="reports-choices" role="group" aria-label="Period">
            {REPORT_RANGES.map((range) => (
              <button
                key={range}
                type="button"
                aria-pressed={days === range}
                className={`reports-choice ${days === range ? 'reports-choice--active' : ''}`}
                onClick={() => setDays(range)}
              >
                Last {range} days
              </button>
            ))}
          </div>
        </div>

        <div className="reports-card reports-option">
          <h2 className="reports-option__title">Preview and export</h2>

          <p className="reports-option__text">
            Preview your report or export the current reporting period.
          </p>

          <div className="reports-export-actions">
            <button
              type="button"
              className="reports-btn"
              onClick={handlePreviewPdf}
              disabled={!usage && !times}
            >
              Preview PDF
            </button>

            <button
              type="button"
              className="reports-btn reports-btn--secondary"
              onClick={handleExportCsv}
              disabled={!usage && !times}
            >
              Export CSV
            </button>

            <button
              type="button"
              className="reports-btn reports-btn--secondary"
              onClick={handleExportExcel}
              disabled={!usage && !times}
            >
              Export Excel
            </button>
          </div>
        </div>
      </section>

      {loading && <p className="reports-empty">Loading report…</p>}

      {current?.error && (
        <p className="reports-form-error" role="alert">
          Could not load the report: {current.error}
        </p>
      )}

      {usage && <UsageView report={usage} />}
      {times && <ResponseTimesView report={times} />}
    </div>
  );
}
