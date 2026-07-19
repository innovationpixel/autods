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
  LuPackage,
  LuRefreshCcw,
  LuSlidersHorizontal,
  LuStore,
  LuTrash2,
  LuX,
} from "react-icons/lu";
import { buildEbayListingProductUrl, buildPaginationItems, buildSourceProductUrl, formatDisplayDate, getListingImageUrl, normalizeListingSourceInput } from "../helpers";
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
import { bulkDeleteProducts, deleteProduct, getImportHistory, publishProduct, syncProductToStore, updateProduct } from "../../../services/ProductService";
import BulkEditDraftsModal, { applyBulkEditToForm } from "../BulkEditDraftsModal";
import ProductEditorModal from "../ProductEditorModal";
import QuickEditModal from "../QuickEditModal";
import { buildDraftFormState, serializeDraftFormForApi } from "../../../utils/draftEditorState";
import { getApiErrorMessage } from "../../../utils/apiErrors";
import UploadHistoryPanel from "../UploadHistoryPanel";
import PageFilterPanel from "../PageFilterPanel";
import { FilterSelect } from "../FilterField";
import ProductColumnManager from "../ProductColumnManager";
import {
  getVisibleProductTableMinWidth,
  loadVisibleProductColumnIds,
  resolveVisibleProductColumns,
  saveVisibleProductColumnIds,
} from "../productColumns";
import ProductItemIdCell from "../ProductItemIdCell";

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
  const listingSku = item.sku ?? "—";
  const itemBuyUrl = buildSourceProductUrl(item.source_platform, item.source_product_id, item.source_url);
  const itemSellUrl = buildEbayListingProductUrl(item);
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
    listingSku,
    itemBuyUrl,
    itemSellUrl,
    asin,
    dws: item.days_without_sale ?? "—",
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
  const [editingStockId, setEditingStockId] = useState("");
  const [stockDraft, setStockDraft] = useState("");
  const [savingStockId, setSavingStockId] = useState("");
  const [editingBuySourceId, setEditingBuySourceId] = useState("");
  const [buySourceDraft, setBuySourceDraft] = useState("");
  const [savingBuySourceId, setSavingBuySourceId] = useState("");
  const [editingSellIdId, setEditingSellIdId] = useState("");
  const [sellIdDraft, setSellIdDraft] = useState("");
  const [savingSellIdId, setSavingSellIdId] = useState("");
  const [tableView, setTableView] = useState("compact");
  const [visibleColumnIds, setVisibleColumnIds] = useState(loadVisibleProductColumnIds);
  const [bulkEditTargets, setBulkEditTargets] = useState([]);
  const [bulkEditing, setBulkEditing] = useState(false);
  const [bulkWorking, setBulkWorking] = useState(false);
  const [editorProduct, setEditorProduct] = useState(null);
  const [editorForm, setEditorForm] = useState(null);
  const [editorTab, setEditorTab] = useState("general");
  const [editorSaving, setEditorSaving] = useState(false);
  const [syncingId, setSyncingId] = useState("");
  const tableScrollRef = useRef(null);

  const visibleColumns = useMemo(
    () => resolveVisibleProductColumns(visibleColumnIds),
    [visibleColumnIds],
  );

  const visibleStockColumns = useMemo(
    () => visibleColumns.filter((column) => column.group === "stock"),
    [visibleColumns],
  );

  const hasStockGroup = visibleStockColumns.length > 0;
  const tableColumnCount = visibleColumns.length + 2;
  const tableMinWidth = useMemo(() => getVisibleProductTableMinWidth(visibleColumnIds), [visibleColumnIds]);

  const handleVisibleColumnsChange = (nextIds) => {
    setVisibleColumnIds(nextIds);
    saveVisibleProductColumnIds(nextIds);
  };

  const clearProductFilters = () => {
    setFilterStatus("Active");
    setFilterStore("");
    setFilterSupplier("");
    setTableView("compact");
    setCurrentPage(1);
  };

  const hasProductFilters =
    filterStatus !== "Active" || filterStore || filterSupplier || tableView !== "compact";

  const loadListings = () =>
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

  const startEditStock = (item) => {
    setEditingStockId(item.id);
    setStockDraft(String(item.available));
    setOpenMenuId("");
  };

  const cancelEditStock = () => {
    setEditingStockId("");
    setStockDraft("");
  };

  const saveStockQty = async (item) => {
    const qty = Number.parseInt(stockDraft, 10);
    if (!Number.isFinite(qty) || qty < 0) {
      toast.error("Enter a valid stock quantity (0 or more).");
      return;
    }

    setSavingStockId(item.id);
    try {
      const res = await updateProduct(item.id, { quantity: qty });
      toast.success(res.data?.message ?? "Stock quantity updated.");
      cancelEditStock();
      loadListings();
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Could not update stock quantity.");
    } finally {
      setSavingStockId("");
    }
  };

  const startEditBuySource = (item) => {
    setEditingBuySourceId(item.id);
    setBuySourceDraft(item.source_url ?? (item.itemBuy !== "—" ? item.itemBuy : ""));
    setOpenMenuId("");
  };

  const cancelEditBuySource = () => {
    setEditingBuySourceId("");
    setBuySourceDraft("");
  };

  const saveBuySource = async (item) => {
    const trimmed = buySourceDraft.trim();
    if (!trimmed) {
      toast.error("Enter a source link or item ID.");
      return;
    }

    setSavingBuySourceId(item.id);
    try {
      const source = normalizeListingSourceInput(trimmed, item.source_platform);
      const res = await updateProduct(item.id, {
        source_input: source.source_input,
        source_url: source.source_url,
        source_product_id: source.source_product_id,
        source_platform: source.source_platform,
      });
      toast.success(res.data?.message ?? "Source link updated.");
      cancelEditBuySource();
      loadListings();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not update source link."));
    } finally {
      setSavingBuySourceId("");
    }
  };

  const startEditSellId = (item) => {
    setEditingSellIdId(item.id);
    setSellIdDraft(item.itemSell !== "—" ? item.itemSell : "");
    setOpenMenuId("");
  };

  const cancelEditSellId = () => {
    setEditingSellIdId("");
    setSellIdDraft("");
  };

  const saveSellId = async (item) => {
    const trimmed = sellIdDraft.trim();

    setSavingSellIdId(item.id);
    try {
      const res = await updateProduct(item.id, { ebay_item_id: trimmed || null });
      toast.success(res.data?.message ?? "Item ID (Sell) updated.");
      cancelEditSellId();
      loadListings();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not update Item ID (Sell)."));
    } finally {
      setSavingSellIdId("");
    }
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

    const items = sortedRows.filter((item) => selectedIds.includes(item.id));

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

    if (action === "edit") {
      setBulkEditTargets(items);
      return;
    }

    if (action === "relist") {
      setBulkWorking(true);
      let updated = 0;
      let failed = 0;

      for (const item of items) {
        try {
          await publishProduct(item.id);
          updated += 1;
        } catch {
          failed += 1;
        }
      }

      setBulkWorking(false);
      await loadListings();

      if (updated) {
        toast.success(`${updated} product${updated === 1 ? "" : "s"} relisted or published.`);
      }
      if (failed) {
        toast.error(`${failed} product${failed === 1 ? "" : "s"} could not be relisted.`);
      }
    }
  };

  const confirmBulkEdit = async (changes) => {
    if (!bulkEditTargets.length) {
      return;
    }

    setBulkEditing(true);
    let updated = 0;
    let failed = 0;

    for (const item of bulkEditTargets) {
      try {
        const baseForm = buildDraftFormState(item);
        const nextForm = applyBulkEditToForm(baseForm, changes);
        await updateProduct(item.id, serializeDraftFormForApi(nextForm));
        updated += 1;
      } catch {
        failed += 1;
      }
    }

    setBulkEditing(false);
    setBulkEditTargets([]);
    await loadListings();

    if (updated) {
      toast.success(`Bulk edit applied to ${updated} product${updated === 1 ? "" : "s"}.`);
    }
    if (failed) {
      toast.error(`${failed} product${failed === 1 ? "" : "s"} could not be updated.`);
    }
  };

  const openProductEditor = (item) => {
    setEditorProduct(item);
    setEditorForm(buildDraftFormState(item));
    setEditorTab("general");
    setOpenMenuId("");
  };

  const closeProductEditor = () => {
    if (editorSaving) {
      return;
    }
    setEditorProduct(null);
    setEditorForm(null);
  };

  const saveProductEditor = async () => {
    if (!editorProduct || !editorForm) {
      return;
    }

    setEditorSaving(true);
    try {
      const res = await updateProduct(editorProduct.id, serializeDraftFormForApi(editorForm));
      toast.success(res.data?.message ?? "Product updated.");
      setEditorProduct(null);
      setEditorForm(null);
      loadListings();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not save product."));
    } finally {
      setEditorSaving(false);
    }
  };

  const handleSyncToStore = async (item) => {
    setSyncingId(String(item.id));
    setOpenMenuId("");
    try {
      const res = await syncProductToStore(item.id);
      toast.success(res.data?.message ?? "Synced to store.");
      loadListings();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Sync to store failed."));
    } finally {
      setSyncingId("");
    }
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

  const renderProductColumnHeader = (column) => {
    if (column.sortable) {
      return (
        <button type="button" className="orders-sort-btn" onClick={() => setSortDirection((c) => (c === "desc" ? "asc" : "desc"))}>
          <span>{column.label}</span>
          <LuChevronDown className={sortDirection === "asc" ? "orders-sort-btn__icon orders-sort-btn__icon--asc" : "orders-sort-btn__icon"} />
        </button>
      );
    }

    return column.label;
  };

  const renderProductCell = (item, columnId, imageUrl) => {
    switch (columnId) {
      case "name":
        return (
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
        );
      case "uploaded":
        return item.uploaded ? formatDisplayDate(String(item.uploaded).slice(0, 10)) : "—";
      case "store":
        return <span className="products-store-chip">{item.storeName}</span>;
      case "stockAvailable":
        return (
          <button type="button" className="products-stock-btn" onClick={() => startEditStock(item)} title="Update stock quantity">
            <span className={`products-count ${item.available === 0 ? "products-count--red" : "products-count--green"}`}>{item.available}</span>
            <LuPencil className="products-stock-btn__icon" />
          </button>
        );
      case "stockOnHold":
        return <span className="products-count products-count--amber">{item.onHold}</span>;
      case "stockOos":
        return <span className={`products-count ${item.outOfStock ? "products-count--red" : "products-count--green"}`}>{item.outOfStock}</span>;
      case "stockTotal":
        return item.totalStock;
      case "cost":
        return (
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
        );
      case "sold":
        return item.sold;
      case "dws":
        return item.dws;
      case "itemIdBuy":
        return (
          <div className="products-source-cell">
            {item.itemBuyUrl || (item.itemBuy && item.itemBuy !== "—") ? (
              <ProductItemIdCell itemId={item.itemBuy} sku={item.listingSku} url={item.itemBuyUrl} />
            ) : (
              <span className="products-source-btn__placeholder">Add source</span>
            )}
            <button
              type="button"
              className="products-source-cell__edit"
              onClick={() => startEditBuySource(item)}
              title="Edit source link"
              aria-label="Edit source link"
            >
              <LuPencil />
            </button>
          </div>
        );
      case "itemIdSell":
        return (
          <div className="products-source-cell">
            {item.itemSellUrl || (item.itemSell && item.itemSell !== "—") ? (
              <ProductItemIdCell itemId={item.itemSell} sku={item.listingSku} url={item.itemSellUrl} />
            ) : (
              <span className="products-source-btn__placeholder">Add item ID</span>
            )}
            <button
              type="button"
              className="products-source-cell__edit"
              onClick={() => startEditSellId(item)}
              title="Edit Item ID (Sell)"
              aria-label="Edit Item ID (Sell)"
            >
              <LuPencil />
            </button>
          </div>
        );
      case "tags":
        return "—";
      case "asin":
        return item.asin;
      case "views":
        return item.views ?? 0;
      case "watchers":
        return item.watchers ?? 0;
      case "daysLeft":
        return item.days_left != null ? `${item.days_left}d` : "—";
      case "warnings":
        return item.warning ? (
          <span className="products-warning-icon" title="Needs attention">
            <LuTriangleAlert />
          </span>
        ) : null;
      default:
        return "—";
    }
  };

  const getProductCellClassName = (columnId) => {
    switch (columnId) {
      case "uploaded":
        return "products-table__date";
      case "store":
        return "products-table__store";
      case "stockAvailable":
        return "products-table__group--divider";
      case "itemIdBuy":
      case "itemIdSell":
      case "asin":
        return "products-table__mono";
      case "tags":
        return "products-table__tags";
      default:
        return undefined;
    }
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

          <div className={`products-bulk-actions ${selectedIds.length && !bulkWorking && !bulkEditing ? "" : "products-bulk-actions--disabled"}`}>
            <button type="button" onClick={() => applyBulkAction("edit")} disabled={bulkWorking || bulkEditing}>
              Bulk Edit
            </button>
            <button type="button" onClick={() => applyBulkAction("relist")} disabled={bulkWorking || bulkEditing}>
              {bulkWorking ? "Working…" : "Bulk Relist"}
            </button>
            <button type="button" onClick={() => applyBulkAction("delete")} disabled={bulkWorking || bulkEditing}>
              Bulk Delete
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
          <ProductColumnManager visibleColumnIds={visibleColumnIds} onChange={handleVisibleColumnsChange} />
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
          <table
            className={`products-table ${tableView === "comfortable" ? "products-table--comfortable" : ""}`}
            style={{ minWidth: tableMinWidth }}
          >
            <thead>
              <tr className="products-table__group-row">
                <th className="products-table__checkbox-col" rowSpan={hasStockGroup ? 2 : 1} />
                {visibleColumns.map((column) => {
                  if (column.group === "stock") {
                    if (column.id !== visibleStockColumns[0]?.id) {
                      return null;
                    }

                    return (
                      <th
                        key="stock-group"
                        className="products-table__group products-table__group--divider"
                        colSpan={visibleStockColumns.length}
                      >
                        Stock
                      </th>
                    );
                  }

                  return (
                    <th key={column.id} rowSpan={hasStockGroup ? 2 : 1} style={{ minWidth: column.minWidth }}>
                      {renderProductColumnHeader(column)}
                    </th>
                  );
                })}
                <th className="products-table__actions-col" rowSpan={hasStockGroup ? 2 : 1} />
              </tr>
              {hasStockGroup ? (
                <tr className="products-table__sub-row">
                  {visibleStockColumns.map((column, index) => (
                    <th
                      key={column.id}
                      className={index === 0 ? "products-table__group--divider" : undefined}
                      style={{ minWidth: column.minWidth }}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              ) : null}
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="orders-table__empty" colSpan={tableColumnCount}>
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

                      {visibleColumns.map((column) => (
                        <td
                          key={column.id}
                          className={getProductCellClassName(column.id)}
                          data-column={column.id}
                          style={{ minWidth: column.minWidth }}
                        >
                          {renderProductCell(item, column.id, imageUrl)}
                        </td>
                      ))}

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
                              <button type="button" onClick={() => openProductEditor(item)}>
                                <LuPencil />
                                <span>Edit Product</span>
                              </button>
                              <button type="button" onClick={() => startEditStock(item)}>
                                <LuPackage />
                                <span>Update Stock Qty</span>
                              </button>
                              <button type="button" onClick={() => startEditBuySource(item)}>
                                <LuLink />
                                <span>Edit Source Link</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSyncToStore(item)}
                                disabled={syncingId === String(item.id)}
                              >
                                {syncingId === String(item.id) ? <LuLoader className="spin-icon" /> : <LuRefreshCcw />}
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
                  <td className="orders-table__empty" colSpan={tableColumnCount}>
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

      <BulkEditDraftsModal
        open={bulkEditTargets.length > 0}
        drafts={bulkEditTargets}
        saving={bulkEditing}
        onClose={() => setBulkEditTargets([])}
        onApply={confirmBulkEdit}
        itemLabel="product"
      />

      <ProductEditorModal
        open={Boolean(editorProduct && editorForm)}
        product={editorProduct}
        form={editorForm}
        activeTab={editorTab}
        saving={editorSaving}
        onTabChange={setEditorTab}
        onChange={setEditorForm}
        onSave={saveProductEditor}
        onClose={closeProductEditor}
      />

      <QuickEditModal
        open={Boolean(editingBuySourceId)}
        title="Edit Source Link"
        description="Paste the AliExpress (or other supplier) URL or item ID this product was sourced from."
        label="Source link or item ID"
        value={buySourceDraft}
        onChange={setBuySourceDraft}
        onSave={() => saveBuySource(rows.find((row) => row.id === editingBuySourceId))}
        onClose={cancelEditBuySource}
        saving={savingBuySourceId === editingBuySourceId}
        placeholder="https://www.aliexpress.com/item/... or item ID"
      />

      <QuickEditModal
        open={Boolean(editingSellIdId)}
        title="Edit Item ID (Sell)"
        description="The eBay listing item ID this product is published as."
        label="eBay item ID"
        value={sellIdDraft}
        onChange={setSellIdDraft}
        onSave={() => saveSellId(rows.find((row) => row.id === editingSellIdId))}
        onClose={cancelEditSellId}
        saving={savingSellIdId === editingSellIdId}
        placeholder="e.g. 397686874847"
      />

      <QuickEditModal
        open={Boolean(editingStockId)}
        title="Update Stock Quantity"
        label="Available quantity"
        type="number"
        min="0"
        step="1"
        value={stockDraft}
        onChange={setStockDraft}
        onSave={() => saveStockQty(rows.find((row) => row.id === editingStockId))}
        onClose={cancelEditStock}
        saving={savingStockId === editingStockId}
        placeholder="0"
      />
    </section>
  );
}

export default ProductsContent;
