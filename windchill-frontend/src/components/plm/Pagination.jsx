import { useCallback } from 'react';
import './Pagination.css';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function Pagination({
  page,
  totalPages,
  size,
  totalElements,
  onPageChange,
  onSizeChange,
}) {
  const currentPage = page + 1; // zero-based → one-based display
  const safeTotalPages = totalPages || 1;

  const startItem = totalElements === 0 ? 0 : page * size + 1;
  const endItem = Math.min((page + 1) * size, totalElements);

  const handleSizeChange = useCallback(
    (e) => {
      const newSize = Number(e.target.value);
      if (onSizeChange) onSizeChange(newSize);
    },
    [onSizeChange],
  );

  const prevDisabled = page === 0;
  const nextDisabled = page >= safeTotalPages - 1;

  return (
    <div className="pagination">
      <div className="pagination-info">
        Showing {startItem}&ndash;{endItem} of {totalElements} results
      </div>

      <div className="pagination-controls">
        <label className="pagination-size-label">
          Page size
          <select
            className="pagination-size-select"
            value={size}
            onChange={handleSizeChange}
          >
            {PAGE_SIZE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>

        <span className="pagination-page-indicator">
          Page {currentPage} of {safeTotalPages}
        </span>

        <div className="pagination-buttons">
          <button
            className="pagination-btn"
            disabled={prevDisabled}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </button>
          <button
            className="pagination-btn"
            disabled={nextDisabled}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
