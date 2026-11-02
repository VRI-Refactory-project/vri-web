import { validateFile } from './certificateValidation';

const file = (name: string, type: string, size = 100) =>
  new File([new Uint8Array(size)], name, { type });

describe('validateFile', () => {
  it('accepts a PDF, JPG or PNG', () => {
    expect(validateFile(file('a.pdf', 'application/pdf'))).toBeUndefined();
    expect(validateFile(file('a.JPG', 'image/jpeg'))).toBeUndefined();
    expect(validateFile(file('a.png', 'image/png'))).toBeUndefined();
  });

  it('rejects other file types', () => {
    expect(validateFile(file('a.docx', 'application/msword'))).toMatch(/PDF, JPG or PNG/);
    expect(validateFile(file('a.exe', 'application/octet-stream'))).toMatch(/PDF, JPG or PNG/);
  });

  it('rejects a file whose name does not match its type', () => {
    expect(validateFile(file('virus.exe', 'application/pdf'))).toMatch(/PDF, JPG or PNG/);
  });

  it('rejects a file over 10 MB', () => {
    expect(validateFile(file('a.pdf', 'application/pdf', 10 * 1024 * 1024 + 1))).toMatch(/10 MB/);
  });
});
