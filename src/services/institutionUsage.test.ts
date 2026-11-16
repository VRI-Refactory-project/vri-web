import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  changeVsLastPeriod,
  formatMinutes,
  getInstitutionUsage,
  groupDays,
  lastDays,
} from './institutionUsage';

const api = vi.hoisted(() => vi.fn());
vi.mock('./api', () => ({ api }));

beforeEach(() => api.mockReset());

describe('getInstitutionUsage', () => {
  it('sends the filters and maps the response', async () => {
    api.mockResolvedValue({
      totals: {
        sessions: 4,
        previous_period_sessions: 2,
        completed: 3,
        completion_rate: 75,
        total_minutes: 90,
        avg_duration_minutes: 30,
      },
      by_type: [{ type: 'MEDICAL', label: 'Medical', count: 4 }],
      by_outcome: [{ status: 'COMPLETED', label: 'Completed', count: 3 }],
      by_department: [{ department: '', count: 4 }],
      over_time: [{ date: '2026-11-14', count: 4 }],
      staff: { total: 5, used_vri: 2, not_used: 3 },
    });

    const usage = await getInstitutionUsage({
      from: '2026-11-08',
      to: '2026-11-14',
      staff: '7',
      department: '',
    });

    expect(api).toHaveBeenCalledWith(
      '/api/v1/institutions/me/usage/?from=2026-11-08&to=2026-11-14&staff=7',
    );
    expect(usage.completionRate).toBe(75);
    expect(usage.byDepartment).toEqual([{ key: '', label: 'No department', count: 4 }]);
    expect(usage.staff).toEqual({ total: 5, usedVri: 2, notUsed: 3 });
  });
});

describe('helpers', () => {
  it('lastDays counts today as the last day', () => {
    expect(lastDays(7, new Date(2026, 10, 14))).toEqual({ from: '2026-11-08', to: '2026-11-14' });
  });

  const days = (from: number, counts: number[]) =>
    counts.map((count, i) => ({
      date: `2026-10-${String(from + i).padStart(2, '0')}`,
      count,
    }));

  it('labels a week of days by weekday', () => {
    expect(groupDays(days(26, [1, 2]), 'Daily')).toEqual([
      { label: 'Mon', count: 1 },
      { label: 'Tue', count: 2 },
    ]);
  });

  it('groups by 7 days and by month', () => {
    const tenDays = days(22, [1, 1, 1, 1, 1, 1, 1, 2, 2, 2]); // 22 to 31 October
    expect(groupDays(tenDays, 'Weekly')).toEqual([
      { label: '22 Oct', count: 7 },
      { label: '29 Oct', count: 6 },
    ]);
    expect(groupDays([...tenDays, { date: '2026-11-01', count: 5 }], 'Monthly')).toEqual([
      { label: 'Oct', count: 13 },
      { label: 'Nov', count: 5 },
    ]);
  });

  it('formats minutes and the change from the last period', () => {
    expect(formatMinutes(40)).toBe('40 min');
    expect(formatMinutes(125)).toBe('2h 05m');
    expect(changeVsLastPeriod(5, 4)).toBe('+25% vs last period');
    expect(changeVsLastPeriod(2, 4)).toBe('-50% vs last period');
    expect(changeVsLastPeriod(3, 0)).toBe('None in the last period');
  });
});
