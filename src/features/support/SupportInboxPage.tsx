import { ArrowLeft } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { describeError } from '../../services/api';
import {
  getAdminSupportRequests,
  updateAdminSupportRequest,
  type SupportRequest,
  type SupportRequestPage,
  type SupportStatus,
} from '../../services/support';
import './SupportInboxPage.css';

const PAGE_SIZE = 20;

function roleLabel(role: string) {
  const names: Record<string, string> = {
    deaf_hoh: 'Deaf or hard of hearing user',
    deaf: 'Deaf or hard of hearing user',
    interpreter: 'Interpreter',
    institution: 'Institution user',
  };
  return names[role] ?? role;
}

function RequestEditor({
  request,
  onSaved,
}: {
  request: SupportRequest;
  onSaved: (updated: SupportRequest) => void;
}) {
  const [status, setStatus] = useState<SupportStatus>(request.status);
  const [response, setResponse] = useState(request.admin_response ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      const updated = await updateAdminSupportRequest(request.id, {
        status,
        admin_response: response,
      });
      onSaved(updated);
      setSaved(true);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="si-detail">
      <header>
        <span className={`si-status si-status--${request.status.toLowerCase()}`}>
          {request.status.replace('_', ' ').toLowerCase()}
        </span>
        <time dateTime={request.created_at}>{new Date(request.created_at).toLocaleString()}</time>
      </header>
      <h2>{request.subject}</h2>
      <p className="si-category">{request.category.replaceAll('_', ' ')}</p>
      <div className="si-requester">
        <strong>{request.requester.name}</strong>
        <span>
          {roleLabel(request.requester.role)}
          {request.requester.institution_role
            ? ` (${request.requester.institution_role.toLowerCase()})`
            : ''}
          {' · '}User #{request.requester.user_id}
        </span>
        {request.requester.institution_name && <span>{request.requester.institution_name}</span>}
      </div>
      <p className="si-message">{request.message}</p>
      <form className="si-response-form" onSubmit={(event) => void save(event)}>
        <label>
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as SupportStatus)}
          >
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </label>
        <label>
          Admin response or follow-up note
          <textarea
            value={response}
            onChange={(event) => setResponse(event.target.value)}
            rows={5}
            maxLength={4000}
            placeholder="Record how this request was handled or what follow-up is needed."
          />
        </label>
        {error && (
          <p className="si-error" role="alert">
            {error}
          </p>
        )}
        {saved && (
          <p className="si-saved" role="status">
            Support request updated.
          </p>
        )}
        <button className="si-save" type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save update'}
        </button>
      </form>
    </article>
  );
}

export function SupportInboxPage() {
  const [filter, setFilter] = useState<SupportStatus | 'ALL'>('OPEN');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<SupportRequestPage | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getAdminSupportRequests(page, PAGE_SIZE, filter).then(
      (result) => {
        if (!cancelled) {
          setData(result);
          setError('');
          setLoading(false);
        }
      },
      (err) => {
        if (!cancelled) {
          setError(describeError(err));
          setLoading(false);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [page, filter]);

  const selected = data?.results.find((item) => item.id === selectedId) ?? null;

  function saveUpdated(updated: SupportRequest) {
    const leavesCurrentView = filter !== 'ALL' && updated.status !== filter;
    if (leavesCurrentView) setSelectedId(null);
    setData((current) =>
      current
        ? {
            ...current,
            count: leavesCurrentView ? Math.max(0, current.count - 1) : current.count,
            results: leavesCurrentView
              ? current.results.filter((item) => item.id !== updated.id)
              : current.results.map((item) => (item.id === updated.id ? updated : item)),
          }
        : current,
    );
    window.dispatchEvent(new Event('support-requests-updated'));
  }

  return (
    <main className="si-page">
      <header className="si-header">
        <div>
          <h1>Support requests</h1>
          <p>
            Review questions and problems reported by Deaf users, interpreters, and institutions.
          </p>
        </div>
        <label className="si-filter">
          Show
          <select
            value={filter}
            onChange={(event) => {
              setLoading(true);
              setPage(1);
              setSelectedId(null);
              setFilter(event.target.value as SupportStatus | 'ALL');
            }}
          >
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="ALL">All requests</option>
          </select>
        </label>
      </header>
      {error && (
        <p className="si-error" role="alert">
          {error}
        </p>
      )}
      {selected ? (
        <section className="si-detail-view" aria-label="Selected support request">
          <button type="button" className="si-back" onClick={() => setSelectedId(null)}>
            <ArrowLeft size={17} aria-hidden="true" />
            Back to requests
          </button>
          <RequestEditor key={selected.id} request={selected} onSaved={saveUpdated} />
        </section>
      ) : (
        <section className="si-list" aria-label="Support request list">
          <div className="si-list-heading">
            <h2>Inbox</h2>
            <span>{data?.count ?? 0} requests</span>
          </div>
          {loading && <p className="si-muted">Loading requests…</p>}
          {!loading && data?.results.length === 0 && (
            <p className="si-muted">There are no requests in this view.</p>
          )}
          {!!data?.results.length && (
            <div className="si-table-scroll">
              <table className="si-table">
                <thead>
                  <tr>
                    <th scope="col">Requester</th>
                    <th scope="col">Inquiry</th>
                    <th scope="col">User type</th>
                    <th scope="col">Status</th>
                    <th scope="col">Received</th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <button
                          type="button"
                          className="si-request-link"
                          onClick={() => setSelectedId(item.id)}
                        >
                          {item.requester.name}
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="si-request-link si-request-subject"
                          onClick={() => setSelectedId(item.id)}
                        >
                          {item.subject}
                        </button>
                      </td>
                      <td>{roleLabel(item.requester.role)}</td>
                      <td>
                        <span className={`si-status si-status--${item.status.toLowerCase()}`}>
                          {item.status.replace('_', ' ').toLowerCase()}
                        </span>
                      </td>
                      <td>
                        <time dateTime={item.created_at}>
                          {new Date(item.created_at).toLocaleDateString()}
                        </time>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {data && data.count > PAGE_SIZE && (
            <div className="si-pagination">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => {
                  setLoading(true);
                  setPage((current) => current - 1);
                }}
              >
                Previous
              </button>
              <span>
                Page {page} of {Math.ceil(data.count / PAGE_SIZE)}
              </span>
              <button
                type="button"
                disabled={page >= Math.ceil(data.count / PAGE_SIZE)}
                onClick={() => {
                  setLoading(true);
                  setPage((current) => current + 1);
                }}
              >
                Next
              </button>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
