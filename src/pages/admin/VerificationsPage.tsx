import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { describeError } from '../../services/api';
import {
  listInterpreters,
  type InterpreterRow,
  type VerificationStatus,
} from '../../services/adminInterpreters';
import './VerificationsPage.css';

type Filter = VerificationStatus | 'ALL';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'INACTIVE', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'DEACTIVATED', label: 'Deactivated' },
  { value: 'ALL', label: 'All' },
];

const STATUS_LABEL: Record<VerificationStatus, string> = {
  INACTIVE: 'Pending review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  DEACTIVATED: 'Deactivated',
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** Interpreter verification queue (V2-045): who is waiting, and a way into each review. */
export function VerificationsPage() {
  const [filter, setFilter] = useState<Filter>('INACTIVE');
  const [rows, setRows] = useState<InterpreterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    listInterpreters(filter === 'ALL' ? undefined : filter).then(
      (data) => {
        if (cancelled) return;
        setRows(data);
        setError('');
        setLoading(false);
      },
      (err: unknown) => {
        if (cancelled) return;
        setError(describeError(err));
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [filter]);

  const choose = (next: Filter) => {
    if (next === filter) return;
    setLoading(true);
    setFilter(next);
  };

  const needle = query.trim().toLowerCase();
  const visible = needle
    ? rows.filter((r) =>
        [r.fullName, r.email, r.phoneNumber].some((v) => v.toLowerCase().includes(needle)),
      )
    : rows;

  return (
    <div className="vp">
      <header className="vp-header">
        <h1>Interpreter verifications</h1>
        <p>Review interpreter applications, credentials and identity checks.</p>
      </header>

      <section className="vp-card" aria-labelledby="vp-queue-title">
        <div className="vp-card-head">
          <div>
            <h2 id="vp-queue-title">Verification queue</h2>
            <p>Applications are ordered by submission time.</p>
          </div>
          {!loading && (
            <span className="vp-count">
              {rows.length} {filter === 'INACTIVE' ? 'pending' : 'shown'}
            </span>
          )}
        </div>

        <div className="vp-tools">
          <label className="vp-search">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="m20 20-4-4" fill="none" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            <input
              type="search"
              placeholder="Search interpreters"
              aria-label="Search interpreters"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>

        <div className="vp-filters" role="group" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={f.value === filter ? 'vp-filter vp-filter--on' : 'vp-filter'}
              aria-pressed={f.value === filter}
              onClick={() => choose(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {error && (
          <p className="vp-error" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <p className="vp-empty" role="status">
            Loading…
          </p>
        ) : rows.length === 0 && !error ? (
          <p className="vp-empty">No interpreters here.</p>
        ) : visible.length === 0 && rows.length > 0 ? (
          <p className="vp-empty">No interpreters match your search.</p>
        ) : (
          visible.length > 0 && (
            <div className="vp-list">
              <div className="vp-list-head" aria-hidden="true">
                <span>INTERPRETER</span>
                <span>STATUS</span>
              </div>
              <ul>
                {visible.map((r) => (
                  <li key={r.id} className="vp-row">
                    <div className="vp-who">
                      <strong>{r.fullName}</strong>
                      <small>
                        {[r.specialisation, `Submitted ${formatDate(r.createdAt)}`]
                          .filter(Boolean)
                          .join(' · ')}
                      </small>
                    </div>
                    <span className={`vp-pill vp-pill--${r.status.toLowerCase()}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
                    <Link
                      className="vp-link"
                      aria-label="Review"
                      to={`/dashboard/admin/verifications/${r.id}`}
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                        <path
                          d="m9 5 7 7-7 7"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )
        )}
      </section>
    </div>
  );
}
