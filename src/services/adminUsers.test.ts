import { fetchAdminUsers } from './adminUsers';

function mockFetch(body: unknown, status = 200) {
  const fn = vi.fn().mockResolvedValue({
    ok: status < 400,
    status,
    statusText: 'x',
    json: async () => body,
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

const apiUser = (overrides: Record<string, unknown> = {}) => ({
  id: 7,
  full_name: 'Grace Nakato',
  email: 'grace@example.com',
  phone_number: '+256772123456',
  role: 'deaf_hoh',
  verification_status: 'verified',
  created_at: '2026-10-01T08:00:00Z',
  last_login: null,
  ...overrides,
});

describe('adminUsers service', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reads the administration users endpoint and maps the fields', async () => {
    const fetchMock = mockFetch([apiUser()]);
    const users = await fetchAdminUsers();
    expect(fetchMock.mock.calls[0][0]).toContain('/api/v1/administration/users/');
    expect(users[0]).toMatchObject({
      id: '7',
      name: 'Grace Nakato',
      role: 'deaf',
      verificationStatus: 'verified',
      phone: '+256772123456',
    });
  });

  it('keeps rejected and suspended as their own statuses', async () => {
    mockFetch([
      apiUser({ id: 1, verification_status: 'rejected' }),
      apiUser({ id: 2, verification_status: 'suspended' }),
      apiUser({ id: 3, verification_status: 'pending' }),
    ]);
    const users = await fetchAdminUsers();
    expect(users.map((u) => u.verificationStatus)).toEqual(['rejected', 'suspended', 'pending']);
  });

  it('sends the filters as query parameters and skips the "all" choices', async () => {
    const fetchMock = mockFetch([]);
    await fetchAdminUsers({
      search: 'grace',
      type: 'deaf',
      status: 'all-statuses',
      range: '7-days',
    });
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain('search=grace');
    expect(url).toContain('role=deaf');
    expect(url).toContain('range=7-days');
    expect(url).not.toContain('status=');
  });
});
