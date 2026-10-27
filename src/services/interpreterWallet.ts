import type { Transaction } from './wallet';

/**
 * The interpreter's wallet. There is no payments backend yet: set VITE_MOCK_INTERPRETER_WALLET=true in
 * .env.local to see it filled with sample data; without it the page shows an honest "not live yet".
 *
 * Built on the shared wallet types and helpers in ./wallet (filterTransactions, money, whole).
 */

/** Which picture a transaction gets in the list. */
export type TransactionIcon = 'session' | 'pending' | 'withdrawal' | 'bonus';

export interface InterpreterTransaction extends Transaction {
  /** ISO date, e.g. "2026-10-10". */
  date: string;
  icon: TransactionIcon;
}

export interface PayoutMethod {
  /** e.g. "Mobile Money (Airtel Money)" */
  provider: string;
  /** The last four digits of the account, the only part ever shown. */
  lastDigits: string;
  verified: boolean;
}

export interface InterpreterWallet {
  available: number;
  pending: number;
  total: number;
  payoutMethod: PayoutMethod | null;
  transactions: InterpreterTransaction[];
}

const SAMPLE: InterpreterWallet = {
  available: 27000,
  pending: 17000,
  total: 44000,
  payoutMethod: { provider: 'Mobile Money (Airtel Money)', lastDigits: '4821', verified: true },
  transactions: [
    {
      id: '1',
      title: 'Session payment',
      detail: 'Client: Acme Corp',
      date: '2026-10-10',
      amount: 120,
      kind: 'earning',
      status: 'Completed',
      icon: 'session',
    },
    {
      id: '2',
      title: 'Pending session payment',
      detail: 'Client: Global Health Org',
      date: '2026-10-09',
      amount: 85,
      kind: 'pending',
      status: 'Pending',
      icon: 'pending',
    },
    {
      id: '3',
      title: 'Withdrawal',
      detail: 'Mobile Money (**** 4821)',
      date: '2026-10-07',
      amount: -200,
      kind: 'withdrawal',
      status: 'Processing',
      icon: 'withdrawal',
    },
    {
      id: '4',
      title: 'Bonus payment',
      detail: 'Platform incentive',
      date: '2026-10-05',
      amount: 50,
      kind: 'earning',
      status: 'Completed',
      icon: 'bonus',
    },
  ],
};

const walletMocked = () => import.meta.env.VITE_MOCK_INTERPRETER_WALLET === 'true';

/** The interpreter's wallet, or null while payments are not live. */
export async function getInterpreterWallet(): Promise<InterpreterWallet | null> {
  return walletMocked() ? SAMPLE : null;
}
