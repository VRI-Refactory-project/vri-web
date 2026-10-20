import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from './api';
import { cancelSessionRequest, createSessionRequest, getSessionRequest } from './sessionRequests';

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

const queued = { id: 12, status: 'PENDING', created_at: '2026-10-20T08:00:00Z' };

describe('session requests', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('asks for a video session and maps the response', async () => {
    const fetchMock = mockFetch(201, queued);
    const request = await createSessionRequest();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/v1/requests/');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toMatchObject({
      specialisation_required: 'GENERAL',
      priority: 'NORMAL',
    });
    expect(JSON.parse(init.body).request_key).toEqual(expect.any(String));
    expect(request).toEqual({
      id: '12',
      state: 'QUEUED',
      createdAt: '2026-10-20T08:00:00Z',
      interpreter: undefined,
    });
  });

  it('reads one request, including the interpreter once there is one', async () => {
    const fetchMock = mockFetch(200, {
      ...queued,
      status: 'ASSIGNED',
      interpreter: { name: 'Amina Okafor', languages: 'Ugandan Sign Language ⇄ English' },
    });
    const request = await getSessionRequest('12');

    expect(fetchMock.mock.calls[0][0]).toContain('/api/v1/requests/12/');
    expect(request.state).toBe('ACCEPTED');
    expect(request.interpreter?.name).toBe('Amina Okafor');
  });

  it('cancels a request', async () => {
    const fetchMock = mockFetch(200, { ...queued, status: 'CANCELLED' });
    const request = await cancelSessionRequest('12');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/v1/requests/12/cancel/');
    expect(init.method).toBe('POST');
    expect(request.state).toBe('CANCELLED');
  });

  it('maps a request that nobody could take to FAILED', async () => {
    mockFetch(200, { ...queued, status: 'FAILED' });
    expect((await getSessionRequest('12')).state).toBe('FAILED');
  });

  it('keeps waiting on a status it does not know', async () => {
    mockFetch(200, { ...queued, status: 'SOMETHING_NEW' });
    expect((await getSessionRequest('12')).state).toBe('QUEUED');
  });

  it('surfaces the API message when a request is already open', async () => {
    mockFetch(409, { detail: 'You already have an open request.' });
    await expect(createSessionRequest()).rejects.toMatchObject({
      status: 409,
      message: 'You already have an open request.',
    });
    await expect(createSessionRequest()).rejects.toBeInstanceOf(ApiError);
  });
});
