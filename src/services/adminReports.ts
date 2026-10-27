// src/services/adminReports.ts
import { api } from './api';

export interface AdminReportStats {
  totalReports: number;
  totalDeltaPercent: number;
  reportsThisMonth: number;
  monthDeltaPercent: number;
  scheduledReports: number;
  lastGeneratedLabel: string;
}

export interface AdminReport {
  id: string;
  name: string;
  generatedAt: string;
  generatedBy: string;
  status: 'ready' | 'processing' | 'failed';
}

export interface AdminReportActivity {
  usersRegistered: number;
  usersDeltaPercent: number;
  activeSessions: number;
  sessionsDeltaPercent: number;
  reportsCompleted: number;
  reportsDeltaPercent: number;
  sessionsCancelled: number;
  cancelledDeltaPercent: number;
}

interface ApiStats {
  total_reports?: number;
  total_delta_percent?: number;
  reports_this_month?: number;
  month_delta_percent?: number;
  scheduled_reports?: number;
  last_generated_label?: string;
}

/** GET /api/v1/admin/reports/stats/ */
export async function fetchAdminReportStats(): Promise<AdminReportStats> {
  const raw = await api<ApiStats>('/api/v1/admin/reports/stats/');
  return {
    totalReports: raw.total_reports ?? 0,
    totalDeltaPercent: raw.total_delta_percent ?? 0,
    reportsThisMonth: raw.reports_this_month ?? 0,
    monthDeltaPercent: raw.month_delta_percent ?? 0,
    scheduledReports: raw.scheduled_reports ?? 0,
    lastGeneratedLabel: raw.last_generated_label ?? '',
  };
}

interface ApiReport {
  id?: string | number;
  name?: string;
  title?: string;
  generated_at?: string;
  generated_by?: string;
  status?: string;
}

function normalizeReport(raw: ApiReport): AdminReport {
  const s = String(raw.status ?? 'ready').toLowerCase();
  return {
    id: String(raw.id ?? ''),
    name: raw.name ?? raw.title ?? 'Report',
    generatedAt: raw.generated_at ?? '',
    generatedBy: raw.generated_by ?? '',
    status: s === 'processing' || s === 'failed' ? s : 'ready',
  };
}

function unwrapReports(value: unknown): ApiReport[] {
  if (Array.isArray(value)) return value as ApiReport[];
  if (
    value &&
    typeof value === 'object' &&
    Array.isArray((value as { results?: unknown }).results)
  ) {
    return (value as { results: ApiReport[] }).results;
  }
  return [];
}

/** GET /api/v1/admin/reports/ */
export async function fetchAdminReports(): Promise<AdminReport[]> {
  const raw = await api<unknown>('/api/v1/admin/reports/');
  return unwrapReports(raw)
    .map(normalizeReport)
    .filter((r) => r.id);
}

interface ApiActivity {
  users_registered?: number;
  users_delta_percent?: number;
  active_sessions?: number;
  sessions_delta_percent?: number;
  reports_completed?: number;
  reports_delta_percent?: number;
  sessions_cancelled?: number;
  cancelled_delta_percent?: number;
}

/** GET /api/v1/admin/reports/activity/ */
export async function fetchAdminReportActivity(): Promise<AdminReportActivity> {
  const raw = await api<ApiActivity>('/api/v1/admin/reports/activity/');
  return {
    usersRegistered: raw.users_registered ?? 0,
    usersDeltaPercent: raw.users_delta_percent ?? 0,
    activeSessions: raw.active_sessions ?? 0,
    sessionsDeltaPercent: raw.sessions_delta_percent ?? 0,
    reportsCompleted: raw.reports_completed ?? 0,
    reportsDeltaPercent: raw.reports_delta_percent ?? 0,
    sessionsCancelled: raw.sessions_cancelled ?? 0,
    cancelledDeltaPercent: raw.cancelled_delta_percent ?? 0,
  };
}
