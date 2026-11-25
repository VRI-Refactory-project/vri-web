import './TablePagination.css';

interface TablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  label: string;
  onPageChange: (page: number) => void;
}

/** Compact, consistent pagination for locally paged tables. */
export function TablePagination({
  page,
  pageSize,
  total,
  label,
  onPageChange,
}: TablePaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <nav className="table-pagination" aria-label={`${label} pagination`}>
      <span className="table-pagination__summary">
        Showing {first}–{last} of {total} {label}
      </span>
      <div className="table-pagination__controls">
        <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          Previous
        </button>
        <span aria-live="polite">
          Page {page} of {pageCount}
        </span>
        <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount}>
          Next
        </button>
      </div>
    </nav>
  );
}
