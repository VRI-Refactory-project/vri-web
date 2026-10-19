import {
  createStaff,
  getStaff,
  initialsOf,
  lastActiveLabel,
  listStaff,
  reinstateStaff,
  revokeStaff,
  toStaffMember,
  updateStaff,
  type ApiStaff,
} from './staff';

const apiStaff = (overrides: Partial<ApiStaff> = {}): ApiStaff => ({
  id: 12,
  user_id: 31,
  full_name: 'Sarah Nakato',
  phone_number: '+256772111000',
  email: 'sarah@mulago.example',
  role: 'STAFF',
  job_title: 'Healthcare',
  status: 'ACTIVE',
  last_login: '2026-10-19T08:00:00Z',
  created_at: '2026-10-18T08:00:00Z',
  revoked_at: null,
  ...overrides,
});

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

describe('staff service', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('lists my institution’s staff from the V2-006 endpoint', async () => {
    const fetchMock = mockFetch([apiStaff()]);
    const staff = await listStaff();
    expect(fetchMock.mock.calls[0][0]).toContain('/api/v1/institutions/me/staff/');
    expect(staff[0]).toMatchObject({
      id: '12',
      name: 'Sarah Nakato',
      initials: 'SN',
      department: 'Healthcare',
      role: 'Staff',
      status: 'Active',
    });
  });

  it('creates staff with the field names the API expects', async () => {
    const fetchMock = mockFetch(apiStaff({ role: 'ADMIN', last_login: null }), 201);
    const created = await createStaff({
      fullName: ' Sarah Nakato ',
      email: ' sarah@mulago.example ',
      phone: '+256 772 111-000',
      department: 'Healthcare',
      role: 'Admin',
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/v1/institutions/me/staff/');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({
      full_name: 'Sarah Nakato',
      email: 'sarah@mulago.example',
      phone_number: '+256772111000',
      job_title: 'Healthcare',
      role: 'ADMIN',
    });
    expect(created.role).toBe('Admin');
  });

  it('shows the backend’s reason when creating fails', async () => {
    mockFetch({ phone_number: ['An account with this phone number already exists.'] }, 400);
    await expect(
      createStaff({
        fullName: 'A B',
        email: 'a@b.co',
        phone: '+256772111000',
        department: 'X',
        role: 'Staff',
      }),
    ).rejects.toThrow('An account with this phone number already exists.');
  });

  it('maps API status to Active / Invitation Sent / Inactive', () => {
    expect(toStaffMember(apiStaff()).status).toBe('Active');
    expect(toStaffMember(apiStaff({ last_login: null })).status).toBe('Invitation Sent');
    expect(toStaffMember(apiStaff({ status: 'REVOKED' })).status).toBe('Inactive');
  });

  it('describes when someone was last active', () => {
    const now = new Date('2026-10-19T10:00:00Z');
    expect(lastActiveLabel(null, now)).toBe('—');
    expect(lastActiveLabel('2026-10-19T09:55:00Z', now)).toBe('5 min ago');
    expect(lastActiveLabel('2026-10-19T07:00:00Z', now)).toBe('3 hours ago');
    expect(lastActiveLabel('2026-10-16T10:00:00Z', now)).toBe('3 days ago');
  });

  it('makes initials from the first and last name', () => {
    expect(initialsOf('Maggie Nanduga')).toBe('MN');
    expect(initialsOf('Okello')).toBe('O');
  });
});

describe('staff profile actions', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('loads one staff member', async () => {
    const fetchMock = mockFetch(apiStaff());
    expect((await getStaff('12')).name).toBe('Sarah Nakato');
    expect(fetchMock.mock.calls[0][0]).toContain('/api/v1/institutions/me/staff/12/');
  });

  it('sends only the changed fields, with the API’s names', async () => {
    const fetchMock = mockFetch(apiStaff({ role: 'ADMIN' }));
    await updateStaff('12', { role: 'Admin', department: 'Reception' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/v1/institutions/me/staff/12/');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body)).toEqual({ role: 'ADMIN', job_title: 'Reception' });
  });

  it('revokes and reinstates through their own endpoints', async () => {
    const fetchMock = mockFetch(apiStaff({ status: 'REVOKED' }));
    expect((await revokeStaff('12')).status).toBe('Inactive');
    expect(fetchMock.mock.calls[0][0]).toContain('/api/v1/institutions/me/staff/12/revoke/');
    expect(fetchMock.mock.calls[0][1].method).toBe('POST');

    mockFetch(apiStaff());
    expect((await reinstateStaff('12')).status).toBe('Active');
  });
});
