import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "../../../utils/toast";
import { getOrders, pushOrderTracking, syncOrders, updateOrderFulfillment, updateOrderSource, updateOrderTracking, updateOrderStatus as updateOrderStatusApi } from "../../../services/OrderService";
import {
  LuBadgeCheck,
  LuBolt,
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuClipboardCheck,
  LuClipboardList,
  LuClock3,
  LuExternalLink,
  LuInbox,
  LuMenu,
  LuPencil,
  LuPlus,
  LuPrinter,
  LuRefreshCcw,
  LuSlidersHorizontal,
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
import { buildEbayListingProductUrl, buildSourceProductUrl, detectTrackingCarrier, formatDisplayDate, getEbayOrderDetailUrl, normalizeListingSourceInput, normalizeTrackingCarrier } from "../helpers";
import { getApiErrorMessage } from "../../../utils/apiErrors";
import { orderRowBoltActions, orderRowPrintActions, orderStatusOptions } from "../constants";
import ProductItemIdCell from "../ProductItemIdCell";
import OrdersTrackingEditor from "../OrdersTrackingEditor";
import QuickEditModal from "../QuickEditModal";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=120&q=80";

const ORDER_DATE_PRESETS = [
  { id: "today", label: "Today" },
  { id: "7days", label: "7 days" },
  { id: "15days", label: "15 days" },
  { id: "30days", label: "30 days" },
  { id: "month", label: "This month" },
  { id: "all", label: "All time" },
];

const ORDER_SORT_OPTIONS = [
  { id: "orderDate", label: "Order date" },
  { id: "total", label: "Total amount" },
  { id: "profit", label: "Profit" },
];

const DEFAULT_DATE_PRESET = "30days";

const ORDER_TOTAL_COLUMNS = {
  total: { accessor: (order) => order.totalValue, format: "money" },
  totalQuantity: { accessor: (order) => order.totalQuantity, format: "number" },
  profit: { accessor: (order) => order.profitValue, format: "money" },
  refundTotal: { accessor: (order) => order.refundTotalValue, format: "money" },
  shippingPrice: { accessor: (order) => order.shippingPriceValue, format: "money" },
  prepCost: { accessor: (order) => order.prepCost, format: "money" },
  shippingCost: { accessor: (order) => order.shippingCost, format: "money" },
};

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateRangeForPreset(preset) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const to = formatDateInput(today);

  switch (preset) {
    case "today":
      return { from: to, to };
    case "7days": {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      return { from: formatDateInput(from), to };
    }
    case "15days": {
      const from = new Date(today);
      from.setDate(from.getDate() - 14);
      return { from: formatDateInput(from), to };
    }
    case "30days": {
      const from = new Date(today);
      from.setDate(from.getDate() - 29);
      return { from: formatDateInput(from), to };
    }
    case "month": {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: formatDateInput(from), to };
    }
    case "all":
      return { from: "", to: "" };
    default:
      return null;
  }
}

