import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "../../../utils/toast";
import {
  getOrders,
  pushOrderTracking,
  syncOrders,
  updateOrderFulfillment,
  updateOrderSource,
  updateOrderTracking,
  updateOrderStatus as updateOrderStatusApi,
  refundOrder,
  cancelOrder,
  archiveOrder,
} from "../../../services/OrderService";
import {
  LuArchive,
  LuArchiveRestore,
  LuBadgeCheck,
  LuBolt,
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuClipboardList,
  LuClock3,
  LuDownload,
  LuExternalLink,
  LuInbox,
  LuLoader,
  LuPencil,
  LuPrinter,
  LuRefreshCcw,
  LuSearch,
  LuSlidersHorizontal,
  LuStore,
  LuTriangleAlert,
  LuTruck,
  LuX,
} from "react-icons/lu";
import PageFilterPanel from "../PageFilterPanel";
import { FilterCheckbox, FilterInput, FilterSelect } from "../FilterField";
import OrderColumnManager from "../OrderColumnManager";
import {
  getVisibleTableMinWidth,
  loadVisibleColumnIds,
  resolveVisibleOrderColumns,
  saveVisibleColumnIds,
} from "../orderColumns";
import {
  buildCarrierTrackingUrl,
  buildEbayListingProductUrl,
  buildOrdersCsv,
  buildSourceProductUrl,
  compareGridValues,
  detectTrackingCarrier,
  downloadTextFile,
  formatDisplayDate,
  formatTrackingDisplay,
  getEbayOrderDetailUrl,
  getEbayShippingLabelUrl,
  isShippingLabelGenerated,
  normalizeTrackingCarrier,
  platformLabel,
} from "../helpers";
import GridSortHeader from "../GridSortHeader";
import { openPrintableDocument } from "../printDocuments";
import { getApiErrorMessage } from "../../../utils/apiErrors";
import { orderRowBoltActions, orderRowPrintActions, orderStatusOptions } from "../constants";
import ProductItemIdCell from "../ProductItemIdCell";
import OrdersTrackingEditor from "../OrdersTrackingEditor";
import BulkTrackingModal from "../BulkTrackingModal";
import QuickEditModal from "../QuickEditModal";
import OrderSourceModal from "../OrderSourceModal";
import ConfirmModal from "../ConfirmModal";
import RefundOrderModal from "../RefundOrderModal";
import {
  DEFAULT_DATE_PRESET,
  ORDER_DATE_PRESETS,
  ORDER_SORT_OPTIONS,
  getDateRangeForPreset,
  getDefaultOrderFilters,
} from "../orderFilters";

const PRINT_COLUMN_DOC_TYPES = {
  invoice: "invoice",
  packingSlip: "packing-slip",
  shippingLabel: "shipping-label",
};

