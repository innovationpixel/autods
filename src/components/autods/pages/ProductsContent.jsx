import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "../../../utils/toast";
import {
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuEllipsisVertical,
  LuExternalLink,
  LuInbox,
  LuLink,
  LuLoader,
  LuMenu,
  LuPencil,
  LuPlay,
  LuRefreshCcw,
  LuSlidersHorizontal,
  LuSparkles,
  LuStore,
} from "react-icons/lu";
import { buildPaginationItems, formatDisplayDate } from "../helpers";
import {
  selectEbayConnected,
  selectEbayListings,
  selectEbayListingsMeta,
  selectEbayListingsLoading,
  selectEbayListingsError,
  selectEbaySyncing,
} from "../../../store/selectors/EbaySelectors";
import {
  fetchEbayListings,
  syncEbayListingsAction,
} from "../../../store/actions/EbayActions";

function ProductsContent({ searchQuery }) {
  const dispatch = useDispatch();
  const connected  = useSelector(selectEbayConnected);
  const listings   = useSelector(selectEbayListings);
  const meta       = useSelector(selectEbayListingsMeta);
  const loading    = useSelector(selectEbayListingsLoading);
  const error      = useSelector(selectEbayListingsError);
  const syncing    = useSelector(selectEbaySyncing);

  const [showFilters, setShowFilters]         = useState(false);
  const [showTutorialNote, setShowTutorialNote] = useState(false);
  const [historyVisible, setHistoryVisible]   = useState(false);
  const [pageSize, setPageSize]               = useState(20);
  const [currentPage, setCurrentPage]         = useState(1);
  const [selectedIds, setSelectedIds]         = useState([]);
  const [sortDirection, setSortDirection]     = useState("desc");
  const [filterStatus, setFilterStatus]       = useState("All");
  const [openMenuId, setOpenMenuId]           = useState("");
  const [tableView, setTableView]             = useState("compact");
  const tableScrollRef = useRef(null);

  useEffect(() => {
    if (connected) {
      dispatch(fetchEbayListings({ page: currentPage, limit: pageSize, status: filterStatus === "All" ? "" : filterStatus.toLowerCase(), q: searchQuery }));
    }
  }, [dispatch, connected, currentPage, pageSize, filterStatus, searchQuery]);

  useEffect(() => {
    const closeMenus = () => setOpenMenuId("");
    document.addEventListener("click", closeMenus);
    return () => document.removeEventListener("click", closeMenus);
  }, []);

  const totalPages = meta?.last_page ?? 1;
  const totalCount = meta?.total ?? listings.length;
  const allVisibleSelected = listings.length > 0 && listings.every((item) => selectedIds.includes(item.id));
  const paginationItems = buildPaginationItems(currentPage, totalPages);

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((cur) => cur.filter((id) => !listings.some((item) => item.id === id)));
      return;
    }
    setSelectedIds((cur) => [...new Set([...cur, ...listings.map((item) => item.id)])]);
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  };

  const applyBulkAction = (action) => {
    if (!selectedIds.length) {
      toast.warn("Select at least one product to use bulk actions.");
      return;
    }
    const labels = {
      relist: `${selectedIds.length} products marked for relist.`,
      delete: `${selectedIds.length} products deleted.`,
      rewrite: `${selectedIds.length} product titles queued for AI rewrite.`,
      edit: `${selectedIds.length} products opened for bulk edit.`,
    };
    toast.info(labels[action] ?? "Action applied.");
  };

  const handleSyncNow = () => {
    dispatch(syncEbayListingsAction());
  };

  const scrollTable = (position) => {
    const el = tableScrollRef.current;
    if (!el) return;
    el.scrollTo({ left: position === "end" ? el.scrollWidth : 0, behavior: "smooth" });
  };

  if (!connected) {
    return (
      <section className="products-page-content">
        <div className="products-heading">
          <h2 className="products-heading__title">Products</h2>
        </div>
        <div className="products-not-connected card-wrapper">
          <LuLink size={32} style={{ opacity: 0.4 }} />
          <h3>No eBay account connected</h3>
          <p>Go to <strong>Settings → Store Settings</strong> to connect your eBay seller account and sync your listings.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="products-page-content">
      <div className="products-heading">
        <h2 className="products-heading__title">
          Products ({totalCount})
          {loading ? <LuLoader size={14} style={{ marginLeft: 8, animation: "spin 1s linear infinite" }} /> : null}
        </h2>
      </div>

      {error ? (
        <div className="products-alert">
          <div className="products-alert__copy">
            <span className="products-alert__dot products-alert__dot--red" />
            <span>{error}</span>
          </div>
        </div>
      ) : null}

      <div className="products-toolbar">
        <button type="button" className="orders-filter-toggle" onClick={() => setShowFilters((c) => !c)}>
          <LuSlidersHorizontal />
          <span>Add Filter</span>
        </button>

        <div className="products-toolbar__actions">
          <button
            type="button"
            className="dashboard-secondary-btn dashboard-secondary-btn--orders"
            onClick={handleSyncNow}
            disabled={syncing}
          >
            {syncing ? <LuLoader style={{ animation: "spin 1s linear infinite" }} /> : <LuRefreshCcw />}
            <span>{syncing ? "Syncing…" : "Sync from eBay"}</span>
          </button>
          <button type="button" className="dashboard-secondary-btn dashboard-secondary-btn--orders" onClick={() => setShowTutorialNote((c) => !c)}>
            <LuPlay />
            <span>Watch Tutorial</span>
          </button>
          <button type="button" className="marketplace-search-panel__ugc-btn products-toolbar__ugc-btn" onClick={() => toast.info("UGC generation queue started.")}>
            <LuSparkles />
            <span>Generate Sales Ready UGC Ads</span>
          </button>
        </div>
      </div>

      {showTutorialNote ? (
        <div className="orders-inline-note">
          <LuPlay />
          <span>Products tutorial: manage your live eBay listings, sync from eBay, and use bulk actions.</span>
        </div>
      ) : null}

      {showFilters ? (
        <div className="products-filter-panel card-wrapper">
          <label className="orders-filter-panel__field">
            <span>Status</span>
            <div className="orders-filter-panel__select">
              <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}>
                {["All", "Active", "Draft", "Inactive", "Ended"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <LuChevronDown />
            </div>
          </label>

          <label className="orders-filter-panel__field">
            <span>View Mode</span>
            <div className="orders-filter-panel__select">
              <select value={tableView} onChange={(e) => setTableView(e.target.value)}>
                <option value="compact">Compact</option>
                <option value="comfortable">Comfortable</option>
              </select>
              <LuChevronDown />
            </div>
          </label>
        </div>
      ) : null}

      <div className="products-selection-row">
        <div className="products-selection-row__left">
          <label className="orders-select-all">
            <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} />
            <span>{selectedIds.length} Results Selected</span>
          </label>

          <div className="products-bulk-actions">
            <button type="button" onClick={() => applyBulkAction("edit")}>Bulk Edit</button>
            <button type="button" onClick={() => applyBulkAction("relist")}>Bulk Relist</button>
            <button type="button" onClick={() => applyBulkAction("delete")}>Bulk Delete</button>
            <button type="button" onClick={() => applyBulkAction("rewrite")}>Bulk AI Rewrite</button>
          </div>
        </div>

        <div className="products-selection-row__right">
          <button type="button" className={`products-history-btn ${historyVisible ? "products-history-btn--active" : ""}`} onClick={() => setHistoryVisible((c) => !c)}>
            View History
          </button>
          <button type="button" className="orders-icon-btn" onClick={() => scrollTable("end")} aria-label="Show more columns"><LuMenu /></button>
          <button type="button" className="orders-icon-btn" onClick={() => scrollTable("start")} aria-label="Return table start"><LuExternalLink /></button>
        </div>
      </div>

      {historyVisible ? (
        <div className="products-history">
          <span>eBay sync status:</span>
          <span>{syncing ? "Sync in progress…" : `${totalCount} listings loaded from eBay.`}</span>
        </div>
      ) : null}

      <div className="products-table-shell">
        <div className="products-table-scroll" ref={tableScrollRef}>
          <table className={`products-table ${tableView === "comfortable" ? "products-table--comfortable" : ""}`}>
            <thead>
              <tr className="products-table__group-row">
                <th className="products-table__checkbox-col" rowSpan={2} />
                <th rowSpan={2}>Name</th>
                <th rowSpan={2}>
                  <button type="button" className="orders-sort-btn" onClick={() => setSortDirection((c) => c === "desc" ? "asc" : "desc")}>
                    <span>Created</span>
                    <LuChevronDown className={sortDirection === "asc" ? "orders-sort-btn__icon orders-sort-btn__icon--asc" : "orders-sort-btn__icon"} />
                  </button>
                </th>
                <th rowSpan={2}>Status</th>
                <th rowSpan={2}>Category</th>
                <th className="products-table__actions-col" rowSpan={2} />
                <th className="products-table__group products-table__group--divider" colSpan={3}>Stock</th>
                <th rowSpan={2}>Price (Sell)</th>
                <th rowSpan={2}>Item ID</th>
                <th rowSpan={2}>Sold</th>
                <th rowSpan={2}>Views</th>
                <th rowSpan={2}>Watchers</th>
                <th rowSpan={2}>Days Left</th>
              </tr>
              <tr className="products-table__sub-row">
                <th className="products-table__group--divider">Available</th>
                <th>Sold</th>
                <th>Currency</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="orders-table__empty" colSpan={16}>
                    <LuLoader style={{ animation: "spin 1s linear infinite" }} />
                    <span>Loading listings from eBay…</span>
                  </td>
                </tr>
              ) : listings.length ? (
                listings.map((item) => (
                  <tr className="products-table__row" key={item.id}>
                    <td className="products-table__checkbox-col">
                      <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelectOne(item.id)} />
                    </td>

                    <td>
                      <div className="products-item">
                        {item.image_url ? (
                          <div className="products-item__thumb">
                            <img src={item.image_url} alt={item.title} />
                          </div>
                        ) : null}
                        <div className="products-item__copy">
                          <h3>{item.title}</h3>
                        </div>
                      </div>
                    </td>

                    <td className="products-table__date">
                      {item.created_at ? formatDisplayDate(item.created_at.slice(0, 10)) : "—"}
                    </td>

                    <td>
                      <span className={`products-status-badge products-status-badge--${item.status}`}>
                        {item.status}
                      </span>
                    </td>

                    <td>{item.category_name ?? "—"}</td>

                    <td className="products-table__actions-col">
                      <div className="products-row-actions" onClick={(e) => e.stopPropagation()}>
                        {item.listing_url ? (
                          <a href={item.listing_url} target="_blank" rel="noopener noreferrer" className="orders-row-actions__icon" aria-label="View on eBay">
                            <LuExternalLink />
                          </a>
                        ) : null}
                        <button type="button" className="orders-row-actions__icon" onClick={() => setOpenMenuId((c) => c === item.id ? "" : item.id)} aria-label="Open product menu">
                          <LuEllipsisVertical />
                        </button>

                        {openMenuId === item.id ? (
                          <div className="products-actions-menu">
                            <button type="button">
                              <LuPencil /><span>Edit Product</span>
                            </button>
                            <button type="button">
                              <LuStore /><span>Sync To Store</span>
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </td>

                    <td className="products-table__group--divider">
                      <span className="products-count products-count--green">{item.quantity ?? 0}</span>
                    </td>
                    <td>
                      <span className="products-count products-count--amber">{item.quantity_sold ?? 0}</span>
                    </td>
                    <td>{item.currency ?? "USD"}</td>

                    <td>
                      <div className="products-paired-values">
                        <div>
                          <span className="orders-paired-values__type">SELL</span>
                          <span className="orders-paired-values__platform">ebay</span>
                          <strong>${Number(item.price ?? 0).toFixed(2)}</strong>
                        </div>
                      </div>
                    </td>

                    <td>{item.ebay_item_id ?? "—"}</td>
                    <td>{item.quantity_sold ?? 0}</td>
                    <td>{item.views ?? 0}</td>
                    <td>{item.watchers ?? 0}</td>
                    <td>{item.days_left != null ? `${item.days_left}d` : "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="orders-table__empty" colSpan={16}>
                    <LuInbox />
                    <span>No listings found. Click "Sync from eBay" to import your listings.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="orders-table-footer products-table-footer">
          <div className="orders-pagination">
            <button type="button" className="orders-pagination__arrow" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
              <LuChevronLeft />
            </button>

            {paginationItems.map((page, index) =>
              page === "..." ? (
                <span className="products-pagination__ellipsis" key={`ellipsis-${index}`}>...</span>
              ) : (
                <button
                  type="button"
                  className={page === currentPage ? "orders-pagination__page orders-pagination__page--active" : "orders-pagination__page"}
                  key={page}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              )
            )}

            <button type="button" className="orders-pagination__arrow" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
              <LuChevronRight />
            </button>
          </div>

          <div className="orders-table-footer__meta">
            <label>
              <span>Show</span>
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={40}>40</option>
              </select>
            </label>
            <span>Products out of {totalCount}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProductsContent;
