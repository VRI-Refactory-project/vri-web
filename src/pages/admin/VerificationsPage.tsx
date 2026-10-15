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

  return (
    <div className="vp">
      <header className="vp-header">
        <h1>Verifications</h1>
        <p>Review interpreter certificates and decide who can take requests.</p>
      </header>

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
      ) : (
        rows.length > 0 && (
          <div className="vp-table-wrap">
            <table className="vp-table">
              <thead>
                <tr>
                  <th>Interpreter</th>
                  <th>Contact</th>
                  <th>Certificates</th>
                  <th>Registered</th>
                  <th>Status</th>
                  <th>
                    <span className="vp-sr">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.fullName}</strong>
                    </td>
                    <td>
                      {r.email || r.phoneNumber}
                      {r.email && <small>{r.phoneNumber}</small>}
                    </td>
                    <td>{r.certificationCount}</td>
                    <td>{formatDate(r.createdAt)}</td>
                    <td>
                      <span className={`vp-pill vp-pill--${r.status.toLowerCase()}`}>
                        {STATUS_LABEL[r.status]}
                      </span>
                    </td>
                    <td>
                      <Link className="vp-link" to={`/dashboard/admin/verifications/${r.id}`}>
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
