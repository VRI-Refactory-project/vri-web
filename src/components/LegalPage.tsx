import { Fragment, type MouseEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthShell } from './AuthShell';
import { PRIVACY, TERMS, type Block, type LegalDocument } from './LegalText';
import './LegalPage.css';

// Turns **bold** markers in the client's text into <strong>.
function inline(text: string): ReactNode {
  return text
    .split('**')
    .map((part, i) =>
      i % 2 === 1 ? <strong key={i}>{part}</strong> : <Fragment key={i}>{part}</Fragment>,
    );
}

function renderBlock(block: Block, key: number): ReactNode {
  if ('p' in block) return <p key={key}>{inline(block.p)}</p>;
  if ('note' in block)
    return (
      <p key={key} className="legal-note">
        {inline(block.note)}
      </p>
    );
  if ('sub' in block) return <h3 key={key}>{block.sub}</h3>;
  if ('ul' in block)
    return (
      <ul key={key}>
        {block.ul.map((item) => (
          <li key={item}>{inline(item)}</li>
        ))}
      </ul>
    );
  return (
    <div key={key} className="legal-table-wrap">
      <table className="legal-table">
        <thead>
          <tr>
            <th>{block.table.head[0]}</th>
            <th>{block.table.head[1]}</th>
          </tr>
        </thead>
        <tbody>
          {block.table.rows.map(([a, b]) => (
            <tr key={a}>
              <td>{a}</td>
              <td>{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LegalPage({
  doc,
  otherPath,
  otherLabel,
}: {
  doc: LegalDocument;
  otherPath: string;
  otherLabel: string;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  // Back goes to the page the person came from (for example the sign-up form they were filling in).
  // `key === 'default'` means this page was opened directly, with nothing to go back to, so sign-in.
  const goBack = () => {
    if (location.key === 'default') navigate('/sign-in', { replace: true });
    else navigate(-1);
  };

  // Jump to a section without adding a browser history entry, so Back still leaves this page.
  const jumpTo = (id: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <AuthShell onBack={goBack} size="wide">
      <article className="legal-page">
        <header className="legal-hero">
          {doc.company && <p className="legal-company">{doc.company}</p>}
          <h1>{doc.title}</h1>
        </header>

        <div className="legal-body">
          <nav className="legal-toc" aria-label="On this page">
            <p className="legal-toc-title">On this page</p>
            <ul>
              {doc.sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} onClick={jumpTo(s.id)}>
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {doc.sections.map((s) => (
            <section key={s.id} id={s.id} className="legal-section">
              <h2>{s.title}</h2>
              {s.blocks.map(renderBlock)}
            </section>
          ))}

          {/* replace: moving between Terms and Privacy keeps one history entry, so Back still
              returns to where the person started. */}
          <p className="legal-other">
            See also our{' '}
            <Link to={otherPath} replace>
              {otherLabel}
            </Link>
            .
          </p>
        </div>
      </article>
    </AuthShell>
  );
}

export const TermsPage = () => (
  <LegalPage doc={TERMS} otherPath="/privacy" otherLabel="Privacy Policy" />
);

export const PrivacyPage = () => (
  <LegalPage doc={PRIVACY} otherPath="/terms" otherLabel="Terms of Use" />
);
