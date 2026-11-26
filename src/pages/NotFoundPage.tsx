import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import signConnectLogo from '../assets/no_bg.png';
import errorIllustration from '../assets/404.png';
import './NotFoundPage.css';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main className="not-found-page">
      <svg
        className="not-found-wave"
        viewBox="0 0 1000 300"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="not-found-wave-fill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#c4a3ff" />
            <stop offset="52%" stopColor="#e0d1ff" />
            <stop offset="100%" stopColor="#c7a8ff" />
          </linearGradient>
        </defs>
        <path
          d="M0 62 C135 24 222 54 340 103 C464 154 545 206 672 192 C808 177 907 70 1000 42 L1000 300 L0 300 Z"
          fill="url(#not-found-wave-fill)"
        />
      </svg>
      <div className="not-found-orb not-found-orb--logo" aria-hidden="true" />
      <div className="not-found-orb not-found-orb--right" aria-hidden="true" />
      <div className="not-found-orb not-found-orb--bottom" aria-hidden="true" />

      <header className="not-found-header">
        <Link className="not-found-brand" to="/" aria-label="SignConnect home">
          <img src={signConnectLogo} alt="SignConnect" />
        </Link>
      </header>

      <section className="not-found-content" aria-labelledby="not-found-title">
        <div className="not-found-art" aria-label="Error 404" role="img">
          <img src={errorIllustration} alt="" />
        </div>

        <div className="not-found-copy">
          <h1 id="not-found-title">Oops! Page Not Found</h1>
          <p className="not-found-description">
            The page you are looking for might have been moved, deleted or does not exist.
          </p>
          <div className="not-found-actions">
            <button className="not-found-retry" onClick={() => navigate(-1)} type="button">
              <ArrowLeft aria-hidden="true" size={24} />
              <span>Go Back</span>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
