import { useEffect, useRef, useState } from 'react';
import { ApiError } from '../../services/api';
import {
  WebPushBlocked,
  disableWebPush,
  enableWebPush,
  getWebPushKey,
  syncWebPush,
  webPushSupported,
} from '../../services/webPush';

/**
 * checking: still finding out. unavailable: this browser or this server cannot do it, so show nothing.
 * off and on: the person can switch it.
 */
type State = 'checking' | 'unavailable' | 'off' | 'on';

/** Browser notifications (shown even when the site is closed) for the signed-in person. */
export function useBrowserNotifications() {
  const [state, setState] = useState<State>('checking');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const publicKey = useRef('');

  useEffect(() => {
    let cancelled = false;
    const finish = (next: State) => {
      if (!cancelled) setState(next);
    };

    async function check() {
      if (!webPushSupported()) return finish('unavailable');
      try {
        publicKey.current = await getWebPushKey();
        // No key means the server has browser notifications switched off.
        if (!publicKey.current) return finish('unavailable');
        finish((await syncWebPush()) ? 'on' : 'off');
      } catch {
        finish('unavailable');
      }
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      if (state === 'on') {
        await disableWebPush();
        setState('off');
      } else {
        await enableWebPush(publicKey.current);
        setState('on');
      }
    } catch (err) {
      setError(
        err instanceof WebPushBlocked
          ? 'Notifications are blocked for this site. Allow them in your browser settings, then try again.'
          : err instanceof ApiError
            ? err.message
            : 'We could not change this in your browser. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  return { state, busy, error, toggle };
}
