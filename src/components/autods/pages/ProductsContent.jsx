import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "../../../utils/toast";
import {
  LuTriangleAlert,
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
  LuRefreshCcw,
  LuSlidersHorizontal,
  LuStore,
  LuTrash2,
  LuX,
} from "react-icons/lu";
import { buildPaginationItems, formatDisplayDate, getListingImageUrl } from "../helpers";
import {
  selectEbayConnected,
  selectEbayConnections,
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
import { bulkDeleteProducts, deleteProduct, getImportHistory } from "../../../services/ProductService";
import UploadHistoryPanel from "../UploadHistoryPanel";
import PageFilterPanel from "../PageFilterPanel";
import { FilterSelect } from "../FilterField";

function formatMoney(value, currency = "USD") {
  const amount = Number(value ?? 0);
  const symbol = currency === "AUD" || currency === "A$" ? "A$" : currency === "GBP" ? "£" : "$";
  return `${symbol}${amount.toFixed(2)}`;
}

function platformLabel(platform) {
  if (!platform) return "—";
  const map = {
    aliexpress: "AE",
    amazon: "AMZ",
    walmart: "WMT",
    etsy: "ETSY",
    ebay: "eBay",
  };
  return map[platform] ?? platform.slice(0, 3).toUpperCase();
}

function importActionLabel(action) {
  return action === "publish" ? "Import to Store" : "Import to Draft";
}

function buildImportBatchAlert(batch) {
  const processed = Number(batch.completed ?? 0) + Number(batch.failed ?? 0);
  const total = Number(batch.total ?? 0);
  const isActive = batch.status === "processing" || batch.status === "pending";
  const progressLabel = isActive ? `${processed}/${total} in progress` : `${processed}/${total} finished`;

  return {
    id: `import-batch-${batch.id}`,
    batchId: batch.id,
    tone: !isActive && Number(batch.failed ?? 0) > 0 ? "danger" : "warning",
    message: `Import Products #${batch.id} (${importActionLabel(batch.action)}) (${progressLabel})`,
    isActive,
  };
}

function mapListingRow(item) {
  const available = Math.max(0, Number(item.quantity ?? 0));
  const sold = Number(item.quantity_sold ?? 0);
  const onHold = 0;
  const outOfStock = available === 0 ? 1 : 0;
  const uploaded = item.published_at ?? item.created_at;
  const storeName = item.connection?.ebay_username ?? "—";
  const itemBuy = item.source_product_id ?? "—";
  const itemSell = item.ebay_item_id ?? "—";
  const asin = item.source_platform === "amazon" ? item.source_product_id : "—";

  return {
    ...item,
    available,
    sold,
    onHold,
    outOfStock,
    totalStock: available + onHold,
    uploaded,
    storeName,
    itemBuy,
    itemSell,
    asin,
    dws: item.days_without_sale ?? "—",
    profitValue: item.profit,
    warning: item.import_status === "failed" || available === 0,
  };
}

function ProductsContent({ searchQuery }) {
  const dispatch = useDispatch();
  const connected = useSelector(selectEbayConnected);
  const connections = useSelector(selectEbayConnections);
  const listings = useSelector(selectEbayListings);
  const meta = useSelector(selectEbayListingsMeta);
  const loading = useSelector(selectEbayListingsLoading);
  const error = useSelector(selectEbayListingsError);
  const syncing = useSelector(selectEbaySyncing);

  const [importBatches, setImportBatches] = useState([]);
  const [dismissedBatchIds, setDismissedBatchIds] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortDirection, setSortDirection] = useState("desc");
  const [filterStatus, setFilterStatus] = useState("Active");
  const [filterStore, setFilterStore] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("");
  const [openMenuId, setOpenMenuId] = useState("");
  const [tableView, setTableView] = useState("compact");
  const tableScrollRef = useRef(null);

  const clearProductFilters = () => {
    setFilterStatus("Active");
    setFilterStore("");
    setFilterSupplier("");
    setTableView("compact");
    setCurrentPage(1);
  };

  const hasProductFilters =
    filterStatus !== "Active" || filterStore || filterSupplier || tableView !== "compact";

  const loadListings = () => {
    dispatch(
      fetchEbayListings({
        page: currentPage,
        limit: pageSize,
        status: filterStatus === "All" ? "" : filterStatus.toLowerCase(),
        supplier: filterSupplier,
        connection_id: filterStore || undefined,
        q: searchQuery,
      }),
    );
  };

  useEffect(() => {
    if (connected) {
      loadListings();
    }
  }, [dispatch, connected, currentPage, pageSize, filterStatus, filterStore, filterSupplier, searchQuery]);

  useEffect(() => {
    const closeMenus = () => setOpenMenuId("");
    document.addEventListener("click", closeMenus);
    return () => document.removeEventListener("click", closeMenus);
  }, []);

  useEffect(() => {
    if (!connected) {
      return undefined;
    }

    let cancelled = false;

    const loadImportBatches = async () => {
      try {
        const res = await getImportHistory({ limit: 10 });
        if (!cancelled) {
          setImportBatches(res.data?.batches ?? []);
        }
      } catch {
        // Keep existing alerts if refresh fails.
      }
    };

    loadImportBatches();

    return () => {
      cancelled = true;
    };
  }, [connected]);

  const hasActiveImports = useMemo(
    () => importBatches.some((batch) => batch.status === "processing" || batch.status === "pending"),
    [importBatches],
  );

  useEffect(() => {
    if (!connected || !hasActiveImports) {
      return undefined;
    }

    const interval = setInterval(() => {
      getImportHistory({ limit: 10 })
        .then((res) => setImportBatches(res.data?.batches ?? []))
        .catch(() => {});
    }, 2000);

    return () => clearInterval(interval);
  }, [connected, hasActiveImports]);

  const alerts = useMemo(
    () =>
      importBatches
        .filter((batch) => !dismissedBatchIds.includes(batch.id))
        .map(buildImportBatchAlert),
    [importBatches, dismissedBatchIds],
  );

  const rows = useMemo(() => listings.map(mapListingRow), [listings]);
  const totalPages = meta?.last_page ?? 1;
  const totalCount = meta?.total ?? rows.length;
  const allVisibleSelected = rows.length > 0 && rows.every((item) => selectedIds.includes(item.id));
  const paginationItems = buildPaginationItems(currentPage, totalPages);

  const sortedRows = useMemo(() => {
    const next = [...rows];
    next.sort((a, b) => {
      const aDate = new Date(a.uploaded ?? 0).getTime();
      const bDate = new Date(b.uploaded ?? 0).getTime();
      return sortDirection === "asc" ? aDate - bDate : bDate - aDate;
    });
    return next;
  }, [rows, sortDirection]);

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((cur) => cur.filter((id) => !rows.some((item) => item.id === id)));
      return;
    }
    setSelectedIds((cur) => [...new Set([...cur, ...rows.map((item) => item.id)])]);
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };

  const applyBulkAction = async (action) => {
    if (!selectedIds.length) {
      toast.warn("Select at least one product to use bulk actions.");
      return;
    }
    if (action === "delete") {
      try {
        await bulkDeleteProducts(selectedIds);
        toast.success(`${selectedIds.length} products deleted.`);
        setSelectedIds([]);
        loadListings();
      } catch (err) {
        toast.error(err.response?.data?.error ?? "Bulk delete failed.");
      }
      return;
    }
    const labels = {
      relist: `${selectedIds.length} products marked for relist.`,
      rewrite: `${selectedIds.length} product titles queued for AI rewrite.`,
      edit: `${selectedIds.length} products opened for bulk edit.`,
    };
    toast.info(labels[action] ?? "Action applied.");
  };

  const handleSyncNow = () => {
    const primary = connections.find((c) => c.is_primary) ?? connections[0];
    if (primary) {
      dispatch(syncEbayListingsAction(primary.id));
    }
  };

  const scrollTable = (position) => {
    const el = tableScrollRef.current;
    if (!el) return;
    el.scrollTo({ left: position === "end" ? el.scrollWidth : 0, behavior: "smooth" });
  };

  const dismissAlert = (batchId) => {
    setDismissedBatchIds((current) => [...new Set([...current, batchId])]);
  };

  const viewImportDetails = () => {
    setHistoryVisible(true);
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
          <p>
            Go to <strong>Settings → Store Settings</strong> to connect your eBay seller account and sync your listings.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="products-page-content">
      <div className="products-heading">
        <h2 className="products-heading__title">
          Products ({totalCount})
          {loading ? <LuLoader size={14} className="spin-icon" style={{ marginLeft: 8 }} /> : null}
        </h2>
      </div>

      {alerts.length ? (
        <div className="products-alerts card-wrapper">
          {alerts.map((alert) => (
            <div className="products-alert" key={alert.id}>
              <div className="products-alert__copy">
                <span className={`products-alert__dot products-alert__dot--${alert.tone === "danger" ? "danger" : "warning"}`} />
                <span>{alert.message}</span>
              </div>
              <div className="products-alert__actions">
                <button type="button" className="products-alert__link" onClick={viewImportDetails}>
                  View details
                </button>
                <button
                  type="button"
                  className="products-alert__dismiss"
                  aria-label="Dismiss alert"
                  onClick={() => dismissAlert(alert.batchId)}
                >
                  <LuX />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="products-alert card-wrapper">
          <div className="products-alert__copy">
            <span className="products-alert__dot products-alert__dot--danger" />
            <span>{error}</span>
          </div>
        </div>
      ) : null}

      <div className="products-toolbar">
        <button
          type="button"
          className={`orders-filter-toggle ${showFilters ? "orders-filter-toggle--active" : ""}`}
          onClick={() => setShowFilters((c) => !c)}
        >
          <LuSlidersHorizontal />
          <span>Add Filter</span>
        </button>

        <div className="products-toolbar__actions">
          <button type="button" className="dashboard-secondary-btn dashboard-secondary-btn--orders" onClick={handleSyncNow} disabled={syncing}>
            {syncing ? <LuLoader className="spin-icon" /> : <LuRefreshCcw />}
            <span>{syncing ? "Syncing…" : "Sync from eBay"}</span>
          </button>
        </div>
      </div>

      {showFilters ? (
        <PageFilterPanel layout="wide" onClear={hasProductFilters ? clearProductFilters : undefined}>
          <FilterSelect
            label="Status"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
          >
            {["All", "Active", "Inactive", "Ended"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Store"
            value={filterStore}
            onChange={(e) => {
              setFilterStore(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">All stores</option>
            {connections.map((conn) => (
              <option key={conn.id} value={conn.id}>
                {conn.ebay_username ?? `Store #${conn.id}`}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Supplier"
            value={filterSupplier}
            onChange={(e) => {
              setFilterSupplier(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">All suppliers</option>
            <option value="aliexpress">AliExpress</option>
            <option value="amazon">Amazon</option>
            <option value="walmart">Walmart</option>
            <option value="etsy">Etsy</option>
            <option value="ebay">eBay</option>
          </FilterSelect>

          <FilterSelect label="View mode" value={tableView} onChange={(e) => setTableView(e.target.value)}>
            <option value="compact">Compact</option>
            <option value="comfortable">Comfortable</option>
          </FilterSelect>
        </PageFilterPanel>
      ) : null}

      <div className="products-selection-row">
        <div className="products-selection-row__left">
          <label className="orders-select-all">
            <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} />
            <span>{selectedIds.length} Results Selected</span>
          </label>

          <div className="products-bulk-actions">
            <button type="button" onClick={() => applyBulkAction("edit")}>
              Bulk Edit
            </button>
            <button type="button" onClick={() => applyBulkAction("relist")}>
              Bulk Relist
            </button>
            <button type="button" onClick={() => applyBulkAction("delete")}>
              Bulk Delete
            </button>
            <button type="button" onClick={() => applyBulkAction("rewrite")}>
              Bulk AI Rewrite
            </button>
          </div>
        </div>

        <div className="products-selection-row__right">
          <button
            type="button"
            className={`products-history-btn ${historyVisible ? "products-history-btn--active" : ""}`}
            onClick={() => setHistoryVisible((c) => !c)}
          >
            View History
          </button>
          <button type="button" className="orders-icon-btn" onClick={() => scrollTable("end")} aria-label="Show more columns">
            <LuMenu />
          </button>
          <button type="button" className="orders-icon-btn" onClick={() => scrollTable("start")} aria-label="Return table start">
            <LuExternalLink />
          </button>
        </div>
      </div>

      <UploadHistoryPanel visible={historyVisible} onClose={() => setHistoryVisible(false)} />

      <div className="products-table-shell card-wrapper">
        <div className="products-table-scroll" ref={tableScrollRef}>
          <table className={`products-table ${tableView === "comfortable" ? "products-table--comfortable" : ""}`}>
            <thead>
              <tr className="products-table__group-row">
                <th className="products-table__checkbox-col" rowSpan={2} />
                <th rowSpan={2}>Name</th>
                <th rowSpan={2}>
                  <button type="button" className="orders-sort-btn" onClick={() => setSortDirection((c) => (c === "desc" ? "asc" : "desc"))}>
                    <span>Uploaded</span>
                    <LuChevronDown className={sortDirection === "asc" ? "orders-sort-btn__icon orders-sort-btn__icon--asc" : "orders-sort-btn__icon"} />
                  </button>
                </th>
                <th rowSpan={2}>Store</th>
                <th className="products-table__group products-table__group--divider" colSpan={4}>
                  Stock
                </th>
                <th rowSpan={2}>Price (Buy / Sell)</th>
                <th rowSpan={2}>Sold</th>
                <th rowSpan={2}>DWS</th>
                <th rowSpan={2}>Profit</th>
                <th rowSpan={2}>Item ID (Buy)</th>
                <th rowSpan={2}>Item ID (Sell)</th>
                <th rowSpan={2}>Tags</th>
                <th rowSpan={2}>ASIN</th>
                <th rowSpan={2}>Views</th>
                <th rowSpan={2}>Watchers</th>
                <th rowSpan={2}>Days Left</th>
                <th rowSpan={2} aria-label="Warnings" />
                <th className="products-table__actions-col" rowSpan={2} />
              </tr>
              <tr className="products-table__sub-row">
                <th className="products-table__group--divider">Available</th>
                <th>On Hold</th>
                <th>OOS</th>
                <th>Total</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="orders-table__empty" colSpan={21}>
                    <LuLoader className="spin-icon" />
                    <span>Loading products…</span>
                  </td>
                </tr>
              ) : sortedRows.length ? (
                sortedRows.map((item) => {
                  const imageUrl = getListingImageUrl(item);

                  return (
                    <tr className={`products-table__row ${item.warning ? "products-table__row--warning" : ""}`} key={item.id}>
                      <td className="products-table__checkbox-col">
                        <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelectOne(item.id)} />
                      </td>

                      <td>
                        <div className="products-item">
                          {imageUrl ? (
                            <div className="products-item__thumb">
                              <img src={imageUrl} alt={item.title} referrerPolicy="no-referrer" />
                            </div>
                          ) : (
                            <div className="products-item__thumb products-item__thumb--empty">
                              <LuStore />
                            </div>
                          )}
                          <div className="products-item__copy">
                            <h3>{item.title}</h3>
                            <button type="button" className="products-sourcing-btn" onClick={() => toast.info("Sourcing request flow opens for this product.")}>
                              Sourcing Request
                            </button>
                          </div>
                        </div>
                      </td>

                      <td className="products-table__date">{item.uploaded ? formatDisplayDate(String(item.uploaded).slice(0, 10)) : "—"}</td>

                      <td className="products-table__store">
                        <span className="products-store-chip">{item.storeName}</span>
                      </td>

                      <td className="products-table__group--divider">
                        <span className="products-count products-count--green">{item.available}</span>
                      </td>
                      <td>
                        <span className="products-count products-count--amber">{item.onHold}</span>
                      </td>
                      <td>
                        <span className={`products-count ${item.outOfStock ? "products-count--red" : "products-count--green"}`}>{item.outOfStock}</span>
                      </td>
                      <td>{item.totalStock}</td>

                      <td>
                        <div className="products-paired-values">
                          {item.buy_price != null ? (
                            <div>
                              <span className="orders-paired-values__type">BUY</span>
                              <span className="orders-paired-values__platform">{platformLabel(item.source_platform)}</span>
                              <strong>{formatMoney(item.buy_price, item.currency)}</strong>
                            </div>
                          ) : null}
                          <div>
                            <span className="orders-paired-values__type">SELL</span>
                            <span className="orders-paired-values__platform">ebay</span>
                            <strong>{formatMoney(item.price, item.currency)}</strong>
                          </div>
                        </div>
                      </td>

                      <td>{item.sold}</td>
                      <td>{item.dws}</td>
                      <td>{item.profitValue != null ? formatMoney(item.profitValue, item.currency) : "—"}</td>
                      <td className="products-table__mono">{item.itemBuy}</td>
                      <td className="products-table__mono">{item.itemSell}</td>
                      <td className="products-table__tags">—</td>
                      <td className="products-table__mono">{item.asin}</td>
                      <td>{item.views ?? 0}</td>
                      <td>{item.watchers ?? 0}</td>
                      <td>{item.days_left != null ? `${item.days_left}d` : "—"}</td>

                      <td>
                        {item.warning ? (
                          <span className="products-warning-icon" title="Needs attention">
                            <LuTriangleAlert />
                          </span>
                        ) : null}
                      </td>

                      <td className="products-table__actions-col">
                        <div className="products-row-actions" onClick={(e) => e.stopPropagation()}>
                          {item.listing_url ? (
                            <a href={item.listing_url} target="_blank" rel="noopener noreferrer" className="orders-row-actions__icon" aria-label="View on eBay">
                              <LuExternalLink />
                            </a>
                          ) : null}
                          <button type="button" className="orders-row-actions__icon" onClick={() => setOpenMenuId((c) => (c === item.id ? "" : item.id))} aria-label="Open product menu">
                            <LuEllipsisVertical />
                          </button>

                          {openMenuId === item.id ? (
                            <div className="products-actions-menu">
                              <button type="button" onClick={() => toast.info("Edit product panel opened.")}>
                                <LuPencil />
                                <span>Edit Product</span>
                              </button>
                              <button type="button" onClick={() => toast.info("Sync queued for this listing.")}>
                                <LuRefreshCcw />
                                <span>Sync To Store</span>
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await deleteProduct(item.id);
                                    toast.success("Product deleted.");
                                    loadListings();
                                  } catch (err) {
                                    toast.error(err.response?.data?.error ?? "Delete failed.");
                                  }
                                  setOpenMenuId("");
                                }}
                              >
                                <LuTrash2 />
                                <span>Delete Product</span>
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="orders-table__empty" colSpan={21}>
                    <LuInbox />
                    <span>No products found. Publish drafts or click &quot;Sync from eBay&quot; to load live listings.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="orders-table-footer products-table-footer">
          <div className="orders-pagination">
            <button type="button" className="orders-pagination__arrow" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}>
              <LuChevronLeft />
            </button>

            {paginationItems.map((page, index) =>
              page === "..." ? (
                <span className="products-pagination__ellipsis" key={`ellipsis-${index}`}>
                  ...
                </span>
              ) : (
                <button
                  type="button"
                  className={page === currentPage ? "orders-pagination__page orders-pagination__page--active" : "orders-pagination__page"}
                  key={page}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ),
            )}

            <button type="button" className="orders-pagination__arrow" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
              <LuChevronRight />
            </button>
          </div>

          <div className="orders-table-footer__meta">
            <label>
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={40}>40</option>
              </select>
            </label>
            <span>
              Products out of {totalCount}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProductsContent;
