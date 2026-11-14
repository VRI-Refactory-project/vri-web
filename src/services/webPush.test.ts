import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  WebPushBlocked,
  disableWebPush,
  enableWebPush,
  syncWebPush,
  webPushSupported,
} from './webPush';

const fetchMock = vi.fn();

function reply(status: number, body: unknown = {}) {
  return { ok: status < 400, status, statusText: 'x', json: async () => body };
}

/** A pretend browser: an existing subscription (or none), a permission answer, and spies. */
function pretendBrowser({
  permission = 'granted' as NotificationPermission,
  existing = null as unknown,
} = {}) {
  const unsubscribe = vi.fn().mockResolvedValue(true);
  const created = {
    endpoint: 'https://push.example/abc',
    toJSON: () => ({ endpoint: 'https://push.example/abc', keys: { p256dh: 'p', auth: 'a' } }),
    unsubscribe,
  };
  const subscribe = vi.fn().mockResolvedValue(created);
  const pushManager = { getSubscription: vi.fn().mockResolvedValue(existing), subscribe };
  const registration = { pushManager };

  vi.stubGlobal('Notification', {
    permission,
    requestPermission: vi.fn().mockResolvedValue(permission),
  });
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      register: vi.fn().mockResolvedValue(registration),
      ready: Promise.resolve(registration),
      getRegistration: vi.fn().mockResolvedValue(registration),
    },
  });
  return { subscribe, unsubscribe, created, register: navigator.serviceWorker.register };
}

beforeEach(() => vi.stubGlobal('fetch', fetchMock.mockResolvedValue(reply(200))));
afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, 'serviceWorker');
});

describe('web push', () => {
  it('is not supported in a browser without the push features', () => {
    expect(webPushSupported()).toBe(false);
  });

  it('subscribes with the server key and gives the server the subscription', async () => {
    const browser = pretendBrowser();

    await enableWebPush('AQID'); // URL-safe text for the bytes 1, 2, 3

    expect(browser.register).toHaveBeenCalledWith('/sw.js');
    const options = browser.subscribe.mock.calls[0][0];
    expect(options.userVisibleOnly).toBe(true);
    expect(Array.from(options.applicationServerKey)).toEqual([1, 2, 3]);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/v1/notifications/web-push/');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({
      endpoint: 'https://push.example/abc',
      keys: { p256dh: 'p', auth: 'a' },
    });
  });

  it('reuses the subscription the browser already has', async () => {
    const existing = pretendBrowser().created;
    const browser = pretendBrowser({ existing });

    await enableWebPush('AQID');

    expect(browser.subscribe).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('stops and tells the server nothing when the person says no', async () => {
    pretendBrowser({ permission: 'denied' });

    await expect(enableWebPush('AQID')).rejects.toBeInstanceOf(WebPushBlocked);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('tells the server first and then drops the subscription when switched off', async () => {
    const existing = pretendBrowser().created;
    pretendBrowser({ existing });

    await disableWebPush();

    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe('DELETE');
    expect(JSON.parse(init.body)).toEqual({ endpoint: 'https://push.example/abc' });
    expect(existing.unsubscribe).toHaveBeenCalled();
  });

  it('keeps the subscription if the server could not be told, so switching off can be retried', async () => {
    const existing = pretendBrowser().created;
    pretendBrowser({ existing });
    fetchMock.mockResolvedValue(reply(500, { detail: 'down' }));

    await expect(disableWebPush()).rejects.toThrow();

    expect(existing.unsubscribe).not.toHaveBeenCalled();
  });

  it('claims an existing subscription for whoever is signed in now', async () => {
    const existing = pretendBrowser().created;
    pretendBrowser({ existing });

    expect(await syncWebPush()).toBe(true);
    expect(fetchMock.mock.calls[0][1].method).toBe('POST');
  });

  it('says notifications are off when the browser has no subscription', async () => {
    pretendBrowser();

    expect(await syncWebPush()).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
