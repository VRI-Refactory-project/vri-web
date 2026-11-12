import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadNotificationSettings, saveNotificationSettings } from './notificationSettings';

const fetchMock = vi.fn();

const reply = (body: unknown) => ({
  ok: true,
  status: 200,
  statusText: 'OK',
  json: async () => body,
});

const SERVER = { session_requests: false, session_reminders: true, product_updates: true };
const PAGE = { sessionRequests: false, sessionReminders: true, productUpdates: true };

beforeEach(() => vi.stubGlobal('fetch', fetchMock));
afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe('notification settings', () => {
  it('loads the saved choices and renames them for the page', async () => {
    fetchMock.mockResolvedValue(reply(SERVER));

    expect(await loadNotificationSettings()).toEqual(PAGE);
    expect(fetchMock.mock.calls[0][0]).toContain('/api/v1/notifications/preferences/');
  });

  it('saves the choices with PATCH, renamed for the server', async () => {
    fetchMock.mockResolvedValue(reply(SERVER));

    expect(await saveNotificationSettings(PAGE)).toEqual(PAGE);

    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body)).toEqual(SERVER);
  });
});
