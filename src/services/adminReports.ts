// src/services/adminReports.ts
import { api } from './api';

export type ReportRange = 7 | 30 | 90;
export const REPORT_RANGES: ReportRange[] = [7, 30, 90];

export interface UsageReport {
  rangeDays: number;
  summary: {
    requests: number;
    sessions: number;
    completed: number;
    cancelled: number;
    failed: number;
    emergency: number;
  };
  byDay: { date: string; requests: number; sessions: number }[];
  bySpecialisation: { specialisation: string; count: number }[];
  byStatus: { status: string; count: number }[];
}

export interface ResponseTimesReport {
  rangeDays: number;
  summary: {
    requests: number;
    answered: number;
    abandoned: number;
    failed: number;
    matchedByFallback: number;
    avgSecondsToAccept: number | null;
    avgSecondsInQueue: number | null;
  };
  peakHours: { hour: number; requests: number }[];
  offers: {
    total: number;
    accepted: number;
    declined: number;
    expired: number;
    acceptanceRatePercent: number | null;
  };
}

interface ApiUsage {
  range_days?: number;
  summary?: Partial<UsageReport['summary']>;
  by_day?: { date?: string; requests?: number; sessions?: number }[];
  by_specialisation?: { specialisation?: string; count?: number }[];
  by_status?: { status?: string; count?: number }[];
}

interface ApiResponseTimes {
  range_days?: number;
  summary?: {
    requests?: number;
    answered?: number;
    abandoned?: number;
    failed?: number;
    matched_by_fallback?: number;
    avg_seconds_to_accept?: number | null;
    avg_seconds_in_queue?: number | null;
  };
  peak_hours?: { hour?: number; requests?: number }[];
  offers?: {
    total?: number;
    accepted?: number;
    declined?: number;
    expired?: number;
    acceptance_rate_percent?: number | null;
  };
}

/** GET /api/v1/dashboard/admin/reports/usage/?days=30 */
export async function fetchUsageReport(days: ReportRange): Promise<UsageReport> {
  const raw = await api<ApiUsage>(`/api/v1/dashboard/admin/reports/usage/?days=${days}`);
  const summary = raw.summary ?? {};
  return {
    rangeDays: raw.range_days ?? days,
    summary: {
      requests: summary.requests ?? 0,
      sessions: summary.sessions ?? 0,
      completed: summary.completed ?? 0,
      cancelled: summary.cancelled ?? 0,
      failed: summary.failed ?? 0,
      emergency: summary.emergency ?? 0,
    },
    byDay: (raw.by_day ?? []).map((row) => ({
      date: row.date ?? '',
      requests: row.requests ?? 0,
      sessions: row.sessions ?? 0,
    })),
    bySpecialisation: (raw.by_specialisation ?? []).map((row) => ({
      specialisation: row.specialisation ?? '',
      count: row.count ?? 0,
    })),
    byStatus: (raw.by_status ?? []).map((row) => ({
      status: row.status ?? '',
      count: row.count ?? 0,
    })),
  };
}

/** GET /api/v1/dashboard/admin/reports/response-times/?days=30 */
export async function fetchResponseTimesReport(days: ReportRange): Promise<ResponseTimesReport> {
  const raw = await api<ApiResponseTimes>(
    `/api/v1/dashboard/admin/reports/response-times/?days=${days}`,
  );
  const summary = raw.summary ?? {};
  const offers = raw.offers ?? {};
  return {
    rangeDays: raw.range_days ?? days,
    summary: {
      requests: summary.requests ?? 0,
      answered: summary.answered ?? 0,
      abandoned: summary.abandoned ?? 0,
      failed: summary.failed ?? 0,
      matchedByFallback: summary.matched_by_fallback ?? 0,
      avgSecondsToAccept: summary.avg_seconds_to_accept ?? null,
      avgSecondsInQueue: summary.avg_seconds_in_queue ?? null,
    },
    peakHours: (raw.peak_hours ?? []).map((row) => ({
      hour: row.hour ?? 0,
      requests: row.requests ?? 0,
    })),
    offers: {
      total: offers.total ?? 0,
      accepted: offers.accepted ?? 0,
      declined: offers.declined ?? 0,
      expired: offers.expired ?? 0,
      acceptanceRatePercent: offers.acceptance_rate_percent ?? null,
    },
  };
}

/** 45 -> "45s", 135 -> "2m 15s", null -> "—". */
export function formatSeconds(seconds: number | null): string {
  if (seconds === null) return '—';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest === 0 ? `${minutes}m` : `${minutes}m ${rest}s`;
}

type CsvCell = string | number | null;

/** Rows of cells as CSV text. Cells with a comma, quote or line break are wrapped in quotes. */
export function toCsv(rows: CsvCell[][]): string {
  const cell = (value: CsvCell) => {
    const text = value === null ? '' : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return rows.map((row) => row.map(cell).join(',')).join('\r\n');
}

export function usageCsvRows(report: UsageReport): CsvCell[][] {
  const { summary } = report;
  return [
    ['Usage report', `last ${report.rangeDays} days`],
    [],
    ['Summary'],
    ['Requests', summary.requests],
    ['Sessions', summary.sessions],
    ['Completed', summary.completed],
    ['Cancelled', summary.cancelled],
    ['Failed', summary.failed],
    ['Emergency', summary.emergency],
    [],
    ['Per day'],
    ['Date', 'Requests', 'Sessions'],
    ...report.byDay.map((row) => [row.date, row.requests, row.sessions]),
    [],
    ['By specialisation'],
    ['Specialisation', 'Requests'],
    ...report.bySpecialisation.map((row) => [row.specialisation, row.count]),
    [],
    ['By status'],
    ['Status', 'Requests'],
    ...report.byStatus.map((row) => [row.status, row.count]),
  ];
}

export function responseTimesCsvRows(report: ResponseTimesReport): CsvCell[][] {
  const { summary, offers } = report;
  return [
    ['Response times report', `last ${report.rangeDays} days`],
    [],
    ['Summary'],
    ['Requests', summary.requests],
    ['Answered', summary.answered],
    ['Abandoned', summary.abandoned],
    ['Failed', summary.failed],
    ['Matched by fallback', summary.matchedByFallback],
    ['Average seconds to accept', summary.avgSecondsToAccept],
    ['Average seconds in queue', summary.avgSecondsInQueue],
    [],
    ['Offers'],
    ['Total', offers.total],
    ['Accepted', offers.accepted],
    ['Declined', offers.declined],
    ['Expired', offers.expired],
    ['Acceptance rate percent', offers.acceptanceRatePercent],
    [],
    ['Requests by hour of day'],
    ['Hour', 'Requests'],
    ...report.peakHours.map((row) => [row.hour, row.requests]),
  ];
}

/** Saves the rows as a .csv file in the browser. */
export function downloadCsv(filename: string, rows: CsvCell[][]) {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
