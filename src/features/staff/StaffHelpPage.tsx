import { Link } from 'react-router-dom';
import '../../pages/deaf/SessionsPages.css';
import './StaffPages.css';

const FAQ = [
  {
    q: 'How do I start a call with an interpreter?',
    a: 'Choose Start session on your dashboard, pick the language and what the call is about, then send the request. You will join the call as soon as an interpreter accepts.',
  },
  {
    q: 'Can I book an interpreter for later?',
    a: 'Yes. Choose Schedule session on your dashboard and pick a date and time.',
  },
  {
    q: 'Where can I see my past calls?',
    a: 'Open Sessions in the sidebar. Select any call to see its details.',
  },
  {
    q: 'How do I change my password?',
    a: 'Open Settings in the sidebar and use Change password. You will be signed out on your other devices.',
  },
  {
    q: 'I cannot sign in or my account details are wrong.',
    a: 'Ask your institution’s administrator. They manage staff accounts and can resend your login details.',
  },
];

/** Answers to the questions staff ask most, kept on the page so they work offline too. */
export function StaffHelpPage() {
  return (
    <div className="sh-page">
      <header className="sh-header">
        <h1>Help &amp; Support</h1>
        <p>Quick answers about using SignConnect.</p>
      </header>
      <section className="sp-card sp-faq" aria-label="Frequently asked questions">
        <h2>Frequently asked questions</h2>
        {FAQ.map(({ q, a }) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </section>
      <section className="sp-card" aria-label="Other help">
        <h2>Still stuck?</h2>
        <p>
          Your institution’s administrator can help with accounts. For anything about a call, open
          it from <Link to="/dashboard/staff/sessions">Sessions</Link> and note the details.
        </p>
      </section>
    </div>
  );
}
