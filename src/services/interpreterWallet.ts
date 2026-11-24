import { getApiWallet, latestPayout, toLine, type Transaction, type WalletLine } from './wallet';

/**
 * The interpreter's wallet. It reads the real wallet (GET /api/v1/wallet/) and shows "not live yet" while the
 * server has none. Set VITE_MOCK_INTERPRETER_WALLET=true in .env.local to see sample data instead.
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
  /** The money sign to show; "$" when not given (sample data), "UGX" for the real wallet. */
  symbol?: string;
  /** Withdrawals only work when the server has a payment provider switched on. */
  paymentsAvailable?: boolean;
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

// Dates are stored as "2026-10-10"; reading and showing them in UTC keeps the day from shifting.
const DATE_FORMAT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

/** "2026-10-10" becomes "Oct 10, 2026". */
export const formatTransactionDate = (isoDate: string) => DATE_FORMAT.format(new Date(isoDate));

const walletMocked = () => import.meta.env.VITE_MOCK_INTERPRETER_WALLET === 'true';

const iconFor = (line: WalletLine): TransactionIcon =>
  // A payout keeps its own picture while it waits; the clock is for earnings still on their way.
  line.entryKind === 'payout'
    ? 'withdrawal'
    : line.kind === 'pending'
      ? 'pending'
      : line.entryKind === 'adjustment'
        ? 'bonus'
        : 'session';

/** The interpreter's wallet, or null while payments are not live. Throws when the server cannot be reached. */
export async function getInterpreterWallet(): Promise<InterpreterWallet | null> {
  if (walletMocked()) return SAMPLE;
  const raw = await getApiWallet();
  if (!raw) return null;
  const payout = latestPayout(raw.transactions);
  return {
    available: raw.available,
    pending: raw.pending,
    total: raw.earned ?? raw.available + raw.pending,
    payoutMethod: payout
      ? {
          provider: `Mobile Money (${payout.network === 'AIRTEL' ? 'Airtel Money' : 'MTN'})`,
          lastDigits: payout.phone_ending,
          // Verified once a payout to this number has actually been sent.
          verified: payout.status === 'completed',
        }
      : null,
    transactions: raw.transactions.map(toLine).map((line) => ({ ...line, icon: iconFor(line) })),
    symbol: 'UGX',
    paymentsAvailable: raw.payments_available,
  };
}
