import { api, apiBlob } from './api';

// V2-029: how much the institution uses VRI (vri-api GET /api/v1/institutions/me/usage/), and the same
// figures as a PDF. Only the institution's administrators may call them.

const USAGE = '/api/v1/institutions/me/usage/';
const USAGE_REPORT = '/api/v1/dashboard/institution/export/';

export interface UsageFilters {
  /** First and last day, YYYY-MM-DD, both included. */
  from: string;
  to: string;
  /** A staff member's id (StaffMember.id); empty for everyone. */
  staff?: string;
  /** A department; empty for every department. */
  department?: string;
}

export interface UsageCount {
  key: string;
  label: string;
  count: number;
}

export interface UsageDay {
  date: string;
  count: number;
}

export interface InstitutionUsage {
  sessions: number;
  previousPeriodSessions: number;
  completed: number;
  completionRate: number;
  totalMinutes: number;
  avgDurationMinutes: number;
  byType: UsageCount[];
  byOutcome: UsageCount[];
  byDepartment: UsageCount[];
  overTime: UsageDay[];
  staff: { total: number; usedVri: number; notUsed: number };
}

interface ApiUsage {
  totals: {
    sessions: number;
    previous_period_sessions: number;
    completed: number;
    completion_rate: number;
    total_minutes: number;
    avg_duration_minutes: number;
  };
  by_type: { type: string; label: string; count: number }[];
  by_outcome: { status: string; label: string; count: number }[];
  by_department: { department: string; count: number }[];
  over_time: UsageDay[];
  staff: { total: number; used_vri: number; not_used: number };
}

/** The filters as a query string; the screen and the PDF use the same one. */
function usageQuery(filters: UsageFilters): string {
  const params = new URLSearchParams({ from: filters.from, to: filters.to });
  if (filters.staff) params.set('staff', filters.staff);
  if (filters.department) params.set('department', filters.department);
  return params.toString();
}

/** Downloads the Analytics page as a PDF for the same filters (admins only). */
export async function downloadUsageReport(filters: UsageFilters): Promise<void> {
  const pdf = await apiBlob(`${USAGE_REPORT}?${usageQuery(filters)}`);
  const url = window.URL.createObjectURL(pdf);
  const link = document.createElement('a');
  link.href = url;
  link.download = `usage-report-${filters.from}-to-${filters.to}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Released a moment later so the download has started.
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}

export async function getInstitutionUsage(filters: UsageFilters): Promise<InstitutionUsage> {
  const raw = await api<ApiUsage>(`${USAGE}?${usageQuery(filters)}`);
  return {
    sessions: raw.totals.sessions,
    previousPeriodSessions: raw.totals.previous_period_sessions,
    completed: raw.totals.completed,
    completionRate: raw.totals.completion_rate,
    totalMinutes: raw.totals.total_minutes,
    avgDurationMinutes: raw.totals.avg_duration_minutes,
    byType: raw.by_type.map((row) => ({ key: row.type, label: row.label, count: row.count })),
    byOutcome: raw.by_outcome.map((row) => ({
      key: row.status,
      label: row.label,
      count: row.count,
    })),
    byDepartment: raw.by_department.map((row) => ({
      key: row.department,
      label: row.department || 'No department',
      count: row.count,
    })),
    overTime: raw.over_time,
    staff: {
      total: raw.staff.total,
      usedVri: raw.staff.used_vri,
      notUsed: raw.staff.not_used,
    },
  };
}

// --- Helpers for the Analytics page -----------------------------------------------------------------

/** A day as YYYY-MM-DD in the viewer's own calendar (not UTC, which can be a day off). */
export function toIsoDay(day: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
}

/** The last `days` days up to and including `today`. */
export function lastDays(days: number, today: Date = new Date()): { from: string; to: string } {
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  return { from: toIsoDay(start), to: toIsoDay(today) };
}

export type Grouping = 'Daily' | 'Weekly' | 'Monthly';

export interface ChartBar {
  label: string;
  count: number;
}

// The dates are calendar days, so they are read and shown as UTC to keep them from shifting.
const asDate = (day: string) => new Date(`${day}T00:00:00Z`);
const format = (day: string, options: Intl.DateTimeFormatOptions) =>
  asDate(day).toLocaleDateString('en-GB', { ...options, timeZone: 'UTC' });

/** "17 Nov 2026" */
export const formatDay = (day: string) =>
  format(day, { day: 'numeric', month: 'short', year: 'numeric' });

/** The daily counts as chart bars: one per day, per 7 days from the first day, or per month. */
export function groupDays(days: UsageDay[], grouping: Grouping): ChartBar[] {
  if (grouping === 'Daily') {
    const weekdays = days.length <= 7;
    return days.map((day) => ({
      label: format(day.date, weekdays ? { weekday: 'short' } : { day: 'numeric', month: 'short' }),
      count: day.count,
    }));
  }
  const bars: ChartBar[] = [];
  let key = '';
  days.forEach((day, i) => {
    const next = grouping === 'Weekly' ? String(Math.floor(i / 7)) : day.date.slice(0, 7);
    if (next !== key) {
      key = next;
      bars.push({
        label: format(
          day.date,
          grouping === 'Weekly' ? { day: 'numeric', month: 'short' } : { month: 'short' },
        ),
        count: 0,
      });
    }
    bars[bars.length - 1].count += day.count;
  });
  return bars;
}

/** "2h 05m", or "40 min" under an hour. */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}

/** "+25% vs last period"; a plain sentence when the last period had no sessions to compare with. */
export function changeVsLastPeriod(now: number, before: number): string {
  if (before === 0) return now === 0 ? 'No change vs last period' : 'None in the last period';
  const change = Math.round(((now - before) * 100) / before);
  return `${change > 0 ? '+' : ''}${change}% vs last period`;
}
