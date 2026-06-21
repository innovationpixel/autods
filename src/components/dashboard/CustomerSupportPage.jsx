import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LuCalendar,
  LuChevronLeft,
  LuChevronRight,
  LuFilter,
  LuInbox,
  LuLoader,
  LuRefreshCcw,
  LuStar,
} from "react-icons/lu";
import { toast } from "../../utils/toast";
import { buildPaginationItems } from "../autods/helpers";
import {
  getSupportConversations,
  syncSupportConversations,
  updateSupportConversation,
} from "../../services/SupportService";
import "../../assets/css/customer-support.css";
import PageFilterPanel from "../autods/PageFilterPanel";
import { FilterSelect } from "../autods/FilterField";

const sortableColumns = {
  status: "status",
  type: "type",
  time: "time",
};

const typeFilterOptions = [
  "All",
  "System Conversation",
  "Pre Sale Conversation",
];

function SortHeader({ children, column, sort, onSort }) {
  const active = sort.key === column;

  return (
    <button
      type="button"
      className={`support-sort ${active ? "support-sort--active" : ""}`}
      onClick={() => onSort(column)}
    >
      <span>{children}</span>
      <span className={`support-sort__chevrons support-sort__chevrons--${active ? sort.direction : "idle"}`}>
        <span />
        <span />
      </span>
    </button>
  );
}

