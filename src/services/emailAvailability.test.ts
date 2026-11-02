import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';
import { checkEmailAvailability } from './emailAvailability';

vi.mock('./api', () => ({
  api: vi.fn(),
}));

describe('checkEmailAvailability', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns true when the email is available', async () => {
    vi.mocked(api).mockResolvedValue({ available: true });

    await expect(checkEmailAvailability('new@example.com')).resolves.toBe(true);

    expect(api).toHaveBeenCalledWith('/api/v1/auth/email/availability/?email=new%40example.com', {
      method: 'GET',
    });
  });

  it('trims whitespace before checking the email', async () => {
    vi.mocked(api).mockResolvedValue({ available: true });

    await checkEmailAvailability('  new@example.com  ');

    expect(api).toHaveBeenCalledWith('/api/v1/auth/email/availability/?email=new%40example.com', {
      method: 'GET',
    });
  });

  it('returns false when the email is already registered', async () => {
    vi.mocked(api).mockResolvedValue({ available: false });

    await expect(checkEmailAvailability('used@example.com')).resolves.toBe(false);
  });

  it('propagates API errors', async () => {
    vi.mocked(api).mockRejectedValue(new Error('Request failed'));

    await expect(checkEmailAvailability('new@example.com')).rejects.toThrow('Request failed');
  });
});
