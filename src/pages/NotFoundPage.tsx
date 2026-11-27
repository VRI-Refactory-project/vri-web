import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import signConnectLogo from '../assets/no_bg.png';
import errorIllustration from '../assets/404.png';
import './NotFoundPage.css';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main className="not-found-page">
      <div className="not-found-orb not-found-orb--logo" aria-hidden="true" />

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
