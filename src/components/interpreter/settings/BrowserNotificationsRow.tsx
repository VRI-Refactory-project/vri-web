import { useBrowserNotifications } from '../../../features/notifications/useBrowserNotifications';
import { ToggleRow } from './ToggleRow';

/** The switch for notifications that arrive even when SignConnect is closed. Hidden when not possible. */
export function BrowserNotificationsRow() {
  const { state, busy, error, toggle } = useBrowserNotifications();

  if (state === 'checking' || state === 'unavailable') return null;

  return (
    <>
      <ToggleRow
        title="Browser notifications"
        description="Get session updates on this computer, even when SignConnect is closed."
        on={state === 'on'}
        onToggle={() => {
          if (!busy) void toggle();
        }}
      />
      {error && (
        <p className="is-row-error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