function getDefaultOrderFilters() {
  const range = getDateRangeForPreset(DEFAULT_DATE_PRESET);

  return {
    dateRangePreset: DEFAULT_DATE_PRESET,
    fromDate: range?.from ?? "",
    toDate: range?.to ?? "",
    sortBy: "orderDate",
    sortDirection: "desc",
    statusFilter: "All Statuses",
    buyerFilter: "",
    orderIdFilter: "",
    storeFilter: "All Stores",
    showOnlyActive: true,
  };
}

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
  const trimmed = String(value ?? "").trim();
  if (!trimmed || /^https?:\/\//i.test(trimmed)) {
    return "";
  }

  return trimmed;
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
  const itemBuy = sourceProductId ?? "—";
  const itemBuyUrl = buildSourceProductUrl(sourcePlatform, sourceProductId, sourceUrl);
  const itemSellUrl = buildEbayListingProductUrl({ ebay_item_id: order.item_sell_id ?? firstItem.legacyItemId });
  const trackingValue =
    normalizeTrackingValue(order.tracking_number) || normalizeTrackingValue(shippingStep.shipmentTrackingNumber);
  const carrierRaw =
    normalizeTrackingCarrier(order.carrier) ||
    normalizeTrackingCarrier(shippingStep.shippingCarrierCode) ||
    detectTrackingCarrier(trackingValue) ||
    "";

  return {
    id: String(order.id),
    title: order.item_title ?? firstItem.title ?? "Order item",
    image: firstItem.image?.imageUrl ?? PLACEHOLDER_IMAGE,
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
    refundTotalValue: Number(refund.amount?.value ?? raw.refundAmount?.value ?? 0) || 0,
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
    shippingPriceValue: Number(delivery.shippingCost?.value ?? delivery.amount?.value ?? 0) || 0,
    trackingNumber: trackingValue || "—",
    trackingNumberRaw: trackingValue,
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
    shipBy: raw.lineItems?.[0]?.lineItemFulfillmentInstructions?.shipByDate?.slice(0, 10) ?? "—",
    shippingDate: raw.fulfillmentHrefs?.length ? String(raw.lastModifiedDate ?? "").slice(0, 10) || "Shipped" : "—",
    estDeliveryDate: order.estimated_arrival ?? raw.maxEstimatedDeliveryDate?.slice(0, 10) ?? "—",
    notes: order.internal_notes ?? "—",
    ebaySellerNotes: order.ebay_seller_notes ?? "—",
    invoice: "Print",
    packingSlip: "Print",
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
    listingSku: order.listing_sku ?? firstItem.sku ?? "—",
    buyer: buyer.username ?? order.buyer_name ?? "—",
    date: typeof order.order_date === "string" ? order.order_date.slice(0, 10) : order.order_date,
    totalValue: Number(sellPrice) || 0,
    profitValue: profit != null && !Number.isNaN(Number(profit)) ? Number(profit) : null,
    currency,
    aliexpressOrderId: order.aliexpress_order_id ?? "—",
    aliexpressOrderIdRaw: order.aliexpress_order_id ?? "",
    aliexpressStatus: order.aliexpress_order_status ?? "—",
    aliexpressStatusRaw: order.aliexpress_order_status ?? "",
    prepCost: order.prep_cost ?? 0,
    shippingCost: order.shipping_cost ?? 0,
  };
}

