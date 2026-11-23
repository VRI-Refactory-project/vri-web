import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SessionFilters } from '../../components/interpreter/sessions/SessionFilters';
import { useMobileViewMore } from '../../components/responsive/useMobileViewMore';
import { SessionRow } from '../../components/interpreter/sessions/SessionRow';
import { UpNextCard } from '../../components/interpreter/sessions/UpNextCard';
import { INTERPRETER_BASE } from '../../features/interpreter/navigation';
import {
  countLabel,
  filterSessions,
  getInterpreterSessions,
  nextSession,
  orderSessions,
  type InterpreterSession,
  type SessionFilter,
} from '../../services/interpreterSessions';
import './SessionsPage.css';

/** The interpreter's booked sessions: the next one up, then the full list. */
export function InterpreterSessionsPage() {
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<InterpreterSession[] | null | undefined>(undefined);
  const [now, setNow] = useState(() => new Date());
  const [filter, setFilter] = useState<SessionFilter>('all');
  const [search, setSearch] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void getInterpreterSessions().then((list) => {
      if (cancelled) return;
      setSessions(list);
      setNow(new Date());
    });

    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  const handleRetry = () => {
    setSessions(undefined);
    setRetryCount((count) => count + 1);
  };

  const all = useMemo(() => orderSessions(sessions ?? []), [sessions]);
  const upNext = useMemo(() => nextSession(all), [all]);
  const shown = useMemo(() => filterSessions(all, filter, search), [all, filter, search]);

  const mobileRows = useMobileViewMore(shown.length, [filter, search, shown.length].join('|'));

  const emptyMessage =
    all.length === 0 ? 'No sessions yet.' : 'No sessions match your search or filter.';

  return (
    <div className="isn-page">
      <header className="isn-header">
        <div>
          <h1>Sessions</h1>
          <p>Your booked interpreting sessions and history</p>
        </div>

        <button type="button" className="isn-back" onClick={() => navigate(INTERPRETER_BASE)}>
          <ArrowLeft size={16} aria-hidden="true" />
          Back
        </button>
      </header>

      {sessions === undefined && (
        <p className="isn-notice" role="status">
          Loading your sessions...
        </p>
      )}

      {sessions === null && (
        <div className="isn-notice" role="alert">
          <p>We couldn't load your sessions. Please check your connection and try again.</p>
          <button type="button" onClick={handleRetry}>
            <RefreshCw size={14} aria-hidden="true" />
            Retry
          </button>
        </div>
      )}

      {upNext && <UpNextCard session={upNext} now={now} />}

      {sessions !== undefined && sessions !== null && (
        <section className="isn-panel" aria-labelledby="isn-list-title">
          <div className="isn-panel-top">
            <h2 className="isn-panel-title" id="isn-list-title">
              {countLabel(all)}
            </h2>

            <SessionFilters
              filter={filter}
              onFilterChange={setFilter}
              search={search}
              onSearchChange={setSearch}
            />
          </div>

          {shown.length === 0 ? (
            <p className="isn-empty">{emptyMessage}</p>
          ) : (
            <>
              <div className="isn-table-wrap mobile-data-cards">
                <table className="isn-table">
                  <thead>
                    <tr>
                      <th scope="col">Date</th>
                      <th scope="col">With</th>
                      <th scope="col">Type</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {shown.map((session, index) => (
                      <SessionRow
                        key={session.id}
                        session={session}
                        now={now}
                        mobileItemProps={mobileRows.itemProps(index)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {mobileRows.button}
            </>
          )}
        </section>
      )}
    </div>
  );
}
