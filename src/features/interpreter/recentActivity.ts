import { useEffect, useState } from 'react';
import { api, describeError } from '../../services/api';

/** One item from GET /api/v1/notifications/ (NotificationSerializer), newest first. */
export interface ActivityItem {
  id: number;
  title: string;
  body: string;
  category: string;
  read_at: string | null;
  created_at: string;
  actor_name?: string | null; // the Deaf user's name (session items only)
  actor_photo?: string | null; // path to their photo, or null
}

/** How many items the card shows. */
const SHOWN = 5;

const MINUTE = 60_000;

/** "Just now", "5 minutes ago", "2 hours ago", "Yesterday", "3 days ago", or "Oct 14". */
export function timeAgo(iso: string, now = new Date()): string {
  const minutes = Math.floor((now.getTime() - new Date(iso).getTime()) / MINUTE);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;

  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** The colour of the timeline dot, from the notification's category. */
export function markerClass(category: string): string {
  if (category === 'incoming_request') return 'bg-purple';
  if (category === 'offer_reminder') return 'bg-blue';
  return 'bg-green';
}

/** The latest notifications for the "Recent activity" card. */
export function useRecentActivity() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api<ActivityItem[]>('/api/v1/notifications/').then(
      (data) => {
        if (cancelled) return;
        setItems(Array.isArray(data) ? data.slice(0, SHOWN) : []);
        setLoading(false);
      },
      (err: unknown) => {
        if (cancelled) return;
        setError(describeError(err));
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  return { items, loading, error };
}
