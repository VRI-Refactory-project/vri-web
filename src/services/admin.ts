import { api } from './api';

/* ---------- Summary (existing endpoint) ---------- */
export interface AdminDashboardSummary {
  totalUsers: number;
  dhhUsers: number;
  institutions: number;
  interpreters: number;
  pendingVerifications: number;
  top_session_types?: { type: string; count: number }[];
  unread_notifications?: number;
  available_interpreters?: number;
  offline_interpreters?: number;
}

interface ApiAdminDashboard {
  interpreters_pending_verification: number;
  institutions_pending_approval: number;
  users_by_role: Record<string, number>;
  top_session_types?: { type: string; count: number }[];
  unread_notifications?: number;
  available_interpreters?: number;
  offline_interpreters?: number;
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
    top_session_types: raw.top_session_types ?? [],
    unread_notifications: raw.unread_notifications ?? 0,
    available_interpreters: raw.available_interpreters ?? 0,
    offline_interpreters: raw.offline_interpreters ?? 0,
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
  avgResponseTime: string;
  completionRate: string;
  responseTrend: string;
  completionTrend: string;
}

interface ApiPerformancePayload {
  avg_response_time?: string;
  completion_rate?: number;
  response_trend?: string;
  completion_trend?: string;
}

export async function fetchInterpreterPerformance(): Promise<InterpreterPerformance> {
  // Reads from the same admin dashboard endpoint (avoids a second request)
  const raw = await api<{ performance?: ApiPerformancePayload }>('/api/v1/dashboard/admin/');
  const p = raw.performance ?? {};
  return {
    avgResponseTime: p.avg_response_time ?? '0m 0s',
    completionRate: `${p.completion_rate ?? 0}%`,
    responseTrend: p.response_trend ?? '+0%',
    completionTrend: p.completion_trend ?? '+0%',
  };
}

/* ---------- Detailed interpreter metrics (V2-042) ---------- */
export interface InterpreterMetricRow {
  interpreterId: number;
  interpreterName: string;
  specialisation: string;
  averageRating: number | null;
  ratingCount: number;
  completedSessions: number;
  lowRatingCount: number;
}

export interface InterpreterRatingTrend {
  month: string;
  averageRating: number | null;
  ratingCount: number;
}

export interface LowRatingFeedback {
  id: number;
  interpreterName: string;
  sessionDate: string;
  rating: number;
  comment: string;
}

export interface InterpreterMetrics {
  summary: {
    averageRating: number | null;
    ratingsCount: number;
    lowRatingCount: number;
    completedSessions: number;
  };
  trendStartMonth: string;
  trends: InterpreterRatingTrend[];
  interpreters: InterpreterMetricRow[];
  interpreterPagination: { count: number; page: number; pageSize: number };
  lowRatings: LowRatingFeedback[];
}

interface ApiInterpreterMetrics {
  summary: {
    average_rating: number | null;
    ratings_count: number;
    low_rating_count: number;
    completed_sessions: number;
  };
  trend_start_month: string;
  trends: { month: string; average_rating: number | null; rating_count: number }[];
  interpreters: {
    count: number;
    next: string | null;
    previous: string | null;
    results: {
      interpreter_id: number;
      interpreter_name: string;
      specialisation: string | null;
      average_rating: number | null;
      rating_count: number;
      completed_sessions: number;
      low_rating_count: number;
    }[];
  };
  low_ratings: {
    id: number;
    interpreter_name: string;
    session_date: string;
    rating: number;
    comment: string | null;
  }[];
}

export async function fetchInterpreterMetrics(
  page = 1,
  pageSize = 10,
): Promise<InterpreterMetrics> {
  const raw = await api<ApiInterpreterMetrics>(
    `/api/v1/dashboard/admin/interpreter-performance/?page=${page}&page_size=${pageSize}`,
  );
  return {
    summary: {
      averageRating: raw.summary.average_rating,
      ratingsCount: raw.summary.ratings_count,
      lowRatingCount: raw.summary.low_rating_count,
      completedSessions: raw.summary.completed_sessions,
    },
    trendStartMonth: raw.trend_start_month,
    trends: raw.trends.map((item) => ({
      month: item.month,
      averageRating: item.average_rating,
      ratingCount: item.rating_count,
    })),
    interpreters: raw.interpreters.results.map((item) => ({
      interpreterId: item.interpreter_id,
      interpreterName: item.interpreter_name,
      specialisation: item.specialisation ?? 'Not specified',
      averageRating: item.average_rating,
      ratingCount: item.rating_count,
      completedSessions: item.completed_sessions,
      lowRatingCount: item.low_rating_count,
    })),
    interpreterPagination: { count: raw.interpreters.count, page, pageSize },
    lowRatings: raw.low_ratings.map((item) => ({
      id: item.id,
      interpreterName: item.interpreter_name,
      sessionDate: item.session_date,
      rating: item.rating,
      comment: item.comment ?? '',
    })),
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

/* ---------- Live interpreter availability ---------- */

export interface InterpreterAvailabilityRow {
  id: number;
  name: string;
  photo_url: string | null;
  is_available: boolean;
  available_now: boolean;
  reason: 'switched_off' | 'day_off' | 'outside_hours' | null;
}

export interface InterpreterAvailabilityData {
  total: number;
  available: number;
  unavailable: number;
  interpreters: InterpreterAvailabilityRow[];
}

export async function fetchInterpreterAvailability(): Promise<InterpreterAvailabilityData> {
  return api<InterpreterAvailabilityData>('/api/v1/dashboard/admin/interpreter-availability/');
}
