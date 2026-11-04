import { ChevronRight, Clock, Landmark, Star, Video, type LucideIcon } from 'lucide-react';
import {
  formatTransactionDate,
  type InterpreterTransaction,
  type TransactionIcon,
} from '../../../services/interpreterWallet';
import { money } from '../../../services/wallet';
import './wallet.css';

const ICONS: Record<TransactionIcon, LucideIcon> = {
  session: Video,
  pending: Clock,
  withdrawal: Landmark,
  bonus: Star,
};

/** One line of Recent activity: what it was, when, its status and the amount. */
export function TransactionRow({ transaction }: { transaction: InterpreterTransaction }) {
  const { title, detail, date, amount, status, icon } = transaction;
  const Icon = ICONS[icon];

  return (
    <li className="iw-tx">
      <span className={`iw-tx-icon iw-tx-icon--${icon}`}>
        <Icon size={18} aria-hidden="true" />
      </span>
      <span className="iw-tx-text">
        <strong>{title}</strong>
        <span>
          {formatTransactionDate(date)} <span aria-hidden="true">•</span> {detail}
        </span>
      </span>
      <span className={`iw-badge iw-badge--${status.toLowerCase()}`}>{status}</span>
      <span className={`iw-amount${amount < 0 ? ' iw-amount--out' : ''}`}>{money(amount)}</span>
      <ChevronRight className="iw-tx-chevron" size={18} aria-hidden="true" />
    </li>
  );
}
