import { useEffect, useState } from 'react';
import {
  fetchNotifications,
  markAllNotificationsRead,
  type AppNotification,
} from '../../services/notifications';

export function useInterpreterNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const unreadCount = notifications.filter((n) => n.read_at === null).length;

  // 👇 We define markAllRead outside the effect, but it uses the setter safely
  const markAllRead = async () => {
    try {
      await markAllNotificationsRead();
      // Instantly update the UI so the red dot disappears
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to mark notifications as read';
      console.error(message);
    }
  };

  useEffect(() => {
    let cancelled = false;

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
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load notifications';
          setError(message);
          setLoading(false);
        }
      }
    };

    void load(true);

    const interval = setInterval(() => {
      void load(false);
    }, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { notifications, unreadCount, loading, error, markAllRead };
}
