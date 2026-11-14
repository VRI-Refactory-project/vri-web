import { api } from './api';

/** How a request ended up, in the words a person sees in their history. */
export type HistoryStatus = 'waiting' | 'matched' | 'completed' | 'cancelled' | 'missed';

export interface HistoryItem {
  id: string;
  status: HistoryStatus;
  /** The interpreter, once one accepted. */
  interpreterName: string | null;
  emergency: boolean;
  createdAt: string;
}

/** One request in full, for the details screen. */
export interface SessionDetail extends HistoryItem {
  /** The sign languages the interpreter works in, once one accepted. */
  languages: string;
  /** GENERAL, MEDICAL or LEGAL. */
  specialisation: string;
  description: string;
  /** When an interpreter accepted. */
  matchedAt: string | null;
}

interface ApiRequest {
  id: number | string;
  status: string;
  priority?: string;
  created_at: string;
  assigned_at?: string | null;
  specialisation_required?: string;
  description?: string;
  interpreter?: { name: string; languages?: string } | null;
}

const STATUS: Record<string, HistoryStatus> = {
  CREATED: 'waiting',
  PENDING: 'waiting',
  OFFERED: 'waiting',
  ASSIGNED: 'matched',
  CONNECTING: 'matched',
  ACTIVE: 'matched',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'missed',
};

/** The API may answer with a plain list or a paged `{ results }`. */
const rows = (body: ApiRequest[] | { results: ApiRequest[] }) =>
  Array.isArray(body) ? body : body.results;

const toItem = (r: ApiRequest): HistoryItem => ({
  id: String(r.id),
  status: STATUS[r.status] ?? 'waiting',
  interpreterName: r.interpreter?.name ?? null,
  emergency: r.priority === 'EMERGENCY',
  createdAt: r.created_at,
});

/** GET /api/v1/requests/: every request the signed-in person has made, newest first. */
export async function getMySessions(): Promise<HistoryItem[]> {
  const body = await api<ApiRequest[] | { results: ApiRequest[] }>('/api/v1/requests/');
  return rows(body).map(toItem);
}

/** GET /api/v1/requests/<id>/: one of the signed-in person's requests, in full. */
export async function getMySession(id: string): Promise<SessionDetail> {
  const r = await api<ApiRequest>(`/api/v1/requests/${encodeURIComponent(id)}/`);
  return {
    ...toItem(r),
    languages: r.interpreter?.languages ?? '',
    specialisation: r.specialisation_required ?? 'GENERAL',
    description: r.description ?? '',
    matchedAt: r.assigned_at ?? null,
  };
}
