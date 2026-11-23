import { useEffect, useState } from 'react';
import { AlertTriangle, Star, Video, MessageSquare } from 'lucide-react';
import { describeError } from '../../services/api';
import { fetchInterpreterMetrics, type InterpreterMetrics } from '../../services/admin';
import './InterpreterPerformancePage.css';

export function InterpreterPerformancePage() {
  const [metrics, setMetrics] = useState<InterpreterMetrics | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchInterpreterMetrics().then(
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
  }, []);

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
            {metrics.trends.length === 0 ? (
              <p>No rating history yet.</p>
            ) : (
              <div className="ipm-trends">
                {metrics.trends.map((point) => (
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
                    {[...metrics.interpreters]
                      .sort(
                        (a, b) =>
                          (b.averageRating ?? -1) - (a.averageRating ?? -1) ||
                          b.ratingCount - a.ratingCount,
                      )
                      .map((row) => (
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