function CustomerSupportContent({ searchQuery = "" }) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [sort, setSort] = useState({ key: "time", direction: "desc" });
  const [selectedRows, setSelectedRows] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState("All");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const clearSupportFilters = () => {
    setTypeFilter("All");
  };

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSupportConversations({
        q: searchQuery,
        type: typeFilter,
        unread: unreadOnly ? "1" : "",
        page: currentPage,
        limit: pageSize,
        sort: sort.key,
        direction: sort.direction,
      });
      setRows(res.data?.data ?? []);
      setMeta(res.data?.meta ?? {});
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to load conversations.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, typeFilter, unreadOnly, currentPage, pageSize, sort.key, sort.direction]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, unreadOnly, pageSize]);

  const totalPages = meta?.last_page ?? 1;
  const totalCount = meta?.total ?? rows.length;
  const paginationItems = buildPaginationItems(currentPage, totalPages);
  const allSelected = selectedRows.length === rows.length && rows.length > 0;

  const toggleSort = (column) => {
    setSort((current) => {
      if (current.key !== column) {
        return { key: column, direction: "asc" };
      }

      return { key: column, direction: current.direction === "asc" ? "desc" : "asc" };
    });
  };

  const handleRefresh = async () => {
    setSyncing(true);
    try {
      const res = await syncSupportConversations();
      toast.success(res.data?.message ?? "Conversations synced.");
      await loadConversations();
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to sync conversations.");
    } finally {
      setSyncing(false);
    }
  };

  const toggleFavorite = async (row) => {
    try {
      const res = await updateSupportConversation(row.id, {
        is_favorite: !row.is_favorite,
      });
      const updated = res.data?.conversation;
      setRows((current) =>
        current.map((item) => (item.id === row.id ? { ...item, ...updated } : item)),
      );
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to update favorite.");
    }
  };

  const markAsRead = async (row) => {
    if (!row.unread) {
      return;
    }

    try {
      const res = await updateSupportConversation(row.id, { is_unread: false });
      const updated = res.data?.conversation;
      setRows((current) =>
        current.map((item) => (item.id === row.id ? { ...item, ...updated } : item)),
      );
    } catch {
      // Non-blocking — row still displays if mark-read fails.
    }
  };

  const toggleAllRows = () => {
    setSelectedRows(allSelected ? [] : rows.map((row) => row.id));
  };

  const toggleRow = (id) => {
    setSelectedRows((current) =>
      current.includes(id) ? current.filter((rowId) => rowId !== id) : [...current, id],
    );
  };

  const emptyMessage = useMemo(() => {
    if (searchQuery || typeFilter !== "All" || unreadOnly) {
      return "No conversations match your filters.";
    }
    return "No conversations yet. Click Refresh to sync messages from eBay.";
  }, [searchQuery, typeFilter, unreadOnly]);

  return (
    <div className="customer-support-content">
      <section className="support-toolbar" aria-label="Conversation controls">
        <div className="support-toolbar__left">
          <button
            type="button"
            className={`support-view-btn ${unreadOnly ? "support-view-btn--active" : ""}`}
            onClick={() => setUnreadOnly((current) => !current)}
          >
            {unreadOnly ? "Unread only" : "All conversations"}
          </button>
          <button
            type="button"
            className={`support-filter-btn ${showFilters ? "support-filter-btn--active" : ""}`}
            onClick={() => setShowFilters((current) => !current)}
          >
            <LuFilter aria-hidden="true" />
            <span>Add Filter</span>
          </button>
        </div>

        <button
          type="button"
          className="support-refresh-btn"
          onClick={handleRefresh}
          disabled={syncing || loading}
        >
          {syncing ? <LuLoader className="spin-icon" /> : <LuRefreshCcw aria-hidden="true" />}
          <span>{syncing ? "Syncing…" : "Refresh"}</span>
        </button>
      </section>

      {showFilters ? (
        <PageFilterPanel
          layout="auto"
          onClear={typeFilter !== "All" ? clearSupportFilters : undefined}
        >
          <FilterSelect
            label="Type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            {typeFilterOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </FilterSelect>
        </PageFilterPanel>
      ) : null}

      <main className="support-table-shell">
        <div className="support-table-scroll">
          <table className="support-table">
            <colgroup>
              <col className="support-col-check" />
              <col className="support-col-star" />
              <col className="support-col-message" />
              <col className="support-col-buyer" />
              <col className="support-col-status" />
              <col className="support-col-type" />
              <col className="support-col-time" />
              <col className="support-col-store" />
            </colgroup>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    className="support-checkbox"
                    aria-label="Select all conversations"
                    checked={allSelected}
                    onChange={toggleAllRows}
                    disabled={!rows.length}
                  />
                </th>
                <th aria-label="Favorite" />
                <th>Message</th>
                <th>Buyer</th>
                <th>
                  <SortHeader column={sortableColumns.status} sort={sort} onSort={toggleSort}>
                    Status
                  </SortHeader>
                </th>
                <th>
                  <SortHeader column={sortableColumns.type} sort={sort} onSort={toggleSort}>
                    Type
                  </SortHeader>
                </th>
                <th>
                  <SortHeader column={sortableColumns.time} sort={sort} onSort={toggleSort}>
                    Time
                  </SortHeader>
                </th>
                <th>Store</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "32px 16px" }}>
                    <LuLoader className="spin-icon" style={{ marginRight: 8 }} />
                    Loading conversations…
                  </td>
                </tr>
              ) : rows.length ? (
                rows.map((row) => {
                  const isSelected = selectedRows.includes(row.id);
                  const isFavorite = row.is_favorite;

                  return (
                    <tr
                      key={row.id}
                      className={isSelected ? "support-table__row support-table__row--selected" : "support-table__row"}
                      onClick={() => markAsRead(row)}
                    >
                      <td>
                        <input
                          type="checkbox"
                          className="support-checkbox"
                          aria-label={`Select conversation ${row.id}`}
                          checked={isSelected}
                          onChange={() => toggleRow(row.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`support-star ${isFavorite ? "support-star--active" : ""}`}
                          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                          aria-pressed={isFavorite}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(row);
                          }}
                        >
                          <LuStar />
                        </button>
                      </td>
                      <td>
                        <div className="support-message">
                          {row.unread ? <span className="support-message__dot" aria-hidden="true" /> : null}
                          {row.message_icon === "calendar" ? (
                            <span className="support-message__mini-icon" aria-hidden="true">
                              <LuCalendar />
                            </span>
                          ) : null}
                          <span className={`support-message__text ${row.unread ? "support-message__text--unread" : ""}`}>
                            {row.message}
                          </span>
                        </div>
                      </td>
                      <td className="support-table__buyer">{row.buyer}</td>
                      <td>
                        <span className="support-status-badge">{row.status}</span>
                      </td>
                      <td>
                        <span className="support-type-badge">{row.type}</span>
                      </td>
                      <td className="support-table__time">{row.time}</td>
                      <td className="support-table__store">{row.store ?? "—"}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px 16px", color: "#8b8a93" }}>
                    <LuInbox style={{ display: "block", margin: "0 auto 8px", fontSize: 28 }} />
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      <footer className="support-footer">
        <nav className="support-pagination" aria-label="Conversation pages">
          <button
            type="button"
            className="support-pagination__arrow"
            aria-label="Previous page"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          >
            <LuChevronLeft />
          </button>
          {paginationItems.map((item, index) =>
            item === "..." ? (
              <span key={`ellipsis-${index}`} className="support-pagination__page">…</span>
            ) : (
              <button
                type="button"
                key={item}
                className={`support-pagination__page ${item === currentPage ? "support-pagination__page--active" : ""}`}
                aria-current={item === currentPage ? "page" : undefined}
                onClick={() => setCurrentPage(item)}
              >
                {item}
              </button>
            ),
          )}
          <button
            type="button"
            className="support-pagination__arrow"
            aria-label="Next page"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
          >
            <LuChevronRight />
          </button>
        </nav>

        <div className="support-footer__meta">
          <label>
            <span>Show</span>
            <select
              value={pageSize}
              aria-label="Conversations per page"
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              <option value={20}>20</option>
              <option value={40}>40</option>
              <option value={60}>60</option>
            </select>
          </label>
          <span>Conversations out of {totalCount}</span>
        </div>
      </footer>
    </div>
  );
}

export default CustomerSupportContent;
