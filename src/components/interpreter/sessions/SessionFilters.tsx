import { useId } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import {
  STATUS_LABEL,
  type SessionFilter,
  type SessionStatus,
} from '../../../services/interpreterSessions';
import './sessions.css';

const STATUSES = Object.keys(STATUS_LABEL) as SessionStatus[];

interface SessionFiltersProps {
  filter: SessionFilter;
  onFilterChange: (filter: SessionFilter) => void;
  search: string;
  onSearchChange: (search: string) => void;
}

/** Name search and the status filter above the sessions table. */
export function SessionFilters({
  filter,
  onFilterChange,
  search,
  onSearchChange,
}: SessionFiltersProps) {
  const filterId = useId();

  return (
    <div className="isn-toolbar">
      <label className="isn-search">
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          placeholder="Search name"
          aria-label="Search sessions by name"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </label>
      {/* A native select: keyboard and screen-reader support for free, styled to look like the design's button. */}
      <span className="isn-filter">
        <SlidersHorizontal size={16} aria-hidden="true" />
        <label htmlFor={filterId}>Filter</label>
        <select
          id={filterId}
          value={filter}
          onChange={(e) => onFilterChange(e.target.value as SessionFilter)}
        >
          <option value="all">All</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABEL[status]}
            </option>
          ))}
        </select>
      </span>
    </div>
  );
}
