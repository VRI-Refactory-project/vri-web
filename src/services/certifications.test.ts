import { uploadCertificate } from './certifications';

describe('uploadCertificate', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('posts the file as `document` to the v1 upload endpoint without a JSON content type', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"id":1}', { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    await uploadCertificate({
      file: new File(['x'], 'cert.pdf', { type: 'application/pdf' }),
      type: 'Other',
      organisation: 'UNAD',
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/v1\/interpreters\/certifications\/upload\/$/);
    expect(init.method).toBe('POST');
    const body = init.body as FormData;
    expect((body.get('document') as File).name).toBe('cert.pdf');
    expect(init.headers['Content-Type']).toBeUndefined();
  });

  it('surfaces the backend field error message', async () => {
    const body = JSON.stringify({ document: ['File extension “txt” is not allowed.'] });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body, { status: 400 })));

    await expect(
      uploadCertificate({ file: new File(['x'], 'a.txt'), type: 'Other', organisation: 'X' }),
    ).rejects.toThrow('File extension “txt” is not allowed.');
  });
});
