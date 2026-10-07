import { confirmRecovery, requestRecovery, signIn } from './auth';
import { ApiError } from './api';

const apiUser = {
  id: 7,
  full_name: 'Amina Nakato',
  phone_number: '+256772123456',
  email: null,
  role: 'deaf_hoh',
  must_change_password: false,
  date_joined: '2026-01-01T00:00:00Z',
};

function mockFetch(status: number, body: unknown) {
  const fn = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: 'x',
    json: async () => body,
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

describe('signIn', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('posts identifier and password and maps the response to a session', async () => {
    const fetchMock = mockFetch(200, { access: 'a', refresh: 'r', user: apiUser });
    const session = await signIn('0772123456', 'secret');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/v1/auth/login/');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ identifier: '0772123456', password: 'secret' });
    expect(session).toEqual({
      token: 'a',
      refreshToken: 'r',
      user: { id: '7', name: 'Amina Nakato', role: 'deaf', mustChangePassword: false },
    });
  });

  it('surfaces the API error message', async () => {
    mockFetch(401, { detail: 'No active account found with the given credentials' });
    await expect(signIn('x', 'y')).rejects.toMatchObject({
      status: 401,
      message: 'No active account found with the given credentials',
    });
    await expect(signIn('x', 'y')).rejects.toBeInstanceOf(ApiError);
  });
});

describe('account recovery', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('requests a code with the identifier', async () => {
    const fetchMock = mockFetch(200, { detail: 'If an account exists, a code was sent.' });
    await requestRecovery('deaf@test.com');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/v1/auth/recovery/request/');
    expect(JSON.parse(init.body)).toEqual({ identifier: 'deaf@test.com' });
  });

  it('confirms with code and new_password and returns a session', async () => {
    const fetchMock = mockFetch(200, { access: 'a', refresh: 'r', user: apiUser });
    const session = await confirmRecovery('deaf@test.com', '123456', 'NewPass#2026');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/v1/auth/recovery/confirm/');
    expect(JSON.parse(init.body)).toEqual({
      identifier: 'deaf@test.com',
      code: '123456',
      new_password: 'NewPass#2026',
    });
    expect(session.user.role).toBe('deaf');
  });
});
