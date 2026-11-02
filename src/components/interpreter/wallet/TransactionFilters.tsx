import { Search } from 'lucide-react';
import type { TxFilter } from '../../../services/wallet';
import './wallet.css';

const FILTERS: { id: TxFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'earnings', label: 'Earnings' },
  { id: 'withdrawals', label: 'Withdrawals' },
  { id: 'pending', label: 'Pending' },
];

interface TransactionFiltersProps {
  filter: TxFilter;
  onFilterChange: (filter: TxFilter) => void;
  search: string;
  onSearchChange: (search: string) => void;
}

/**
 * The chips and the search box above Recent activity. The chips filter one list, so they are
 * toggle buttons (aria-pressed) rather than tabs.
 */
export function TransactionFilters({
  filter,
  onFilterChange,
  search,
  onSearchChange,
}: TransactionFiltersProps) {
  return (
    <div className="iw-toolbar">
      <div className="iw-chips" role="group" aria-label="Show transactions">
        {FILTERS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className="iw-chip"
            aria-pressed={filter === id}
            onClick={() => onFilterChange(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <label className="iw-search">
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          aria-label="Search transactions"
          placeholder="Search transactions…"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>
    </div>
  );
}
