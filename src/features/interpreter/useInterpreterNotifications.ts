import { useEffect, useState } from 'react';
import { fetchNotifications, type AppNotification } from '../../services/notifications';

export function useInterpreterNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const unreadCount = notifications.filter((n) => n.read_at === null).length;

  useEffect(() => {
    let cancelled = false;

    // 👇 Define the load function INSIDE the effect to avoid dependency warnings and cascading renders
    const load = async (isInitial = false) => {
      if (isInitial) setLoading(true);
      try {
        setError('');
        const data = await fetchNotifications();
        if (!cancelled) {
          setNotifications(data);
          setLoading(false);
        }
      } catch (err: unknown) {
        // 👇 Fixed the "any" error by using "unknown" and checking the type
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load notifications';
          setError(message);
          setLoading(false);
        }
      }
    };

    // Run immediately on mount
    void load(true);

    // Check for new notifications every 30 seconds
    const interval = setInterval(() => {
      void load(false); // Don't show the loading spinner for background polls
    }, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { notifications, unreadCount, loading, error };
}
