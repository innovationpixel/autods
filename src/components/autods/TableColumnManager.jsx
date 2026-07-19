import { useEffect, useMemo, useRef, useState } from "react";
import {
  LuArrowDown,
  LuArrowUp,
  LuCheck,
  LuColumns3,
  LuGripVertical,
  LuRotateCcw,
  LuSearch,
} from "react-icons/lu";

function moveVisibleColumn(ids, columnId, direction) {
  const index = ids.indexOf(columnId);
  if (index === -1) {
    return ids;
  }

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= ids.length) {
    return ids;
  }

  const next = [...ids];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next;
}

function reorderVisibleColumn(ids, sourceId, targetId) {
  if (sourceId === targetId) {
    return ids;
  }

  const fromIndex = ids.indexOf(sourceId);
  const toIndex = ids.indexOf(targetId);

  if (fromIndex === -1 || toIndex === -1) {
    return ids;
  }

  const next = [...ids];
  next.splice(fromIndex, 1);
  next.splice(toIndex, 0, sourceId);
  return next;
}

function TableColumnManager({
  visibleColumnIds,
  onChange,
  columns,
  defaultColumnIds,
  allColumnIds,
  totalColumnCount,
  dialogLabel = "Customise grid",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [draggingId, setDraggingId] = useState("");
  const [dragOverId, setDragOverId] = useState("");
  const rootRef = useRef(null);

  const allIds = useMemo(() => allColumnIds(), [allColumnIds]);
  const allVisible = visibleColumnIds.length === allIds.length;
  const someVisible = visibleColumnIds.length > 0 && !allVisible;
  const canReorder = !query.trim();

  const orderedColumns = useMemo(() => {
    const columnMap = new Map(columns.map((column) => [column.id, column]));
    const visible = visibleColumnIds.map((id) => columnMap.get(id)).filter(Boolean);
    const hidden = columns.filter((column) => !visibleColumnIds.includes(column.id));
    const combined = [...visible, ...hidden];
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return combined;
    }

    return combined.filter((column) => column.label.toLowerCase().includes(normalized));
  }, [columns, query, visibleColumnIds]);

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
    onChange(allVisible ? [columns[0].id] : allIds);
  };

  const resetDefaults = () => {
    onChange(defaultColumnIds());
  };

  const moveColumn = (columnId, direction) => {
    onChange(moveVisibleColumn(visibleColumnIds, columnId, direction));
  };

  const handleDrop = (targetId) => {
    if (!draggingId || draggingId === targetId) {
      setDraggingId("");
      setDragOverId("");
      return;
    }

    onChange(reorderVisibleColumn(visibleColumnIds, draggingId, targetId));
    setDraggingId("");
    setDragOverId("");
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
        <span>Customise Grid</span>
      </button>

      {open ? (
        <div className="orders-column-manager__panel" role="dialog" aria-label={dialogLabel}>
          <div className="orders-column-manager__head">
            <strong>Customise Grid</strong>
            <span className="orders-column-manager__meta">
              {allVisible
                ? `All ${totalColumnCount} columns visible`
                : `${visibleColumnIds.length} of ${allIds.length} visible`}
            </span>
          </div>

          {canReorder ? (
            <p className="orders-column-manager__hint">Drag visible columns or use arrows to change order.</p>
          ) : null}

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
            {orderedColumns.map((column) => {
              const checked = visibleColumnIds.includes(column.id);
              const visibleIndex = visibleColumnIds.indexOf(column.id);
              const canMove = checked && canReorder;

              return (
                <div
                  className={`orders-column-manager__item ${checked ? "orders-column-manager__item--visible" : ""} ${dragOverId === column.id ? "orders-column-manager__item--drag-over" : ""}`}
                  key={column.id}
                  role="option"
                  aria-selected={checked}
                  draggable={canMove}
                  onDragStart={() => {
                    if (!canMove) {
                      return;
                    }
                    setDraggingId(column.id);
                  }}
                  onDragEnd={() => {
                    setDraggingId("");
                    setDragOverId("");
                  }}
                  onDragOver={(event) => {
                    if (!canMove || !draggingId || draggingId === column.id) {
                      return;
                    }
                    event.preventDefault();
                    setDragOverId(column.id);
                  }}
                  onDragLeave={() => {
                    if (dragOverId === column.id) {
                      setDragOverId("");
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    handleDrop(column.id);
                  }}
                >
                  <span
                    className={`orders-column-manager__grip ${canMove ? "" : "orders-column-manager__grip--disabled"}`}
                    aria-hidden="true"
                  >
                    <LuGripVertical />
                  </span>

                  <label className="orders-column-manager__item-label">
                    <input type="checkbox" checked={checked} onChange={() => toggleColumn(column.id)} />
                    <span className="orders-column-manager__check" aria-hidden="true">
                      {checked ? <LuCheck /> : null}
                    </span>
                    <span>{column.label}</span>
                  </label>

                  <div className="orders-column-manager__reorder">
                    <button
                      type="button"
                      className="orders-column-manager__reorder-btn"
                      aria-label={`Move ${column.label} up`}
                      disabled={!canMove || visibleIndex <= 0}
                      onClick={(event) => {
                        event.stopPropagation();
                        moveColumn(column.id, "up");
                      }}
                    >
                      <LuArrowUp />
                    </button>
                    <button
                      type="button"
                      className="orders-column-manager__reorder-btn"
                      aria-label={`Move ${column.label} down`}
                      disabled={!canMove || visibleIndex === -1 || visibleIndex >= visibleColumnIds.length - 1}
                      onClick={(event) => {
                        event.stopPropagation();
                        moveColumn(column.id, "down");
                      }}
                    >
                      <LuArrowDown />
                    </button>
                  </div>
                </div>
              );
            })}

            {!orderedColumns.length ? (
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

export default TableColumnManager;
