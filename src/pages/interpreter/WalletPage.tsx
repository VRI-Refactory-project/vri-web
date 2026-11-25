import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Banknote, Clock, Coins, CreditCard, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PayoutMethodCard } from '../../components/interpreter/wallet/PayoutMethodCard';
import { StatCard } from '../../components/interpreter/wallet/StatCard';
import { TransactionFilters } from '../../components/interpreter/wallet/TransactionFilters';
import { TransactionRow } from '../../components/interpreter/wallet/TransactionRow';
import { INTERPRETER_BASE } from '../../features/interpreter/navigation';
import { MoneyForm } from '../../features/wallet/MoneyForm';
import { describeError } from '../../services/api';
import { getInterpreterWallet, type InterpreterWallet } from '../../services/interpreterWallet';
import {
  filterTransactions,
  requestPayout,
  whole,
  type MoneyRequest,
  type TxFilter,
} from '../../services/wallet';
import './WalletPage.css';

/** The interpreter's earnings, transactions and payouts. */
export function InterpreterWalletPage() {
  const navigate = useNavigate();
  // undefined while loading, null while payments are not live
  const [wallet, setWallet] = useState<InterpreterWallet | null | undefined>(undefined);
  const [filter, setFilter] = useState<TxFilter>('all');
  const [search, setSearch] = useState('');
  const [loadError, setLoadError] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [sending, setSending] = useState(false);
  const [payoutError, setPayoutError] = useState('');
  const [requested, setRequested] = useState(false);
  // A ref, because a second press can arrive before React has shown the first one is sending.
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    try {
      setWallet(await getInterpreterWallet());
      setLoadError('');
    } catch (err) {
      setLoadError(describeError(err));
      setWallet((now) => (now === undefined ? null : now));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getInterpreterWallet().then(
      (w) => {
        if (!cancelled) setWallet(w);
      },
      (err) => {
        if (cancelled) return;
        setLoadError(describeError(err));
        setWallet(null);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const symbol = wallet?.symbol;
  const amount = (n: number | undefined) => (n === undefined ? '—' : whole(n, symbol));
  const canWithdraw = wallet?.paymentsAvailable === true;

  const withdraw = async (request: MoneyRequest) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSending(true);
    setPayoutError('');
    try {
      await requestPayout(request);
      setRequested(true);
      setWithdrawing(false);
      void load();
    } catch (err) {
      setPayoutError(describeError(err));
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  };
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

      {loadError && (
        <p className="iw-empty" role="alert">
          {loadError}
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
              <TransactionRow key={transaction.id} transaction={transaction} symbol={symbol} />
            ))}
          </ul>
        )}

        <div className="iw-footer">
          <PayoutMethodCard method={wallet?.payoutMethod ?? null} />
          {/* Both actions stay off, with the reason, until the server has payments switched on. */}
          <div className="iw-actions">
            <button
              type="button"
              className="iw-button iw-button--primary"
              disabled={!canWithdraw}
              aria-describedby={canWithdraw ? undefined : 'iw-actions-hint'}
              aria-expanded={canWithdraw ? withdrawing : undefined}
              onClick={() => {
                setWithdrawing((open) => !open);
                setPayoutError('');
                setRequested(false);
              }}
            >
              <Banknote size={18} aria-hidden="true" />
              Withdraw funds
            </button>
            <button
              type="button"
              className="iw-button"
              disabled={!canWithdraw}
              aria-describedby={canWithdraw ? undefined : 'iw-actions-hint'}
              onClick={() => {
                setFilter('withdrawals');
                setSearch('');
              }}
            >
              <History size={18} aria-hidden="true" />
              View payout history
            </button>
            {!canWithdraw && (
              <p className="iw-actions-hint" id="iw-actions-hint">
                Withdrawals open once payments are live.
              </p>
            )}
          </div>
        </div>

        {requested && (
          <p className="iw-actions-hint" role="status">
            Payout requested. The money is set aside and an administrator will send it to your
            phone.
          </p>
        )}
        {withdrawing && canWithdraw && (
          <MoneyForm
            submitLabel="Request payout"
            hint="The money is taken from your balance straight away. An administrator sends it to this number."
            busy={sending}
            error={payoutError}
            onSubmit={(request) => void withdraw(request)}
          />
        )}
      </section>
    </div>
  );
}
