// src/services/adminAuditLogs.ts
import { api } from './api';

export interface AdminAuditLog {
  id: string;
  action: string;
  meta: string;
  source: 'admin' | 'system' | 'institution';
  createdAt: string;
}

interface ApiLog {
  id?: string | number;
  action?: string;
  description?: string;
  meta?: string;
  details?: string;
  source?: string;
  created_at?: string;
}

function normalizeLog(raw: ApiLog): AdminAuditLog {
  const src = String(raw.source ?? 'system').toLowerCase();
  return {
    id: String(raw.id ?? ''),
    action: raw.action ?? raw.description ?? 'Activity',
    meta: raw.meta ?? raw.details ?? '',
    source: src === 'admin' || src === 'institution' ? src : 'system',
    createdAt: raw.created_at ?? '',
  };
}

function unwrap(value: unknown): ApiLog[] {
  if (Array.isArray(value)) return value as ApiLog[];
  if (
    value &&
    typeof value === 'object' &&
    Array.isArray((value as { results?: unknown }).results)
  ) {
    return (value as { results: ApiLog[] }).results;
  }
  return [];
}

/** GET /api/v1/admin/audit-logs/ */
export async function fetchAdminAuditLogs(): Promise<AdminAuditLog[]> {
  const raw = await api<unknown>('/api/v1/admin/audit-logs/');
  return unwrap(raw)
    .map(normalizeLog)
    .filter((l) => l.id);
}
