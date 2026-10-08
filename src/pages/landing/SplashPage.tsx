import { ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import splashLogo from '../../assets/splsh_logo.png';
import './SplashPage.css';

/**
 * First-entry splash screen for SignConnect.
 *
 * This page is intentionally frontend-only. Continue hands off to the
 * existing public landing page, while Log in keeps the existing auth flow.
 */
export function SplashPage() {
  const navigate = useNavigate();

  return (
    <main className="splash-page">
      <section className="splash-content" aria-labelledby="splash-title">
        <img className="splash-logo" src={splashLogo} alt="SignConnect VRI Platform" />

        <h1 id="splash-title" className="splash-title">
          Inclusive Communication. Anytime. Anywhere.
        </h1>

        <p className="splash-description">
          Connect instantly with certified sign-language interpreters.
        </p>

        <button
          type="button"
          className="splash-continue"
          onClick={() => navigate('/landing')}
        >
          <span>Continue</span>
          <ArrowRight size={18} aria-hidden="true" />
        </button>

        <p className="splash-login-prompt">
          Already have an account?{' '}
          <Link to="/sign-in" className="splash-login-link">
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}
