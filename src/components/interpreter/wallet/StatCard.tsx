import type { LucideIcon } from 'lucide-react';
import './wallet.css';

interface StatCardProps {
  icon: LucideIcon;
  /** Colour of the icon box. */
  tone: 'purple' | 'amber' | 'violet';
  label: string;
  value: string;
}

/** One summary box at the top of the wallet: icon, label and amount. */
export function StatCard({ icon: Icon, tone, label, value }: StatCardProps) {
  return (
    <div className="iw-stat">
      <span className={`iw-stat-icon iw-stat-icon--${tone}`}>
        <Icon size={22} aria-hidden="true" />
      </span>
      <div>
        <span className="iw-stat-label">{label}</span>
        <strong className="iw-stat-value">{value}</strong>
      </div>
    </div>
  );
}
