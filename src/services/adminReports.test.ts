import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';
import {
  fetchResponseTimesReport,
  fetchUsageReport,
  formatSeconds,
  responseTimesCsvRows,
  toCsv,
  usageCsvRows,
} from './adminReports';

vi.mock('./api', () => ({ api: vi.fn() }));

describe('adminReports service', () => {
  beforeEach(() => {
    vi.mocked(api).mockReset();
  });

  it('asks for the usage report with the chosen period and reads the numbers', async () => {
    vi.mocked(api).mockResolvedValue({
      range_days: 7,
      summary: { requests: 4, sessions: 3, completed: 2, cancelled: 1, failed: 0, emergency: 1 },
      by_day: [{ date: '2026-11-25', requests: 4, sessions: 3 }],
      by_specialisation: [{ specialisation: 'LEGAL', count: 4 }],
      by_status: [{ status: 'COMPLETED', count: 2 }],
    });

    const report = await fetchUsageReport(7);

    expect(api).toHaveBeenCalledWith('/api/v1/dashboard/admin/reports/usage/?days=7');
    expect(report.summary.sessions).toBe(3);
    expect(report.byDay).toEqual([{ date: '2026-11-25', requests: 4, sessions: 3 }]);
    expect(report.bySpecialisation[0]).toEqual({ specialisation: 'LEGAL', count: 4 });
  });

  it('fills in zeros and blanks when the API leaves things out', async () => {
    vi.mocked(api).mockResolvedValue({});

    const report = await fetchResponseTimesReport(30);

    expect(api).toHaveBeenCalledWith('/api/v1/dashboard/admin/reports/response-times/?days=30');
    expect(report.summary.requests).toBe(0);
    expect(report.summary.avgSecondsToAccept).toBeNull();
    expect(report.offers.acceptanceRatePercent).toBeNull();
    expect(report.peakHours).toEqual([]);
  });

  it('writes seconds the way people read them', () => {
    expect(formatSeconds(null)).toBe('—');
    expect(formatSeconds(45)).toBe('45s');
    expect(formatSeconds(120)).toBe('2m');
    expect(formatSeconds(135)).toBe('2m 15s');
  });

  it('wraps CSV cells that contain commas, quotes or new lines', () => {
    expect(toCsv([['a', 'b,c', 'say "hi"', null, 3]])).toBe('a,"b,c","say ""hi""",,3');
    expect(toCsv([['x'], ['y']])).toBe('x\r\ny');
  });

  it('builds CSV rows for both reports', async () => {
    vi.mocked(api).mockResolvedValue({ summary: { requests: 2 } });
    const usage = await fetchUsageReport(30);
    const times = await fetchResponseTimesReport(30);

    expect(usageCsvRows(usage)[0]).toEqual(['Usage report', 'last 30 days']);
    expect(usageCsvRows(usage)).toContainEqual(['Requests', 2]);
    expect(responseTimesCsvRows(times)[0]).toEqual(['Response times report', 'last 30 days']);
  });
});
