import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  WebPushBlocked,
  disableWebPush,
  enableWebPush,
  syncWebPush,
  webPushSupported,
} from './webPush';

const fetchMock = vi.fn();
const CURRENT_KEY = 'AQID';

type MockPushSubscription = {
  endpoint: string;
  options: {
    applicationServerKey?: ArrayBuffer | null;
  };
  toJSON?: () => unknown;
  unsubscribe: ReturnType<typeof vi.fn>;
};

function reply(status: number, body: unknown = {}) {
  return {
    ok: status < 400,
    status,
    statusText: 'x',
    json: async () => body,
  };
}

function keyBuffer(bytes: number[]): ArrayBuffer {
  return new Uint8Array(bytes).buffer;
}

function pretendBrowser({
  permission = 'granted' as NotificationPermission,
  existing = null as MockPushSubscription | null,
  existingKey = [1, 2, 3],
} = {}) {
  const unsubscribe = vi.fn().mockResolvedValue(true);

  const created: MockPushSubscription = {
    endpoint: 'https://push.example/abc',
    options: {
      applicationServerKey: keyBuffer([1, 2, 3]),
    },
    toJSON: () => ({
      endpoint: 'https://push.example/abc',
      keys: { p256dh: 'p', auth: 'a' },
    }),
    unsubscribe,
  };

  const subscribe = vi.fn().mockImplementation(async (options) => {
    created.options.applicationServerKey = options.applicationServerKey;
    return created as unknown as PushSubscription;
  });

  const pushManager = {
    getSubscription: vi
      .fn()
      .mockImplementation(async () => existing as unknown as PushSubscription | null),
    subscribe,
  };

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

  if (existing) {
    existing.options.applicationServerKey = keyBuffer(existingKey);
  }

  return {
    subscribe,
    unsubscribe,
    created,
    registration,
    register: navigator.serviceWorker.register,
  };
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    fetchMock.mockImplementation(async (url: string) => {
      if (String(url).includes('/key/')) {
        return reply(200, { public_key: CURRENT_KEY });
      }

      return reply(200);
    }),
  );
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, 'serviceWorker');
});

describe('web push', () => {
  it('is not supported without the required browser features', () => {
    expect(webPushSupported()).toBe(false);
  });

  it('subscribes with the server key and registers the subscription', async () => {
    const browser = pretendBrowser();

    await enableWebPush(CURRENT_KEY);

    expect(browser.register).toHaveBeenCalledWith('/sw.js');

    const options = browser.subscribe.mock.calls[0][0];

    expect(options.userVisibleOnly).toBe(true);
    expect(Array.from(options.applicationServerKey)).toEqual([1, 2, 3]);

    const subscriptionCall = fetchMock.mock.calls.find(
      ([url, init]) => String(url).includes('/web-push/') && init?.method === 'POST',
    );

    expect(subscriptionCall).toBeDefined();

    expect(JSON.parse(subscriptionCall![1].body)).toEqual({
      endpoint: 'https://push.example/abc',
      keys: { p256dh: 'p', auth: 'a' },
    });
  });

  it('reuses an existing subscription when its key matches', async () => {
    const existing: MockPushSubscription = {
      endpoint: 'https://push.example/abc',
      options: {},
      toJSON: () => ({
        endpoint: 'https://push.example/abc',
        keys: { p256dh: 'p', auth: 'a' },
      }),
      unsubscribe: vi.fn(),
    };

    const browser = pretendBrowser({
      existing,
      existingKey: [1, 2, 3],
    });

    await enableWebPush(CURRENT_KEY);

    expect(browser.subscribe).not.toHaveBeenCalled();
    expect(existing.unsubscribe).not.toHaveBeenCalled();
  });

  it('replaces an existing subscription when its key is outdated', async () => {
    const existing: MockPushSubscription = {
      endpoint: 'https://push.example/old',
      options: {},
      toJSON: () => ({
        endpoint: 'https://push.example/old',
        keys: { p256dh: 'old', auth: 'old' },
      }),
      unsubscribe: vi.fn().mockResolvedValue(true),
    };

    const browser = pretendBrowser({
      existing,
      existingKey: [9, 9, 9],
    });

    await enableWebPush(CURRENT_KEY);

    expect(existing.unsubscribe).toHaveBeenCalledOnce();
    expect(browser.subscribe).toHaveBeenCalledOnce();

    expect(Array.from(browser.subscribe.mock.calls[0][0].applicationServerKey)).toEqual([1, 2, 3]);
  });

  it('automatically renews an outdated subscription during sync', async () => {
    const existing: MockPushSubscription = {
      endpoint: 'https://push.example/old',
      options: {},
      toJSON: () => ({
        endpoint: 'https://push.example/old',
        keys: { p256dh: 'old', auth: 'old' },
      }),
      unsubscribe: vi.fn().mockResolvedValue(true),
    };

    const browser = pretendBrowser({
      existing,
      existingKey: [9, 9, 9],
    });

    expect(await syncWebPush()).toBe(true);

    expect(existing.unsubscribe).toHaveBeenCalledOnce();
    expect(browser.subscribe).toHaveBeenCalledOnce();
  });

  it('does not subscribe when notification permission is denied', async () => {
    const browser = pretendBrowser({ permission: 'denied' });

    await expect(enableWebPush(CURRENT_KEY)).rejects.toBeInstanceOf(WebPushBlocked);

    expect(browser.subscribe).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('tells the server first and then removes the subscription when disabled', async () => {
    const existing: MockPushSubscription = {
      endpoint: 'https://push.example/abc',
      options: {},
      toJSON: () => ({
        endpoint: 'https://push.example/abc',
        keys: { p256dh: 'p', auth: 'a' },
      }),
      unsubscribe: vi.fn().mockResolvedValue(true),
    };

    pretendBrowser({ existing });

    await disableWebPush();

    const deleteCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'DELETE');

    expect(deleteCall).toBeDefined();
    expect(JSON.parse(deleteCall![1].body)).toEqual({
      endpoint: 'https://push.example/abc',
    });

    expect(existing.unsubscribe).toHaveBeenCalledOnce();
  });

  it('keeps the subscription if the backend cannot process deletion', async () => {
    const existing: MockPushSubscription = {
      endpoint: 'https://push.example/abc',
      options: {},
      unsubscribe: vi.fn().mockResolvedValue(true),
    };

    pretendBrowser({ existing });

    fetchMock.mockResolvedValue(reply(500, { detail: 'down' }));

    await expect(disableWebPush()).rejects.toThrow();

    expect(existing.unsubscribe).not.toHaveBeenCalled();
  });

  it('returns false when permission is not granted', async () => {
    pretendBrowser({ permission: 'denied' });

    expect(await syncWebPush()).toBe(false);
  });

  it('returns false when there is no existing subscription', async () => {
    pretendBrowser();

    expect(await syncWebPush()).toBe(false);
  });
});
