import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import splashLogo from '../../assets/no_bg.png';
import './SplashPage.css';

/** How long the splash stays up before moving on to the public landing page. */
export const SPLASH_DURATION_MS = 2200;

/**
 * First-entry splash screen for SignConnect: just the logo and name on a plain background, then it
 * moves on to the public landing page by itself (like the WhatsApp / Instagram launch screens).
 */
export function SplashPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate('/landing', { replace: true }), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <main className="splash-page">
      <h1 className="splash-sr-only">SignConnect</h1>
      <div className="splash-logo-frame">
        {/* The artwork also carries the "VRI Platform" line and the tagline at the bottom; the
            frame crops them so only the logo and the name show. */}
        <img className="splash-logo" src={splashLogo} alt="SignConnect" />
      </div>
    </main>
  );
}
