// src/services/admin.ts
import { api } from './api';

/* ---------- Summary (existing endpoint) ---------- */
export interface AdminDashboardSummary {
  totalUsers: number;
  dhhUsers: number;
  institutions: number;
  interpreters: number;
  pendingVerifications: number;
}

interface ApiAdminDashboard {
  interpreters_pending_verification: number;
  institutions_pending_approval: number;
  users_by_role: Record<string, number>;
}

export async function fetchAdminSummary(): Promise<AdminDashboardSummary> {
  const raw = await api<ApiAdminDashboard>('/api/v1/dashboard/admin/');
  const byRole = raw.users_by_role;
  return {
    totalUsers: Object.values(byRole).reduce((sum, n) => sum + n, 0),
    dhhUsers: byRole.deaf_hoh ?? 0,
    institutions: byRole.institution ?? 0,
    interpreters: byRole.interpreter ?? 0,
    pendingVerifications: raw.interpreters_pending_verification,
  };
}

/* ---------- Session activity (sessions per day) ---------- */
export interface SessionActivityPoint {
  label: string;
  value: number;
}

interface ApiSessionActivity {
  labels?: string[];
  values?: number[];
  results?: { label: string; value: number }[];
}

export async function fetchSessionActivity(): Promise<SessionActivityPoint[]> {
  const raw = await api<ApiSessionActivity>('/api/v1/dashboard/admin/sessions-activity/');
  if (raw.results) return raw.results;
  if (raw.labels && raw.values) {
    return raw.labels.map((label, i) => ({ label, value: raw.values?.[i] ?? 0 }));
  }
  return [];
}

/* ---------- Session types breakdown ---------- */
export interface SessionTypesBreakdown {
  vri: number;
  onsite: number;
  pending: number;
  total: number;
}

interface ApiSessionTypes {
  vri?: number;
  onsite?: number;
  pending?: number;
  total?: number;
  by_type?: Record<string, number>;
}

export async function fetchSessionTypes(): Promise<SessionTypesBreakdown> {
  const raw = await api<ApiSessionTypes>('/api/v1/dashboard/admin/session-types/');
  const by = raw.by_type ?? {};
  const vri = raw.vri ?? by.vri ?? by.video ?? 0;
  const onsite = raw.onsite ?? by.onsite ?? by['on-site'] ?? 0;
  const pending = raw.pending ?? by.pending ?? 0;
  const total = raw.total ?? vri + onsite + pending;
  return { vri, onsite, pending, total };
}

/* ---------- Activity feed ---------- */
export interface ActivityItem {
  text: string;
  time: string;
}

interface ApiActivityItem {
  text?: string;
  message?: string;
  description?: string;
  time?: string;
  created_at?: string;
  timestamp?: string;
}

export async function fetchActivityFeed(): Promise<ActivityItem[]> {
  const raw = await api<ApiActivityItem[] | { results: ApiActivityItem[] }>(
    '/api/v1/dashboard/admin/activity/',
  );
  const items = Array.isArray(raw) ? raw : (raw.results ?? []);
  return items.map((it) => ({
    text: it.text ?? it.message ?? it.description ?? 'Activity',
    time: it.time ?? it.created_at ?? it.timestamp ?? '',
  }));
}

/* ---------- Top locations ---------- */
export interface LocationItem {
  label: string;
  value: number;
  pct: number;
}

interface ApiLocationItem {
  label?: string;
  name?: string;
  region?: string;
  value?: number;
  count?: number;
}

export async function fetchTopLocations(): Promise<LocationItem[]> {
  const raw = await api<ApiLocationItem[] | { results: ApiLocationItem[] }>(
    '/api/v1/dashboard/admin/top-locations/',
  );
  const items = Array.isArray(raw) ? raw : (raw.results ?? []);
  const max = Math.max(1, ...items.map((i) => i.value ?? i.count ?? 0));
  return items.map((i) => {
    const value = i.value ?? i.count ?? 0;
    return {
      label: i.label ?? i.name ?? i.region ?? 'Unknown',
      value,
      pct: Math.round((value / max) * 100),
    };
  });
}

/* ---------- User growth (points for the line) ---------- */
export interface GrowthPoint {
  label: string;
  value: number;
}

interface ApiGrowth {
  labels?: string[];
  values?: number[];
  results?: { label: string; value: number }[];
}

export async function fetchUserGrowth(): Promise<GrowthPoint[]> {
  const raw = await api<ApiGrowth>('/api/v1/dashboard/admin/user-growth/');
  if (raw.results) return raw.results;
  if (raw.labels && raw.values) {
    return raw.labels.map((label, i) => ({ label, value: raw.values?.[i] ?? 0 }));
  }
  return [];
}

/* ---------- Interpreter performance ---------- */
export interface InterpreterPerformance {
  sessionsThisWeek: number;
  avgDuration: string;
  completionRate: string;
}

interface ApiPerformance {
  sessions_this_week?: number;
  avg_duration?: string;
  completion_rate?: string | number;
}

export async function fetchInterpreterPerformance(): Promise<InterpreterPerformance> {
  const raw = await api<ApiPerformance>('/api/v1/dashboard/admin/interpreter-performance/');
  return {
    sessionsThisWeek: raw.sessions_this_week ?? 0,
    avgDuration: raw.avg_duration ?? '—',
    completionRate:
      typeof raw.completion_rate === 'number'
        ? `${raw.completion_rate}%`
        : (raw.completion_rate ?? '—'),
  };
}

/* ---------- Verification status breakdown ---------- */
export interface VerificationStatusBreakdown {
  approved: number;
  pending: number;
  rejected: number;
  flagged: number;
  total: number;
}

interface ApiVerificationStatus {
  approved?: number;
  pending?: number;
  rejected?: number;
  flagged?: number;
  total?: number;
}

export async function fetchVerificationStatus(): Promise<VerificationStatusBreakdown> {
  const raw = await api<ApiVerificationStatus>('/api/v1/dashboard/admin/verification-status/');
  const approved = raw.approved ?? 0;
  const pending = raw.pending ?? 0;
  const rejected = raw.rejected ?? 0;
  const flagged = raw.flagged ?? 0;
  const total = raw.total ?? approved + pending + rejected + flagged;
  return { approved, pending, rejected, flagged, total };
}

/* ---------- Upcoming sessions ---------- */
export interface SessionRow {
  id: string;
  date: string;
  client: string;
  interpreter: string;
  type: string;
  status: 'Scheduled' | 'Pending' | 'Completed' | string;
}

interface ApiSessionRow {
  id?: string | number;
  date?: string;
  date_time?: string;
  client?: string;
  client_name?: string;
  interpreter?: string;
  interpreter_name?: string;
  type?: string;
  session_type?: string;
  status?: string;
}

export async function fetchUpcomingSessions(): Promise<SessionRow[]> {
  const raw = await api<ApiSessionRow[] | { results: ApiSessionRow[] }>(
    '/api/v1/dashboard/admin/upcoming-sessions/',
  );
  const items = Array.isArray(raw) ? raw : (raw.results ?? []);
  return items.map((s) => ({
    id: String(s.id ?? ''),
    date: s.date_time ?? s.date ?? '',
    client: s.client_name ?? s.client ?? '',
    interpreter: s.interpreter_name ?? s.interpreter ?? '',
    type: s.session_type ?? s.type ?? '',
    status: s.status ?? 'Scheduled',
  }));
}
