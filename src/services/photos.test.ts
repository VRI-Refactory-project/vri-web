import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getMyPhoto, photoSrc, removeMyPhoto, uploadMyPhoto } from './photos';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const reply = (status: number, body: unknown) => ({
  ok: status < 400,
  status,
  statusText: 'x',
  json: async () => body,
});

describe('photos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('turns an API path into a full address, and nothing into null', () => {
    expect(photoSrc('/api/v1/auth/photos/abc/')).toMatch(/\/api\/v1\/auth\/photos\/abc\/$/);
    expect(photoSrc('/api/v1/auth/photos/abc/')).toMatch(/^https?:\/\//);
    expect(photoSrc(null)).toBeNull();
  });

  it('reads my photo', async () => {
    fetchMock.mockResolvedValue(reply(200, { profile_photo: '/api/v1/auth/photos/abc/' }));
    expect(await getMyPhoto()).toMatch(/photos\/abc\/$/);
    expect(fetchMock.mock.calls[0][0]).toContain('/api/v1/auth/me/photo/');
  });

  it('uploads the file in a form field called photo', async () => {
    fetchMock.mockResolvedValue(reply(200, { profile_photo: '/api/v1/auth/photos/new/' }));
    const file = new File(['x'], 'me.png', { type: 'image/png' });

    const url = await uploadMyPhoto(file);

    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe('POST');
    expect((init.body as FormData).get('photo')).toBeInstanceOf(File);
    expect(url).toMatch(/photos\/new\/$/);
  });

  it('removes my photo', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 204, statusText: 'No Content' });
    await removeMyPhoto();
    expect(fetchMock.mock.calls[0][1].method).toBe('DELETE');
  });
});
