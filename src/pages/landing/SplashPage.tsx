import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import splashLogo from '../../assets/no_bg.png';
import './SplashPage.css';

/** How long the splash stays up before moving on to the public landing page. */
export const SPLASH_DURATION_MS = 2200;

const SPLASH_SEEN_KEY = 'signconnect.splashSeen';

function splashAlreadySeen(): boolean {
  try {
    return sessionStorage.getItem(SPLASH_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

function markSplashSeen(): void {
  try {
    sessionStorage.setItem(SPLASH_SEEN_KEY, '1');
  } catch {
    // Storage can be blocked (private mode); the splash then simply shows again.
  }
}

/**
 * First-entry splash screen for SignConnect: just the logo and name on a plain background, then it
 * moves on to the public landing page by itself (like the WhatsApp / Instagram launch screens).
 *
 * It only plays once each time the app is opened. After that, going "back" to "/" skips straight
 * to the landing page.
 */
export function SplashPage() {
  const navigate = useNavigate();
  const [alreadySeen] = useState(splashAlreadySeen);

  useEffect(() => {
    if (alreadySeen) {
      navigate('/landing', { replace: true });
      return;
    }

    markSplashSeen();
    const timer = setTimeout(() => navigate('/landing', { replace: true }), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [alreadySeen, navigate]);

  if (alreadySeen) return null;

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
