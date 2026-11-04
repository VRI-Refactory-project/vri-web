import { useCallback, useEffect, useState } from 'react';
import { checkBackendConnection } from '../lib/connectivity';

export function useOnlineStatus() {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [offlineCount, setOfflineCount] = useState(0);

  const recheck = useCallback(async (): Promise<boolean> => {
    const isReachable = await checkBackendConnection();
    setOnline(isReachable);
    return isReachable;
  }, []);

  useEffect(() => {
    const goOnline = () => {
      void recheck();
    };

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
  }, [recheck]);

  return { online, offlineCount, recheck };
}
