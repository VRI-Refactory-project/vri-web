import { registerDeaf, registerInstitution, registerInterpreter } from './registration';

const payload = (role: string) => ({
  access: 'a',
  refresh: 'r',
  user: {
    id: 9,
    full_name: 'Amina Nakato',
    phone_number: '+256772123456',
    email: null,
    role,
    must_change_password: false,
  },
});

function mockFetch(role: string) {
  const fn = vi.fn().mockResolvedValue({
    ok: true,
    status: 201,
    statusText: 'Created',
    json: async () => payload(role),
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

describe('registration services', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('registers a deaf user without an email and returns a session', async () => {
    const fetchMock = mockFetch('deaf_hoh');
    const session = await registerDeaf({
      name: ' Amina ',
      phone: '0772123456',
      password: 'pw',
      email: ' ',
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/v1/auth/register/deaf/');
    expect(JSON.parse(init.body)).toEqual({
      full_name: 'Amina',
      phone_number: '0772123456',
      password: 'pw',
    });
    expect(session.user.role).toBe('deaf');
    expect(session.token).toBe('a');
  });

  it('sends the email and specialisation for an interpreter', async () => {
    const fetchMock = mockFetch('interpreter');
    await registerInterpreter({
      name: 'Joel',
      phone: '0772123456',
      email: 'j@x.org',
      password: 'pw',
      specialisation: 'MEDICAL',
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/v1/auth/register/interpreter/');
    expect(JSON.parse(init.body)).toMatchObject({ email: 'j@x.org', specialisation: 'MEDICAL' });
  });

  it('maps organisation fields for an institution', async () => {
    const fetchMock = mockFetch('institution');
    await registerInstitution({
      name: 'Dr Okello',
      phone: '0772123456',
      email: 'a@mulago.org',
      password: 'pw',
      organisationName: 'Mulago',
      organisationType: 'HOSPITAL',
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/v1/auth/register/institution/');
    expect(JSON.parse(init.body)).toMatchObject({
      organisation_name: 'Mulago',
      organisation_type: 'HOSPITAL',
    });
    expect(JSON.parse(init.body)).not.toHaveProperty('organisation_type_other');
  });

  it('sends what an "Other" institution is, and only for that type', async () => {
    const fetchMock = mockFetch('institution');
    await registerInstitution({
      name: 'Dr Okello',
      phone: '+256772123456',
      email: 'a@school.org',
      password: 'pw',
      organisationName: 'Hill School',
      organisationType: 'OTHER',
      organisationTypeOther: ' School for the Deaf ',
    });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      organisation_type: 'OTHER',
      organisation_type_other: 'School for the Deaf',
    });

    await registerInstitution({
      name: 'Dr Okello',
      phone: '+256772123456',
      email: 'a@mulago.org',
      password: 'pw',
      organisationName: 'Mulago',
      organisationType: 'HOSPITAL',
      organisationTypeOther: 'left over text',
    });
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).not.toHaveProperty(
      'organisation_type_other',
    );
  });

  it('sends the phone number without spaces or dashes', async () => {
    const fetchMock = mockFetch('deaf_hoh');
    await registerDeaf({ name: 'Amina', phone: '+256 772-123 456', password: 'pw' });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).phone_number).toBe('+256772123456');
  });
});
