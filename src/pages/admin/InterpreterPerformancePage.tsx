import { useEffect, useState } from 'react';
import { AlertTriangle, Star, Video, MessageSquare } from 'lucide-react';
import { describeError } from '../../services/api';
import {
  fetchInterpreterMetrics,
  type InterpreterMetrics,
  type InterpreterRatingTrend,
} from '../../services/admin';
import './InterpreterPerformancePage.css';

const PAGE_SIZE = 10;

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function visibleRatingTrend(trends: InterpreterRatingTrend[], trendStartMonth: string) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const trackingStart = /^\d{4}-\d{2}$/.test(trendStartMonth)
    ? new Date(`${trendStartMonth}-01T00:00:00`)
    : new Date(currentYear, now.getMonth(), 1);
  const start =
    trackingStart.getFullYear() === currentYear
      ? new Date(currentYear, trackingStart.getMonth(), 1)
      : new Date(currentYear, 0, 1);
  const end = new Date(currentYear, 11, 1);
  const byMonth = new Map(trends.map((point) => [point.month, point]));
  const result: InterpreterRatingTrend[] = [];
  for (const date = new Date(start); date <= end; date.setMonth(date.getMonth() + 1)) {
    const month = monthKey(date);
    result.push(byMonth.get(month) ?? { month, averageRating: null, ratingCount: 0 });
  }
  return result;
}

export function InterpreterPerformancePage() {
  const [metrics, setMetrics] = useState<InterpreterMetrics | null>(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    fetchInterpreterMetrics(page, PAGE_SIZE).then(
      (data) => {
        if (!cancelled) setMetrics(data);
      },
      (err) => {
        if (!cancelled) setError(describeError(err));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [page]);

  const trend = metrics ? visibleRatingTrend(metrics.trends, metrics.trendStartMonth) : [];
  const pageCount = metrics
    ? Math.max(1, Math.ceil(metrics.interpreterPagination.count / PAGE_SIZE))
    : 1;
  const firstRow =
    metrics && metrics.interpreterPagination.count > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const lastRow = metrics ? Math.min(page * PAGE_SIZE, metrics.interpreterPagination.count) : 0;

  return (
    <main className="ipm-page">
      <header className="ipm-header">
        <div>
          <h1>Interpreter performance</h1>
          <p>Ratings and feedback over time, based on completed sessions.</p>
        </div>
      </header>

      {error && (
        <p className="ipm-message ipm-message--error" role="alert">
          {error}
        </p>
      )}
      {!metrics && !error && <p className="ipm-message">Loading interpreter metrics…</p>}

      {metrics && (
        <>
          <section className="ipm-summary" aria-label="Performance summary">
            <article>
              <Star />
              <span>Average rating</span>
              <strong>
                {metrics.summary.averageRating == null
                  ? '—'
                  : metrics.summary.averageRating.toFixed(2)}
              </strong>
            </article>
            <article>
              <MessageSquare />
              <span>Ratings received</span>
              <strong>{metrics.summary.ratingsCount}</strong>
            </article>
            <article>
              <AlertTriangle />
              <span>Low ratings</span>
              <strong>{metrics.summary.lowRatingCount}</strong>
            </article>
            <article>
              <Video />
              <span>Completed sessions</span>
              <strong>{metrics.summary.completedSessions}</strong>
            </article>
          </section>

          <section className="ipm-panel">
            <h2>Rating trend</h2>
            {trend.length === 0 ? (
              <p>No rating history yet.</p>
            ) : (
              <div className="ipm-trends">
                {trend.map((point) => (
                  <div className="ipm-trend" key={point.month}>
                    <span>{point.month}</span>
                    <div className="ipm-track">
                      <i
                        style={{
                          width: `${Math.max(0, Math.min(100, ((point.averageRating ?? 0) / 5) * 100))}%`,
                        }}
                      />
                    </div>
                    <strong>
                      {point.averageRating == null ? '—' : point.averageRating.toFixed(2)}
                    </strong>
                    <small>{point.ratingCount} ratings</small>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="ipm-panel">
            <h2>Interpreter results</h2>
            {metrics.interpreters.length === 0 ? (
              <p>No interpreter performance data yet.</p>
            ) : (
              <div className="ipm-table-wrap">
                <table className="ipm-table">
                  <thead>
                    <tr>
                      <th>Interpreter</th>
                      <th>Specialisation</th>
                      <th>Average rating</th>
                      <th>Ratings</th>
                      <th>Completed sessions</th>
                      <th>Low ratings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.interpreters.map((row) => (
                      <tr key={row.interpreterId}>
                        <td>{row.interpreterName}</td>
                        <td>{row.specialisation}</td>
                        <td>{row.averageRating == null ? '—' : row.averageRating.toFixed(2)}</td>
                        <td>{row.ratingCount}</td>
                        <td>{row.completedSessions}</td>
                        <td>
                          <span className={row.lowRatingCount > 0 ? 'ipm-low' : ''}>
                            {row.lowRatingCount}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {metrics.interpreterPagination.count > 0 && (
              <div className="ipm-pagination" aria-label="Interpreter table pagination">
                <span>
                  Showing {firstRow}–{lastRow} of {metrics.interpreterPagination.count} interpreters
                </span>
                <div>
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((value) => value - 1)}
                  >
                    Previous
                  </button>
                  <span>
                    Page {page} of {pageCount}
                  </span>
                  <button
                    type="button"
                    disabled={page >= pageCount}
                    onClick={() => setPage((value) => value + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="ipm-panel">
            <h2>Low-rating feedback</h2>
            {metrics.lowRatings.length === 0 ? (
              <p>No low ratings recorded.</p>
            ) : (
              <div className="ipm-feedback-list">
                {metrics.lowRatings.map((item) => (
                  <article key={item.id}>
                    <div>
                      <strong>{item.interpreterName}</strong>
                      <span>{new Date(item.sessionDate).toLocaleDateString()}</span>
                      <b>{item.rating} / 5</b>
                    </div>
                    <p>{item.comment || 'No written comment provided.'}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
