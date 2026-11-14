import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from './api';
import { endSession, toSessionState } from './sessionRequests';

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

describe('ending a session', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('asks the API to end the session and maps the result', async () => {
    const fetchMock = mockFetch(200, {
      id: 12,
      status: 'COMPLETED',
      created_at: '2026-11-10T08:00:00Z',
    });
    const request = await endSession('12');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/v1/requests/12/end/');
    expect(init.method).toBe('POST');
    expect(request.state).toBe('COMPLETED');
  });

  it('passes on the reason when the person is not allowed to end it', async () => {
    mockFetch(403, {
      detail: 'Only the interpreter or the person who asked can end this session.',
    });
    await expect(endSession('12')).rejects.toBeInstanceOf(ApiError);
  });

  it('knows the live and ending statuses the server sends', () => {
    expect(toSessionState('CONNECTING')).toBe('CONNECTING');
    expect(toSessionState('ACTIVE')).toBe('ACTIVE');
    expect(toSessionState('COMPLETED')).toBe('COMPLETED');
    expect(toSessionState('ASSIGNED')).toBe('ACCEPTED');
    expect(toSessionState('SOMETHING_NEW')).toBe('QUEUED');
  });
});