function formatMoney(value, currency = "USD") {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return String(value);
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

function joinAddress(parts) {
  return parts.filter(Boolean).join(", ") || "—";
}

function normalizeTrackingValue(value) {
  return formatTrackingDisplay(value).trackingNumber;
}

function mapApiOrder(order) {
  const raw = order.raw_data ?? {};
  const lineItems = raw.lineItems ?? [];
  const firstItem = lineItems[0] ?? {};
  const buyer = raw.buyer ?? {};
  const pricing = raw.pricingSummary ?? {};
  const payment = raw.paymentSummary?.payments?.[0] ?? {};
  const fulfillment = raw.fulfillmentStartInstructions?.[0] ?? {};
  const shipTo = fulfillment.shippingStep?.shipTo ?? buyer.buyerRegistrationAddress ?? {};
  const delivery = raw.deliveryCost ?? {};
  const variationAspects = firstItem.lineItemFulfillmentInstructions?.variations
    ?? firstItem.variationAspects
    ?? [];

  const variationText = Array.isArray(variationAspects)
    ? variationAspects
        .map((aspect) => {
          if (typeof aspect === "string") {
            return aspect;
          }
          const name = aspect.name ?? aspect.localizedName ?? "";
          const value = aspect.value ?? aspect.localizedValue ?? "";
          return [name, value].filter(Boolean).join(": ");
        })
        .filter(Boolean)
        .join(", ")
    : "";

  const totalQuantity = lineItems.reduce((sum, item) => sum + Number(item.quantity ?? 1), 0);
  const sellPrice = order.sell_price ?? pricing.total?.value ?? firstItem.lineItemCost?.value ?? 0;
  const buyPrice = order.buy_price;
  const profit = order.profit ?? (buyPrice != null ? Number(sellPrice) - Number(buyPrice) : null);
  const currency = order.currency ?? pricing.total?.currency ?? "USD";

  const paymentStatus = raw.orderPaymentStatus
    ? String(raw.orderPaymentStatus).replace(/_/g, " ")
    : "—";

  const shippingStatus = raw.orderFulfillmentStatus
    ? String(raw.orderFulfillmentStatus).replace(/_/g, " ")
    : "—";

  const refund = raw.refundSummary ?? raw.paymentSummary?.refunds?.[0] ?? {};
  const shippingStep = fulfillment.shippingStep ?? {};
  const sourceProductId = order.source_product_id ?? order.item_buy_id ?? null;
  const sourcePlatform = order.source_platform ?? "aliexpress";
  const sourceUrl = order.source_url ?? null;
  const sourceSkuId = order.source_sku_id ?? null;
  const sourceVariation = Array.isArray(order.source_variation) ? order.source_variation : null;
  const sourceVariationText = sourceVariation?.length
    ? sourceVariation.map((entry) => [entry.name, entry.value].filter(Boolean).join(": ")).join(", ")
    : "";
  const itemBuy = sourceProductId ?? "—";
  const itemBuyUrl = buildSourceProductUrl(sourcePlatform, sourceProductId, sourceUrl);
  const itemSellUrl = buildEbayListingProductUrl({ ebay_item_id: order.item_sell_id ?? firstItem.legacyItemId });
  const shipByDate = raw.lineItems?.[0]?.lineItemFulfillmentInstructions?.shipByDate ?? null;
  const isFulfilled = String(raw.orderFulfillmentStatus ?? "").toUpperCase() === "FULFILLED";
  const shipByOverdue = Boolean(
    shipByDate &&
      !isFulfilled &&
      order.status !== "Canceled" &&
      new Date(shipByDate) < new Date(new Date().toDateString()),
  );
  const aliExpressTracking =
    normalizeTrackingValue(order.buy_tracking_number) ||
    normalizeTrackingValue(raw.buy_tracking_number) ||
    normalizeTrackingValue(raw.source_tracking_number) ||
    "";

  const explicitEbayTracking = normalizeTrackingValue(order.tracking_number);
  const ebayStepTracking = normalizeTrackingValue(shippingStep.shipmentTrackingNumber);

  // If AliExpress gives the tracking ID, show the same in eBay tracking ID
  const trackingValue =
    explicitEbayTracking ||
    aliExpressTracking ||
    ebayStepTracking ||
    "";

  const aliExpressCarrier =
    normalizeTrackingCarrier(order.buy_carrier) ||
    normalizeTrackingCarrier(raw.buy_carrier) ||
    "";

  const carrierRaw =
    normalizeTrackingCarrier(order.carrier) ||
    aliExpressCarrier ||
    normalizeTrackingCarrier(shippingStep.shippingCarrierCode) ||
    detectTrackingCarrier(trackingValue) ||
    "";

  const trackingParsed = formatTrackingDisplay(trackingValue);
  const trackingUrl = trackingParsed.url || (trackingValue ? buildCarrierTrackingUrl(trackingValue, carrierRaw) : null);

  return {
    id: String(order.id),
    title: order.item_title ?? firstItem.title ?? "Order item",
    image: order.image_url ?? order.listing_image_url ?? firstItem.image?.imageUrl ?? null,
    color: variationText || "—",
    pickStatus: raw.pickStatus ?? "—",
    itemId: order.item_sell_id ?? firstItem.legacyItemId ?? firstItem.lineItemId ?? "—",
    sku: firstItem.sku ?? "—",
    variationSpecifics: variationText || "—",
    bundleDetails: firstItem.bundleDetails ?? "—",
    listingsTags: firstItem.listingTags ?? "—",
    orderId: order.ebay_order_id ?? raw.orderId ?? "—",
    orderDetailUrl: getEbayOrderDetailUrl(
      order.ebay_order_id ?? raw.orderId,
      order.connection?.site_id,
    ),
    detailsExtended: [
      paymentStatus !== "—" ? `Payment: ${paymentStatus}` : null,
      shippingStatus !== "—" ? `Shipping: ${shippingStatus}` : null,
      delivery.shippingCost?.value ? `Shipping cost: ${formatMoney(delivery.shippingCost.value, delivery.shippingCost.currency)}` : null,
    ]
      .filter(Boolean)
      .join(" · ") || "—",
    orderDate: typeof order.order_date === "string" ? order.order_date.slice(0, 10) : order.order_date,
    status: order.status,
    paidDate: payment.paymentDate ? String(payment.paymentDate).slice(0, 10) : "—",
    total: formatMoney(sellPrice, currency),
    totalQuantity: totalQuantity || 1,
    transactionId: firstItem.lineItemId ?? raw.salesRecordReference ?? "—",
    refundDate: refund.refundDate ? String(refund.refundDate).slice(0, 10) : "—",
    refundTotal: formatMoney(refund.amount?.value ?? raw.refundAmount?.value, refund.amount?.currency ?? currency),
    cancelStatus: raw.cancelStatus?.cancelState ?? "—",
    returnStatus: raw.returnStatus ?? raw.cancelStatus?.cancelState ?? "—",
    inquiryStatus: raw.inquiryStatus ?? "—",
    tags: order.tags ?? "—",
    profit: profit != null ? formatMoney(profit, currency) : "—",
    buyerName: shipTo.fullName ?? buyer.buyerRegistrationAddress?.fullName ?? order.buyer_name ?? "—",
    username: buyer.username ?? order.buyer_name ?? "—",
    buyerNotes: raw.buyerCheckoutNotes ?? "—",
    email: order.buyer_email ?? buyer.buyerRegistrationAddress?.email ?? "—",
    buyerAdditionalInfo: buyer.taxAddress?.postalCode ?? buyer.primaryPhone?.phoneNumber ?? "—",
    shippingStatus,
    shippingService: shippingStep.shippingServiceCode ?? fulfillment.shippingStep?.shippingCarrierCode ?? "—",
    shippingPrice: formatMoney(delivery.shippingCost?.value ?? delivery.amount?.value, delivery.shippingCost?.currency ?? currency),
    trackingNumber: trackingValue || "—",
    trackingNumberRaw: trackingValue,
    trackingUrl,
    carrier: carrierRaw || "—",
    carrierRaw,
    trackingPushed: Boolean(order.tracking_pushed_at),
    trackingPushedAt: order.tracking_pushed_at ?? null,
    shippingAddress: joinAddress([
      shipTo.contactAddress?.addressLine1 ?? shipTo.addressLine1,
      shipTo.contactAddress?.city ?? shipTo.city,
      shipTo.contactAddress?.stateOrProvince ?? shipTo.stateOrProvince,
      shipTo.contactAddress?.postalCode ?? shipTo.postalCode,
      shipTo.contactAddress?.countryCode ?? shipTo.countryCode,
    ]),
    shipBy: shipByDate ? shipByDate.slice(0, 10) : "—",
    shipByOverdue,
    shippingDate: raw.fulfillmentHrefs?.length ? String(raw.lastModifiedDate ?? "").slice(0, 10) || "Shipped" : "—",
    estDeliveryDate: order.estimated_arrival ?? raw.maxEstimatedDeliveryDate?.slice(0, 10) ?? "—",
    notes: order.internal_notes ?? "—",
    ebaySellerNotes: order.ebay_seller_notes ?? "—",
    invoice: "Print",
    packingSlip: "Print",
    shippingLabel: "Print",
    feedback: order.feedback_status ?? "—",
    record: raw.salesRecordReference ?? String(order.id ?? "—"),
    taxRef: raw.taxReference ?? "—",
    channel: order.store_name ? `${order.store_name} · eBay` : "eBay",
    storeName: order.store_name ?? "eBay",
    teammate: order.teammate ?? "—",
    itemBuy,
    itemSell: order.item_sell_id ?? "—",
    itemBuyUrl,
    itemSellUrl,
    sourcePlatform,
    sourceUrl,
    sourceProductId,
    sourceSkuId,
    sourceVariation,
    sourceVariationText,
    listingSku: order.listing_sku ?? firstItem.sku ?? "—",
    buyer: buyer.username ?? order.buyer_name ?? "—",
    date: typeof order.order_date === "string" ? order.order_date.slice(0, 10) : order.order_date,
    totalValue: Number(sellPrice) || 0,
    profitValue: profit != null && !Number.isNaN(Number(profit)) ? Number(profit) : null,
    aliexpressOrderId: order.aliexpress_order_id ?? "—",
    aliexpressOrderIdRaw: order.aliexpress_order_id ?? "",
    aliexpressStatus: order.aliexpress_order_status ?? "—",
    aliexpressStatusRaw: order.aliexpress_order_status ?? "",
    prepCost: order.prep_cost ?? 0,
    shippingCost: order.shipping_cost ?? 0,
    siteId: order.connection?.site_id ?? raw.siteId ?? null,
    raw,
    connection: order.connection,
    shippingLabelUrl: order.shipping_label_url ?? raw.shipping_label_url ?? raw.shippingLabelUrl ?? null,
    shippingLabelGenerated: Boolean(
      order.shipping_label_generated ||
      order.shipping_label_url ||
      raw.shipping_label_url ||
      raw.shippingLabelUrl
    ),
  };
}

function OrdersContent({ searchQuery: parentSearchQuery = "" }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const focusedOrderParam = (searchParams.get("focus") ?? "").trim();
  const focusedOrderHandledRef = useRef("");
  const defaultFilters = useMemo(() => getDefaultOrderFilters(), []);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showOnlyActive, setShowOnlyActive] = useState(defaultFilters.showOnlyActive);
  const [statusFilter, setStatusFilter] = useState(defaultFilters.statusFilter);
  const [buyerFilter, setBuyerFilter] = useState(defaultFilters.buyerFilter);
  const [orderIdFilter, setOrderIdFilter] = useState(defaultFilters.orderIdFilter);
  const [storeFilter, setStoreFilter] = useState(defaultFilters.storeFilter);
  const [carrierFilter, setCarrierFilter] = useState(defaultFilters.carrierFilter ?? "All Carriers");
  const [sourceFilter, setSourceFilter] = useState(defaultFilters.sourceFilter ?? "All Sources");
  const [dateRangePreset, setDateRangePreset] = useState(defaultFilters.dateRangePreset);
  const [fromDate, setFromDate] = useState(defaultFilters.fromDate);
  const [toDate, setToDate] = useState(defaultFilters.toDate);
  const [sortBy, setSortBy] = useState(defaultFilters.sortBy);
  const [sortDirection, setSortDirection] = useState(defaultFilters.sortDirection);
  const [searchInput, setSearchInput] = useState(parentSearchQuery || "");
  const [debouncedSearch, setDebouncedSearch] = useState(parentSearchQuery || "");
  const [ordersNotice, setOrdersNotice] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [openStatusId, setOpenStatusId] = useState("");
  const [openRowPrintId, setOpenRowPrintId] = useState("");
  const [openRowBoltId, setOpenRowBoltId] = useState("");
  const [openDetailsId, setOpenDetailsId] = useState("");
  const [openBulkMenu, setOpenBulkMenu] = useState(false);
  const [openPrintMenu, setOpenPrintMenu] = useState(false);
  const [visibleColumnIds, setVisibleColumnIds] = useState(loadVisibleColumnIds);
  const [editingBuySourceOrder, setEditingBuySourceOrder] = useState(null);
  const [savingBuySourceId, setSavingBuySourceId] = useState("");
  const [editingTrackingId, setEditingTrackingId] = useState("");
  const [trackingDraft, setTrackingDraft] = useState("");
  const [carrierDraft, setCarrierDraft] = useState("");
  const [savingTrackingId, setSavingTrackingId] = useState("");
  const [pushingTrackingId, setPushingTrackingId] = useState("");
  const [bulkTrackingOrders, setBulkTrackingOrders] = useState(null);
  const [bulkTrackingSaving, setBulkTrackingSaving] = useState(false);
  const [editingFulfillment, setEditingFulfillment] = useState(null);
  const [fulfillmentDraft, setFulfillmentDraft] = useState("");
  const [savingFulfillmentKey, setSavingFulfillmentKey] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [archivingId, setArchivingId] = useState("");
  const [refundTarget, setRefundTarget] = useState(null);
  const [refundSaving, setRefundSaving] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelSaving, setCancelSaving] = useState(false);
  const [invoiceInfoOpen, setInvoiceInfoOpen] = useState(false);
  const tableScrollRef = useRef(null);

  // Sync external search input from parent if provided
  useEffect(() => {
    if (parentSearchQuery !== undefined && parentSearchQuery !== searchInput) {
      setSearchInput(parentSearchQuery);
      setDebouncedSearch(parentSearchQuery);
    }
  }, [parentSearchQuery]);

  // Debounce search input typing to prevent excessive API load
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const visibleColumns = useMemo(
    () => resolveVisibleOrderColumns(visibleColumnIds),
    [visibleColumnIds],
  );

  const tableMinWidth = useMemo(() => getVisibleTableMinWidth(visibleColumnIds), [visibleColumnIds]);

  const handleVisibleColumnsChange = (nextIds) => {
    setVisibleColumnIds(nextIds);
    saveVisibleColumnIds(nextIds);
  };

  const applyDatePreset = (preset) => {
    setDateRangePreset(preset);
    const range = getDateRangeForPreset(preset);
    if (range) {
      setFromDate(range.from);
      setToDate(range.to);
    }
  };

  const handleFromDateChange = (value) => {
    setFromDate(value);
    setDateRangePreset("custom");
  };

  const handleToDateChange = (value) => {
    setToDate(value);
    setDateRangePreset("custom");
  };

  const storeOptions = useMemo(() => {
    const stores = new Set(
      orders.map((order) => order.storeName).filter((name) => name && name !== "—"),
    );

    return ["All Stores", ...Array.from(stores).sort((left, right) => left.localeCompare(right))];
  }, [orders]);

  const carrierOptions = useMemo(() => {
    const carriers = new Set();
    orders.forEach((order) => {
      const c = order.carrierRaw || (order.carrier !== "—" ? order.carrier : null);
      if (c && c !== "—" && c !== "-") carriers.add(c);
      const bc = order.buyCarrier;
      if (bc && bc !== "—" && bc !== "-") carriers.add(bc);
    });
    return ["All Carriers", ...Array.from(carriers).sort((a, b) => a.localeCompare(b))];
  }, [orders]);

  const sourceOptions = useMemo(() => {
    const sources = new Set();
    orders.forEach((order) => {
      const s = order.sourcePlatform;
      if (s && s !== "—" && s !== "-") sources.add(s);
    });
    return ["All Sources", ...Array.from(sources).sort((a, b) => a.localeCompare(b))];
  }, [orders]);

  const statusCounts = useMemo(() => {
    const counts = {
      all: orders.length,
      Pending: 0,
      Ordered: 0,
      Shipped: 0,
      Delivered: 0,
      Canceled: 0,
    };
    orders.forEach((o) => {
      if (counts[o.status] !== undefined) {
        counts[o.status] += 1;
      }
    });
    return counts;
  }, [orders]);

  const boltActions = useMemo(
    () =>
      orderRowBoltActions.map((item) =>
        item.id === "archive-order"
          ? { ...item, label: showArchived ? "Unarchive Order" : "Archive Order" }
          : item,
      ),
    [showArchived],
  );

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const params = {
        q: debouncedSearch.trim() || undefined,
        status: statusFilter !== "All Statuses" ? statusFilter : undefined,
        carrier: carrierFilter !== "All Carriers" ? carrierFilter : undefined,
        store: storeFilter !== "All Stores" ? storeFilter : undefined,
        source: sourceFilter !== "All Sources" ? sourceFilter : undefined,
        buyer: buyerFilter.trim() || undefined,
        order_id: orderIdFilter.trim() || undefined,
        hide_canceled: showOnlyActive ? 1 : 0,
        sort: sortDirection,
        limit: 100,
        archived: showArchived ? 1 : 0,
      };

      if (fromDate) {
        params.from_date = fromDate;
      }

      if (toDate) {
        params.to_date = toDate;
      }

      const res = await getOrders(params);
      const rows = (res.data?.data ?? []).map(mapApiOrder);
      setOrders(rows);
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to load orders.");
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [
    debouncedSearch,
    statusFilter,
    buyerFilter,
    orderIdFilter,
    carrierFilter,
    storeFilter,
    sourceFilter,
    fromDate,
    toDate,
    showOnlyActive,
    sortDirection,
    showArchived,
  ]);

  const handleSyncOrders = async () => {
    setSyncing(true);
    try {
      const res = await syncOrders();
      toast.success(res.data?.message ?? "Orders synced.");
      await loadOrders();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Order sync failed."));
    } finally {
      setSyncing(false);
    }
  };

  const startEditBuySource = (order) => {
    setEditingBuySourceOrder(order);
  };

  const cancelEditBuySource = () => {
    setEditingBuySourceOrder(null);
  };

  const saveBuySource = async (payload) => {
    const order = editingBuySourceOrder;
    if (!order) {
      return;
    }

    setSavingBuySourceId(order.id);
    try {
      const res = await updateOrderSource(order.id, payload);
      toast.success(res.data?.message ?? "Source link updated.");
      cancelEditBuySource();
      await loadOrders();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not update source link."));
    } finally {
      setSavingBuySourceId("");
    }
  };

  const FULFILLMENT_FIELDS = {
    aliexpressOrderId: { key: "aliexpress_order_id", label: "AliExpress order ID" },
    aliexpressStatus: { key: "aliexpress_order_status", label: "AliExpress order status" },
    prepCost: { key: "prep_cost", label: "Prep cost" },
    shippingCost: { key: "shipping_cost", label: "Shipping cost" },
  };

  const startEditFulfillment = (order, columnId) => {
    setEditingFulfillment({ orderId: order.id, columnId });
    setFulfillmentDraft(
      columnId === "prepCost" || columnId === "shippingCost"
        ? String(order[columnId] ?? 0)
        : order[`${columnId}Raw`] ?? "",
    );
  };

  const cancelEditFulfillment = () => {
    setEditingFulfillment(null);
    setFulfillmentDraft("");
  };

  const saveFulfillment = async (order, columnId) => {
    const field = FULFILLMENT_FIELDS[columnId];
    const isNumeric = columnId === "prepCost" || columnId === "shippingCost";

    let value = fulfillmentDraft.trim();
    if (isNumeric) {
      const parsed = Number.parseFloat(value || "0");
      if (!Number.isFinite(parsed) || parsed < 0) {
        toast.warn(`Enter a valid ${field.label.toLowerCase()}.`);
        return;
      }
      value = Number(parsed.toFixed(2));
    }

    const fulfillmentKey = `${order.id}:${columnId}`;
    setSavingFulfillmentKey(fulfillmentKey);
    try {
      await updateOrderFulfillment(order.id, { [field.key]: value });
      toast.success(`${field.label} updated.`);
      cancelEditFulfillment();
      await loadOrders();
    } catch (err) {
      toast.error(getApiErrorMessage(err, `Could not update ${field.label.toLowerCase()}.`));
    } finally {
      setSavingFulfillmentKey("");
    }
  };

  const startEditTracking = (order) => {
    setEditingTrackingId(order.id);
    setTrackingDraft(order.trackingNumberRaw ?? "");
    setCarrierDraft(order.carrierRaw || "");
  };

  const cancelEditTracking = () => {
    setEditingTrackingId("");
    setTrackingDraft("");
    setCarrierDraft("");
  };

  const handleTrackingDraftChange = (value) => {
    setTrackingDraft(value);
  };

  const saveTrackingNumber = async (order) => {
    setSavingTrackingId(order.id);
    try {
      const res = await updateOrderTracking(order.id, {
        tracking_number: trackingDraft.trim() || null,
        carrier: carrierDraft || null,
      });
      toast.success(res.data?.message ?? "Tracking updated.");
      cancelEditTracking();
      await loadOrders();
      return true;
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not update tracking."));
      return false;
    } finally {
      setSavingTrackingId("");
    }
  };

  const closeBulkTracking = () => {
    setBulkTrackingOrders(null);
    setBulkTrackingSaving(false);
  };

  const saveBulkTrackingOne = async (order, payload) => {
    setBulkTrackingSaving(order.id);
    try {
      await updateOrderTracking(order.id, payload);
      toast.success(`Tracking saved for ${order.orderId}.`);
      loadOrders();
      return true;
    } catch (err) {
      toast.error(getApiErrorMessage(err, `Could not save tracking for ${order.orderId}.`));
      return false;
    } finally {
      setBulkTrackingSaving(false);
    }
  };

  const saveBulkTrackingAll = async (rows, markSaved) => {
    if (!rows.length) return;

    setBulkTrackingSaving("all");
    const savedIds = [];
    let failed = 0;

    for (const { order, payload } of rows) {
      try {
        await updateOrderTracking(order.id, payload);
        savedIds.push(order.id);
      } catch {
        failed += 1;
      }
    }

    setBulkTrackingSaving(false);
    markSaved(savedIds);

    if (savedIds.length) toast.success(`Tracking saved for ${savedIds.length} order${savedIds.length === 1 ? "" : "s"}.`);
    if (failed) toast.error(`${failed} order${failed === 1 ? "" : "s"} could not be updated.`);
    if (savedIds.length) loadOrders();
  };

  const pushTrackingToEbay = async (order) => {
    const isEditing = editingTrackingId === order.id;
    const tracking = (isEditing ? trackingDraft : (order.trackingNumberRaw || "")).trim();
    let carrier = normalizeTrackingCarrier(isEditing ? carrierDraft : (order.carrierRaw || ""));

    if (!tracking) {
      startEditTracking(order);
      toast.info("Please enter a tracking number first.");
      return;
    }

    if (!carrier) {
      carrier = detectTrackingCarrier(tracking) || "";
    }

    if (!carrier) {
      startEditTracking(order);
      toast.info("Please select a carrier before pushing to eBay.");
      return;
    }

    setPushingTrackingId(order.id);
    try {
      await updateOrderTracking(order.id, {
        tracking_number: tracking,
        carrier,
      });
      const res = await pushOrderTracking(order.id);
      toast.success(res.data?.message ?? "Tracking pushed to eBay.");
      cancelEditTracking();
      await loadOrders();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not push tracking to eBay."));
    } finally {
      setPushingTrackingId("");
    }
  };

  const renderTrackingEditor = (order, compact = false) => (
    <OrdersTrackingEditor
      order={order}
      isEditing={editingTrackingId === order.id}
      trackingDraft={trackingDraft}
      carrierDraft={carrierDraft}
      saving={savingTrackingId === order.id}
      pushing={pushingTrackingId === order.id}
      onStartEdit={startEditTracking}
      onCancel={cancelEditTracking}
      onTrackingChange={handleTrackingDraftChange}
      onCarrierChange={setCarrierDraft}
      onSave={saveTrackingNumber}
      onPushToEbay={pushTrackingToEbay}
      compact={compact}
    />
  );

  const renderFulfillmentCell = (order, columnId) => {
    const isNumeric = columnId === "prepCost" || columnId === "shippingCost";
    const displayValue = isNumeric ? formatMoney(order[columnId] ?? 0) : order[columnId];

    return (
      <button
        type="button"
        className="products-tracking-btn"
        onClick={(event) => {
          event.stopPropagation();
          startEditFulfillment(order, columnId);
        }}
        title={`Edit ${FULFILLMENT_FIELDS[columnId].label}`}
      >
        <span className={displayValue && displayValue !== "—" ? undefined : "products-tracking-btn__placeholder"}>
          {displayValue || "—"}
        </span>
        <LuPencil className="products-tracking-btn__icon" />
      </button>
    );
  };

  useEffect(() => {
    const handleDocumentClick = () => {
      setOpenStatusId("");
      setOpenRowPrintId("");
      setOpenRowBoltId("");
      setOpenBulkMenu(false);
      setOpenPrintMenu(false);
    };

    document.addEventListener("click", handleDocumentClick);

    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  const filteredOrders = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();

    const nextOrders = orders.filter((order) => {
      if (showOnlyActive && order.status === "Canceled") {
        return false;
      }

      if (statusFilter !== "All Statuses" && order.status !== statusFilter) {
        return false;
      }

      if (buyerFilter.trim()) {
        const b = buyerFilter.trim().toLowerCase();
        if (
          !order.buyer?.toLowerCase().includes(b) &&
          !order.buyerName?.toLowerCase().includes(b) &&
          !order.username?.toLowerCase().includes(b)
        ) {
          return false;
        }
      }

      if (orderIdFilter.trim()) {
        const orderIdQuery = orderIdFilter.trim().toLowerCase();
        if (
          !order.orderId?.toLowerCase().includes(orderIdQuery) &&
          !order.id?.toLowerCase().includes(orderIdQuery)
        ) {
          return false;
        }
      }

      if (storeFilter !== "All Stores" && order.storeName !== storeFilter) {
        return false;
      }

      if (carrierFilter !== "All Carriers") {
        const c1 = (order.carrierRaw || order.carrier || "").toLowerCase();
        const c2 = (order.buyCarrier || "").toLowerCase();
        const target = carrierFilter.toLowerCase();
        if (!c1.includes(target) && !c2.includes(target)) {
          return false;
        }
      }

      if (sourceFilter !== "All Sources") {
        const s = (order.sourcePlatform || "").toLowerCase();
        if (s !== sourceFilter.toLowerCase()) {
          return false;
        }
      }

      if (fromDate && order.date < fromDate) {
        return false;
      }

      if (toDate && order.date > toDate) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        order.title,
        order.color,
        order.buyer,
        order.buyerName,
        order.username,
        order.email,
        order.itemBuy,
        order.itemSell,
        order.orderSellId,
        order.orderId,
        order.sku,
        order.transactionId,
        order.trackingNumber,
        order.trackingNumberRaw,
        order.buyTrackingNumber,
        order.carrier,
        order.carrierRaw,
        order.aliexpressOrderId,
        order.aliexpressOrderIdRaw,
        order.storeName,
        order.sourceVariationText,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });

    return nextOrders.sort((left, right) => {
      let leftVal = left[sortBy];
      let rightVal = right[sortBy];

      if (sortBy === "name") {
        leftVal = left.title;
        rightVal = right.title;
      } else if (sortBy === "total") {
        leftVal = left.totalValue;
        rightVal = right.totalValue;
      } else if (sortBy === "profit") {
        leftVal = left.profitValue;
        rightVal = right.profitValue;
      } else if (sortBy === "orderDate") {
        leftVal = left.date;
        rightVal = right.date;
      } else if (sortBy === "trackingNumber") {
        leftVal = left.trackingNumberRaw;
        rightVal = right.trackingNumberRaw;
      } else if (sortBy === "carrier") {
        leftVal = left.carrierRaw;
        rightVal = right.carrierRaw;
      } else if (sortBy === "buyer") {
        leftVal = left.buyer;
        rightVal = right.buyer;
      } else if (sortBy === "buyerName") {
        leftVal = left.buyerName;
        rightVal = right.buyerName;
      } else if (sortBy === "orderId") {
        leftVal = left.orderId;
        rightVal = right.orderId;
      }

      return compareGridValues(leftVal, rightVal, sortDirection);
    });
  }, [
    buyerFilter,
    carrierFilter,
    debouncedSearch,
    fromDate,
    orderIdFilter,
    orders,
    showOnlyActive,
    sortBy,
    sortDirection,
    sourceFilter,
    statusFilter,
    storeFilter,
    toDate,
  ]);

  useEffect(() => {
    if (!focusedOrderParam) {
      setCurrentPage(1);
    }
  }, [filteredOrders.length, pageSize, focusedOrderParam]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const visibleOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    if (!focusedOrderParam || ordersLoading || !orders.length) {
      return;
    }

    const matchedOrder = orders.find(
      (order) =>
        String(order.id) === focusedOrderParam ||
        String(order.orderId) === focusedOrderParam,
    );

    if (!matchedOrder) {
      return;
    }

    const focusKey = `${focusedOrderParam}:${matchedOrder.id}:${pageSize}`;
    if (focusedOrderHandledRef.current === focusKey) {
      return;
    }
    focusedOrderHandledRef.current = focusKey;

    const filteredIndex = filteredOrders.findIndex((order) => order.id === matchedOrder.id);
    if (filteredIndex >= 0) {
      setCurrentPage(Math.floor(filteredIndex / pageSize) + 1);
    } else {
      setShowOnlyActive(false);
      setStatusFilter("All Statuses");
      setBuyerFilter("");
      setOrderIdFilter("");
      setStoreFilter("All Stores");
      setCarrierFilter("All Carriers");
      setSourceFilter("All Sources");
      setSearchInput("");
      setDebouncedSearch("");
      setCurrentPage(1);
    }

    setOpenDetailsId(matchedOrder.id);

    window.setTimeout(() => {
      document.getElementById(`orders-row-${matchedOrder.id}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 180);
  }, [focusedOrderParam, filteredOrders, orders, ordersLoading, pageSize]);

  const allVisibleSelected =
    visibleOrders.length > 0 && visibleOrders.every((order) => selectedIds.includes(order.id));
  const tableColumnCount = visibleColumns.length + 2;

  const activeFilterChips = [
    debouncedSearch.trim()
      ? {
          key: "search",
          label: `Search: "${debouncedSearch.trim()}"`,
          onRemove: () => {
            setSearchInput("");
            setDebouncedSearch("");
          },
        }
      : null,
    statusFilter !== "All Statuses"
      ? {
          key: "status",
          label: `Status: ${statusFilter}`,
          onRemove: () => setStatusFilter("All Statuses"),
        }
      : null,
    storeFilter !== "All Stores"
      ? {
          key: "store",
          label: `Store: ${storeFilter}`,
          onRemove: () => setStoreFilter("All Stores"),
        }
      : null,
    carrierFilter !== "All Carriers"
      ? {
          key: "carrier",
          label: `Carrier: ${carrierFilter}`,
          onRemove: () => setCarrierFilter("All Carriers"),
        }
      : null,
    sourceFilter !== "All Sources"
      ? {
          key: "source",
          label: `Source: ${sourceFilter}`,
          onRemove: () => setSourceFilter("All Sources"),
        }
      : null,
    dateRangePreset !== DEFAULT_DATE_PRESET && dateRangePreset !== "custom"
      ? {
          key: "date-preset",
          label: ORDER_DATE_PRESETS.find((preset) => preset.id === dateRangePreset)?.label ?? "Date range",
          onRemove: () => applyDatePreset(DEFAULT_DATE_PRESET),
        }
      : null,
    dateRangePreset === "custom" && (fromDate || toDate)
      ? {
          key: "date-custom",
          label: fromDate && toDate ? `${fromDate} – ${toDate}` : fromDate || toDate,
          onRemove: () => applyDatePreset(DEFAULT_DATE_PRESET),
        }
      : null,
    sortBy !== defaultFilters.sortBy || sortDirection !== defaultFilters.sortDirection
      ? {
          key: "sort",
          label: `${ORDER_SORT_OPTIONS.find((option) => option.id === sortBy)?.label ?? "Sort"} · ${sortDirection === "desc" ? "Desc" : "Asc"}`,
          onRemove: () => {
            setSortBy(defaultFilters.sortBy);
            setSortDirection(defaultFilters.sortDirection);
          },
        }
      : null,
    showOnlyActive
      ? null
      : {
          key: "active",
          label: "Including canceled",
          onRemove: () => setShowOnlyActive(true),
        },
    buyerFilter.trim()
      ? {
          key: "buyer",
          label: `Buyer: ${buyerFilter.trim()}`,
          onRemove: () => setBuyerFilter(""),
        }
      : null,
    orderIdFilter.trim()
      ? {
          key: "order-id",
          label: `Order: ${orderIdFilter.trim()}`,
          onRemove: () => setOrderIdFilter(""),
        }
      : null,
  ].filter(Boolean);

  const clearOrderFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setShowOnlyActive(defaultFilters.showOnlyActive);
    setStatusFilter(defaultFilters.statusFilter);
    setBuyerFilter(defaultFilters.buyerFilter);
    setOrderIdFilter(defaultFilters.orderIdFilter);
    setStoreFilter(defaultFilters.storeFilter);
    setCarrierFilter(defaultFilters.carrierFilter || "All Carriers");
    setSourceFilter(defaultFilters.sourceFilter || "All Sources");
    setSortBy(defaultFilters.sortBy);
    setSortDirection(defaultFilters.sortDirection);
    applyDatePreset(defaultFilters.dateRangePreset);
  };

  const hasOrderFilters =
    debouncedSearch.trim() !== "" ||
    dateRangePreset !== DEFAULT_DATE_PRESET ||
    sortBy !== defaultFilters.sortBy ||
    sortDirection !== defaultFilters.sortDirection ||
    !showOnlyActive ||
    statusFilter !== "All Statuses" ||
    buyerFilter.trim() !== "" ||
    orderIdFilter.trim() !== "" ||
    storeFilter !== "All Stores" ||
    carrierFilter !== "All Carriers" ||
    sourceFilter !== "All Sources";

  const activeFilterCount = [
    statusFilter !== "All Statuses",
    carrierFilter !== "All Carriers",
    sourceFilter !== "All Sources",
    storeFilter !== "All Stores",
    buyerFilter.trim() !== "",
    orderIdFilter.trim() !== "",
    dateRangePreset !== DEFAULT_DATE_PRESET,
    !showOnlyActive,
    Boolean(debouncedSearch.trim()),
  ].filter(Boolean).length;

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((current) => current.filter((id) => !visibleOrders.some((order) => order.id === id)));
      return;
    }

    setSelectedIds((current) => [...new Set([...current, ...visibleOrders.map((order) => order.id)])]);
  };

  const toggleSelection = (orderId) => {
    setSelectedIds((current) =>
      current.includes(orderId) ? current.filter((id) => id !== orderId) : [...current, orderId],
    );
  };

  const updateOrderStatus = async (orderId, nextStatus) => {
    try {
      await updateOrderStatusApi(Number(orderId), nextStatus);
      setOrders((current) =>
        current.map((order) => (order.id === orderId ? { ...order, status: nextStatus } : order)),
      );
      setOpenStatusId("");
      setOrdersNotice(`Order #${orderId} moved to ${nextStatus}.`);
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to update status.");
    }
  };

  const scrollTable = (direction) => {
    const element = tableScrollRef.current;

    if (!element) {
      return;
    }

    if (direction === "start") {
      element.scrollTo({ left: 0, behavior: "smooth" });
    } else if (direction === "end") {
      element.scrollTo({ left: element.scrollWidth, behavior: "smooth" });
    } else if (direction === "left" || direction === -1) {
      element.scrollBy({ left: -360, behavior: "smooth" });
    } else {
      element.scrollBy({ left: 360, behavior: "smooth" });
    }
  };

  const statusMeta = {
    Pending: { icon: LuClock3, className: "pending" },
    Ordered: { icon: LuClipboardList, className: "ordered" },
    Shipped: { icon: LuTruck, className: "shipped" },
    Delivered: { icon: LuBadgeCheck, className: "delivered" },
    Canceled: { icon: LuX, className: "canceled" },
  };

  const closeRowActionMenus = () => {
    setOpenRowPrintId("");
    setOpenRowBoltId("");
  };

  const handleEditListing = (order) => {
    if (order.itemSell && order.itemSell !== "—") {
      navigate(`/products?item=${encodeURIComponent(order.itemSell)}`);
    } else {
      toast.warn("This order has no linked eBay item ID to edit.");
    }
  };

  const handleArchiveOrder = async (order, archived) => {
    setArchivingId(order.id);
    try {
      await archiveOrder(order.id, archived);
      toast.success(archived ? "Order archived." : "Order unarchived.");
      setOrders((current) => current.filter((item) => item.id !== order.id));
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not update order."));
    } finally {
      setArchivingId("");
    }
  };

  const confirmRefund = async ({ amount, reason, comment }) => {
    if (!refundTarget) return;

    setRefundSaving(true);
    try {
      const res = await refundOrder(refundTarget.id, { amount, reason, comment });
      toast.success(res.data?.message ?? "Refund issued.");
      setRefundTarget(null);
      loadOrders();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Refund failed."));
    } finally {
      setRefundSaving(false);
    }
  };

  const confirmCancelOrder = async () => {
    if (!cancelTarget) return;

    setCancelSaving(true);
    try {
      const res = await cancelOrder(cancelTarget.id, {});
      toast.success(res.data?.message ?? "Order canceled.");
      setCancelTarget(null);
      loadOrders();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Cancel failed."));
    } finally {
      setCancelSaving(false);
    }
  };

  const handlePrintShippingLabel = (order) => {
    if (!order) return;

    const generated = isShippingLabelGenerated(order);

    if (!generated) {
      const orderKey = order.orderId || order.id;
      const ebayUrl = getEbayShippingLabelUrl(order.orderId, order.siteId, false);

      if (!ebayUrl) {
        toast.warn("eBay order ID is missing for this order.");
        return;
      }

      try {
        if (orderKey) {
          localStorage.setItem(`autods_label_generated_${orderKey}`, "true");
        }
        if (order.id) {
          localStorage.setItem(`autods_label_generated_${order.id}`, "true");
        }
      } catch {
        // ignore localStorage errors
      }

      setOrders((prev) =>
        prev.map((item) =>
          item.id === order.id
            ? { ...item, shippingLabelGenerated: true }
            : item
        )
      );

      toast.info("Shipping label not yet generated. Redirecting to eBay to purchase and generate label…");
      window.open(ebayUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (order.shippingLabelUrl && /^https?:\/\//i.test(order.shippingLabelUrl)) {
      window.open(order.shippingLabelUrl, "_blank", "noopener,noreferrer");
      return;
    }

    openPrintableDocument("shipping-label", order);
  };

  const handleOrderAction = (orderId, action) => {
    const order = orders.find((row) => String(row.id) === String(orderId));

    if (!order) {
      toast.error("Order not found.");
      closeRowActionMenus();
      return;
    }

    switch (action) {
      case "add-tracking":
        startEditTracking(order);
        break;
      case "edit-listing":
        handleEditListing(order);
        break;
      case "send-ebay-invoice":
        setInvoiceInfoOpen(true);
        break;
      case "issue-refund":
        setRefundTarget(order);
        break;
      case "cancel-order":
        setCancelTarget(order);
        break;
      case "archive-order":
        handleArchiveOrder(order, !showArchived);
        break;
      case "generate-invoice":
        openPrintableDocument("invoice", order);
        break;
      case "generate-packing-slip":
        openPrintableDocument("packing-slip", order);
        break;
      case "generate-pick-list":
        openPrintableDocument("pick-list", order);
        break;
      case "generate-barcode":
        openPrintableDocument("barcode", order);
        break;
      case "generate-shipping-label":
        handlePrintShippingLabel(order);
        break;
      default:
        toast.info(`${action} is not available.`);
    }

    closeRowActionMenus();
  };

  const toggleRowPrintMenu = (orderId) => {
    setOpenStatusId("");
    setOpenRowBoltId("");
    setOpenRowPrintId((current) => (current === orderId ? "" : orderId));
  };

  const toggleRowBoltMenu = (orderId) => {
    setOpenStatusId("");
    setOpenRowPrintId("");
    setOpenRowBoltId((current) => (current === orderId ? "" : orderId));
  };

  const renderRowActionMenu = (orderId, items, menuClassName = "") => (
    <div className={`orders-actions-menu orders-actions-menu--row ${menuClassName}`.trim()} role="menu">
      {items.map((item, index) => (
        <button
          type="button"
          key={`${orderId}-${item.id}-${index}`}
          className={item.disabled ? "orders-actions-menu__item orders-actions-menu__item--disabled" : "orders-actions-menu__item"}
          disabled={item.disabled}
          onClick={() => handleOrderAction(orderId, item.id, item.label)}
        >
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );

  const handleSort = (columnId) => {
    if (sortBy === columnId) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(columnId);
      const isDescDefault = [
        "orderDate",
        "paidDate",
        "shippingDate",
        "refundDate",
        "total",
        "profit",
        "refundTotal",
        "totalQuantity",
        "prepCost",
        "shippingCost",
      ].includes(columnId);
      setSortDirection(isDescDefault ? "desc" : "asc");
    }
  };

  const renderColumnHeader = (column) => {
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

  const renderOrderCell = (order, columnId, meta, StatusIcon) => {
    switch (columnId) {
      case "name":
        return (
          <div className="orders-product">
            {order.image ? (
              <div className="orders-product__thumb">
                <img
                  src={order.image}
                  alt={order.title}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.classList.add("orders-product__thumb--empty");
                    }
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            ) : (
              <div className="orders-product__thumb orders-product__thumb--empty">
                <LuStore />
              </div>
            )}
            <div className="orders-product__copy">
              <h3>{order.title}</h3>
              <p>{order.color}</p>
            </div>
          </div>
        );
      case "status":
        return (
          <div className="orders-status-wrap" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className={`orders-status-badge orders-status-badge--${meta.className}`}
              onClick={() => {
                closeRowActionMenus();
                setOpenStatusId((current) => (current === order.id ? "" : order.id));
              }}
            >
              <span className="orders-status-badge__left">
                <StatusIcon />
                <span>{order.status}</span>
              </span>
              <LuChevronDown />
            </button>

            {openStatusId === order.id ? (
              <div className="orders-status-menu">
                {orderStatusOptions.map((option) => {
                  const optionMeta = statusMeta[option];
                  const OptionIcon = optionMeta.icon;

                  return (
                    <button
                      type="button"
                      className="orders-status-menu__item"
                      key={option}
                      onClick={() => updateOrderStatus(order.id, option)}
                    >
                      <OptionIcon />
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      case "detailsExtended":
        return (
          <div className="orders-details">
            <span>{order.detailsExtended}</span>
            <button
              type="button"
              className="orders-details__link"
              onClick={() => setOpenDetailsId((current) => (current === order.id ? "" : order.id))}
            >
              Details
            </button>

            {openDetailsId === order.id ? (
              <div className="orders-details__popover">
                <span className="orders-details__icon">
                  <LuInbox />
                </span>
                <strong>{order.detailsExtended}</strong>
              </div>
            ) : null}
          </div>
        );
      case "shipBy":
        if (!order.shipBy || order.shipBy === "—") {
          return "—";
        }
        return order.shipByOverdue ? (
          <span className="orders-table__ship-by orders-table__ship-by--overdue">
            <LuTriangleAlert />
            <span>Overdue · {formatDisplayDate(order.shipBy)}</span>
          </span>
        ) : (
          formatDisplayDate(order.shipBy)
        );
      case "orderDate":
      case "paidDate":
      case "refundDate":
      case "shippingDate":
      case "estDeliveryDate":
        return order[columnId] && order[columnId] !== "—" ? formatDisplayDate(order[columnId]) : "—";
      case "username":
        return <span className="orders-table__buyer">{order.username}</span>;
      case "itemId":
        return (
          <div className="orders-paired-values">
            <div>
              <span className="orders-paired-values__type orders-paired-values__type--buy">BUY</span>
              <span className="orders-paired-values__platform">{platformLabel(order.sourcePlatform)}</span>
              <div className="products-source-cell">
                {order.itemBuyUrl || (order.itemBuy && order.itemBuy !== "—") ? (
                  <ProductItemIdCell itemId={order.itemBuy} url={order.itemBuyUrl} />
                ) : (
                  <span className="products-source-btn__placeholder">Add source</span>
                )}
                <button
                  type="button"
                  className="products-source-cell__edit"
                  onClick={() => startEditBuySource(order)}
                  title="Edit source link"
                  aria-label="Edit source link"
                >
                  <LuPencil />
                </button>
              </div>
              {order.sourceVariationText ? (
                <span className="orders-source-cell__variation">{order.sourceVariationText}</span>
              ) : null}
            </div>
            <div>
              <span className="orders-paired-values__type orders-paired-values__type--sell">SELL</span>
              <span className="orders-paired-values__platform">ebay</span>
              {order.itemSellUrl ? (
                <a href={order.itemSellUrl} target="_blank" rel="noopener noreferrer" className="products-item-id-link">
                  <strong>{order.itemSell}</strong>
                </a>
              ) : (
                <strong>{order.itemSell}</strong>
              )}
            </div>
          </div>
        );
      case "orderId":
        if (order.orderDetailUrl) {
          return (
            <a
              href={order.orderDetailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="orders-order-id-link"
            >
              <strong>{order.orderId}</strong>
            </a>
          );
        }

        return <strong>{order.orderId}</strong>;
      case "profit":
        return <span className="orders-table__profit">{order.profit}</span>;
      case "trackingNumber":
        return renderTrackingEditor(order);
      case "aliexpressOrderId":
      case "aliexpressStatus":
      case "prepCost":
      case "shippingCost":
        return renderFulfillmentCell(order, columnId);
      case "invoice":
      case "packingSlip":
        return (
          <button
            type="button"
            className="orders-details__link"
            onClick={() => openPrintableDocument(PRINT_COLUMN_DOC_TYPES[columnId], order)}
          >
            Print
          </button>
        );
      case "shippingLabel": {
        const generated = isShippingLabelGenerated(order);
        return generated ? (
          <div className="orders-shipping-label-cell">
            <button
              type="button"
              className="orders-details__link"
              title="Print generated shipping label"
              onClick={() => handlePrintShippingLabel(order)}
            >
              Print
            </button>
            <button
              type="button"
              className="orders-shipping-label-ebay-link"
              title="View / reprint label on eBay"
              onClick={() => {
                const url = getEbayShippingLabelUrl(order.orderId, order.siteId, true);
                if (url) window.open(url, "_blank", "noopener,noreferrer");
              }}
            >
              eBay
            </button>
          </div>
        ) : (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <button
              type="button"
              className="orders-details__link orders-details__link--action"
              title="Print standard 4x6 shipping label"
              onClick={() => handlePrintShippingLabel(order)}
            >
              <span>Print Label</span>
            </button>
            <button
              type="button"
              className="orders-shipping-label-ebay-link"
              title="View / buy label on eBay official portal"
              onClick={() => {
                const url = getEbayShippingLabelUrl(order.orderId, order.siteId, true);
                if (url) window.open(url, "_blank", "noopener,noreferrer");
              }}
            >
              eBay
            </button>
          </div>
        );
      }
      default:
        return order[columnId] ?? "—";
    }
  };

  const hasSelection = selectedIds.length > 0;
  const selectedOrders = orders.filter((order) => selectedIds.includes(order.id));

  const handleBulkMarkShipped = async () => {
    if (!selectedOrders.length) return;

    setOpenBulkMenu(false);
    let succeeded = 0;
    let failed = 0;

    for (const order of selectedOrders) {
      try {
        await updateOrderStatusApi(order.id, "Shipped");
        succeeded += 1;
      } catch {
        failed += 1;
      }
    }

    if (succeeded) toast.success(`${succeeded} order${succeeded === 1 ? "" : "s"} marked as shipped.`);
    if (failed) toast.error(`${failed} order${failed === 1 ? "" : "s"} could not be updated.`);
    loadOrders();
  };

  const handleBulkPrint = (docType) => {
    if (!selectedOrders.length) return;
    if (docType === "shipping-label") {
      const generatedList = selectedOrders.filter(isShippingLabelGenerated);
      const ungeneratedList = selectedOrders.filter((o) => !isShippingLabelGenerated(o));
      if (!generatedList.length) {
        toast.info("Selected orders do not have generated shipping labels yet. Redirecting to eBay…");
        ungeneratedList.forEach((order) => {
          const url = getEbayShippingLabelUrl(order.orderId, order.siteId, false);
          if (url) window.open(url, "_blank", "noopener,noreferrer");
        });
        setOpenPrintMenu(false);
        return;
      }
      if (ungeneratedList.length > 0) {
        toast.info(`Printing ${generatedList.length} generated label(s). ${ungeneratedList.length} order(s) not yet generated on eBay.`);
      }
      openPrintableDocument(docType, generatedList);
      setOpenPrintMenu(false);
      return;
    }
    openPrintableDocument(docType, selectedOrders);
    setOpenPrintMenu(false);
  };

  const handleDownloadCsv = () => {
    if (!filteredOrders.length) {
      toast.warn("No orders to export.");
      return;
    }

    const csv = buildOrdersCsv(filteredOrders);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadTextFile(`orders-${stamp}.csv`, csv);
    toast.success(`Exported ${filteredOrders.length} order${filteredOrders.length === 1 ? "" : "s"}.`);
  };

  return (
    <section className="orders-page-content">
      <div className="orders-toolbar orders-toolbar--primary">
        <div className="orders-toolbar__left">
          <button
            type="button"
            className="dashboard-secondary-btn dashboard-secondary-btn--orders"
            onClick={handleSyncOrders}
            disabled={syncing}
          >
            <LuRefreshCcw className={syncing ? "spin-icon" : ""} />
            <span>{syncing ? "Syncing…" : "Sync Orders"}</span>
          </button>

          <button
            type="button"
            className={`orders-filter-toggle ${showFilters ? "orders-filter-toggle--active" : ""}`}
            onClick={() => setShowFilters((current) => !current)}
          >
            <LuSlidersHorizontal />
            <span>Filters</span>
            {activeFilterCount > 0 ? (
              <span className="orders-filter-badge">{activeFilterCount}</span>
            ) : null}
          </button>

          <div className="orders-toolbar-dropdown" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="orders-toolbar-action"
              disabled={!hasSelection}
              onClick={() => {
                setOpenPrintMenu(false);
                setOpenBulkMenu((current) => !current);
              }}
            >
              <LuBolt />
              <span>Bulk Actions</span>
              <LuChevronDown />
            </button>
            {openBulkMenu && hasSelection ? (
              <div className="orders-toolbar-dropdown__menu">
                <button type="button" onClick={handleBulkMarkShipped}>Mark as shipped</button>
                <button
                  type="button"
                  onClick={() => {
                    setBulkTrackingOrders(selectedOrders);
                    setOpenBulkMenu(false);
                  }}
                >
                  Add tracking
                </button>
              </div>
            ) : null}
          </div>

          <div className="orders-toolbar-dropdown" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="orders-toolbar-action"
              disabled={!hasSelection}
              onClick={() => {
                setOpenBulkMenu(false);
                setOpenPrintMenu((current) => !current);
              }}
            >
              <LuPrinter />
              <span>Print</span>
              <LuChevronDown />
            </button>
            {openPrintMenu && hasSelection ? (
              <div className="orders-toolbar-dropdown__menu">
                <button type="button" onClick={() => handleBulkPrint("invoice")}>Invoice</button>
                <button type="button" onClick={() => handleBulkPrint("packing-slip")}>Packing Slip</button>
                <button type="button" onClick={() => handleBulkPrint("pick-list")}>Pick List</button>
                <button type="button" onClick={() => handleBulkPrint("barcode")}>Barcode</button>
                <button type="button" onClick={() => handleBulkPrint("shipping-label")}>Shipping Label</button>
              </div>
            ) : null}
          </div>

          <button type="button" className="orders-toolbar-action" onClick={handleDownloadCsv}>
            <LuDownload />
            <span>Download</span>
          </button>

          <button
            type="button"
            className={`orders-toolbar-action ${showArchived ? "orders-toolbar-action--active" : ""}`}
            onClick={() => {
              setShowArchived((current) => !current);
              setSelectedIds([]);
            }}
          >
            {showArchived ? <LuArchiveRestore /> : <LuArchive />}
            <span>{showArchived ? "Viewing Archived" : "Archived"}</span>
          </button>
        </div>

        <div className="orders-toolbar__actions orders-toolbar__actions--search">
          <div className="orders-search-bar">
            <LuSearch className="orders-search-bar__icon" />
            <input
              type="text"
              className="orders-search-bar__input"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search order ID, buyer, product, SKU, tracking…"
              aria-label="Search orders"
            />
            {searchInput ? (
              <button
                type="button"
                className="orders-search-bar__clear"
                onClick={() => {
                  setSearchInput("");
                  setDebouncedSearch("");
                }}
                aria-label="Clear search"
                title="Clear search"
              >
                <LuX />
              </button>
            ) : null}
          </div>

          <button type="button" className="orders-icon-btn" onClick={loadOrders} aria-label="Refresh orders grid" title="Refresh">
            <LuRefreshCcw className={ordersLoading ? "spin-icon" : ""} />
          </button>
          <OrderColumnManager visibleColumnIds={visibleColumnIds} onChange={handleVisibleColumnsChange} />
        </div>
      </div>

      {ordersNotice ? (
        <div className="orders-inline-note orders-inline-note--success">
          <LuBadgeCheck />
          <span>{ordersNotice}</span>
          <button type="button" onClick={() => setOrdersNotice("")} aria-label="Dismiss orders note">
            <LuX />
          </button>
        </div>
      ) : null}

      <div className="orders-quick-filters">
        <div className="orders-quick-filters__group orders-quick-filters__group--status">
          <span className="orders-quick-filters__label">Status</span>
          <div className="orders-quick-filters__pills">
            {["All Statuses", ...orderStatusOptions].map((opt) => {
              const count = opt === "All Statuses" ? statusCounts.all : (statusCounts[opt] ?? 0);
              const isActive = statusFilter === opt;
              const label = opt === "All Statuses" ? "All" : opt;
              return (
                <button
                  key={opt}
                  type="button"
                  className={`orders-quick-filters__pill ${isActive ? "orders-quick-filters__pill--active" : ""}`}
                  onClick={() => setStatusFilter(opt)}
                >
                  <span>{label}</span>
                  {count > 0 ? <span className="orders-quick-filters__count">({count})</span> : null}
                </button>
              );
            })}
          </div>
        </div>

        {storeOptions.length > 2 ? (
          <div className="orders-quick-filters__group">
            <span className="orders-quick-filters__label">Store</span>
            <select
              className="orders-quick-filters__select"
              value={storeFilter}
              onChange={(event) => setStoreFilter(event.target.value)}
              aria-label="Filter by store"
            >
              {storeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {carrierOptions.length > 1 ? (
          <div className="orders-quick-filters__group">
            <span className="orders-quick-filters__label">Carrier</span>
            <select
              className="orders-quick-filters__select"
              value={carrierFilter}
              onChange={(event) => setCarrierFilter(event.target.value)}
              aria-label="Filter by carrier"
            >
              {carrierOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {sourceOptions.length > 2 ? (
          <div className="orders-quick-filters__group">
            <span className="orders-quick-filters__label">Source</span>
            <select
              className="orders-quick-filters__select"
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value)}
              aria-label="Filter by source platform"
            >
              {sourceOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "All Sources" ? "All Sources" : platformLabel(option)}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="orders-quick-filters__group">
          <span className="orders-quick-filters__label">Date</span>
          <div className="orders-quick-filters__pills">
            {ORDER_DATE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`orders-quick-filters__pill ${dateRangePreset === preset.id ? "orders-quick-filters__pill--active" : ""}`}
                onClick={() => applyDatePreset(preset.id)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="orders-quick-filters__group">
          <span className="orders-quick-filters__label">Sort</span>
          <div className="orders-quick-filters__controls">
            <select
              className="orders-quick-filters__select"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              aria-label="Sort orders by"
            >
              {ORDER_SORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={`orders-quick-filters__pill ${sortDirection === "desc" ? "orders-quick-filters__pill--active" : ""}`}
              onClick={() => setSortDirection("desc")}
            >
              Desc
            </button>
            <button
              type="button"
              className={`orders-quick-filters__pill ${sortDirection === "asc" ? "orders-quick-filters__pill--active" : ""}`}
              onClick={() => setSortDirection("asc")}
            >
              Asc
            </button>
          </div>
        </div>

        <div className="orders-quick-filters__group">
          <button
            type="button"
            className={`orders-quick-filters__pill ${showOnlyActive ? "orders-quick-filters__pill--active" : ""}`}
            onClick={() => setShowOnlyActive((c) => !c)}
            title={showOnlyActive ? "Canceled orders are hidden" : "Canceled orders are included"}
          >
            <span>{showOnlyActive ? "Hide Canceled" : "Show Canceled"}</span>
          </button>
        </div>
      </div>

      {activeFilterChips.length ? (
        <div className="orders-filter-chips" style={{ margin: "0 0 14px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#8b7f97", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Active filters:
          </span>
          {activeFilterChips.map((chip) => (
            <button type="button" className="orders-filter-chip" key={chip.key} onClick={chip.onRemove}>
              <span>×</span>
              <span>{chip.label}</span>
            </button>
          ))}
          <button type="button" className="orders-filter-chips__clear-all" onClick={clearOrderFilters}>
            Clear all
          </button>
        </div>
      ) : null}

      {showFilters ? (
        <PageFilterPanel layout="orders" onClear={hasOrderFilters ? clearOrderFilters : undefined}>
          <FilterSelect label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="All Statuses">All Statuses</option>
            {orderStatusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect label="Store" value={storeFilter} onChange={(event) => setStoreFilter(event.target.value)}>
            {storeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect label="Carrier" value={carrierFilter} onChange={(event) => setCarrierFilter(event.target.value)}>
            {carrierOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect label="Source" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
            {sourceOptions.map((option) => (
              <option key={option} value={option}>
                {option === "All Sources" ? "All Sources" : platformLabel(option)}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect label="Sort by" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            {ORDER_SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Sort direction"
            value={sortDirection}
            onChange={(event) => setSortDirection(event.target.value)}
          >
            <option value="desc">Descending (newest / highest first)</option>
            <option value="asc">Ascending (oldest / lowest first)</option>
          </FilterSelect>

          <FilterInput
            label="Buyer username"
            value={buyerFilter}
            onChange={(event) => setBuyerFilter(event.target.value)}
            placeholder="Search buyer"
          />

          <FilterInput
            label="Order ID"
            value={orderIdFilter}
            onChange={(event) => setOrderIdFilter(event.target.value)}
            placeholder="eBay order ID"
          />

          <FilterInput
            label="From date"
            type="date"
            value={fromDate}
            onChange={(event) => handleFromDateChange(event.target.value)}
          />

          <FilterInput
            label="To date"
            type="date"
            value={toDate}
            onChange={(event) => handleToDateChange(event.target.value)}
          />

          <FilterCheckbox
            label="Hide canceled orders"
            checked={showOnlyActive}
            onChange={(event) => setShowOnlyActive(event.target.checked)}
          />
        </PageFilterPanel>
      ) : null}

      <div className="orders-summary-row">
        <label className="orders-select-all">
          <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} />
          <span>{selectedIds.length} Results Selected</span>
        </label>

        <div className="orders-summary-row__actions">
          <button type="button" className="orders-icon-btn" onClick={() => scrollTable("left")} aria-label="Scroll grid left" title="Scroll left">
            <LuChevronLeft />
          </button>
          <button type="button" className="orders-icon-btn" onClick={() => scrollTable("right")} aria-label="Scroll grid right" title="Scroll right">
            <LuChevronRight />
          </button>
        </div>
      </div>

      <div className="orders-table-shell">
        <div className="orders-table-scroll" ref={tableScrollRef}>
          <table className="orders-table" style={{ minWidth: tableMinWidth }}>
            <thead>
              <tr>
                <th className="orders-table__checkbox-col" />
                {visibleColumns.map((column) => (
                  <th
                    key={column.id}
                    className="orders-table__col"
                    data-column={column.id}
                    style={{ minWidth: column.minWidth, width: column.minWidth, cursor: "pointer" }}
                    onClick={() => handleSort(column.id)}
                  >
                    {renderColumnHeader(column)}
                  </th>
                ))}
                <th className="orders-table__actions-col">Actions</th>
              </tr>
            </thead>

            <tbody>
              {ordersLoading ? (
                <tr>
                  <td className="orders-table__empty" colSpan={tableColumnCount}>
                    <LuRefreshCcw className="spin-icon" />
                    <span>Loading orders…</span>
                  </td>
                </tr>
              ) : visibleOrders.length ? (
                visibleOrders.map((order) => {
                  const meta = statusMeta[order.status];
                  const StatusIcon = meta.icon;

                  return (
                    <tr
                      id={`orders-row-${order.id}`}
                      className={openDetailsId === order.id ? "orders-table__row orders-table__row--active" : "orders-table__row"}
                      key={order.id}
                    >
                      <td className="orders-table__checkbox-col">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(order.id)}
                          onChange={() => toggleSelection(order.id)}
                        />
                      </td>

                      {visibleColumns.map((column) => (
                        <td
                          key={column.id}
                          className={[
                            "orders-table__col",
                            column.id === "status" ? "orders-table__status-cell" : "",
                            column.id === "detailsExtended" ? "orders-table__details-cell" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          data-column={column.id}
                          style={{ minWidth: column.minWidth, width: column.minWidth }}
                        >
                          {renderOrderCell(order, column.id, meta, StatusIcon)}
                        </td>
                      ))}

                      <td className="orders-table__actions-col">
                        <div className="orders-row-actions" onClick={(event) => event.stopPropagation()}>
                          <div className="orders-row-actions__item">
                            <button
                              type="button"
                              className="orders-row-actions__btn"
                              aria-label="Print"
                              aria-expanded={openRowPrintId === order.id}
                              onClick={() => toggleRowPrintMenu(order.id)}
                            >
                              <LuPrinter />
                            </button>
                            {openRowPrintId === order.id ? renderRowActionMenu(order.id, orderRowPrintActions) : null}
                          </div>

                          <div className="orders-row-actions__item">
                            <button
                              type="button"
                              className="orders-row-actions__btn"
                              aria-label="Order actions"
                              aria-expanded={openRowBoltId === order.id}
                              onClick={() => toggleRowBoltMenu(order.id)}
                              disabled={archivingId === order.id}
                            >
                              {archivingId === order.id ? <LuLoader className="spin-icon" /> : <LuBolt />}
                            </button>
                            {openRowBoltId === order.id
                              ? renderRowActionMenu(order.id, boltActions, "orders-actions-menu--wide")
                              : null}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="orders-table__empty" colSpan={tableColumnCount}>
                    <LuInbox />
                    <span>No orders match the current filters.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="orders-table-footer">
          <div className="orders-pagination">
            <button
              type="button"
              className="orders-pagination__arrow"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage <= 1}
              aria-label="Previous page"
              title="Previous page"
            >
              <LuChevronLeft />
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                type="button"
                className={page === currentPage ? "orders-pagination__page orders-pagination__page--active" : "orders-pagination__page"}
                key={page}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              className="orders-pagination__arrow"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage >= totalPages}
              aria-label="Next page"
              title="Next page"
            >
              <LuChevronRight />
            </button>
          </div>

          <div className="orders-table-footer__meta">
            <label>
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
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
            <span>Orders out of {orders.length}</span>
          </div>
        </div>
      </div>

      <OrderSourceModal
        open={Boolean(editingBuySourceOrder)}
        order={editingBuySourceOrder}
        saving={Boolean(editingBuySourceOrder) && savingBuySourceId === editingBuySourceOrder.id}
        onClose={cancelEditBuySource}
        onSave={saveBuySource}
      />

      <BulkTrackingModal
        open={Boolean(bulkTrackingOrders)}
        orders={bulkTrackingOrders ?? []}
        saving={bulkTrackingSaving}
        onClose={closeBulkTracking}
        onSaveOne={saveBulkTrackingOne}
        onSaveAll={saveBulkTrackingAll}
      />

      <QuickEditModal
        open={Boolean(editingFulfillment)}
        title={editingFulfillment ? `Edit ${FULFILLMENT_FIELDS[editingFulfillment.columnId].label}` : ""}
        label={editingFulfillment ? FULFILLMENT_FIELDS[editingFulfillment.columnId].label : ""}
        type={
          editingFulfillment?.columnId === "prepCost" || editingFulfillment?.columnId === "shippingCost"
            ? "number"
            : "text"
        }
        min={
          editingFulfillment?.columnId === "prepCost" || editingFulfillment?.columnId === "shippingCost"
            ? "0"
            : undefined
        }
        step={
          editingFulfillment?.columnId === "prepCost" || editingFulfillment?.columnId === "shippingCost"
            ? "0.01"
            : undefined
        }
        value={fulfillmentDraft}
        onChange={setFulfillmentDraft}
        onSave={() => saveFulfillment(orders.find((order) => order.id === editingFulfillment.orderId), editingFulfillment.columnId)}
        onClose={cancelEditFulfillment}
        saving={Boolean(savingFulfillmentKey)}
        placeholder={
          editingFulfillment?.columnId === "prepCost" || editingFulfillment?.columnId === "shippingCost" ? "0.00" : "—"
        }
      />

      <RefundOrderModal
        open={Boolean(refundTarget)}
        order={refundTarget}
        onConfirm={confirmRefund}
        onClose={() => setRefundTarget(null)}
        saving={refundSaving}
      />

      <ConfirmModal
        open={Boolean(cancelTarget)}
        title={`Cancel order ${cancelTarget?.orderId ?? ""}?`}
        description="This refunds the buyer in full via eBay's live order API and marks the order Canceled. This cannot be undone from here."
        confirmLabel="Cancel Order"
        danger
        saving={cancelSaving}
        onConfirm={confirmCancelOrder}
        onClose={() => setCancelTarget(null)}
      />

      <ConfirmModal
        open={invoiceInfoOpen}
        title="Send eBay Invoice"
        description="Orders synced here are already paid at eBay checkout, so there's no unpaid invoice to send. This action only applies to unpaid combined-invoice orders, which don't apply to synced Fulfillment orders."
        confirmLabel="Got it"
        danger={false}
        onConfirm={() => setInvoiceInfoOpen(false)}
        onClose={() => setInvoiceInfoOpen(false)}
      />
    </section>
  );
}

export default OrdersContent;
