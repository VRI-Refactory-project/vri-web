import { ChevronRight, Smartphone } from 'lucide-react';
import type { PayoutMethod } from '../../../services/interpreterWallet';
import './wallet.css';

/** Where withdrawals are paid to. Only the last four digits of the account are ever shown. */
export function PayoutMethodCard({ method }: { method: PayoutMethod | null }) {
  return (
    <div className="iw-payout">
      <span className="iw-payout-icon">
        <Smartphone size={20} aria-hidden="true" />
      </span>
      <div className="iw-payout-text">
        <span className="iw-payout-title">
          <strong>Payout method</strong>
          {method?.verified && <span className="iw-badge iw-badge--completed">Verified</span>}
        </span>
        {method ? (
          <>
            <span>{method.provider}</span>
            <span aria-label={`Account ending ${method.lastDigits}`}>•••• {method.lastDigits}</span>
          </>
        ) : (
          <span>No payout method added yet</span>
        )}
      </div>
      <ChevronRight className="iw-tx-chevron" size={18} aria-hidden="true" />
    </div>
  );
}
