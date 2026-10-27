import { useEffect, useState } from 'react';
import { ArrowLeft, Clock, Coins, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../../components/interpreter/wallet/StatCard';
import { INTERPRETER_BASE } from '../../features/interpreter/navigation';
import { getInterpreterWallet, type InterpreterWallet } from '../../services/interpreterWallet';
import { whole } from '../../services/wallet';
import './WalletPage.css';

/** The interpreter's earnings, transactions and payouts. */
export function InterpreterWalletPage() {
  const navigate = useNavigate();
  // undefined while loading, null while payments are not live
  const [wallet, setWallet] = useState<InterpreterWallet | null | undefined>(undefined);

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
    </div>
  );
}
