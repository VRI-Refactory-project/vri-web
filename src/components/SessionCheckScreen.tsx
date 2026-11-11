import { useEffect, useState } from 'react';
import logo from '../assets/logo-icon.png';
import './SessionCheckScreen.css';

/** Nothing is shown for this long, so a fast check never flashes a screen. */
export const SESSION_CHECK_DELAY_MS = 300;

/**
 * Shown while the server confirms a stored session, before the dashboard appears.
 * A centred logo and spinner, held back for the first 300 ms.
 */
export function SessionCheckScreen() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), SESSION_CHECK_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  // Keep the status region mounted so screen readers announce it once it has content.
  return (
    <main className="session-check" role="status" aria-live="polite">
      {visible && (
        <div className="session-check-content">
          <img className="session-check-logo" src={logo} alt="" />
          <span className="session-check-spinner" aria-hidden="true" />
          <span className="session-check-sr-only">Checking your session…</span>
        </div>
      )}
    </main>
  );
}
