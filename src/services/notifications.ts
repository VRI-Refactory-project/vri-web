import { api } from './api';

export interface AppNotification {
  id: number;
  title: string;
  body: string;
  category: string;
  read_at: string | null;
  created_at: string;
}

interface ApiNotification {
  id: number;
  title: string;
  body?: string;
  category?: string;
  read_at?: string | null;
  created_at?: string;
}

export async function fetchNotifications(): Promise<AppNotification[]> {
  const raw = await api<ApiNotification[] | { results: ApiNotification[] }>(
    '/api/v1/notifications/',
  );
  const items = Array.isArray(raw) ? raw : (raw.results ?? []);
  return items.map((n) => ({
    id: n.id,
    title: n.title ?? '',
    body: n.body ?? '',
    category: n.category ?? 'general',
    read_at: n.read_at ?? null,
    created_at: n.created_at ?? '',
  }));
}

export async function markNotificationRead(id: number): Promise<void> {
  await api(`/api/v1/notifications/${id}/read/`, { method: 'POST' });
}
