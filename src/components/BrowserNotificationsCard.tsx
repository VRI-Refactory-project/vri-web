import { Bell } from 'lucide-react';
import { useBrowserNotifications } from '../features/notifications/useBrowserNotifications';

/** Turn on notifications that arrive even when SignConnect is closed. Hidden when not possible. */
export function BrowserNotificationsCard() {
  const { state, busy, error, toggle } = useBrowserNotifications();

  if (state === 'checking' || state === 'unavailable') return null;

  return (
    <section className="sh-card sh-notify" aria-labelledby="sh-notify-title">
      <span className="sh-card-icon">
        <Bell size={22} aria-hidden />
      </span>
      <span className="sh-card-text">
        <strong id="sh-notify-title">Browser notifications</strong>
        <span>
          {state === 'on'
            ? 'On. You will hear about your sessions even when SignConnect is closed.'
            : 'Hear about your sessions even when SignConnect is closed.'}
        </span>
        {error && (
          <span className="sh-notify-error" role="alert">
            {error}
          </span>
        )}
      </span>
      <button
        type="button"
        className="sh-notify-button"
        onClick={() => void toggle()}
        disabled={busy}
      >
        {state === 'on' ? 'Turn off' : 'Turn on'}
      </button>
    </section>
  );
}
