import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { LifeBuoy, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { describeError } from '../../services/api';
import {
  getMySupportRequests,
  submitSupportRequest,
  type MySupportRequestPage,
} from '../../services/support';
import './HelpSupportPage.css';

export type SupportAudience = 'deaf' | 'interpreter' | 'institution_admin' | 'institution_staff';

interface HelpContent {
  title: string;
  description: string;
  categories: { value: string; label: string }[];
  questions: { question: string; answer: string }[];
}

const CONTENT: Record<SupportAudience, HelpContent> = {
  deaf: {
    title: 'Help & Support',
    description: 'Quick answers for connecting with an interpreter and using SignConnect.',
    categories: [
      { value: 'sessions', label: 'Sessions and interpreters' },
      { value: 'accessibility', label: 'Accessibility' },
      { value: 'account', label: 'Account and sign-in' },
      { value: 'technical', label: 'Technical problem' },
      { value: 'other', label: 'Something else' },
    ],
    questions: [
      {
        question: 'How do I start a call with an interpreter?',
        answer:
          'Open Sessions, choose Start a session, tell us what kind of help you need, then send your request. You can join when an interpreter accepts.',
      },
      {
        question: 'How can I book a session for later?',
        answer:
          'Open Sessions and choose Schedule a session. Pick a date and time, then review your booking.',
      },
      {
        question: 'Where can I find my past sessions?',
        answer: 'Open Sessions and choose History to see completed sessions and their details.',
      },
      {
        question: 'Where can I change captions or other access settings?',
        answer:
          'Open Settings, then Accessibility & Preferences. You can adjust available reading and notification options there.',
      },
    ],
  },
  interpreter: {
    title: 'Help & Support',
    description: 'Quick answers about interpreting sessions, availability, and your account.',
    categories: [
      { value: 'sessions', label: 'Requests and sessions' },
      { value: 'availability', label: 'Availability and schedule' },
      { value: 'wallet', label: 'Wallet and payments' },
      { value: 'profile', label: 'Profile and verification' },
      { value: 'technical', label: 'Technical problem' },
      { value: 'other', label: 'Something else' },
    ],
    questions: [
      {
        question: 'How do I receive session requests?',
        answer:
          'Set your availability from Availability. Eligible session requests will appear under Requests for you to review.',
      },
      {
        question: 'How do I join or find a session I accepted?',
        answer:
          'Open Sessions to see your upcoming and completed work. Open an upcoming session to view its details and join when available.',
      },
      {
        question: 'How do I change my working hours?',
        answer: 'Open Availability and update your weekly hours or specific days off.',
      },
      {
        question: 'Where can I see my experience and profile details?',
        answer: 'Open Profile to review and update your interpreter information and experience.',
      },
    ],
  },
  institution_admin: {
    title: 'Help & Support',
    description: 'Quick answers for managing your institution, staff, and interpreting sessions.',
    categories: [
      { value: 'staff', label: 'Staff accounts and access' },
      { value: 'sessions', label: 'Sessions and bookings' },
      { value: 'billing', label: 'Usage and billing' },
      { value: 'account', label: 'Institution account' },
      { value: 'technical', label: 'Technical problem' },
      { value: 'other', label: 'Something else' },
    ],
    questions: [
      {
        question: 'How do I add or manage a staff member?',
        answer: 'Open Staff to create an account, review access, or update staff details.',
      },
      {
        question: 'How do staff request an interpreter?',
        answer:
          'Staff sign in to their own account and choose Start a session or Schedule a session from their dashboard.',
      },
      {
        question: 'Where can I review institutional session use?',
        answer:
          'Open Analytics to review session activity and institutional usage for the available date range.',
      },
      {
        question: 'How do I update institution details?',
        answer:
          'Open Institution Profile to review the registered organisation details and contact information.',
      },
    ],
  },
  institution_staff: {
    title: 'Help & Support',
    description: 'Quick answers for starting sessions and using your institution account.',
    categories: [
      { value: 'sessions', label: 'Sessions and calls' },
      { value: 'bookings', label: 'Scheduled bookings' },
      { value: 'account', label: 'Account and sign-in' },
      { value: 'technical', label: 'Technical problem' },
      { value: 'other', label: 'Something else' },
    ],
    questions: [
      {
        question: 'How do I start a call with an interpreter?',
        answer:
          'Choose Start Interpreter Session on your dashboard, say what the session is about, then send the request. You will join the call when an interpreter accepts.',
      },
      {
        question: 'Can I book an interpreter for later?',
        answer: 'Yes. Choose Book a session on your dashboard and pick a date and time.',
      },
      {
        question: 'Where can I see my past calls?',
        answer: 'Open Sessions in the sidebar. Select a call to see its details.',
      },
      {
        question: 'I cannot sign in or my account details are wrong.',
        answer:
          'Ask your institution administrator. They manage staff accounts and can help restore your access.',
      },
      {
        question: 'How do I change my password?',
        answer:
          'Open Settings and choose Change password. You may need to sign in again on your other devices.',
      },
    ],
  },
};

const SESSIONS_LINK: Record<SupportAudience, string> = {
  deaf: '/dashboard/deaf/sessions',
  interpreter: '/dashboard/interpreter/sessions',
  institution_admin: '/dashboard/institution/sessions',
  institution_staff: '/dashboard/staff/sessions',
};

interface Props {
  audience: SupportAudience;
  extraContent?: ReactNode;
}

const MY_REQUESTS_PAGE_SIZE = 20;

function MySupportRequests({ refreshKey }: { refreshKey: number }) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<MySupportRequestPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getMySupportRequests(page, MY_REQUESTS_PAGE_SIZE).then(
      (result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
          setError('');
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
  }, [page, refreshKey]);

  return (
    <section className="hs-card hs-my-requests" aria-labelledby="hs-my-requests-title">
      <div className="hs-card-heading">
        <LifeBuoy aria-hidden="true" />
        <div>
          <h2 id="hs-my-requests-title">My support requests</h2>
          <p>Check your request status and read replies from the administrators.</p>
        </div>
      </div>
      {error && (
        <p className="hs-error" role="alert">
          {error}
        </p>
      )}
      {loading && <p className="hs-muted">Loading your requests…</p>}
      {!loading && data?.results.length === 0 && (
        <p className="hs-muted">You have not sent any support requests yet.</p>
      )}
      {!!data?.results.length && (
        <div className="hs-request-list">
          {data.results.map((request) => (
            <article className="hs-request" key={request.id}>
              <header>
                <div>
                  <h3>{request.subject}</h3>
                  <span>{request.category.replaceAll('_', ' ')}</span>
                </div>
                <span className={`hs-status hs-status--${request.status.toLowerCase()}`}>
                  {request.status.replace('_', ' ').toLowerCase()}
                </span>
              </header>
              <time dateTime={request.created_at}>
                Sent {new Date(request.created_at).toLocaleDateString()}
              </time>
              <p className="hs-request-message">{request.message}</p>
              <div className="hs-admin-response">
                <strong>Administrator response</strong>
                <p>{request.admin_response || 'The administrators have not replied yet.'}</p>
              </div>
            </article>
          ))}
        </div>
      )}
      {data && data.count > MY_REQUESTS_PAGE_SIZE && (
        <div className="hs-pagination">
          <button
            type="button"
            disabled={!data.previous || loading}
            onClick={() => {
              setLoading(true);
              setPage((current) => current - 1);
            }}
          >
            Previous
          </button>
          <span>
            Page {page} of {Math.ceil(data.count / MY_REQUESTS_PAGE_SIZE)}
          </span>
          <button
            type="button"
            disabled={!data.next || loading}
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
  );
}

export function HelpSupportPage({ audience, extraContent }: Props) {
  const content = CONTENT[audience];
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState(content.categories[0]?.value ?? 'other');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sentId, setSentId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSentId(null);
    try {
      const request = await submitSupportRequest({
        subject: subject.trim(),
        category,
        message: message.trim(),
      });
      setSentId(request.id);
      setRefreshKey((current) => current + 1);
      setSubject('');
      setMessage('');
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="hs-page">
      <header className="hs-header">
        <h1>{content.title}</h1>
        <p>{content.description}</p>
      </header>
      {extraContent}
      <MySupportRequests refreshKey={refreshKey} />
      <section className="hs-card hs-questions" aria-labelledby="hs-questions-title">
        <div className="hs-card-heading">
          <LifeBuoy aria-hidden="true" />
          <div>
            <h2 id="hs-questions-title">Quick questions</h2>
            <p>Choose a question to see a quick answer.</p>
          </div>
        </div>
        {content.questions.map(({ question, answer }) => (
          <details key={question}>
            <summary>{question}</summary>
            <p>{answer}</p>
          </details>
        ))}
        <Link className="hs-link" to={SESSIONS_LINK[audience]}>
          Sessions
        </Link>
      </section>

      <section className="hs-card" aria-labelledby="hs-contact-title">
        <div className="hs-card-heading">
          <Send aria-hidden="true" />
          <div>
            <h2 id="hs-contact-title">Still need help?</h2>
            <p>
              Send a message to the SignConnect administrators so they can review and follow up on
              it.
            </p>
          </div>
        </div>
        {sentId !== null && (
          <p className="hs-success" role="status">
            Your support request #{sentId} was sent.
          </p>
        )}
        {error && (
          <p className="hs-error" role="alert">
            {error}
          </p>
        )}
        <form className="hs-form" onSubmit={(event) => void submit(event)}>
          <label>
            What do you need help with?
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              {content.categories.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Subject
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              maxLength={160}
              required
              placeholder="A short summary of the problem"
            />
          </label>
          <label>
            Describe the problem
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              minLength={10}
              maxLength={4000}
              rows={6}
              required
              placeholder="Tell us what happened and what you were trying to do. Please do not include passwords or PINs."
            />
            <small>{message.length}/4000</small>
          </label>
          <button className="hs-submit" type="submit" disabled={busy}>
            {busy ? 'Sending…' : 'Send to support'}
          </button>
        </form>
      </section>
    </main>
  );
}
