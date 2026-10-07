import { api, setAuthToken, setRefreshHandler } from './api';

const res = (status: number, body: unknown = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: 'err',
  json: async () => body,
});

describe('api token refresh', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    setAuthToken(null);
    setRefreshHandler(null);
  });

  it('refreshes once on 401 and retries with the new token', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(res(401, { detail: 'expired' }))
      .mockResolvedValueOnce(res(200, { ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    setAuthToken('old');
    const handler = vi.fn().mockResolvedValue('new');
    setRefreshHandler(handler);

    await expect(api('/api/v1/auth/me/')).resolves.toEqual({ ok: true });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe('Bearer new');
  });

  it('throws the 401 when the refresh fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(res(401, { detail: 'expired' })));
    setAuthToken('old');
    setRefreshHandler(vi.fn().mockResolvedValue(null));

    await expect(api('/api/v1/auth/me/')).rejects.toMatchObject({ status: 401 });
  });

  it('does not try to refresh for auth endpoints such as login', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(res(401, { detail: 'bad credentials' })));
    setAuthToken('old');
    const handler = vi.fn().mockResolvedValue('new');
    setRefreshHandler(handler);

    await expect(api('/api/v1/auth/login/', { method: 'POST' })).rejects.toMatchObject({
      status: 401,
    });
    expect(handler).not.toHaveBeenCalled();
  });
});
