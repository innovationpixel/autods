import { PAGE_SIZE_OPTIONS } from "./helpers";

function AdminPagination({
  currentPage = 1,
  lastPage = 1,
  total,
  perPage = 20,
  onPageChange,
  onPerPageChange,
  perPageOptions = PAGE_SIZE_OPTIONS,
  entityName = "records",
}) {
  const safeCurrentPage = Math.max(1, Number(currentPage) || 1);
  const safeLastPage = Math.max(1, Number(lastPage) || 1);

  return (
    <div className="admin-page__pagination">
      <div className="admin-page__pagination-controls">
        <button
          type="button"
          disabled={safeCurrentPage <= 1}
          onClick={() => onPageChange?.(safeCurrentPage - 1)}
        >
          Previous
        </button>
        <span>
          Page {safeCurrentPage} of {safeLastPage}
        </span>
        <button
          type="button"
          disabled={safeCurrentPage >= safeLastPage}
          onClick={() => onPageChange?.(safeCurrentPage + 1)}
        >
          Next
        </button>
      </div>

      <div className="admin-page__pagination-size">
        <label>
          <span>Show</span>
          <select
            value={perPage}
            aria-label={`Show ${entityName} per page`}
            onChange={(e) => {
              const val = Number(e.target.value);
              onPerPageChange?.(val);
              onPageChange?.(1);
            }}
          >
            {perPageOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <span>{entityName}</span>
        </label>
        {typeof total === "number" ? (
          <span className="admin-page__pagination-total">
            (Total {total})
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default AdminPagination;
