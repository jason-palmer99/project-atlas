interface PaginationProps {
  total: number;
  offset: number;
  limit: number;
  onPageChange: (newOffset: number) => void;
}

export function Pagination({ total, offset, limit, onPageChange }: PaginationProps) {
  const start = total === 0 ? 0 : offset + 1;
  const end = Math.min(offset + limit, total);
  const hasPrev = offset > 0;
  const hasNext = offset + limit < total;

  return (
    <div className="pagination">
      <span>
        Showing {start}–{end} of {total}
      </span>
      <div className="pagination-controls">
        <button
          className="btn btn-sm"
          disabled={!hasPrev}
          onClick={() => onPageChange(Math.max(0, offset - limit))}
        >
          Previous
        </button>
        <button
          className="btn btn-sm"
          disabled={!hasNext}
          onClick={() => onPageChange(offset + limit)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
