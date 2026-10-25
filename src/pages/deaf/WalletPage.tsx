import { CircleDollarSign, Clock, Landmark, Search, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  filterTransactions,
  getWallet,
  money,
  whole,
  type TxFilter,
  type WalletData,
} from '../../services/wallet';
import './DeafExtras.css';

const TABS: { id: TxFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'earnings', label: 'Earnings' },
  { id: 'withdrawals', label: 'Withdrawals' },
  { id: 'pending', label: 'Pending' },
];

export function WalletPage() {
  // undefined while loading, null when payments are not live
  const [wallet, setWallet] = useState<WalletData | null | undefined>(undefined);
  const [tab, setTab] = useState<TxFilter>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    getWallet().then((w) => !cancelled && setWallet(w));
    return () => {
      cancelled = true;
    };
  }, []);

  const shown = useMemo(
    () => (wallet ? filterTransactions(wallet.transactions, tab, search) : []),
    [wallet, tab, search],
  );
  const stat = (n: number | undefined) => (n === undefined ? '—' : whole(n));

  return (
    <div className="dx-page">
      <header className="dx-header">
        <h1>Wallet</h1>
        <p>Manage your transactions and payouts</p>
      </header>

      {wallet === null && (
        <p className="dx-notice" role="status">
          Payments are not live yet. Your balance and transactions will appear here once they are.
        </p>
      )}

      <div className="dx-stats">
        <div className="dx-stat">
          <span className="dx-icon">
            <Wallet size={20} aria-hidden />
          </span>
          <div>
            <small>Available Balance</small>
            <strong>{stat(wallet?.available)}</strong>
          </div>
        </div>
        <div className="dx-stat">
          <span className="dx-icon dx-icon--amber">
            <Clock size={20} aria-hidden />
          </span>
          <div>
            <small>Pending Earnings</small>
            <strong>{stat(wallet?.pending)}</strong>
          </div>
        </div>
        <div className="dx-stat">
          <span className="dx-icon dx-icon--violet">
            <CircleDollarSign size={20} aria-hidden />
          </span>
          <div>
            <small>Total Earnings</small>
            <strong>{stat(wallet?.total)}</strong>
          </div>
        </div>
      </div>

      <section className="dx-card">
        <div className="dx-toolbar">
          <div className="dx-tabs" role="tablist" aria-label="Transactions">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={`dx-tab${tab === t.id ? ' dx-tab--on' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <label className="dx-search">
            <Search size={16} aria-hidden />
            <input
              type="search"
              aria-label="Search transactions"
              placeholder="Search transactions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>

        <h2 className="dx-h2">Recent Activity</h2>
        {shown.length === 0 ? (
          <p className="dx-empty">No transactions yet.</p>
        ) : (
          <ul className="dx-list">
            {shown.map((t) => (
              <li key={t.id} className="dx-tx">
                <span className="dx-tx-text">
                  <strong>{t.title}</strong>
                  <small>{t.detail}</small>
                </span>
                <span className={`dx-badge dx-badge--${t.status.toLowerCase()}`}>{t.status}</span>
                <span className={`dx-amount${t.amount < 0 ? ' dx-amount--out' : ''}`}>
                  {money(t.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="dx-payout">
          <span className="dx-icon">
            <Landmark size={18} aria-hidden />
          </span>
          <div>
            <strong>Payout method</strong>
            <small>{wallet?.payoutMethod ?? 'No payout method added yet'}</small>
          </div>
        </div>
      </section>
    </div>
  );
}
