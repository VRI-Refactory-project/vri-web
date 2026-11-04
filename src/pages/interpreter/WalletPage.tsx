import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Banknote, Clock, Coins, CreditCard, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PayoutMethodCard } from '../../components/interpreter/wallet/PayoutMethodCard';
import { StatCard } from '../../components/interpreter/wallet/StatCard';
import { TransactionFilters } from '../../components/interpreter/wallet/TransactionFilters';
import { TransactionRow } from '../../components/interpreter/wallet/TransactionRow';
import { INTERPRETER_BASE } from '../../features/interpreter/navigation';
import { getInterpreterWallet, type InterpreterWallet } from '../../services/interpreterWallet';
import { filterTransactions, whole, type TxFilter } from '../../services/wallet';
import './WalletPage.css';

/** The interpreter's earnings, transactions and payouts. */
export function InterpreterWalletPage() {
  const navigate = useNavigate();
  // undefined while loading, null while payments are not live
  const [wallet, setWallet] = useState<InterpreterWallet | null | undefined>(undefined);
  const [filter, setFilter] = useState<TxFilter>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    void getInterpreterWallet().then((w) => {
      if (!cancelled) setWallet(w);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const amount = (n: number | undefined) => (n === undefined ? '—' : whole(n));
  const allTransactions = useMemo(() => wallet?.transactions ?? [], [wallet]);
  const transactions = useMemo(
    () => filterTransactions(allTransactions, filter, search),
    [allTransactions, filter, search],
  );
  // Filtering found nothing, but there is history: say so, rather than "no transactions yet".
  const emptyMessage =
    allTransactions.length === 0 ? 'No transactions yet.' : 'No transactions match your filter.';

  return (
    <div className="iw-page">
      <header className="iw-header">
        <div>
          <h1>Interpreter Wallet</h1>
          <p>Manage your earnings, transactions and payouts</p>
        </div>
        <button type="button" className="iw-back" onClick={() => navigate(INTERPRETER_BASE)}>
          <ArrowLeft size={16} aria-hidden="true" />
          Back
        </button>
      </header>

      {wallet === null && (
        <p className="iw-notice" role="status">
          Payments are not live yet. Your balance and transactions will appear here once they are.
        </p>
      )}

      <div className="iw-stats">
        <StatCard
          icon={CreditCard}
          tone="purple"
          label="Available Balance"
          value={amount(wallet?.available)}
        />
        <StatCard
          icon={Clock}
          tone="amber"
          label="Pending Earnings"
          value={amount(wallet?.pending)}
        />
        <StatCard icon={Coins} tone="violet" label="Total Earnings" value={amount(wallet?.total)} />
      </div>

      <section className="iw-panel" aria-labelledby="iw-activity-title">
        <TransactionFilters
          filter={filter}
          onFilterChange={setFilter}
          search={search}
          onSearchChange={setSearch}
        />
        <h2 className="iw-panel-title" id="iw-activity-title">
          Recent Activity
        </h2>
        {transactions.length === 0 ? (
          <p className="iw-empty">{emptyMessage}</p>
        ) : (
          <ul className="iw-tx-list">
            {transactions.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))}
          </ul>
        )}

        <div className="iw-footer">
          <PayoutMethodCard method={wallet?.payoutMethod ?? null} />
          {/* No payouts backend yet, so both actions stay off and say why. */}
          <div className="iw-actions">
            <button
              type="button"
              className="iw-button iw-button--primary"
              disabled
              aria-describedby="iw-actions-hint"
            >
              <Banknote size={18} aria-hidden="true" />
              Withdraw funds
            </button>
            <button type="button" className="iw-button" disabled aria-describedby="iw-actions-hint">
              <History size={18} aria-hidden="true" />
              View payout history
            </button>
            <p className="iw-actions-hint" id="iw-actions-hint">
              Withdrawals open once payments are live.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
