import { useEffect, useMemo, useRef, useState } from "react";
import { LuCheck, LuColumns3, LuRotateCcw, LuSearch } from "react-icons/lu";
import {
  allManageableColumnIds,
  defaultVisibleColumnIds,
  manageableOrderColumns,
  ORDER_GRID_COLUMN_COUNT,
} from "./orderColumns";

function OrderColumnManager({ visibleColumnIds, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);

  const allIds = useMemo(() => allManageableColumnIds(), []);
  const allVisible = visibleColumnIds.length === allIds.length;
  const someVisible = visibleColumnIds.length > 0 && !allVisible;

  const filteredColumns = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return manageableOrderColumns;
    }

    return manageableOrderColumns.filter((column) => column.label.toLowerCase().includes(normalized));
  }, [query]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleClick = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const toggleColumn = (columnId) => {
    if (visibleColumnIds.includes(columnId) && visibleColumnIds.length === 1) {
      return;
    }

    onChange(
      visibleColumnIds.includes(columnId)
        ? visibleColumnIds.filter((id) => id !== columnId)
        : [...visibleColumnIds, columnId],
    );
  };

  const toggleAll = () => {
    onChange(allVisible ? [manageableOrderColumns[0].id] : allIds);
  };

  const resetDefaults = () => {
    onChange(defaultVisibleColumnIds());
  };

  return (
    <div className="orders-column-manager" ref={rootRef}>
      <button
        type="button"
        className={`orders-column-manager__trigger ${open ? "orders-column-manager__trigger--open" : ""}`}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <LuColumns3 />
        <span>Columns</span>
      </button>

      {open ? (
        <div className="orders-column-manager__panel" role="dialog" aria-label="Manage order columns">
          <div className="orders-column-manager__head">
            <strong>Columns</strong>
            <span className="orders-column-manager__meta">
              {allVisible
                ? `All ${ORDER_GRID_COLUMN_COUNT} columns visible`
                : `${visibleColumnIds.length} of ${allIds.length} visible`}
            </span>
          </div>

          <label className="orders-column-manager__toggle-all">
            <input
              type="checkbox"
              checked={allVisible}
              ref={(input) => {
                if (input) {
                  input.indeterminate = someVisible;
                }
              }}
              onChange={toggleAll}
            />
            <span className="orders-column-manager__check" aria-hidden="true">
              {allVisible ? <LuCheck /> : someVisible ? "–" : null}
            </span>
            <span>Toggle all columns</span>
          </label>

          <label className="orders-column-manager__search">
            <LuSearch />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search columns…"
            />
          </label>

          {!allVisible ? (
            <button type="button" className="orders-column-manager__show-all" onClick={() => onChange(allIds)}>
              <LuCheck />
              <span>Show all columns</span>
            </button>
          ) : null}

          <div className="orders-column-manager__list" role="listbox" aria-multiselectable="true">
            {filteredColumns.map((column) => {
              const checked = visibleColumnIds.includes(column.id);

              return (
                <label className="orders-column-manager__item" key={column.id} role="option" aria-selected={checked}>
                  <input type="checkbox" checked={checked} onChange={() => toggleColumn(column.id)} />
                  <span className="orders-column-manager__check" aria-hidden="true">
                    {checked ? <LuCheck /> : null}
                  </span>
                  <span>{column.label}</span>
                </label>
              );
            })}

            {!filteredColumns.length ? (
              <p className="orders-column-manager__empty">No columns match your search.</p>
            ) : null}
          </div>

          <button type="button" className="orders-column-manager__reset" onClick={resetDefaults}>
            <LuRotateCcw />
            <span>Reset table to default</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default OrderColumnManager;
