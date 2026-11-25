import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError } from './api';
import { getInterpreterWallet } from './interpreterWallet';
import type { ApiWalletEntry } from './wallet';

vi.mock('./api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api')>()),
  api: vi.fn(),
}));

const entry = (over: Partial<ApiWalletEntry>): ApiWalletEntry => ({
  id: 1,
  reference: 'ref',
  kind: 'session_earning',
  status: 'completed',
  amount: 30000,
  currency: 'UGX',
  description: 'Session with Sarah',
  failure_reason: '',
  network: '',
  phone_ending: '',
  created_at: '2026-11-18T10:00:00Z',
  completed_at: null,
  ...over,
});

beforeEach(() => vi.mocked(api).mockReset());

describe('getInterpreterWallet', () => {
  it('is null while payments are not live', async () => {
    vi.mocked(api).mockRejectedValueOnce(new ApiError(404, 'Not found'));

    expect(await getInterpreterWallet()).toBeNull();
  });

  it('gives each line a picture, a date and its shillings', async () => {
    vi.mocked(api).mockResolvedValueOnce({
      currency: 'UGX',
      payments_available: true,
      available: 22000,
      pending: 8000,
      earned: 40000,
      transactions: [
        entry({ id: 4, kind: 'session_earning', status: 'pending', amount: 8000 }),
        entry({
          id: 3,
          kind: 'payout',
          status: 'pending',
          amount: -8000,
          network: 'AIRTEL',
          phone_ending: '4821',
        }),
        entry({ id: 2, kind: 'adjustment', description: 'Thank you' }),
        entry({ id: 1 }),
      ],
    });

    const wallet = await getInterpreterWallet();

    expect(wallet).toMatchObject({
      available: 22000,
      pending: 8000,
      total: 40000,
      symbol: 'UGX',
      paymentsAvailable: true,
    });
    expect(wallet?.transactions.map((t) => t.icon)).toEqual([
      'pending',
      'withdrawal',
      'bonus',
      'session',
    ]);
    expect(wallet?.transactions[3]).toMatchObject({
      date: '2026-11-18',
      detail: 'Session with Sarah',
    });
    expect(wallet?.payoutMethod).toEqual({
      provider: 'Mobile Money (Airtel Money)',
      lastDigits: '4821',
      verified: false,
    });
  });

  it('marks the payout method verified once a payout to it was sent', async () => {
    vi.mocked(api).mockResolvedValueOnce({
      currency: 'UGX',
      payments_available: true,
      available: 0,
      pending: 0,
      transactions: [
        entry({
          kind: 'payout',
          status: 'completed',
          amount: -5000,
          network: 'MTN',
          phone_ending: '7777',
        }),
      ],
    });

    expect((await getInterpreterWallet())?.payoutMethod).toEqual({
      provider: 'Mobile Money (MTN)',
      lastDigits: '7777',
      verified: true,
    });
  });
});
