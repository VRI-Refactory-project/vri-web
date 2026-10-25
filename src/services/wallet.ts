import { extrasMocked } from './deafExtras';

export type TxKind = 'earning' | 'withdrawal' | 'pending';

export interface Transaction {
  id: string;
  title: string;
  detail: string;
  amount: number;
  kind: TxKind;
  status: 'Completed' | 'Pending' | 'Processing';
}

export interface WalletData {
  available: number;
  pending: number;
  total: number;
  payoutMethod: string | null;
  transactions: Transaction[];
}

const SAMPLE: WalletData = {
  available: 27000,
  pending: 17000,
  total: 44000,
  payoutMethod: 'Mobile Money (Airtel Money) •••• 4821',
  transactions: [
    {
      id: '1',
      title: 'Session payment',
      detail: 'Sample entry',
      amount: 120,
      kind: 'earning',
      status: 'Completed',
    },
    {
      id: '2',
      title: 'Pending session payment',
      detail: 'Sample entry',
      amount: 85,
      kind: 'pending',
      status: 'Pending',
    },
    {
      id: '3',
      title: 'Withdrawal',
      detail: 'Sample entry',
      amount: -200,
      kind: 'withdrawal',
      status: 'Processing',
    },
  ],
};

/** The wallet, or null while payments are not live. */
export async function getWallet(): Promise<WalletData | null> {
  return extrasMocked() ? SAMPLE : null;
}

export const money = (n: number) =>
  `${n < 0 ? '- ' : n > 0 ? '+ ' : ''}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const whole = (n: number) => `$ ${n.toLocaleString('en-US')}`;

export type TxFilter = 'all' | 'earnings' | 'withdrawals' | 'pending';

export function filterTransactions(list: Transaction[], filter: TxFilter, search: string) {
  const q = search.trim().toLowerCase();
  return list.filter((t) => {
    if (filter === 'earnings' && t.kind !== 'earning') return false;
    if (filter === 'withdrawals' && t.kind !== 'withdrawal') return false;
    if (filter === 'pending' && t.kind !== 'pending') return false;
    return !q || `${t.title} ${t.detail}`.toLowerCase().includes(q);
  });
}
