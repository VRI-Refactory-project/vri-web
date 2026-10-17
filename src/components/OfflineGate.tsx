import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { OfflinePage } from '../pages/OfflinePage';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

// Renders the active route and shows an offline overlay when the connection drops.
// The route underneath remains mounted, so form data is not lost.
export function OfflineGate() {
  const { online, offlineCount, recheck } = useOnlineStatus();
  const [dismissedOfflineCount, setDismissedOfflineCount] = useState(-1);

  const showOffline = !online && dismissedOfflineCount !== offlineCount;

  return (
    <>
      <Outlet />

      {showOffline && (
        <OfflinePage
          overlay
          onRetry={recheck}
          onBack={() => setDismissedOfflineCount(offlineCount)}
        />
      )}
    </>
  );
}
