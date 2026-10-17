import { useCallback, useEffect, useState } from 'react';

const CONNECTIVITY_URL = '/api/health/';
const TIMEOUT_MS = 5000;

// Tracks whether the app can reach the internet.
// - online: updates automatically when the browser reports a connection change.
// - offlineCount: increases each time the connection drops.
// - recheck: makes a real request to confirm the app can reach the server.
export function useOnlineStatus() {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [offlineCount, setOfflineCount] = useState(0);

  useEffect(() => {
    const goOnline = () => setOnline(true);

    const goOffline = () => {
      setOnline(false);
      setOfflineCount((count) => count + 1);
    };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const recheck = useCallback(async (): Promise<boolean> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(`${CONNECTIVITY_URL}?_=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });

      const isReachable = response.ok;
      setOnline(isReachable);
      return isReachable;
    } catch {
      setOnline(false);
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }, []);

  return { online, offlineCount, recheck };
}
