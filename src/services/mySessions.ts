import { api } from './api';

/** How a request ended up, in the words a person sees in their history. */
export type HistoryStatus = 'waiting' | 'matched' | 'cancelled' | 'missed';

export interface HistoryItem {
  id: string;
  status: HistoryStatus;
  /** The interpreter, once one accepted. */
  interpreterName: string | null;
  emergency: boolean;
  createdAt: string;
}

interface ApiRequest {
  id: number | string;
  status: string;
  priority?: string;
  created_at: string;
  interpreter?: { name: string } | null;
}

const STATUS: Record<string, HistoryStatus> = {
  CREATED: 'waiting',
  PENDING: 'waiting',
  OFFERED: 'waiting',
  ASSIGNED: 'matched',
  CANCELLED: 'cancelled',
  FAILED: 'missed',
};

/** The API may answer with a plain list or a paged `{ results }`. */
const rows = (body: ApiRequest[] | { results: ApiRequest[] }) =>
  Array.isArray(body) ? body : body.results;

/** GET /api/v1/requests/: every request the signed-in person has made, newest first. */
export async function getMySessions(): Promise<HistoryItem[]> {
  const body = await api<ApiRequest[] | { results: ApiRequest[] }>('/api/v1/requests/');
  return rows(body).map((r) => ({
    id: String(r.id),
    status: STATUS[r.status] ?? 'waiting',
    interpreterName: r.interpreter?.name ?? null,
    emergency: r.priority === 'EMERGENCY',
    createdAt: r.created_at,
  }));
}
