import { ChevronLeft, Search, Video } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  filterSessions,
  formatWhen,
  STATUS_LABEL,
  titleFor,
  type StatusFilter,
} from '../../features/sessions/sessionHistory';
import { describeError } from '../../services/api';
import { getMySessions, type HistoryItem } from '../../services/mySessions';
import './SessionsPages.css';

const FILTERS: StatusFilter[] = ['all', 'matched', 'waiting', 'cancelled', 'missed'];

/** The person's past requests with who answered them, searchable and filterable by status. */
export function SessionHistoryPage() {
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');

  useEffect(() => {
    let cancelled = false;
    getMySessions()
      .then((list) => !cancelled && setItems(list))
      .catch((err) => !cancelled && setError(describeError(err)));
    return () => {
      cancelled = true;
    };
  }, []);

  const shown = useMemo(
    () => (items ? filterSessions(items, search, status) : []),
    [items, search, status],
  );

  return (
    <div className="sh-page">
      <Link to="/dashboard/deaf/sessions" className="sh-back">
        <ChevronLeft size={18} aria-hidden /> Back
      </Link>
      <header className="sh-header">
        <h1>Session history</h1>
        <p>Review your past VRI sessions.</p>
      </header>

      <div className="sh-tools">
        <label className="sh-search">
          <Search size={18} aria-hidden />
          <input
            type="search"
            placeholder="Search sessions"
            aria-label="Search sessions"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          className="sh-select"
          aria-label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
        >
          {FILTERS.map((f) => (
            <option key={f} value={f}>
              {f === 'all' ? 'All statuses' : STATUS_LABEL[f]}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="sh-alert" role="alert">
          {error}
        </p>
      )}
      {!error && items === null && <p className="sh-note">Loading your sessions…</p>}
      {!error && items !== null && shown.length === 0 && (
        <p className="sh-note">
          {items.length === 0 ? 'You have no sessions yet.' : 'No sessions match your search.'}
        </p>
      )}

      {shown.length > 0 && (
        <ul className="sh-list">
          {shown.map((item) => (
            <li key={item.id} className="sh-row">
              <span className="sh-card-icon">
                <Video size={20} aria-hidden />
              </span>
              <span className="sh-row-text">
                <strong>{titleFor(item)}</strong>
                <span>
                  {formatWhen(item.createdAt)}
                  {item.emergency ? ' · Emergency' : ''}
                </span>
              </span>
              <span className={`sh-pill sh-pill--${item.status}`}>{STATUS_LABEL[item.status]}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
