import { api, ApiError } from './api';

export type TxKind = 'earning' | 'withdrawal' | 'pending';

export interface Transaction {
  id: string;
  title: string;
  detail: string;
  amount: number;
  kind: TxKind;
  status: 'Completed' | 'Pending' | 'Processing' | 'Failed';
}

/** The mobile money networks the server accepts. */
export type Network = 'MTN' | 'AIRTEL';
export const NETWORKS: { id: Network; label: string }[] = [
  { id: 'MTN', label: 'MTN Mobile Money' },
  { id: 'AIRTEL', label: 'Airtel Money' },
];
const networkLabel = (id: string) => NETWORKS.find((n) => n.id === id)?.label ?? id;

export interface ApiWalletEntry {
  id: number;
  reference: string;
  kind: string;
  status: 'pending' | 'completed' | 'failed';
  amount: number;
  currency: string;
  description: string;
  failure_reason: string;
  network: string;
  phone_ending: string;
  created_at: string;
  completed_at: string | null;
}

export interface ApiWallet {
  currency: string;
  payments_available: boolean;
  available: number;
  pending: number;
  earned?: number;
  transactions: ApiWalletEntry[];
}

/** One line of the wallet as the pages show it, plus what the interpreter's page adds to it. */
export interface WalletLine extends Transaction {
  /** ISO date, e.g. "2026-10-10". */
  date: string;
  /** What the server calls it: topup, payout, session_charge, session_earning, adjustment. */
  entryKind: string;
}

const TITLES: Record<string, string> = {
  topup: 'Top-up',
  payout: 'Payout',
  session_charge: 'Session charge',
  session_earning: 'Session earning',
  adjustment: 'Adjustment',
};

/** What an administrator or the phone still has to do before a pending entry is settled. */
const STATUS: Record<ApiWalletEntry['status'], (kind: string) => Transaction['status']> = {
  completed: () => 'Completed',
  failed: () => 'Failed',
  // A payout waits for an administrator to send it; a top-up waits for the person's phone.
  pending: (kind) => (kind === 'payout' ? 'Processing' : 'Pending'),
};

export function toLine(entry: ApiWalletEntry): WalletLine {
  const account = entry.phone_ending
    ? `${networkLabel(entry.network)} •••• ${entry.phone_ending}`
    : '';
  return {
    id: String(entry.id),
    title: TITLES[entry.kind] ?? 'Transaction',
    detail:
      entry.status === 'failed'
        ? entry.failure_reason || 'Not completed'
        : entry.description || account,
    amount: entry.amount,
    kind: entry.status === 'pending' ? 'pending' : entry.amount < 0 ? 'withdrawal' : 'earning',
    status: STATUS[entry.status](entry.kind),
    date: entry.created_at.slice(0, 10),
    entryKind: entry.kind,
  };
}

/** The server's wallet, or null while payments are not live (no wallet there, or switched off). */
export async function getApiWallet(): Promise<ApiWallet | null> {
  try {
    return await api<ApiWallet>('/api/v1/wallet/');
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 503)) return null;
    throw err;
  }
}

/** Where payouts go: the number of the latest payout request, if there has been one. */
export function latestPayout(entries: ApiWalletEntry[]): ApiWalletEntry | undefined {
  return entries.find((e) => e.kind === 'payout' && e.status !== 'failed');
}

export interface MoneyRequest {
  /** Whole shillings. */
  amount: number;
  network: Network;
  /** Leave empty to use the number on the person's account. */
  phone: string;
}

const body = ({ amount, network, phone }: MoneyRequest) =>
  JSON.stringify({ amount, network, ...(phone.trim() ? { phone_number: phone.trim() } : {}) });

/** Asks for earnings to be paid out. The money is held at once and an administrator sends it. */
export async function requestPayout(request: MoneyRequest): Promise<WalletLine> {
  const raw = await api<ApiWalletEntry>('/api/v1/wallet/payouts/', {
    method: 'POST',
    body: body(request),
  });
  return toLine(raw);
}

/** An amount with a sign: "+ $120.00", or "- UGX 5,000" (shillings have no cents). */
export const money = (n: number, symbol = '$') => {
  const sign = n < 0 ? '- ' : n > 0 ? '+ ' : '';
  const cents = symbol === '$';
  const digits = Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  });
  return `${sign}${cents ? '$' : `${symbol} `}${digits}`;
};

export const whole = (n: number, symbol = '$') => `${symbol} ${n.toLocaleString('en-US')}`;

export type TxFilter = 'all' | 'earnings' | 'withdrawals' | 'pending';

/** Generic so a list of richer transactions (e.g. the interpreter's, with dates) keeps its type. */
export function filterTransactions<T extends Transaction>(
  list: T[],
  filter: TxFilter,
  search: string,
): T[] {
  const q = search.trim().toLowerCase();
  return list.filter((t) => {
    if (filter === 'earnings' && t.kind !== 'earning') return false;
    if (filter === 'withdrawals' && t.kind !== 'withdrawal') return false;
    if (filter === 'pending' && t.kind !== 'pending') return false;
    return !q || `${t.title} ${t.detail}`.toLowerCase().includes(q);
  });
}
