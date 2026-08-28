import { LuArrowDown, LuArrowUp, LuArrowUpDown } from "react-icons/lu";

/**
 * A clickable <th> for server-driven sorting: click toggles asc/desc on that
 * column, or switches to it (ascending first) if a different column was active.
 */
function AdminSortableHeader({ label, sortKey, sort, sortDir, onSort, className }) {
  const isActive = sort === sortKey;

  const handleClick = () => {
    if (isActive) {
      onSort(sortKey, sortDir === "asc" ? "desc" : "asc");
    } else {
      onSort(sortKey, "asc");
    }
  };

  return (
    <th className={className}>
      <button type="button" className="admin-table__sort-btn" onClick={handleClick}>
        <span>{label}</span>
        {isActive ? (
          sortDir === "asc" ? <LuArrowUp /> : <LuArrowDown />
        ) : (
          <LuArrowUpDown className="admin-table__sort-icon--idle" />
        )}
      </button>
    </th>
  );
}

export default AdminSortableHeader;
