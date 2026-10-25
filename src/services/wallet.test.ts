import { describe, expect, it } from 'vitest';
import { filterTransactions, getWallet, money, whole, type Transaction } from './wallet';

const tx = (over: Partial<Transaction>): Transaction => ({
  id: '1',
  title: 'Session payment',
  detail: 'Acme',
  amount: 10,
  kind: 'earning',
  status: 'Completed',
  ...over,
});

describe('wallet', () => {
  it('has no wallet while payments are not live', async () => {
    expect(await getWallet()).toBeNull();
  });

  it('formats amounts with a sign', () => {
    expect(money(120)).toBe('+ $120.00');
    expect(money(-200)).toBe('- $200.00');
    expect(whole(27000)).toBe('$ 27,000');
  });

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
