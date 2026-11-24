// src/pages/admin/ReportsPage.tsx
import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import {
  REPORT_RANGES,
  downloadCsv,
  fetchResponseTimesReport,
  fetchUsageReport,
  formatSeconds,
  responseTimesCsvRows,
  usageCsvRows,
  type ReportRange,
  type ResponseTimesReport,
  type UsageReport,
} from '../../services/adminReports';
import { describeError } from '../../services/api';
import './ReportsPage.css';

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

function UsageView({ report }: { report: UsageReport }) {
  const { summary } = report;
  return (
    <>
      <section className="reports-stats">
        <StatCard label="Requests" value={summary.requests} hint="Asked for an interpreter" />
        <StatCard label="Sessions" value={summary.sessions} hint="An interpreter accepted" />
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
      <section className="reports-stats">
        <StatCard
          label="Average time to accept"
          value={formatSeconds(summary.avgSecondsToAccept)}
          hint="From request to an interpreter accepting"
        />
        <StatCard
          label="Average time in queue"
          value={formatSeconds(summary.avgSecondsInQueue)}
          hint="From request to the first offer"
        />
        <StatCard
          label="Answered"
          value={summary.answered}
          hint={`of ${summary.requests} requests`}
        />
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

  const handleExport = () => {
    if (usage) downloadCsv(`usage-report-${days}-days.csv`, usageCsvRows(usage));
    if (times) downloadCsv(`response-times-report-${days}-days.csv`, responseTimesCsvRows(times));
  };

  return (
    <div className="reports-page">
      <header className="reports-header">
        <div>
          <h1>Reports</h1>
          <p>How the platform is being used, and how quickly requests are answered.</p>
        </div>
        <button
          type="button"
          className="reports-btn"
          onClick={handleExport}
          disabled={!usage && !times}
        >
          <Download size={15} /> Export CSV
        </button>
      </header>

      <div className="reports-toolbar">
        <div className="reports-tabs" role="tablist" aria-label="Report">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`reports-tab ${tab === t.id ? 'reports-tab--active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="reports-ranges" role="group" aria-label="Period">
          {REPORT_RANGES.map((range) => (
            <button
              key={range}
              type="button"
              aria-pressed={days === range}
              className={`reports-pill ${days === range ? 'reports-pill--active' : ''}`}
              onClick={() => setDays(range)}
            >
              Last {range} days
            </button>
          ))}
        </div>
      </div>

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
