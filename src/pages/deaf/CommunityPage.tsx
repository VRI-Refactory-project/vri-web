import { Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../../features/community/Avatar';
import { CommunityTabs, MESSAGES_PATH } from '../../features/community/CommunityTabs';
import { describeError } from '../../services/api';
import {
  acceptRequest,
  cancelRequest,
  declineRequest,
  getConnections,
  getPeople,
  getRequests,
  sendRequest,
  type CommunityMember,
  type Connection,
  type ConnectionRequest,
} from '../../services/community';
import './DeafExtras.css';
import '../../features/community/Community.css';

const SEARCH_DELAY_MS = 300;

/** Find Deaf people, ask them to connect, and answer the requests people send you. */
export function CommunityPage() {
  const [search, setSearch] = useState('');
  const [people, setPeople] = useState<CommunityMember[] | null>(null);
  const [incoming, setIncoming] = useState<ConnectionRequest[]>([]);
  const [outgoing, setOutgoing] = useState<ConnectionRequest[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadPeople = useCallback(async (term: string) => {
    try {
      setPeople(await getPeople(term));
      setError('');
    } catch (err) {
      setError(describeError(err));
    }
  }, []);

  const loadRelations = useCallback(async () => {
    try {
      const [inc, out, conns] = await Promise.all([
        getRequests('incoming'),
        getRequests('outgoing'),
        getConnections(),
      ]);
      setIncoming(inc);
      setOutgoing(out);
      setConnections(conns);
    } catch (err) {
      setError(describeError(err));
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRelations();
  }, [loadRelations]);

  useEffect(() => {
    const timer = setTimeout(() => void loadPeople(search), search ? SEARCH_DELAY_MS : 0);
    return () => clearTimeout(timer);
  }, [search, loadPeople]);

  /** Runs one action, then refreshes everything so each card shows where things stand now. */
  const act = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await action();
      await Promise.all([loadPeople(search), loadRelations()]);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  };

  const requestFrom = (personId: number) => incoming.find((r) => r.person.id === personId);
  const requestTo = (personId: number) => outgoing.find((r) => r.person.id === personId);
  const connectionWith = (personId: number) => connections.find((c) => c.person.id === personId);

  const actions = (p: CommunityMember) => {
    if (p.relationship === 'connected') {
      const connection = connectionWith(p.id);
      return connection ? (
        <Link className="cm-btn" to={`${MESSAGES_PATH}?c=${connection.id}`}>
          Message
        </Link>
      ) : null;
    }
    if (p.relationship === 'request_received') {
      const request = requestFrom(p.id);
      return request ? (
        <span className="cm-actions">
          <button
            type="button"
            className="cm-btn"
            disabled={busy}
            onClick={() => act(() => acceptRequest(request.id))}
          >
            Accept
          </button>
          <button
            type="button"
            className="cm-btn cm-btn--ghost"
            disabled={busy}
            onClick={() => act(() => declineRequest(request.id))}
          >
            Decline
          </button>
        </span>
      ) : null;
    }
    if (p.relationship === 'request_sent') {
      const request = requestTo(p.id);
      return request ? (
        <button
          type="button"
          className="cm-btn cm-btn--ghost"
          disabled={busy}
          aria-label={`Cancel request to ${p.name}`}
          onClick={() => act(() => cancelRequest(request.id))}
        >
          Cancel request
        </button>
      ) : (
        <button type="button" className="cm-btn cm-btn--ghost" disabled>
          Request sent
        </button>
      );
    }
    return (
      <button
        type="button"
        className="cm-btn"
        disabled={busy}
        aria-label={`Connect with ${p.name}`}
        onClick={() => act(() => sendRequest(p.id))}
      >
        Connect
      </button>
    );
  };

  return (
    <div className="dx-page">
      <header className="dx-header">
        <h1>Community</h1>
        <p>Find other Deaf people, connect, and start chatting.</p>
        <CommunityTabs />
      </header>

      {error && (
        <p className="dx-notice" role="alert">
          {error}
        </p>
      )}

      {incoming.length > 0 && (
        <section className="cm-section" aria-label="Requests for you">
          <h2>Requests for you</h2>
          <ul className="cm-grid">
            {incoming.map((r) => (
              <li key={r.id} className="cm-person">
                <Avatar name={r.person.name} photoUrl={r.person.photoUrl} />
                <span className="cm-person-text">
                  <strong>{r.person.name}</strong>
                  <small>{r.person.location || 'Wants to connect'}</small>
                </span>
                <span className="cm-actions">
                  <button
                    type="button"
                    className="cm-btn"
                    disabled={busy}
                    aria-label={`Accept request from ${r.person.name}`}
                    onClick={() => act(() => acceptRequest(r.id))}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="cm-btn cm-btn--ghost"
                    disabled={busy}
                    aria-label={`Decline request from ${r.person.name}`}
                    onClick={() => act(() => declineRequest(r.id))}
                  >
                    Decline
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="cm-section" aria-label="People">
        <h2>People</h2>
        <label className="dx-search">
          <Search size={16} aria-hidden />
          <input
            type="search"
            aria-label="Search people"
            placeholder="Search by name or place"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        {people === null ? (
          <p className="cm-note">Loading…</p>
        ) : people.length === 0 ? (
          <p className="cm-note">
            {search ? 'No one matches that search.' : 'No one else has joined the community yet.'}
          </p>
        ) : (
          <ul className="cm-grid">
            {people.map((p) => (
              <li key={p.id} className="cm-person">
                <Avatar name={p.name} photoUrl={p.photoUrl} />
                <span className="cm-person-text">
                  <strong>{p.name}</strong>
                  <small>{p.location || 'Deaf user'}</small>
                </span>
                {actions(p)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
