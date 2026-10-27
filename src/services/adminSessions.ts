// src/services/adminSessions.ts
import { api } from './api';

export interface AdminSessionStats {
  liveNow: number;
  liveStable: number;
  connecting: number;
  connectingAverageSeconds: number;
  needsAttention: number;
}

export interface AdminSession {
  id: string;
  sector: string;
  participant: string;
  status: string;
  startedAt: string;
  connection: 'stable' | 'review';
}

interface ApiStats {
  live_now?: number;
  live_stable?: number;
  connecting?: number;
  connecting_avg_seconds?: number;
  needs_attention?: number;
}

/** GET /api/v1/admin/sessions/stats/ */
export async function fetchAdminSessionStats(): Promise<AdminSessionStats> {
  const raw = await api<ApiStats>('/api/v1/admin/sessions/stats/');
  return {
    liveNow: raw.live_now ?? 0,
    liveStable: raw.live_stable ?? 0,
    connecting: raw.connecting ?? 0,
    connectingAverageSeconds: raw.connecting_avg_seconds ?? 0,
    needsAttention: raw.needs_attention ?? 0,
  };
}

interface ApiSession {
  id?: string | number;
  sector?: string;
  participant_name?: string;
  participant?: string;
  status?: string;
  started_at?: string;
  connection?: string;
}

function normalizeSession(raw: ApiSession): AdminSession {
  const conn = String(raw.connection ?? 'stable').toLowerCase();
  return {
    id: String(raw.id ?? ''),
    sector: raw.sector ?? '',
    participant: raw.participant_name ?? raw.participant ?? '',
    status: raw.status ?? '',
    startedAt: raw.started_at ?? '',
    connection: conn === 'review' || conn === 'unstable' ? 'review' : 'stable',
  };
}

function unwrap(value: unknown): ApiSession[] {
  if (Array.isArray(value)) return value as ApiSession[];
  if (
    value &&
    typeof value === 'object' &&
    Array.isArray((value as { results?: unknown }).results)
  ) {
    return (value as { results: ApiSession[] }).results;
  }
  return [];
}

/** GET /api/v1/admin/sessions/ */
export async function fetchAdminSessions(): Promise<AdminSession[]> {
  const raw = await api<unknown>('/api/v1/admin/sessions/');
  return unwrap(raw)
    .map(normalizeSession)
    .filter((s) => s.id);
}
