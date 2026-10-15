import { afterEach, describe, expect, it, vi } from 'vitest';
import { interpreterApi } from './interpreterApi';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);
afterEach(() => fetchMock.mockReset());

const reply = (body: unknown, status = 200) => ({
  ok: status < 400,
  status,
  statusText: 'x',
  json: async () => body,
});

const week = (source: 'default' | 'exception' = 'default') => ({
  days: Array.from({ length: 7 }, (_, weekday) => ({
    date: '2026-10-12',
    weekday,
    is_available: weekday < 5,
    start_time: weekday < 5 ? '08:00:00' : null,
    end_time: weekday < 5 ? '17:00:00' : null,
    source,
  })),
});

function mockLoad() {
  fetchMock.mockImplementation(async (url: string) => {
    if (url.includes('/status/'))
      return reply({ is_available: true, available_now: true, reason: null });
    if (url.includes('/exceptions/'))
      return reply({
        month: '2026-10',
        exceptions: [
          {
            date: '2099-01-05',
            is_available: false,
            start_time: null,
            end_time: null,
            kind: 'unavailable',
          },
        ],
      });
    return reply(week());
  });
}

describe('interpreterApi', () => {
  it('turns the API week, one-off dates and switch into what the page shows', async () => {
    mockLoad();
    const data = await interpreterApi.getAvailability();
    expect(data.available).toBe(true);
    expect(data.weeklySchedule[0]).toEqual({
      day: 'Monday',
      enabled: true,
      start: '08:00',
      end: '17:00',
    });
    expect(data.weeklySchedule[6].enabled).toBe(false);
    expect(data.exceptions[0]).toMatchObject({ date: '2099-01-05', unavailable: true });
    const urls = fetchMock.mock.calls.map(([url]) => String(url));
    expect(urls.some((u) => u.includes('/api/v1/interpreters/me/availability/status/'))).toBe(true);
    expect(urls.some((u) => u.includes('/availability/exceptions/?month='))).toBe(true);
  });

  it('saves each weekday as a repeating change and each one-off date on its own', async () => {
    mockLoad();
    const data = await interpreterApi.getAvailability();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(reply({}));
    await interpreterApi.updateAvailability({
      weeklySchedule: data.weeklySchedule,
      exceptions: [{ id: 'x', date: '2099-02-01', unavailable: true }],
    });
    const calls = fetchMock.mock.calls.map(([url, init]) => ({
      url: String(url),
      method: init?.method,
      body: init?.body ? JSON.parse(init.body) : undefined,
    }));
    const weekly = calls.filter((c) => c.body?.repeat_weekly === true);
    expect(weekly).toHaveLength(7);
    expect(weekly.every((c) => c.method === 'PATCH')).toBe(true);
    expect(weekly.find((c) => c.body.is_available === false)?.body.start_time).toBeNull();
    const oneOff = calls.find((c) => c.url.includes('/days/2099-02-01/'));
    expect(oneOff?.body).toEqual({
      is_available: false,
      start_time: null,
      end_time: null,
      repeat_weekly: false,
    });
    // the date that was on the page when it loaded but is not any more is deleted
    expect(
      calls.some((c) => c.method === 'DELETE' && c.url.includes('/exceptions/2099-01-05/')),
    ).toBe(true);
  });

  it('flips the dashboard switch through the status endpoint', async () => {
    fetchMock.mockResolvedValue(reply({ is_available: false }));
    await interpreterApi.updateLiveStatus(false);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/api/v1/interpreters/me/availability/status/');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body)).toEqual({ is_available: false });
  });
});
