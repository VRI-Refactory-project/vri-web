import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError } from './api';
import {
  filterTransactions,
  getApiWallet,
  money,
  requestPayout,
  toLine,
  whole,
  type ApiWalletEntry,
  type Transaction,
} from './wallet';

vi.mock('./api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api')>()),
  api: vi.fn(),
}));

const tx = (over: Partial<Transaction>): Transaction => ({
  id: '1',
  title: 'Session payment',
  detail: 'Acme',
  amount: 10,
  kind: 'earning',
  status: 'Completed',
  ...over,
});

const entry = (over: Partial<ApiWalletEntry> = {}): ApiWalletEntry => ({
  id: 1,
  reference: 'topup-abc',
  kind: 'topup',
  status: 'completed',
  amount: 20000,
  currency: 'UGX',
  description: '',
  failure_reason: '',
  network: 'MTN',
  phone_ending: '4821',
  created_at: '2026-11-20T09:30:00Z',
  completed_at: '2026-11-20T09:31:00Z',
  ...over,
});

beforeEach(() => vi.mocked(api).mockReset());

describe('getApiWallet', () => {
  it('has no wallet while the server has none or payments are off', async () => {
    vi.mocked(api).mockRejectedValueOnce(new ApiError(404, 'Not found'));
    expect(await getApiWallet()).toBeNull();
    vi.mocked(api).mockRejectedValueOnce(new ApiError(503, 'Payments are not available yet.'));
    expect(await getApiWallet()).toBeNull();
  });

  it('passes on any other failure, so the page can say so', async () => {
    vi.mocked(api).mockRejectedValueOnce(new ApiError(500, 'Server error'));
    await expect(getApiWallet()).rejects.toThrow('Server error');
    vi.mocked(api).mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(getApiWallet()).rejects.toThrow('Failed to fetch');
  });

  it('reads the wallet from the server', async () => {
    const raw = {
      currency: 'UGX',
      payments_available: true,
      available: 1,
      pending: 0,
      transactions: [],
    };
    vi.mocked(api).mockResolvedValueOnce(raw);

    expect(await getApiWallet()).toEqual(raw);
    expect(api).toHaveBeenCalledWith('/api/v1/wallet/');
  });
});

describe('toLine', () => {
  it('shows a payout waiting for an administrator as Processing, and money out as a withdrawal', () => {
    const payout = toLine(entry({ kind: 'payout', status: 'pending', amount: -5000 }));

    expect(payout).toMatchObject({ title: 'Payout', status: 'Processing', kind: 'pending' });
    expect(toLine(entry({ kind: 'payout', status: 'completed', amount: -5000 }))).toMatchObject({
      status: 'Completed',
      kind: 'withdrawal',
    });
  });

  it('shows a top-up waiting for the phone as Pending', () => {
    expect(toLine(entry({ status: 'pending' }))).toMatchObject({
      status: 'Pending',
      kind: 'pending',
    });
  });

  it('shows why a payment failed', () => {
    expect(
      toLine(entry({ status: 'failed', failure_reason: 'Not approved on the phone' })),
    ).toMatchObject({
      status: 'Failed',
      detail: 'Not approved on the phone',
    });
    expect(toLine(entry({ status: 'failed' })).detail).toBe('Not completed');
  });

  it('uses the description when there is one, and keeps the date and the kind', () => {
    expect(
      toLine(entry({ kind: 'session_earning', description: 'Session with Sarah' })),
    ).toMatchObject({
      title: 'Session earning',
      detail: 'Session with Sarah',
      date: '2026-11-20',
      entryKind: 'session_earning',
    });
  });
});

describe('moving money', () => {
  it('asks for a payout with the amount and network, and the number only when given', async () => {
    vi.mocked(api).mockResolvedValue(entry({ kind: 'payout', status: 'pending', amount: -5000 }));

    await requestPayout({ amount: 5000, network: 'MTN', phone: '' });
    await requestPayout({ amount: 5000, network: 'AIRTEL', phone: ' 0772 000 111 ' });

    expect(api).toHaveBeenNthCalledWith(1, '/api/v1/wallet/payouts/', {
      method: 'POST',
      body: JSON.stringify({ amount: 5000, network: 'MTN' }),
    });
    expect(api).toHaveBeenNthCalledWith(2, '/api/v1/wallet/payouts/', {
      method: 'POST',
      body: JSON.stringify({ amount: 5000, network: 'AIRTEL', phone_number: '0772 000 111' }),
    });
  });

  it('asks for a payout', async () => {
    vi.mocked(api).mockResolvedValueOnce(
      entry({ kind: 'payout', status: 'pending', amount: -8000 }),
    );

    const line = await requestPayout({ amount: 8000, network: 'MTN', phone: '' });

    expect(line.status).toBe('Processing');
    expect(api).toHaveBeenCalledWith('/api/v1/wallet/payouts/', {
      method: 'POST',
      body: JSON.stringify({ amount: 8000, network: 'MTN' }),
    });
  });
});

describe('formatting', () => {
  it('formats amounts with a sign, in dollars unless told otherwise', () => {
    expect(money(120)).toBe('+ $120.00');
    expect(money(-200)).toBe('- $200.00');
    expect(whole(27000)).toBe('$ 27,000');
  });

  it('shows shillings without cents', () => {
    expect(money(20000, 'UGX')).toBe('+ UGX 20,000');
    expect(money(-5000, 'UGX')).toBe('- UGX 5,000');
    expect(whole(27000, 'UGX')).toBe('UGX 27,000');
  });
});

describe('filterTransactions', () => {
  it('filters by tab and by search', () => {
    const list = [
      tx({ id: '1' }),
      tx({ id: '2', kind: 'withdrawal', title: 'Withdrawal' }),
      tx({ id: '3', kind: 'pending' }),
    ];
    expect(filterTransactions(list, 'withdrawals', '').map((t) => t.id)).toEqual(['2']);
    expect(filterTransactions(list, 'pending', '').map((t) => t.id)).toEqual(['3']);
    expect(filterTransactions(list, 'all', 'withdraw').map((t) => t.id)).toEqual(['2']);
    expect(filterTransactions(list, 'all', '')).toHaveLength(3);
  });
});