function OrdersContent({ searchQuery }) {
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
  const [dateRangePreset, setDateRangePreset] = useState(defaultFilters.dateRangePreset);
  const [fromDate, setFromDate] = useState(defaultFilters.fromDate);
  const [toDate, setToDate] = useState(defaultFilters.toDate);
  const [sortBy, setSortBy] = useState(defaultFilters.sortBy);
  const [sortDirection, setSortDirection] = useState(defaultFilters.sortDirection);
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
  const [editingBuySourceId, setEditingBuySourceId] = useState("");
  const [buySourceDraft, setBuySourceDraft] = useState("");
  const [savingBuySourceId, setSavingBuySourceId] = useState("");
  const [editingTrackingId, setEditingTrackingId] = useState("");
  const [trackingDraft, setTrackingDraft] = useState("");
  const [carrierDraft, setCarrierDraft] = useState("");
  const [savingTrackingId, setSavingTrackingId] = useState("");
  const [pushingTrackingId, setPushingTrackingId] = useState("");
  const [editingFulfillment, setEditingFulfillment] = useState(null);
  const [fulfillmentDraft, setFulfillmentDraft] = useState("");
  const [savingFulfillmentKey, setSavingFulfillmentKey] = useState("");
  const tableScrollRef = useRef(null);

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

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const params = {
        q: searchQuery,
        status: statusFilter,
        buyer: buyerFilter,
        hide_canceled: showOnlyActive ? 1 : 0,
        sort: sortDirection,
        limit: 500,
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
  }, [searchQuery, statusFilter, buyerFilter, fromDate, toDate, showOnlyActive, sortDirection]);

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
    setEditingBuySourceId(order.id);
    setBuySourceDraft(order.sourceUrl ?? (order.itemBuy !== "—" ? order.itemBuy : ""));
  };

  const cancelEditBuySource = () => {
    setEditingBuySourceId("");
    setBuySourceDraft("");
  };

  const saveBuySource = async (order) => {
    const trimmed = buySourceDraft.trim();
    if (!trimmed) {
      toast.error("Enter a source link or item ID.");
      return;
    }

    setSavingBuySourceId(order.id);
    try {
      const source = normalizeListingSourceInput(trimmed, order.sourcePlatform);
      const res = await updateOrderSource(order.id, {
        source_input: source.source_input,
        source_platform: source.source_platform,
      });
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
    setCarrierDraft(order.carrierRaw || detectTrackingCarrier(order.trackingNumberRaw) || "");
  };

  const cancelEditTracking = () => {
    setEditingTrackingId("");
    setTrackingDraft("");
    setCarrierDraft("");
  };

  const handleTrackingDraftChange = (value) => {
    setTrackingDraft(value);
    const detected = detectTrackingCarrier(value);
    if (detected) {
      setCarrierDraft(detected);
    }
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

  const pushTrackingToEbay = async (order) => {
    const isEditing = editingTrackingId === order.id;
    const tracking = (isEditing ? trackingDraft : order.trackingNumberRaw).trim();
    const carrier =
      normalizeTrackingCarrier(isEditing ? carrierDraft : order.carrierRaw) || detectTrackingCarrier(tracking);

    if (!tracking) {
      toast.error("Enter a tracking number first.");
      return;
    }

    if (!carrier) {
      toast.error("Select or detect a carrier first.");
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
    const query = searchQuery.trim().toLowerCase();

    const nextOrders = orders.filter((order) => {
      if (showOnlyActive && order.status === "Canceled") {
        return false;
      }

      if (statusFilter !== "All Statuses" && order.status !== statusFilter) {
        return false;
      }

      if (buyerFilter.trim()) {
        if (!order.buyer.toLowerCase().includes(buyerFilter.trim().toLowerCase())) {
          return false;
        }
      }

      if (orderIdFilter.trim()) {
        const orderIdQuery = orderIdFilter.trim().toLowerCase();
        if (
          !order.orderId.toLowerCase().includes(orderIdQuery) &&
          !order.id.toLowerCase().includes(orderIdQuery)
        ) {
          return false;
        }
      }

      if (storeFilter !== "All Stores" && order.storeName !== storeFilter) {
        return false;
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
        order.itemBuy,
        order.itemSell,
        order.orderSellId,
        order.orderId,
        order.sku,
        order.transactionId,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });

    return nextOrders.sort((left, right) => {
      let comparison = 0;

      if (sortBy === "total") {
        comparison = left.totalValue - right.totalValue;
      } else if (sortBy === "profit") {
        comparison = (left.profitValue ?? Number.NEGATIVE_INFINITY) - (right.profitValue ?? Number.NEGATIVE_INFINITY);
      } else {
        comparison = left.date.localeCompare(right.date);
      }

      return sortDirection === "desc" ? -comparison : comparison;
    });
  }, [
    buyerFilter,
    fromDate,
    orderIdFilter,
    orders,
    searchQuery,
    showOnlyActive,
    sortBy,
    sortDirection,
    statusFilter,
    storeFilter,
    toDate,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredOrders.length, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const visibleOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columnTotals = useMemo(() => {
    const sums = {};

    Object.entries(ORDER_TOTAL_COLUMNS).forEach(([columnId, { accessor }]) => {
      sums[columnId] = filteredOrders.reduce((sum, order) => {
        const value = accessor(order);
        return sum + (Number.isFinite(value) ? value : 0);
      }, 0);
    });

    return sums;
  }, [filteredOrders]);
  const allVisibleSelected =
    visibleOrders.length > 0 && visibleOrders.every((order) => selectedIds.includes(order.id));
  const tableColumnCount = visibleColumns.length + 2;

  const activeFilterChips = [
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
    statusFilter !== "All Statuses"
      ? {
          key: "status",
          label: statusFilter,
          onRemove: () => setStatusFilter("All Statuses"),
        }
      : null,
    buyerFilter.trim()
      ? {
          key: "buyer",
          label: buyerFilter.trim(),
          onRemove: () => setBuyerFilter(""),
        }
      : null,
    orderIdFilter.trim()
      ? {
          key: "order-id",
          label: `Order ${orderIdFilter.trim()}`,
          onRemove: () => setOrderIdFilter(""),
        }
      : null,
    storeFilter !== "All Stores"
      ? {
          key: "store",
          label: storeFilter,
          onRemove: () => setStoreFilter("All Stores"),
        }
      : null,
  ].filter(Boolean);

  const clearOrderFilters = () => {
    setShowOnlyActive(defaultFilters.showOnlyActive);
    setStatusFilter(defaultFilters.statusFilter);
    setBuyerFilter(defaultFilters.buyerFilter);
    setOrderIdFilter(defaultFilters.orderIdFilter);
    setStoreFilter(defaultFilters.storeFilter);
    setSortBy(defaultFilters.sortBy);
    setSortDirection(defaultFilters.sortDirection);
    applyDatePreset(defaultFilters.dateRangePreset);
  };

  const hasOrderFilters =
    dateRangePreset !== DEFAULT_DATE_PRESET ||
    sortBy !== defaultFilters.sortBy ||
    sortDirection !== defaultFilters.sortDirection ||
    !showOnlyActive ||
    statusFilter !== "All Statuses" ||
    buyerFilter.trim() ||
    orderIdFilter.trim() ||
    storeFilter !== "All Stores";

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

  const scrollTable = (position) => {
    const element = tableScrollRef.current;

    if (!element) {
      return;
    }

    element.scrollTo({
      left: position === "end" ? element.scrollWidth : 0,
      behavior: "smooth",
    });
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

  const handleOrderAction = (orderId, action, label) => {
    const order = orders.find((row) => String(row.id) === String(orderId));
    const orderLabel = order?.orderId ?? orderId;

    if (action === "add-tracking") {
      if (order) {
        startEditTracking(order);
      } else {
        toast.error("Order not found.");
      }
      closeRowActionMenus();
      return;
    }

    if (action === "update-pick-status") {
      toast.info("Update Pick Status — coming soon.");
    } else {
      toast.info(`${label} for order ${orderLabel} — coming soon.`);
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

  const renderColumnHeader = (column) => {
    if (column.sortable) {
      const isActive = sortBy === "orderDate";

      return (
        <button
          type="button"
          className="orders-sort-btn"
          onClick={() => {
            setSortBy("orderDate");
            setSortDirection((current) => (current === "desc" ? "asc" : "desc"));
          }}
        >
          <span>{column.label}</span>
          <LuChevronDown
            className={
              isActive && sortDirection === "asc"
                ? "orders-sort-btn__icon orders-sort-btn__icon--asc"
                : "orders-sort-btn__icon"
            }
          />
        </button>
      );
    }

    return column.label;
  };

  const renderOrderCell = (order, columnId, meta, StatusIcon) => {
    switch (columnId) {
      case "name":
        return (
          <div className="orders-product">
            <div className="orders-product__thumb">
              <img src={order.image} alt={order.title} />
            </div>
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
      case "orderDate":
      case "paidDate":
      case "refundDate":
      case "shipBy":
      case "shippingDate":
      case "estDeliveryDate":
        return order[columnId] && order[columnId] !== "—" ? formatDisplayDate(order[columnId]) : "—";
      case "username":
        return <span className="orders-table__buyer">{order.username}</span>;
      case "itemId":
        return (
          <div className="orders-paired-values">
            <div>
              <span className="orders-paired-values__type">BUY</span>
              <span className="orders-paired-values__platform">{platformLabel(order.sourcePlatform)}</span>
              <div className="products-source-cell">
                {order.itemBuyUrl || (order.itemBuy && order.itemBuy !== "—") ? (
                  <ProductItemIdCell itemId={order.itemBuy} sku={order.listingSku} url={order.itemBuyUrl} />
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
            </div>
            <div>
              <span className="orders-paired-values__type">SELL</span>
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
      case "carrier":
        return editingTrackingId === order.id ? renderTrackingEditor(order, true) : renderTrackingEditor(order, true);
      case "aliexpressOrderId":
      case "aliexpressStatus":
      case "prepCost":
      case "shippingCost":
        return renderFulfillmentCell(order, columnId);
      case "invoice":
      case "packingSlip":
        return (
          <button type="button" className="orders-details__link" onClick={() => toast.info(`${columnId} printing is coming soon.`)}>
            Print
          </button>
        );
      default:
        return order[columnId] ?? "—";
    }
  };

  const hasSelection = selectedIds.length > 0;

  return (
    <section className="orders-page-content">
      <div className="orders-page-header">
        <h2 className="orders-page-header__title">All Orders</h2>
      </div>

      <div className="orders-toolbar orders-toolbar--primary">
        <div className="orders-toolbar__left">
          <button
            type="button"
            className={`orders-filter-toggle ${showFilters ? "orders-filter-toggle--active" : ""}`}
            onClick={() => setShowFilters((current) => !current)}
          >
            <LuSlidersHorizontal />
            <span>Add Filter</span>
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
                <button type="button" onClick={() => toast.info("Mark as shipped — coming soon.")}>Mark as shipped</button>
                <button
                  type="button"
                  onClick={() => {
                    const order = orders.find((row) => selectedIds.includes(row.id));
                    if (order) {
                      startEditTracking(order);
                      setOpenBulkMenu(false);
                    }
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
                <button type="button" onClick={() => toast.info("Invoice print — coming soon.")}>Invoice</button>
                <button type="button" onClick={() => toast.info("Packing slip print — coming soon.")}>Packing Slip</button>
                <button type="button" onClick={() => toast.info("Pick list print — coming soon.")}>Pick List</button>
              </div>
            ) : null}
          </div>

          <button type="button" className="orders-toolbar-action orders-toolbar-action--primary" disabled>
            <LuPlus />
            <span>Create Manual Order</span>
          </button>

          {activeFilterChips.length ? (
            <div className="orders-filter-chips">
              {activeFilterChips.map((chip) => (
                <button type="button" className="orders-filter-chip" key={chip.key} onClick={chip.onRemove}>
                  <span>x</span>
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="orders-toolbar__actions orders-toolbar__actions--search">
          <button type="button" className="orders-icon-btn" onClick={loadOrders} aria-label="Refresh orders grid">
            <LuRefreshCcw className={ordersLoading ? "spin-icon" : ""} />
          </button>
          <OrderColumnManager visibleColumnIds={visibleColumnIds} onChange={handleVisibleColumnsChange} />
        </div>
      </div>

      <div className="orders-toolbar orders-toolbar--secondary">
        <div className="orders-toolbar__actions">
          <button type="button" className="dashboard-secondary-btn dashboard-secondary-btn--orders" onClick={handleSyncOrders} disabled={syncing}>
            <LuRefreshCcw />
            <span>{syncing ? "Syncing…" : "Sync from eBay"}</span>
          </button>
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
      </div>

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
          <button type="button" className="orders-icon-btn" onClick={() => scrollTable("end")} aria-label="Show more columns">
            <LuMenu />
          </button>
          <button type="button" className="orders-icon-btn" onClick={() => scrollTable("start")} aria-label="Return to start">
            <LuExternalLink />
          </button>
        </div>
      </div>

      <div className="orders-table-shell">
        <div className="orders-table-scroll" ref={tableScrollRef}>
          <table className="orders-table" style={{ minWidth: tableMinWidth }}>
            <thead>
              <tr className="orders-table__totals-row">
                <td className="orders-table__checkbox-col">Totals</td>
                {visibleColumns.map((column) => {
                  const totalColumn = ORDER_TOTAL_COLUMNS[column.id];

                  return (
                    <td
                      key={column.id}
                      className="orders-table__col"
                      data-column={column.id}
                      style={{ minWidth: column.minWidth, width: column.minWidth }}
                    >
                      {totalColumn
                        ? totalColumn.format === "money"
                          ? formatMoney(columnTotals[column.id], filteredOrders[0]?.currency)
                          : columnTotals[column.id]
                        : ""}
                    </td>
                  );
                })}
                <td className="orders-table__actions-col" />
              </tr>
              <tr>
                <th className="orders-table__checkbox-col" />
                {visibleColumns.map((column) => (
                  <th
                    key={column.id}
                    className="orders-table__col"
                    data-column={column.id}
                    style={{ minWidth: column.minWidth, width: column.minWidth }}
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

                          <button
                            type="button"
                            className="orders-row-actions__btn"
                            aria-label="Update Pick Status"
                            onClick={() => handleOrderAction(order.id, "update-pick-status", "Update Pick Status")}
                          >
                            <LuClipboardCheck />
                          </button>

                          <div className="orders-row-actions__item">
                            <button
                              type="button"
                              className="orders-row-actions__btn"
                              aria-label="Order actions"
                              aria-expanded={openRowBoltId === order.id}
                              onClick={() => toggleRowBoltMenu(order.id)}
                            >
                              <LuBolt />
                            </button>
                            {openRowBoltId === order.id
                              ? renderRowActionMenu(order.id, orderRowBoltActions, "orders-actions-menu--wide")
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
            <button type="button" className="orders-pagination__arrow" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>
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
            >
              <LuChevronRight />
            </button>
          </div>

          <div className="orders-table-footer__meta">
            <label>
              <span>Show</span>
              <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
              </select>
            </label>
            <span>Orders out of {orders.length}</span>
          </div>
        </div>
      </div>

      <QuickEditModal
        open={Boolean(editingBuySourceId)}
        title="Edit Source Link"
        description="Paste the AliExpress (or other supplier) URL or item ID this order was sourced from."
        label="Source link or item ID"
        value={buySourceDraft}
        onChange={setBuySourceDraft}
        onSave={() => saveBuySource(orders.find((order) => order.id === editingBuySourceId))}
        onClose={cancelEditBuySource}
        saving={savingBuySourceId === editingBuySourceId}
        placeholder="https://www.aliexpress.com/item/... or item ID"
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
    </section>
  );
}

export default OrdersContent;
