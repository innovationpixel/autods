import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "../../../utils/toast";
import {
  LuTriangleAlert,
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuChevronUp,
  LuEllipsisVertical,
  LuExternalLink,
  LuInbox,
  LuLink,
  LuLoader,
  LuPencil,
  LuPackage,
  LuRefreshCcw,
  LuSlidersHorizontal,
  LuStore,
  LuTrash2,
  LuX,
} from "react-icons/lu";
import { buildEbayListingProductUrl, buildPaginationItems, buildSourceProductUrl, formatDisplayDate, getListingImageUrl } from "../helpers";
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
import { bulkDeleteProducts, deleteProduct, getImportHistory, monitorProductPriceStock, publishProduct, syncProductToStore, updateProduct } from "../../../services/ProductService";
import BulkEditDraftsModal, { applyBulkEditToForm } from "../BulkEditDraftsModal";
import ProductEditorModal from "../ProductEditorModal";
import QuickEditModal from "../QuickEditModal";
import OrderSourceModal from "../OrderSourceModal";
import ConfirmModal from "../ConfirmModal";
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
import { compareGridValues } from "../helpers";
import GridSortHeader from "../GridSortHeader";

function formatMoney(value, currency = "USD") {
  const amount = Number(value ?? 0);
  const symbol = currency === "GBP" ? "£" : "$";
  return `${symbol}${amount.toFixed(2)}`;
}

function platformLabel(platform) {
  if (!platform) return "—";
  const map = {
    appmarketplace: "APP",
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
  const isDraftAction = String(batch.action ?? "").toLowerCase() !== "publish";
  const actionLabel = isDraftAction ? "move to draft" : importActionLabel(batch.action);

  return {
    id: `import-batch-${batch.id}`,
    batchId: batch.id,
    tone: !isActive && Number(batch.failed ?? 0) > 0 ? "danger" : "warning",
    message: `Import Products #${batch.id} (${actionLabel}) (${progressLabel})`,
    isActive,
    isDraftAction,
  };
}

export function resolveTimeLeft(item) {
  if (!item) return "30d";

  const status = String(item.status ?? "").toLowerCase();
  if (status === "ended") {
    return "0d";
  }

  // 1. Direct numeric or string days_left / daysLeft / time_left / timeLeft
  const explicit = item.days_left ?? item.daysLeft ?? item.time_left ?? item.timeLeft;
  if (explicit !== undefined && explicit !== null && explicit !== "") {
    if (typeof explicit === "number" && !Number.isNaN(explicit)) {
      return `${Math.max(0, Math.round(explicit))}d`;
    }
    const str = String(explicit).trim();
    if (str && str !== "—" && str !== "null" && str !== "undefined") {
      if (/^\d+$/.test(str)) {
        return `${str}d`;
      }
      return str;
    }
  }

  // 2. Check raw_source_data or raw for TimeLeft string (e.g. "P28DT14H32M" or "28 days")
  const raw = item.raw_source_data ?? item.raw ?? {};
  const rawTimeLeft = String(raw.TimeLeft ?? raw.timeLeft ?? raw.time_left ?? "").trim();
  if (rawTimeLeft) {
    const match = rawTimeLeft.match(/P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?/i);
    if (match && (match[1] || match[2])) {
      const days = match[1] ? Number(match[1]) : 0;
      const hours = match[2] ? Number(match[2]) : 0;
      if (days > 0) return `${days}d`;
      if (hours > 0) return `${hours}h`;
    }
    const numMatch = rawTimeLeft.match(/(\d+)\s*(?:d|day)/i);
    if (numMatch) {
      return `${numMatch[1]}d`;
    }
  }

  // 3. Check listing end date or endTime
  const endDate = item.listing_end_date ?? raw.listingEndTime ?? raw.endTime ?? raw.itemEndDate;
  if (endDate) {
    const diffMs = new Date(endDate).getTime() - Date.now();
    if (diffMs > 0) {
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      return days > 0 ? `${days}d` : `${hours}h`;
    }
    return "0d";
  }

  // 4. Good 'Til Cancelled (GTC): eBay listings renew every 30 days
  const pubDate = item.published_at ?? item.created_at ?? item.uploaded ?? item.synced_at;
  if (pubDate) {
    const startTime = new Date(pubDate).getTime();
    if (!Number.isNaN(startTime) && startTime > 0) {
      const elapsedDays = Math.floor((Date.now() - startTime) / (1000 * 60 * 60 * 24));
      const cycleDays = Math.max(1, 30 - (Math.max(0, elapsedDays) % 30));
      return `${cycleDays}d`;
    }
  }

  return status === "ended" ? "0d" : "30d";
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
  const timeLeftDisplay = resolveTimeLeft(item);
  const timeLeftDays = parseInt(timeLeftDisplay, 10) || 0;

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
    sourceUrl: item.source_url ?? null,
    sourcePlatform: item.source_platform ?? "aliexpress",
    sourceSkuId: item.source_sku_id ?? null,
    dws: item.days_without_sale ?? "—",
    daysLeft: timeLeftDisplay,
    days_left: item.days_left ?? timeLeftDays,
    timeLeft: timeLeftDisplay,
    time_left: timeLeftDisplay,
    warning: item.import_status === "failed" || available === 0,
  };
}

function ProductsContent({ searchQuery }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const connected = useSelector(selectEbayConnected);
  const connections = useSelector(selectEbayConnections);
  const listings = useSelector(selectEbayListings);
  const meta = useSelector(selectEbayListingsMeta);
  const loading = useSelector(selectEbayListingsLoading);
  const error = useSelector(selectEbayListingsError);
  const syncing = useSelector(selectEbaySyncing);

  const [importBatches, setImportBatches] = useState([]);
  const [dismissedBatchIds, setDismissedBatchIds] = useState([]);
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortBy, setSortBy] = useState("uploaded");
  const [sortDirection, setSortDirection] = useState("desc");
  const [filterStatus, setFilterStatus] = useState("Active");
  const [filterStore, setFilterStore] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("");
  const [openMenuId, setOpenMenuId] = useState("");
  const [editingStockId, setEditingStockId] = useState("");
  const [stockDraft, setStockDraft] = useState("");
  const [savingStockId, setSavingStockId] = useState("");
  const [editingBuySourceItem, setEditingBuySourceItem] = useState(null);
  const [savingBuySourceId, setSavingBuySourceId] = useState("");
  const [editingSellIdId, setEditingSellIdId] = useState("");
  const [sellIdDraft, setSellIdDraft] = useState("");
  const [savingSellIdId, setSavingSellIdId] = useState("");
  const [tableView, setTableView] = useState("compact");
  const [visibleColumnIds, setVisibleColumnIds] = useState(loadVisibleProductColumnIds);
  const [bulkEditTargets, setBulkEditTargets] = useState([]);
  const [bulkEditing, setBulkEditing] = useState(false);
  const [bulkWorking, setBulkWorking] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editorProduct, setEditorProduct] = useState(null);
  const [editorForm, setEditorForm] = useState(null);
  const [editorTab, setEditorTab] = useState("general");
  const [editorSaving, setEditorSaving] = useState(false);
  const [syncingId, setSyncingId] = useState("");
  const [monitoringId, setMonitoringId] = useState("");
  const [publishingIds, setPublishingIds] = useState([]);
  const tableScrollRef = useRef(null);
  const topScrollRef = useRef(null);
  const stickyScrollRef = useRef(null);
  const isSyncingScroll = useRef(false);
  const [showStickyScroll, setShowStickyScroll] = useState(false);
  const [stickyScrollStyle, setStickyScrollStyle] = useState({});

  const syncScroll = (source) => {
    if (!source || isSyncingScroll.current) return;
    isSyncingScroll.current = true;
    const scrollLeft = source.scrollLeft;
    if (tableScrollRef.current && source !== tableScrollRef.current) {
      tableScrollRef.current.scrollLeft = scrollLeft;
    }
    if (topScrollRef.current && source !== topScrollRef.current) {
      topScrollRef.current.scrollLeft = scrollLeft;
    }
    if (stickyScrollRef.current && source !== stickyScrollRef.current) {
      stickyScrollRef.current.scrollLeft = scrollLeft;
    }
    requestAnimationFrame(() => {
      isSyncingScroll.current = false;
    });
  };

  useEffect(() => {
    const checkStickyVisibility = () => {
      if (!tableScrollRef.current) {
        setShowStickyScroll(false);
        return;
      }
      const rect = tableScrollRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const hasHorizontalOverflow = tableScrollRef.current.scrollWidth > tableScrollRef.current.clientWidth + 10;
      const isTopVisibleOrAbove = rect.top < viewportHeight - 80;
      const isBottomBelowViewport = rect.bottom > viewportHeight + 30;

      if (hasHorizontalOverflow && isTopVisibleOrAbove && isBottomBelowViewport) {
        setShowStickyScroll(true);
        setStickyScrollStyle({
          left: `${Math.max(0, rect.left)}px`,
          width: `${rect.width}px`,
        });
      } else {
        setShowStickyScroll(false);
      }
    };

    window.addEventListener("scroll", checkStickyVisibility, { passive: true });
    window.addEventListener("resize", checkStickyVisibility, { passive: true });
    checkStickyVisibility();

    return () => {
      window.removeEventListener("scroll", checkStickyVisibility);
      window.removeEventListener("resize", checkStickyVisibility);
    };
  }, [tableMinWidth]);

  useEffect(() => {
    const node = tableScrollRef.current;
    if (!node) return;

    const handleWheel = (e) => {
      if (e.shiftKey && e.deltaY !== 0) {
        e.preventDefault();
        node.scrollLeft += e.deltaY;
      }
    };

    node.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      node.removeEventListener("wheel", handleWheel);
    };
  }, []);

  const visibleColumns = useMemo(
    () => resolveVisibleProductColumns(visibleColumnIds),
    [visibleColumnIds],
  );

  const visibleStockColumns = useMemo(
    () => visibleColumns.filter((column) => column.group === "stock"),
    [visibleColumns],
  );

  const hasStockGroup = visibleStockColumns.length > 0;
  const tableColumnCount = visibleColumns.length + 1;
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
    setEditingBuySourceItem(item);
    setOpenMenuId("");
  };

  const cancelEditBuySource = () => {
    setEditingBuySourceItem(null);
  };

  const saveBuySource = async (payload) => {
    const item = editingBuySourceItem;
    if (!item) {
      return;
    }

    setSavingBuySourceId(item.id);
    try {
      const res = await updateProduct(item.id, payload);
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

  const visibleAlerts = useMemo(
    () => (showAllAlerts ? alerts : alerts.slice(0, 3)),
    [alerts, showAllAlerts],
  );

  const rows = useMemo(() => listings.map(mapListingRow), [listings]);
  const totalPages = meta?.last_page ?? 1;
  const totalCount = meta?.total ?? rows.length;
  const allVisibleSelected = rows.length > 0 && rows.every((item) => selectedIds.includes(item.id));
  const paginationItems = buildPaginationItems(currentPage, totalPages);

  const sortedRows = useMemo(() => {
    const next = [...rows];
    next.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === "name") {
        aVal = a.title;
        bVal = b.title;
      } else if (sortBy === "store") {
        aVal = a.storeName;
        bVal = b.storeName;
      } else if (sortBy === "uploaded") {
        aVal = a.uploaded ? new Date(a.uploaded).getTime() : null;
        bVal = b.uploaded ? new Date(b.uploaded).getTime() : null;
      } else if (sortBy === "stockAvailable") {
        aVal = a.available;
        bVal = b.available;
      } else if (sortBy === "stockOnHold") {
        aVal = a.onHold;
        bVal = b.onHold;
      } else if (sortBy === "stockOos") {
        aVal = a.outOfStock;
        bVal = b.outOfStock;
      } else if (sortBy === "stockTotal") {
        aVal = a.totalStock;
        bVal = b.totalStock;
      } else if (sortBy === "cost") {
        aVal = a.sellPrice ?? a.buyPrice;
        bVal = b.sellPrice ?? b.buyPrice;
      } else if (sortBy === "sold") {
        aVal = a.sold;
        bVal = b.sold;
      } else if (sortBy === "dws") {
        aVal = a.dws;
        bVal = b.dws;
      } else if (sortBy === "itemIdBuy") {
        aVal = a.itemBuy;
        bVal = b.itemBuy;
      } else if (sortBy === "itemIdSell") {
        aVal = a.itemSell;
        bVal = b.itemSell;
      } else if (sortBy === "daysLeft" || sortBy === "timeLeft" || sortBy === "time_left") {
        aVal = typeof a.days_left === "number" ? a.days_left : (parseInt(a.daysLeft ?? a.timeLeft, 10) || 0);
        bVal = typeof b.days_left === "number" ? b.days_left : (parseInt(b.daysLeft ?? b.timeLeft, 10) || 0);
      } else if (sortBy === "warnings") {
        aVal = a.warning ? 1 : 0;
        bVal = b.warning ? 1 : 0;
      }

      return compareGridValues(aVal, bVal, sortDirection);
    });
    return next;
  }, [rows, sortBy, sortDirection]);

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
      setDeleteConfirm({ type: "bulk", ids: selectedIds });
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
        setPublishingIds((cur) => [...cur, item.id]);
        try {
          await publishProduct(item.id);
          updated += 1;
        } catch {
          failed += 1;
        } finally {
          setPublishingIds((cur) => cur.filter((x) => x !== item.id));
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

  const confirmDelete = async () => {
    if (!deleteConfirm) {
      return;
    }

    setDeleting(true);
    try {
      if (deleteConfirm.type === "bulk") {
        await bulkDeleteProducts(deleteConfirm.ids);
        toast.success(`${deleteConfirm.ids.length} products deleted.`);
        setSelectedIds([]);
      } else {
        await deleteProduct(deleteConfirm.id);
        toast.success("Product deleted.");
      }
      setDeleteConfirm(null);
      loadListings();
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Delete failed.");
    } finally {
      setDeleting(false);
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

  // Deep link from Orders' "Edit Listing" action (?item=<ebay_item_id>): make sure the
  // fetch isn't status-filtered out, then open the matching row's editor once it loads.
  useEffect(() => {
    if (searchParams.get("item")) {
      setFilterStatus("All");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const itemParam = searchParams.get("item");
    if (!itemParam || !rows.length) {
      return;
    }

    const match = rows.find((row) => String(row.itemSell) === String(itemParam));
    if (match) {
      openProductEditor(match);
    } else {
      toast.warn("Listing not found in Products — it may have been synced from a different store.");
    }

    const next = new URLSearchParams(searchParams);
    next.delete("item");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

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

  const handleMonitorPriceStock = async (item) => {
    setMonitoringId(String(item.id));
    setOpenMenuId("");
    try {
      const res = await monitorProductPriceStock(item.id);
      const result = res.data?.result;
      if (result?.status === "skipped") {
        toast.info(result.reason || "Skipped by supplier settings");
      } else if (result?.status === "error") {
        toast.error(result.error || "Monitoring check failed.");
      } else {
        let msg = "Price & stock verified with supplier.";
        if (result?.price_changed && result?.stock_changed) {
          msg = `Price & stock updated! Price: $${result.details?.price?.new_price}, Qty: ${result.details?.stock?.new_quantity}`;
        } else if (result?.price_changed) {
          msg = `Price updated to $${result.details?.price?.new_price}`;
        } else if (result?.stock_changed) {
          msg = `Stock quantity updated to ${result.details?.stock?.new_quantity}`;
        }
        toast.success(msg);
        loadListings();
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to monitor product."));
    } finally {
      setMonitoringId("");
    }
  };

  const handleSyncNow = () => {
    const primary = connections.find((c) => c.is_primary) ?? connections[0];
    if (primary) {
      dispatch(syncEbayListingsAction(primary.id));
    }
  };

  const scrollTable = (direction) => {
    const el = tableScrollRef.current;
    if (!el) return;
    if (direction === "start") {
      el.scrollTo({ left: 0, behavior: "smooth" });
    } else if (direction === "end") {
      el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    } else if (direction === "left" || direction === -1) {
      el.scrollBy({ left: -360, behavior: "smooth" });
    } else {
      el.scrollBy({ left: 360, behavior: "smooth" });
    }
  };

  const handleSort = (columnId) => {
    if (sortBy === columnId) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(columnId);
      const isDescDefault = [
        "uploaded",
        "sold",
        "cost",
        "views",
        "watchers",
        "stockTotal",
        "stockAvailable",
        "stockOnHold",
        "stockOos",
      ].includes(columnId);
      setSortDirection(isDescDefault ? "desc" : "asc");
    }
  };

  const renderProductColumnHeader = (column) => {
    if (column.id === "actions") {
      return <span>Actions</span>;
    }
    return (
      <GridSortHeader
        columnId={column.id}
        label={column.label}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSort={handleSort}
      />
    );
  };

  const renderProductCell = (item, columnId, imageUrl) => {
    switch (columnId) {
      case "actions":
        return (
          <div className="products-row-actions" onClick={(e) => e.stopPropagation()}>
            {item.listing_url ? (
              <a href={item.listing_url} target="_blank" rel="noopener noreferrer" className="orders-row-actions__icon" aria-label="View on eBay" title="View on eBay">
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
                  onClick={() => handleMonitorPriceStock(item)}
                  disabled={monitoringId === String(item.id)}
                >
                  {monitoringId === String(item.id) ? <LuLoader className="spin-icon" /> : <LuEye />}
                  <span>Monitor Price &amp; Stock</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirm({ type: "single", id: item.id });
                    setOpenMenuId("");
                  }}
                >
                  <LuTrash2 />
                  <span>Delete Product</span>
                </button>
              </div>
            ) : null}
          </div>
        );
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
              {publishingIds.includes(item.id) ? (
                <div className="products-item__processing" role="status">
                  <LuLoader className="spin-icon" />
                  <span>Publishing…</span>
                </div>
              ) : (
                <button type="button" className="products-sourcing-btn" onClick={() => toast.info("Sourcing request flow opens for this product.")}>
                  Sourcing Request
                </button>
              )}
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
      case "timeLeft":
      case "time_left": {
        const val = item.daysLeft ?? item.timeLeft ?? item.time_left ?? resolveTimeLeft(item);
        return (
          <span className="products-table__time-left" title={`Time left: ${val}`}>
            {val || "30d"}
          </span>
        );
      }
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
      case "actions":
        return "products-table__actions-col";
      case "daysLeft":
      case "timeLeft":
      case "time_left":
        return "products-table__time-left-col";
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
      {alerts.length ? (
        <div className="products-alerts card-wrapper">
          {visibleAlerts.map((alert) => (
            <div className="products-alert" key={alert.id}>
              <div className="products-alert__copy">
                <span className={`products-alert__dot products-alert__dot--${alert.tone === "danger" ? "danger" : "warning"}`} />
                <span>{alert.message}</span>
              </div>
              <div className="products-alert__actions">
                {alert.isDraftAction ? (
                  <button
                    type="button"
                    className="products-alert__link products-alert__link--move-draft"
                    onClick={() => navigate("/drafts")}
                  >
                    Move to draft
                  </button>
                ) : null}
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
          {alerts.length > 3 ? (
            <div className="products-alerts__footer">
              <button
                type="button"
                className="products-alerts__more-btn"
                onClick={() => setShowAllAlerts((prev) => !prev)}
              >
                {showAllAlerts ? (
                  <>
                    <LuChevronUp size={14} />
                    <span>Show less</span>
                  </>
                ) : (
                  <>
                    <LuChevronDown size={14} />
                    <span>More ({alerts.length - 3})...</span>
                  </>
                )}
              </button>
            </div>
          ) : null}
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
          <button type="button" className="orders-icon-btn" onClick={() => scrollTable("left")} aria-label="Scroll grid left" title="Scroll left">
            <LuChevronLeft />
          </button>
          <button type="button" className="orders-icon-btn" onClick={() => scrollTable("right")} aria-label="Scroll grid right" title="Scroll right">
            <LuChevronRight />
          </button>
        </div>
      </div>

      <UploadHistoryPanel visible={historyVisible} onClose={() => setHistoryVisible(false)} />

      <div className="products-table-shell card-wrapper">
        <div
          className="products-table-top-scroll"
          ref={topScrollRef}
          onScroll={(e) => syncScroll(e.currentTarget)}
          aria-hidden="true"
        >
          <div style={{ width: tableMinWidth, height: 1 }} />
        </div>

        <div className="products-table-scroll" ref={tableScrollRef} onScroll={(e) => syncScroll(e.currentTarget)}>
          <table
            className={`products-table ${tableView === "comfortable" ? "products-table--comfortable" : ""}`}
            style={{ minWidth: tableMinWidth }}
          >
            <thead>
              <tr className="products-table__group-row">
                <th className="products-table__checkbox-col" rowSpan={hasStockGroup ? 2 : 1} />
                {visibleColumns.map((column) => {
                  if (column.id === "actions") {
                    return (
                      <th
                        key={column.id}
                        className="products-table__actions-col"
                        rowSpan={hasStockGroup ? 2 : 1}
                        style={{ minWidth: column.minWidth }}
                      >
                        {renderProductColumnHeader(column)}
                      </th>
                    );
                  }

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
                    <th
                      key={column.id}
                      rowSpan={hasStockGroup ? 2 : 1}
                      style={{ minWidth: column.minWidth, cursor: "pointer" }}
                      onClick={() => handleSort(column.id)}
                    >
                      {renderProductColumnHeader(column)}
                    </th>
                  );
                })}
              </tr>
              {hasStockGroup ? (
                <tr className="products-table__sub-row">
                  {visibleStockColumns.map((column, index) => (
                    <th
                      key={column.id}
                      className={index === 0 ? "products-table__group--divider" : undefined}
                      style={{ minWidth: column.minWidth, cursor: "pointer" }}
                      onClick={() => handleSort(column.id)}
                    >
                      <GridSortHeader
                        columnId={column.id}
                        label={column.label}
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                      />
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
                <option value={40}>40</option>
                <option value={60}>60</option>
                <option value={120}>120</option>
                <option value={240}>240</option>
              </select>
            </label>
            <span>
              Products out of {totalCount}
            </span>
          </div>
        </div>
      </div>

      {showStickyScroll ? (
        <div
          className="products-table-sticky-scroll"
          style={stickyScrollStyle}
          ref={stickyScrollRef}
          onScroll={(e) => syncScroll(e.currentTarget)}
          aria-hidden="true"
        >
          <div style={{ width: tableMinWidth, height: 1 }} />
        </div>
      ) : null}

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

      <OrderSourceModal
        open={Boolean(editingBuySourceItem)}
        order={editingBuySourceItem}
        saving={Boolean(editingBuySourceItem) && savingBuySourceId === editingBuySourceItem.id}
        onClose={cancelEditBuySource}
        onSave={saveBuySource}
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

      <ConfirmModal
        open={Boolean(deleteConfirm)}
        title={deleteConfirm?.type === "bulk" ? `Delete ${deleteConfirm.ids.length} products?` : "Delete this product?"}
        description="This will permanently remove the product listing. This cannot be undone."
        confirmLabel="Delete"
        saving={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteConfirm(null)}
      />
    </section>
  );
}

export default ProductsContent;
