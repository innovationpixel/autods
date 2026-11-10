import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LuArrowRightLeft,
  LuCheck,
  LuChevronLeft,
  LuChevronRight,
  LuClipboardList,
  LuCopy,
  LuExternalLink,
  LuLayers,
  LuLoader,
  LuMapPin,
  LuPackageCheck,
  LuPencil,
  LuPlus,
  LuRefreshCcw,
  LuStore,
  LuTriangleAlert,
  LuTruck,
  LuUserRound,
  LuX,
  LuZap,
} from "react-icons/lu";
import { toast } from "../../../utils/toast";
import { getApiErrorMessage } from "../../../utils/apiErrors";
import {
  acceptRecommendedAddress,
  getOrders,
  getOrderCheckoutQuote,
  placeAliExpressOrder,
  pushOrderTracking,
  syncAliExpressOrders,
  syncOrders,
  syncSingleAliExpressOrder,
  updateOrderCost,
  updateOrderFulfillment,
  updateOrderProcessingStatus,
  updateOrderShippingAddress,
  updateOrderSource,
  updateOrderTracking,
} from "../../../services/OrderService";
import { getWalletSummary, transferToProcessingWallet } from "../../../services/WalletService";
import { getBuyerAccounts } from "../../../services/BuyerAccountService";
import {
  buildCarrierTrackingUrl,
  buildPaginationItems,
  buildSourceProductUrl,
  compareGridValues,
  detectTrackingCarrier,
  formatDisplayDate,
  formatTrackingDisplay,
  getEbayOrderDetailUrl,
  normalizeTrackingCarrier,
  PAGE_SIZE_OPTIONS,
} from "../helpers";
import GridSortHeader from "../GridSortHeader";
import ProductItemIdCell from "../ProductItemIdCell";
import QuickEditModal from "../QuickEditModal";
import OrderSourceModal from "../OrderSourceModal";
import OrderConfirmModal from "../OrderConfirmModal";
import ExternalOrderModal from "../ExternalOrderModal";
import OrdersTrackingEditor from "../OrdersTrackingEditor";
import OrderShippingAddressModal from "../OrderShippingAddressModal";
import AddressRecommendationModal from "../AddressRecommendationModal";
import BulkOrderFixationModal from "../BulkOrderFixationModal";
import { getAliExpressProduct } from "../../../services/AliExpressService";
import { resolveOrderVariant, formatVariantAspects, resolveBestSku } from "../../../utils/orderVariants";

const PROCESSING_TABS = [
  { key: "new", label: "New Orders" },
  { key: "pending", label: "Pending Payment" },
  { key: "processed", label: "Processed (Paid)" },
  { key: "shipped", label: "Shipped" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

function formatMoney(value, currency = "USD") {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return "—";
  }

  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "USD" }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

function joinAddress(parts) {
  return parts.filter(Boolean).join(", ") || "—";
}

function mapProcessingOrder(order) {
  const raw = order.raw_data ?? {};
  const lineItems = raw.lineItems ?? [];
  const firstItem = lineItems[0] ?? {};
  const buyer = raw.buyer ?? {};
  const pricing = raw.pricingSummary ?? {};
  const fulfillment = raw.fulfillmentStartInstructions?.[0] ?? {};
  const customAddr = raw.customShippingAddress ?? null;
  const shipTo = customAddr
    ? {
        fullName: customAddr.fullName,
        primaryPhone: { phoneNumber: customAddr.phone },
        contactAddress: {
          addressLine1: customAddr.addressLine1,
          addressLine2: customAddr.addressLine2,
          city: customAddr.city,
          stateOrProvince: customAddr.stateOrProvince,
          postalCode: customAddr.postalCode,
          countryCode: customAddr.countryCode,
        },
      }
    : fulfillment.shippingStep?.shipTo ?? buyer.buyerRegistrationAddress ?? {};
  const sellPrice = order.sell_price ?? pricing.total?.value ?? firstItem.lineItemCost?.value ?? 0;
  const currency = order.currency ?? pricing.total?.currency ?? "USD";
  const sourceProductId = order.source_product_id ?? order.item_buy_id ?? null;
  const sourcePlatform = order.source_platform ?? "aliexpress";
  const sourceUrl = order.source_url ?? null;
  const resolvedVariant = resolveOrderVariant(order);
  const sourceVariation = Array.isArray(order.source_variation) ? order.source_variation : null;
  const sourceVariationText = formatVariantAspects(order.source_variation ?? raw.source_variation);

  return {
    id: String(order.id),
    title: order.item_title ?? firstItem.title ?? "Order item",
    image: order.image_url ?? order.listing_image_url ?? firstItem.image?.imageUrl ?? null,
    variant: resolvedVariant,
    variantTitle: resolvedVariant,
    sourceVariation,
    sourceVariationText,
    ebayOrderId: order.ebay_order_id ?? raw.orderId ?? "—",
    orderDetailUrl: getEbayOrderDetailUrl(order.ebay_order_id ?? raw.orderId, order.connection?.site_id),
    siteId: order.connection?.site_id ?? null,
    orderDate: typeof order.order_date === "string" ? order.order_date.slice(0, 10) : order.order_date,
    buyerName: shipTo.fullName ?? buyer.buyerRegistrationAddress?.fullName ?? order.buyer_name ?? "—",
    shippingAddress: joinAddress([
      shipTo.contactAddress?.addressLine1 ?? shipTo.addressLine1,
      shipTo.contactAddress?.addressLine2 ?? shipTo.addressLine2,
      shipTo.contactAddress?.city ?? shipTo.city,
      shipTo.contactAddress?.stateOrProvince ?? shipTo.stateOrProvince,
      shipTo.contactAddress?.postalCode ?? shipTo.postalCode,
      shipTo.contactAddress?.countryCode ?? shipTo.countryCode,
    ]),
    rawAddress: {
      fullName: shipTo.fullName ?? buyer.buyerRegistrationAddress?.fullName ?? order.buyer_name ?? "",
      addressLine1: shipTo.contactAddress?.addressLine1 ?? shipTo.addressLine1 ?? "",
      addressLine2: shipTo.contactAddress?.addressLine2 ?? shipTo.addressLine2 ?? "",
      city: shipTo.contactAddress?.city ?? shipTo.city ?? "",
      stateOrProvince: shipTo.contactAddress?.stateOrProvince ?? shipTo.stateOrProvince ?? "",
      postalCode: shipTo.contactAddress?.postalCode ?? shipTo.postalCode ?? "",
      countryCode: shipTo.contactAddress?.countryCode ?? shipTo.countryCode ?? "US",
      phone: shipTo.primaryPhone?.phoneNumber ?? buyer.primaryPhone?.phoneNumber ?? "",
    },
    buyerPhone: shipTo.primaryPhone?.phoneNumber ?? buyer.primaryPhone?.phoneNumber ?? "—",
    sellPrice: Number(sellPrice) || 0,
    currency,
    itemBuy: sourceProductId ?? "—",
    itemBuyUrl: buildSourceProductUrl(sourcePlatform, sourceProductId, sourceUrl),
    sourceUrl,
    sourcePlatform,
    sourceSkuId: order.source_sku_id ?? null,
    hasSource: Boolean(sourceProductId || sourceUrl),
    buyPrice: order.buy_price != null ? Number(order.buy_price) : null,
    aliexpressOrderId: order.aliexpress_order_id ?? "",
    aliexpressOrderStatus: order.aliexpress_order_status ?? "",
    processingStatus: (() => {
      const explicit = order.processing_status ?? "new";
      const aeStatus = String(order.aliexpress_order_status ?? "").toUpperCase();

      // If backend explicitly marked it cancelled, keep it in cancelled tab
      if (explicit === "cancelled") {
        return "cancelled";
      }

      const isCancelled =
        aeStatus === "CANCELLED" ||
        aeStatus === "CANCELED" ||
        aeStatus === "IN_CANCEL" ||
        aeStatus === "CLOSE" ||
        aeStatus === "CLOSED" ||
        aeStatus === "TRADE_CLOSED" ||
        aeStatus === "ORDER_CANCELED" ||
        aeStatus === "ORDER_CANCELLED" ||
        aeStatus === "WAIT_SELLER_EXAMINE_CANCEL_ORDER" ||
        aeStatus === "WAIT_SELLER_CONFIRM_CANCEL" ||
        aeStatus.includes("CANCEL") ||
        aeStatus.includes("CLOSE");

      // Cancelled AliExpress orders return to new orders ready to process again
      if (isCancelled) {
        return "new";
      }

      const isPaid =
        aeStatus === "WAIT_SELLER_SEND_GOODS" ||
        aeStatus === "PAY_SUCCESS" ||
        aeStatus === "WAIT_SELLER_EXAMINE_MONEY" ||
        aeStatus === "FUND_PROCESSING" ||
        aeStatus === "SELLER_PART_SEND_GOODS" ||
        aeStatus === "WAIT_BUYER_ACCEPT_GOODS";

      // If AliExpress reports paid and status was new or pending, it moves to processed (Paid)
      if (order.aliexpress_order_id && isPaid && (explicit === "pending" || explicit === "new")) {
        return "processed";
      }

      // If order was placed on AliExpress and has not been confirmed paid or shipped, it is Pending Payment
      if (
        order.aliexpress_order_id &&
        !isPaid &&
        (explicit === "new" || explicit === "pending")
      ) {
        return "pending";
      }

      return explicit;
    })(),
    processingMethod: order.processing_method ?? "",
    ...(() => {
      const rawTracking =
        order.tracking_number ??
        fulfillment.shippingStep?.shipmentTrackingNumber ??
        order.buy_tracking_number ??
        order.raw_data?.buy_tracking_number ??
        "";
      const parsed = formatTrackingDisplay(rawTracking);
      const carrier =
        normalizeTrackingCarrier(order.carrier) ||
        normalizeTrackingCarrier(fulfillment.shippingStep?.shippingCarrierCode) ||
        normalizeTrackingCarrier(order.buy_carrier) ||
        detectTrackingCarrier(parsed.trackingNumber) ||
        "";
      const trackingUrl = parsed.url || (parsed.trackingNumber ? buildCarrierTrackingUrl(parsed.trackingNumber, carrier) : null);

      return {
        trackingNumber: parsed.trackingNumber,
        trackingNumberRaw: parsed.trackingNumber,
        trackingUrl,
        carrier,
        carrierRaw: carrier,
        trackingPushed: Boolean(order.tracking_pushed_at),
      };
    })(),
  };
}

function OrderProcessingContent() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingAliExpress, setSyncingAliExpress] = useState(false);
  const [syncingSingleId, setSyncingSingleId] = useState("");
  const [processingId, setProcessingId] = useState("");
  const [wallet, setWallet] = useState(null);

  const [activeTab, setActiveTab] = useState("new");
  const [processingMethod, setProcessingMethod] = useState("autods");
  const [buyerAccounts, setBuyerAccounts] = useState([]);
  const [buyerAccountsError, setBuyerAccountsError] = useState("");
  const [selectedBuyerAccountId, setSelectedBuyerAccountId] = useState("");

  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [bulkSyncingAliExpress, setBulkSyncingAliExpress] = useState(false);
  const [sortBy, setSortBy] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferAmountDraft, setTransferAmountDraft] = useState("");
  const [transferring, setTransferring] = useState(false);

  const [editingSourceOrder, setEditingSourceOrder] = useState(null);
  const [savingSourceId, setSavingSourceId] = useState("");

  const [editingCostId, setEditingCostId] = useState("");
  const [costDraft, setCostDraft] = useState("");
  const [savingCostId, setSavingCostId] = useState("");

  const [editingTrackingId, setEditingTrackingId] = useState("");
  const [trackingDraft, setTrackingDraft] = useState("");
  const [carrierDraft, setCarrierDraft] = useState("");
  const [savingTrackingId, setSavingTrackingId] = useState("");
  const [pushingTrackingId, setPushingTrackingId] = useState("");

  const [editingFulfillment, setEditingFulfillment] = useState(null);
  const [fulfillmentDraft, setFulfillmentDraft] = useState("");
  const [savingFulfillmentKey, setSavingFulfillmentKey] = useState("");

  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const [confirmOrder, setConfirmOrder] = useState(null);
  const [orderQuote, setOrderQuote] = useState(null);
  const [fetchingQuoteId, setFetchingQuoteId] = useState("");
  const [addressRecommendationModal, setAddressRecommendationModal] = useState({
    open: false,
    order: null,
    validation: null,
  });
  const [acceptingRecommended, setAcceptingRecommended] = useState(false);
  const [externalOrder, setExternalOrder] = useState(null);
  const [addressModalOrder, setAddressModalOrder] = useState(null);
  const [addressModalError, setAddressModalError] = useState("");
  const [addressErrorNotice, setAddressErrorNotice] = useState(null);
  const addressErrorTimerRef = useRef(null);

  const showAddressErrorNotice = (notice) => {
    setAddressErrorNotice(notice);
    if (addressErrorTimerRef.current) {
      clearTimeout(addressErrorTimerRef.current);
    }
    addressErrorTimerRef.current = setTimeout(() => {
      setAddressErrorNotice(null);
    }, 8000);
  };
  const [addressModalSaving, setAddressModalSaving] = useState(false);
  const [bulkAddressModalOpen, setBulkAddressModalOpen] = useState(false);
  const [bulkSourceModalOpen, setBulkSourceModalOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState("");
  const [fixationModalOpen, setFixationModalOpen] = useState(false);
  const [fixationOrders, setFixationOrders] = useState([]);
  const tableScrollRef = useRef(null);

  const selectedOrders = useMemo(() => {
    return orders.filter((order) => selectedIds.includes(order.id));
  }, [orders, selectedIds]);

  const addressIssueCount = useMemo(() => {
    return selectedOrders.filter(
      (o) => !o.shippingAddress || o.shippingAddress === "—" || !o.rawAddress?.postalCode || !o.rawAddress?.addressLine1
    ).length;
  }, [selectedOrders]);

  const scrollTable = (direction) => {
    if (!tableScrollRef.current) return;
    const offset = direction === "left" ? -400 : 400;
    tableScrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  const FULFILLMENT_FIELDS = {
    aliexpressOrderId: { key: "aliexpress_order_id", label: "AliExpress order ID" },
    aliexpressOrderStatus: { key: "aliexpress_order_status", label: "AliExpress order status" },
  };

  const loadOrders = async (preserveSelected = false) => {
    setLoading(true);
    try {
      const res = await getOrders({ processing_status: activeTab, sort: "desc", limit: 200 });
      const mapped = (res.data?.data ?? []).map(mapProcessingOrder);
      setOrders(mapped);
      if (!preserveSelected) {
        setSelectedIds([]);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to load orders."), { autoClose: 6000 });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadWallet = async () => {
    try {
      const res = await getWalletSummary();
      const nextWallet = res.data ?? null;
      setWallet(nextWallet);
      if (nextWallet?.balance !== undefined) {
        window.dispatchEvent(
          new CustomEvent("wallet_balance_updated", {
            detail: {
              wallet_balance: Number(nextWallet.balance),
              wallet_currency: nextWallet.currency || "USD",
            },
          }),
        );
      }
    } catch {
      setWallet(null);
    }
  };

  const loadBuyerAccounts = async () => {
    try {
      const res = await getBuyerAccounts();
      const accounts = (res.data?.accounts ?? []).filter((account) => account.is_active);
      setBuyerAccounts(accounts);
      setBuyerAccountsError("");
      setSelectedBuyerAccountId((current) =>
        current && accounts.some((account) => String(account.id) === current) ? current : "",
      );
    } catch (err) {
      setBuyerAccounts([]);
      setBuyerAccountsError(getApiErrorMessage(err, "Could not load buyer accounts."));
    }
  };

  useEffect(() => {
    loadWallet();
    loadBuyerAccounts();

    const handleFocus = () => {
      loadBuyerAccounts();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const totalValue = useMemo(
    () => orders.reduce((sum, order) => sum + (Number.isFinite(order.sellPrice) ? order.sellPrice : 0), 0),
    [orders],
  );

  // A buyer account tagged for the order's own eBay marketplace is preferred;
  // an untagged account (no marketplaces assigned) is used as a fallback for
  // any marketplace with no dedicated account — mirrors the backend's
  // BuyerAccount::resolveForMarketplace() resolution order. An explicit manual
  // selection always overrides this (the backend honors buyer_account_id when set).
  const hasBuyerAccountForSite = (siteId) => {
    if (selectedBuyerAccountId) {
      return true;
    }
    return buyerAccounts.some((account) => !account.site_ids?.length || account.site_ids.includes(siteId));
  };

  const handleSync = async () => {
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

  const handleSyncAliExpress = async () => {
    setSyncingAliExpress(true);
    try {
      const res = await syncAliExpressOrders();
      const updated = res.data?.updated ?? 0;
      const shipped = res.data?.shipped ?? 0;
      const total = res.data?.synced ?? 0;
      toast.success(
        res.data?.message ??
          `AliExpress sync complete. Checked ${total} orders (${updated} updated, ${shipped} shipped).`
      );
      await loadOrders();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "AliExpress sync failed."));
    } finally {
      setSyncingAliExpress(false);
    }
  };

  const handleBulkSyncAliExpress = async () => {
    const selected = orders.filter((o) => selectedIds.includes(o.id));
    const withAe = selected.filter((o) => o.aliexpressOrderId);
    if (!withAe.length) {
      toast.warn("None of the selected orders have an AliExpress order ID.");
      return;
    }
    setBulkSyncingAliExpress(true);
    let updatedCount = 0;
    let paidCount = 0;
    let shippedCount = 0;
    for (const order of withAe) {
      try {
        const res = await syncSingleAliExpressOrder(order.id);
        if (res.data?.updated) updatedCount++;
        if (res.data?.is_paid) paidCount++;
        if (res.data?.is_shipped) shippedCount++;
      } catch (err) {
        // continue
      }
    }
    setBulkSyncingAliExpress(false);
    toast.success(
      `AliExpress sync complete for ${withAe.length} selected orders (${updatedCount} updated${shippedCount ? `, ${shippedCount} shipped` : ""}).`
    );
    await loadOrders();
  };

  const handleSyncSingleAliExpress = async (order) => {
    if (!order.aliexpressOrderId) {
      toast.info("This order does not have an AliExpress order ID.");
      return;
    }
    setSyncingSingleId(order.id);
    try {
      const res = await syncSingleAliExpressOrder(order.id);
      const isPaid = res.data?.is_paid;
      const isShipped = res.data?.is_shipped;
      const isCancelled = res.data?.is_cancelled;
      const tracking = res.data?.tracking_no;
      let msg = res.data?.message || "AliExpress order status checked.";
      if (isShipped && tracking) {
        msg += ` Tracking: ${tracking}. Moved to Shipped!`;
      } else if (isPaid) {
        msg += " Order is paid and moved to Processed (Paid)!";
      } else if (isCancelled) {
        msg = "AliExpress order was cancelled. Moved back to New Orders ready to process again.";
      }
      toast.success(msg);
      await loadOrders();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to sync AliExpress order status."));
    } finally {
      setSyncingSingleId("");
    }
  };

  const startEditSource = (order) => {
    setEditingSourceOrder(order);
  };

  const cancelEditSource = () => {
    setEditingSourceOrder(null);
  };

  const saveSource = async (payload) => {
    const order = editingSourceOrder;
    if (!order) {
      return;
    }

    setSavingSourceId(order.id);
    try {
      const res = await updateOrderSource(order.id, payload);
      toast.success(res.data?.message ?? "Source link updated.");
      cancelEditSource();
      await loadOrders();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not update source link."));
    } finally {
      setSavingSourceId("");
    }
  };

  const startEditCost = (order) => {
    setEditingCostId(order.id);
    setCostDraft(order.buyPrice != null ? String(order.buyPrice) : "");
  };

  const saveCost = async () => {
    const order = orders.find((item) => item.id === editingCostId);
    if (!order) return;

    const parsed = Number.parseFloat(costDraft);
    if (costDraft.trim() !== "" && (!Number.isFinite(parsed) || parsed < 0)) {
      toast.warn("Enter a valid cost amount.");
      return;
    }

    const cost = costDraft.trim() === "" ? null : Number(parsed.toFixed(2));

    setSavingCostId(order.id);
    try {
      await updateOrderCost(order.id, { cost });
      toast.success("Cost updated.");
      setEditingCostId("");
      setCostDraft("");
      await loadOrders();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update cost."));
    } finally {
      setSavingCostId("");
    }
  };

  const startEditTracking = (order) => {
    setEditingTrackingId(order.id);
    const tracking = (order.trackingNumberRaw || order.tracking_number || "").trim();
    setTrackingDraft(tracking);
    const detected = tracking ? detectTrackingCarrier(tracking) : null;
    const initialCarrier = normalizeTrackingCarrier(order.carrierRaw || order.carrier || "") || detected || "";
    setCarrierDraft(initialCarrier);
  };

  const cancelEditTracking = () => {
    setEditingTrackingId("");
    setTrackingDraft("");
    setCarrierDraft("");
  };

  const saveTracking = async (order) => {
    const tracking = trackingDraft.trim();
    let carrier = normalizeTrackingCarrier(carrierDraft);
    if (!carrier && tracking) {
      carrier = detectTrackingCarrier(tracking) || "";
    }

    setSavingTrackingId(order.id);
    try {
      await updateOrderTracking(order.id, {
        tracking_number: tracking || null,
        carrier: carrier || null,
      });
      toast.success("Tracking updated.");
      cancelEditTracking();
      await loadOrders();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not update tracking."));
    } finally {
      setSavingTrackingId("");
    }
  };

  const pushTrackingToEbay = async (order) => {
    const isEditing = editingTrackingId === order.id;
    const tracking = (isEditing ? trackingDraft : (order.trackingNumberRaw || "")).trim();
    let carrier = normalizeTrackingCarrier(isEditing ? carrierDraft : (order.carrierRaw || order.carrier || ""));

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

  const startEditFulfillment = (order, field) => {
    setEditingFulfillment({ orderId: order.id, field });
    setFulfillmentDraft(order[field] ?? "");
  };

  const saveFulfillment = async () => {
    if (!editingFulfillment) return;
    const order = orders.find((item) => item.id === editingFulfillment.orderId);
    const fieldMeta = FULFILLMENT_FIELDS[editingFulfillment.field];
    if (!order) return;

    const fulfillmentKey = `${order.id}:${editingFulfillment.field}`;
    setSavingFulfillmentKey(fulfillmentKey);
    try {
      await updateOrderFulfillment(order.id, { [fieldMeta.key]: fulfillmentDraft.trim() || null });
      toast.success(`${fieldMeta.label} updated.`);
      setEditingFulfillment(null);
      setFulfillmentDraft("");
      await loadOrders();
    } catch (err) {
      toast.error(getApiErrorMessage(err, `Could not update ${fieldMeta.label.toLowerCase()}.`));
    } finally {
      setSavingFulfillmentKey("");
    }
  };

  const handleProcessOrder = async (order) => {
    // Condition 1: Supplier source must be AliExpress
    const isAliExpress =
      order.hasSource &&
      order.sourcePlatform &&
      order.sourcePlatform.toLowerCase() === "aliexpress";

    if (!isAliExpress) {
      if (order.sourcePlatform && order.sourcePlatform.toLowerCase() === "ebay") {
        toast.warn(
          "The source for this order is currently set to eBay. All orders are processed with AliExpress only — please enter the AliExpress supplier link or product ID to proceed.",
          { autoClose: 9000 }
        );
      } else {
        toast.warn(
          "All orders can be processed with AliExpress only. Please provide the AliExpress source link or product ID to proceed.",
          { autoClose: 8000 }
        );
      }
      startEditSource(order);
      return;
    }

    // Condition 2: Already placed on AliExpress / supplier - sync its status!
    if (order.aliexpressOrderId) {
      handleSyncSingleAliExpress(order);
      return;
    }

    // Condition 3: Missing shipping address from buyer
    const cleanAddress = (order.shippingAddress || "").trim();
    if (!cleanAddress || cleanAddress === "—") {
      const missingMsg = "Buyer shipping address is missing from the order data. Please enter the delivery address to proceed.";
      toast.error(missingMsg, { autoClose: 6000 });
      setAddressModalError(missingMsg);
      showAddressErrorNotice({
        order,
        message: missingMsg,
      });
      setAddressModalOrder(order);
      return;
    }

    // Condition 4: Buyer account mode checks
    if (processingMethod === "buyer") {
      if (!buyerAccounts.length) {
        toast.warn(
          "No active AliExpress buyer accounts found. Please connect an account in Settings → Buyer Accounts, or switch to AutoDS Wallet mode.",
          { autoClose: 8000 }
        );
        return;
      }
      if (!hasBuyerAccountForSite(order.siteId)) {
        toast.warn(
          `No buyer account is tagged for this order's marketplace (${order.siteId || "current store"}). Please tag one in Settings → Buyer Accounts or choose a buyer account from the dropdown.`,
          { autoClose: 8000 }
        );
        return;
      }
    }

    // Condition 5: Fetch checkout quote & run address validation
    setFetchingQuoteId(order.id);
    let quote = null;
    try {
      const res = await getOrderCheckoutQuote(order.id, {
        processing_method: processingMethod,
        buyer_account_id: processingMethod === "buyer" && selectedBuyerAccountId ? Number(selectedBuyerAccountId) : undefined,
      });
      quote = res.data;
      setOrderQuote(quote);
    } catch (err) {
      const errMsg = getApiErrorMessage(err, "Could not fetch checkout quote for order.");
      const lowerErr = errMsg.toLowerCase();
      const isAddr =
        lowerErr.includes("address") ||
        lowerErr.includes("city") ||
        lowerErr.includes("postal") ||
        lowerErr.includes("zip") ||
        lowerErr.includes("state");
      toast.error(errMsg, { autoClose: 6000 });
      if (isAddr) {
        setAddressModalError(errMsg);
        showAddressErrorNotice({
          order,
          message: errMsg,
        });
      }
      setFetchingQuoteId("");
      return;
    } finally {
      setFetchingQuoteId("");
    }

    // Address verification check: only proceed if exact address match, otherwise show recommendation modal
    const validation = quote?.address_validation;
    if (validation && validation.is_exact_match === false) {
      setAddressRecommendationModal({
        open: true,
        order,
        validation,
      });
      return;
    }

    // Open pre-flight confirmation modal with full cost breakdown
    setConfirmOrder(order);
  };

  const handleAcceptRecommendedAddress = async () => {
    const { order, validation } = addressRecommendationModal;
    if (!order || !validation?.recommended_address) return;

    setAcceptingRecommended(true);
    try {
      const res = await acceptRecommendedAddress(order.id, {
        recommended_address: validation.recommended_address,
      });
      toast.success(res.data?.message ?? "Address updated to AliExpress format.");
      setAddressRecommendationModal({ open: false, order: null, validation: null });
      await loadOrders();

      const updated = res.data?.order ? mapProcessingOrder(res.data.order) : order;
      // Re-trigger order processing with validated address
      handleProcessOrder(updated);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not save recommended address."));
    } finally {
      setAcceptingRecommended(false);
    }
  };

  const executeProcessOrder = async (order) => {
    setProcessingId(order.id);
    const placePayload = {
      processing_method: processingMethod,
      buyer_account_id:
        processingMethod === "buyer" && selectedBuyerAccountId ? Number(selectedBuyerAccountId) : undefined,
      auto_accept_recommended_address: true,
    };

    try {
      const res = await placeAliExpressOrder(order.id, placePayload);
      toast.success(res.data?.message ?? "Order placed on AliExpress! Moved to Pending Payment.");
      setConfirmOrder(null);
      if (processingMethod === "autods") {
        loadWallet();
      }
      await loadOrders();
      setActiveTab("pending");
    } catch (err) {
      let message = getApiErrorMessage(err, "Could not process this order.");
      let lower = message.toLowerCase();

      // If address blockage, auto-fix and retry
      if (
        lower.includes("formatting rules") ||
        lower.includes("recommended address") ||
        lower.includes("state/province") ||
        (lower.includes("address") && lower.includes("aliexpress"))
      ) {
        try {
          await acceptRecommendedAddress(order.id);
          const res = await placeAliExpressOrder(order.id, placePayload);
          toast.success(res.data?.message ?? "Order placed on AliExpress! Moved to Pending Payment.");
          setConfirmOrder(null);
          if (processingMethod === "autods") {
            loadWallet();
          }
          await loadOrders();
          setActiveTab("pending");
          return;
        } catch (retryErr) {
          message = getApiErrorMessage(retryErr, message);
          lower = message.toLowerCase();
        }
      }

      setConfirmOrder(null);
      if (lower.includes("insufficient") || lower.includes("balance") || lower.includes("wallet")) {
        setTransferModalOpen(true);
        toast.error("Failed due to insufficient wallet balance.", { autoClose: 9000 });
      } else {
        const isAddress =
          lower.includes("address") ||
          lower.includes("city") ||
          lower.includes("zip") ||
          lower.includes("postal") ||
          lower.includes("state") ||
          lower.includes("province") ||
          lower.includes("formatting rules") ||
          lower.includes("delivery address");
        const isVariation =
          lower.includes("source") ||
          lower.includes("link") ||
          lower.includes("product") ||
          lower.includes("sku") ||
          lower.includes("variation");

        if (isAddress) {
          const detailedMsg = message.includes("AliExpress")
            ? message
            : (message || "The buyer's delivery address could not be validated by AliExpress. Please check or edit the shipping details.");
          toast.error(detailedMsg, { autoClose: 6000 });
          setAddressModalError(detailedMsg);
          showAddressErrorNotice({
            order,
            message: detailedMsg,
          });
          setAddressModalOrder(order);
        } else if (isVariation) {
          toast.error("1 have 0 source link or defined variant.", { autoClose: 6000 });
          startEditSource(order);
        } else {
          toast.error(message, { autoClose: 6000 });
        }
      }
    } finally {
      setProcessingId("");
    }
  };

  const handleMarkProcessed = async (order) => {
    setProcessingId(order.id);
    try {
      await updateOrderProcessingStatus(order.id, "processed");
      toast.success("Order marked as processed.");
      setOrders((current) => current.filter((item) => item.id !== order.id));
      setSelectedIds((current) => current.filter((id) => id !== order.id));
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not mark order as processed."));
    } finally {
      setProcessingId("");
    }
  };

  const handleUpdateProcessingStatus = async (order, targetStatus) => {
    if (!targetStatus || targetStatus === order.processingStatus) return;
    setProcessingId(order.id);
    try {
      await updateOrderProcessingStatus(order.id, targetStatus);
      toast.success(`Order moved to ${PROCESSING_TABS.find((t) => t.key === targetStatus)?.label ?? targetStatus}.`);
      setOrders((current) => current.filter((item) => item.id !== order.id));
      setSelectedIds((current) => current.filter((id) => id !== order.id));
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not update processing status."));
    } finally {
      setProcessingId("");
    }
  };

  const handleSaveAddress = async (addressData) => {
    if (!addressModalOrder) return;
    const shouldResume = Boolean(addressModalOrder._autoResumeProcess);
    setAddressModalSaving(true);
    try {
      const res = await updateOrderShippingAddress(addressModalOrder.id, addressData);
      toast.success("Shipping address updated.");
      setAddressModalError("");
      setAddressErrorNotice(null);
      const updatedOrder = res.data?.order;
      let mapped = null;
      if (updatedOrder) {
        mapped = mapProcessingOrder(updatedOrder);
        setOrders((current) => current.map((item) => (item.id === mapped.id ? mapped : item)));
      }
      setAddressModalOrder(null);

      // If the address was edited as part of address validation, re-validate and continue
      if (shouldResume && mapped) {
        handleProcessOrder(mapped);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not update shipping address."));
    } finally {
      setAddressModalSaving(false);
    }
  };

  const handleSort = (columnId) => {
    if (sortBy === columnId) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(columnId);
      const isDescDefault = ["date", "sellPrice", "cost"].includes(columnId);
      setSortDirection(isDescDefault ? "desc" : "asc");
    }
  };

  const sortedOrders = useMemo(() => {
    const list = [...orders];
    list.sort((left, right) => {
      let aVal = left[sortBy];
      let bVal = right[sortBy];

      if (sortBy === "order") {
        aVal = left.orderId;
        bVal = right.orderId;
      } else if (sortBy === "date") {
        aVal = left.orderDate;
        bVal = right.orderDate;
      } else if (sortBy === "buyer") {
        aVal = left.buyerName;
        bVal = right.buyerName;
      } else if (sortBy === "sellPrice") {
        aVal = left.sellPrice;
        bVal = right.sellPrice;
      } else if (sortBy === "source") {
        aVal = left.itemTitle;
        bVal = right.itemTitle;
      } else if (sortBy === "cost") {
        aVal = left.buyPrice ?? left.cost;
        bVal = right.buyPrice ?? right.cost;
      } else if (sortBy === "aliexpressOrderId") {
        aVal = left.aliexpressOrderId;
        bVal = right.aliexpressOrderId;
      } else if (sortBy === "aliexpressStatus") {
        aVal = left.aliexpressOrderStatus;
        bVal = right.aliexpressOrderStatus;
      } else if (sortBy === "tracking") {
        aVal = left.trackingNumber;
        bVal = right.trackingNumber;
      }

      return compareGridValues(aVal, bVal, sortDirection);
    });
    return list;
  }, [orders, sortBy, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedOrders.length / pageSize));
  const visibleOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedOrders.slice(start, start + pageSize);
  }, [sortedOrders, currentPage, pageSize]);

  const allSelected = visibleOrders.length > 0 && visibleOrders.every((order) => selectedIds.includes(order.id));

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : visibleOrders.map((order) => order.id));
  };

  const toggleSelectOrder = (id) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const handleBulkProcess = async () => {
    if (!selectedIds.length) {
      toast.warn("Please select at least one order to process.");
      return;
    }

    const selected = orders.filter(
      (order) =>
        selectedIds.includes(order.id) &&
        order.hasSource &&
        order.sourcePlatform?.toLowerCase() === "aliexpress" &&
        !order.aliexpressOrderId
    );

    const nonAliExpressCount = orders.filter(
      (order) =>
        selectedIds.includes(order.id) &&
        (!order.hasSource || order.sourcePlatform?.toLowerCase() !== "aliexpress")
    ).length;

    const alreadyPlacedCount = orders.filter(
      (order) => selectedIds.includes(order.id) && order.aliexpressOrderId
    ).length;

    if (!selected.length) {
      if (alreadyPlacedCount > 0) {
        toast.info("Selected order(s) have already been placed on AliExpress.");
      } else if (nonAliExpressCount > 0) {
        toast.warn(
          "Selected order(s) do not have a valid AliExpress source. All orders are processed with AliExpress only — please add AliExpress source links first."
        );
      } else {
        toast.warn("Select orders with an AliExpress source link that haven't been processed yet.");
      }
      return;
    }

    const eligible =
      processingMethod === "buyer" ? selected.filter((order) => hasBuyerAccountForSite(order.siteId)) : selected;
    const skippedForBuyerAccount = selected.length - eligible.length;

    if (!eligible.length) {
      toast.warn("None of the selected orders have a buyer account tagged for their marketplace. Tag one in Settings → Buyer Accounts.");
      return;
    }

    setBulkProcessing(true);
    setBulkProgress({ current: 0, total: eligible.length });
    let succeeded = 0;
    let failedAddress = 0;
    let failedVariantOrSource = 0;
    let failedOther = 0;
    const failedOrderIds = [];
    let walletInsufficient = false;

    for (let i = 0; i < eligible.length; i++) {
      const order = eligible[i];
      setBulkProgress({ current: i + 1, total: eligible.length });
      setProcessingId(order.id);

      const hasSource = Boolean(order.sourceProductId || order.itemBuy || order.sourceUrl);
      if (!hasSource) {
        failedVariantOrSource += 1;
        failedOrderIds.push(order.id);
        continue;
      }

      const placePayload = {
        processing_method: processingMethod,
        buyer_account_id:
          processingMethod === "buyer" && selectedBuyerAccountId ? Number(selectedBuyerAccountId) : undefined,
        auto_accept_recommended_address: true,
      };

      try {
        await placeAliExpressOrder(order.id, placePayload);
        succeeded += 1;
      } catch (err) {
        let msg = getApiErrorMessage(err, "Could not process this order.");
        let msgLower = msg.toLowerCase();
        let recovered = false;

        // 1. Check if error is due to address formatting blockage (e.g. ID -> Idaho)
        const isAddressBlockage =
          msgLower.includes("formatting rules") ||
          msgLower.includes("recommended address") ||
          msgLower.includes("state/province") ||
          msgLower.includes("aliexpress formatting") ||
          (msgLower.includes("address") && msgLower.includes("aliexpress"));

        // 2. Check if error is due to variation / SKU blockage
        const isVariationBlockage =
          msgLower.includes("variation") ||
          msgLower.includes("sku") ||
          msgLower.includes("select the correct variation");

        if (isAddressBlockage) {
          try {
            // Auto-fix address blockage by accepting recommended address
            await acceptRecommendedAddress(order.id);
            // Process again!
            await placeAliExpressOrder(order.id, placePayload);
            succeeded += 1;
            recovered = true;
          } catch (retryErr) {
            msg = getApiErrorMessage(retryErr, msg);
            msgLower = msg.toLowerCase();
          }
        }

        if (!recovered && isVariationBlockage && (order.sourceProductId || order.itemBuy)) {
          try {
            // Auto-fix variation blockage by resolving SKU and updating source
            const productId = order.sourceProductId || order.itemBuy;
            const res = await getAliExpressProduct(productId);
            const skus = Array.isArray(res.data?.skus) ? res.data.skus : [];

            if (skus.length > 0) {
              const matchedSku = resolveBestSku(order, skus);
              if (matchedSku) {
                await updateOrderSource(order.id, {
                  source_input: order.sourceUrl || `https://www.aliexpress.com/item/${productId}.html`,
                  source_platform: "aliexpress",
                  source_sku_id: String(matchedSku.id ?? matchedSku.sku_id ?? ""),
                  source_variation: Array.isArray(matchedSku.properties)
                    ? matchedSku.properties.map((p) => ({ name: p.name, value: p.value }))
                    : null,
                });
                // Process again!
                await placeAliExpressOrder(order.id, placePayload);
                succeeded += 1;
                recovered = true;
              }
            }
          } catch (retryErr) {
            msg = getApiErrorMessage(retryErr, msg);
            msgLower = msg.toLowerCase();
          }
        }

        if (!recovered) {
          failedOrderIds.push(order.id);

          if (isAddressBlockage) {
            failedAddress += 1;
          } else if (isVariationBlockage) {
            failedVariantOrSource += 1;
          } else if (msgLower.includes("insufficient") || msgLower.includes("wallet")) {
            walletInsufficient = true;
            failedOther += 1;
            for (let j = i + 1; j < eligible.length; j++) {
              failedOrderIds.push(eligible[j].id);
              failedOther += 1;
            }
            break;
          } else {
            failedOther += 1;
          }
        }
      }
    }

    setProcessingId("");
    setBulkProcessing(false);
    setBulkProgress({ current: 0, total: 0 });
    setSelectedIds(failedOrderIds);

    await loadOrders(true);
    if (processingMethod === "autods") {
      loadWallet();
    }
    if (succeeded > 0) {
      setActiveTab("pending");
    }

    // Build unified system message
    const parts = [];
    if (succeeded > 0) {
      parts.push(`${succeeded} Processed`);
    }
    if (failedAddress > 0) {
      parts.push(`${failedAddress} Failed due to address`);
    }
    if (failedVariantOrSource > 0) {
      parts.push(`${failedVariantOrSource} have 0 source link or defined variant`);
    }
    if (failedOther > 0) {
      parts.push(`${failedOther} Failed`);
    }
    if (skippedForBuyerAccount > 0) {
      parts.push(`${skippedForBuyerAccount} skipped (no buyer account tagged)`);
    }
    if (nonAliExpressCount > 0 && selected.length > 0) {
      parts.push(`${nonAliExpressCount} skipped (missing AliExpress source link)`);
    }

    const summaryText = parts.length > 0 ? parts.join(", ") + "." : "Order processing completed.";

    if (failedAddress > 0 || failedVariantOrSource > 0 || failedOther > 0) {
      if (succeeded > 0) {
        toast.warn(summaryText, { autoClose: 8000, toastId: "bulk-process-summary" });
      } else {
        toast.error(summaryText, { autoClose: 8000, toastId: "bulk-process-summary" });
      }
      if (failedAddress > 0) {
        const addrNoticeMsg = `${failedAddress} order${failedAddress === 1 ? "" : "s"} failed due to AliExpress delivery address validation.`;
        setAddressModalError(addrNoticeMsg);
        showAddressErrorNotice({
          message: addrNoticeMsg,
          isBulk: true,
        });
      }
      if (walletInsufficient) {
        setTransferModalOpen(true);
      }
    } else {
      toast.success(summaryText, { autoClose: 8000, toastId: "bulk-process-summary" });
    }
  };

  const handleBulkFixBlockages = async (andProcess = false) => {
    if (!selectedIds.length) {
      toast.warn("Please select at least one order to fix.");
      return;
    }

    const selected = orders.filter((order) => selectedIds.includes(order.id));
    if (!selected.length) return;

    setBulkProcessing(true);
    let addressFixed = 0;
    let variationFixed = 0;

    for (const order of selected) {
      // 1. Bulk address fixation: accept recommended format (e.g. ID -> Idaho)
      try {
        await acceptRecommendedAddress(order.id);
        addressFixed += 1;
      } catch {
        // Address might already be exact or missing required fields
      }

      // 2. Bulk variation fixation: resolve missing SKU or auto-match
      if (order.hasSource && order.sourcePlatform?.toLowerCase() === "aliexpress" && !order.aliexpressOrderId) {
        const productId = order.sourceProductId || order.itemBuy;
        if (productId && (!order.sourceSkuId || order.sourceSkuId === "—")) {
          try {
            const res = await getAliExpressProduct(productId);
            const skus = Array.isArray(res.data?.skus) ? res.data.skus : [];
            if (skus.length > 0) {
              const matched = resolveBestSku(order, skus);
              if (matched) {
                await updateOrderSource(order.id, {
                  source_input: order.sourceUrl || `https://www.aliexpress.com/item/${productId}.html`,
                  source_platform: "aliexpress",
                  source_sku_id: String(matched.id ?? matched.sku_id ?? ""),
                  source_variation: Array.isArray(matched.properties)
                    ? matched.properties.map((p) => ({ name: p.name, value: p.value }))
                    : null,
                });
                variationFixed += 1;
              }
            }
          } catch {
            // Variation lookup error
          }
        }
      }
    }

    setBulkProcessing(false);
    toast.success(
      `Bulk fixation complete: ${addressFixed} address(es) and ${variationFixed} variation(s) verified/updated.`
    );
    await loadOrders();

    if (andProcess) {
      await handleBulkProcess();
    }
  };

  const handleBulkMarkProcessed = async () => {
    const selected = orders.filter((order) => selectedIds.includes(order.id));
    if (!selected.length) return;

    setBulkProcessing(true);
    let succeeded = 0;
    let failed = 0;

    for (const order of selected) {
      try {
        await updateOrderProcessingStatus(order.id, "processed");
        succeeded += 1;
      } catch {
        failed += 1;
      }
    }

    setBulkProcessing(false);
    setSelectedIds([]);

    if (succeeded) {
      toast.success(`${succeeded} order${succeeded === 1 ? "" : "s"} marked as processed.`);
      await loadOrders();
    }
    if (failed) {
      toast.error(`Could not mark ${failed} order${failed === 1 ? "" : "s"}.`);
    }
  };

  const handleBulkSaveAddress = async (payload) => {
    if (!selectedIds.length) return;
    setAddressModalSaving(true);
    let succeeded = 0;
    let failed = 0;

    const isMap = typeof payload === "object" && payload !== null && !payload.fullName;

    for (const id of selectedIds) {
      const data = isMap ? payload[id] : payload;
      if (!data) continue;
      try {
        await updateOrderShippingAddress(id, data);
        succeeded += 1;
      } catch {
        failed += 1;
      }
    }
    setAddressModalSaving(false);
    setBulkAddressModalOpen(false);
    if (succeeded) {
      toast.success(`Shipping address updated for ${succeeded} order${succeeded === 1 ? "" : "s"}.`);
      setAddressModalError("");
      setAddressErrorNotice(null);
      await loadOrders();
    }
    if (failed) {
      toast.error(`Could not update address for ${failed} order${failed === 1 ? "" : "s"}.`);
    }
  };

  const handleBulkSaveVariants = async (payload) => {
    if (!selectedIds.length) return;
    setSavingSourceId("bulk");
    let succeeded = 0;
    let failed = 0;

    const isMap = typeof payload === "object" && payload !== null && !payload.source_input;

    for (const id of selectedIds) {
      const data = isMap ? payload[id] : payload;
      if (!data || !data.source_input) continue;
      try {
        await updateOrderSource(id, {
          source_input: data.source_input,
          source_platform: data.source_platform || "aliexpress",
          source_sku_id: data.source_sku_id || null,
          source_variation: data.source_variation || null,
        });
        succeeded += 1;
      } catch {
        failed += 1;
      }
    }
    setSavingSourceId("");
    setBulkSourceModalOpen(false);
    if (succeeded) {
      toast.success(`Variants updated for ${succeeded} order${succeeded === 1 ? "" : "s"}.`);
      await loadOrders();
    }
    if (failed) {
      toast.error(`Could not update variants for ${failed} order${failed === 1 ? "" : "s"}.`);
    }
  };

  const handleBulkMoveStatus = async (targetStatus) => {
    const selected = orders.filter((order) => selectedIds.includes(order.id));
    if (!selected.length) return;
    setBulkProcessing(true);
    let succeeded = 0;
    for (const order of selected) {
      try {
        await updateOrderProcessingStatus(order.id, targetStatus);
        succeeded += 1;
      } catch {
        // continue
      }
    }
    setBulkProcessing(false);
    setSelectedIds([]);
    toast.success(`Moved ${succeeded} order${succeeded === 1 ? "" : "s"} to ${targetStatus}.`);
    await loadOrders();
  };

  const handleTransferFunds = async () => {
    const parsed = Number.parseFloat(transferAmountDraft);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.warn("Enter a valid transfer amount.");
      return;
    }

    setTransferring(true);
    try {
      const res = await transferToProcessingWallet(Number(parsed.toFixed(2)));
      toast.success(res.data?.message ?? "Funds transferred to your processing wallet.");
      const nextSummary = res.data?.summary ?? wallet;
      setWallet(nextSummary);
      if (res.data?.summary?.balance !== undefined) {
        window.dispatchEvent(
          new CustomEvent("wallet_balance_updated", {
            detail: {
              wallet_balance: Number(res.data.summary.balance),
              wallet_currency: res.data.summary.currency || "USD",
            },
          }),
        );
      }
      setTransferModalOpen(false);
      setTransferAmountDraft("");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Transfer failed."));
    } finally {
      setTransferring(false);
    }
  };

  return (
    <section className="order-processing-page">
      <section className="order-processing-hero">
        <div className="order-processing-hero__mesh" aria-hidden="true" />
        <div className="order-processing-hero__orb order-processing-hero__orb--one" aria-hidden="true" />
        <div className="order-processing-hero__orb order-processing-hero__orb--two" aria-hidden="true" />

        <div className="order-processing-hero__inner">
          <header className="order-processing-hero__header">
            <div>
              <span className="order-processing-hero__eyebrow">
                <LuPackageCheck />
                Order processing
              </span>
              <h2 className="order-processing-hero__title">Process Orders</h2>
              <p className="order-processing-hero__subtitle">
                Choose how to process orders, then click "Process the order" to auto-purchase and ship straight to the buyer.
              </p>
            </div>

            <div className="order-processing-hero__spotlight">
              <span>Waiting to be processed</span>
              <strong>{orders.length}</strong>
              <em>{formatMoney(totalValue)} in order value</em>
            </div>
          </header>

          <div className="order-processing-hero__actions">
            <button type="button" className="order-processing-btn order-processing-btn--primary" onClick={handleSync} disabled={syncing || syncingAliExpress}>
              <span className="order-processing-btn__icon">
                {syncing ? <LuLoader className="spin-icon" /> : <LuRefreshCcw />}
              </span>
              <span className="order-processing-btn__copy">
                <strong>{syncing ? "Syncing…" : "Sync Orders"}</strong>
                <small>Pull eBay & sync AliExpress</small>
              </span>
            </button>

            <button
              type="button"
              className="order-processing-btn"
              style={{
                background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                borderColor: "#ea580c",
                color: "#fff",
              }}
              onClick={handleSyncAliExpress}
              disabled={syncing || syncingAliExpress}
              title="Check AliExpress directly for payment confirmation & tracking updates"
            >
              <span className="order-processing-btn__icon">
                {syncingAliExpress ? <LuLoader className="spin-icon" /> : <LuRefreshCcw />}
              </span>
              <span className="order-processing-btn__copy">
                <strong>{syncingAliExpress ? "Checking…" : "Sync AliExpress"}</strong>
                <small>Update paid & tracking status</small>
              </span>
            </button>

            <div className="order-processing-method-toggle" role="group" aria-label="Processing method">
              <button
                type="button"
                className={`order-processing-method-toggle__btn ${processingMethod === "autods" ? "order-processing-method-toggle__btn--active" : ""}`}
                onClick={() => setProcessingMethod("autods")}
              >
                <LuZap />
                <span>Auto DS</span>
              </button>
              <button
                type="button"
                className={`order-processing-method-toggle__btn ${processingMethod === "buyer" ? "order-processing-method-toggle__btn--active" : ""}`}
                onClick={() => setProcessingMethod("buyer")}
              >
                <LuUserRound />
                <span>Buyer</span>
              </button>
            </div>

            {processingMethod === "buyer" ? (
              buyerAccountsError ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span className="order-processing-buyer-hint order-processing-buyer-hint--error">
                    Could not load buyer accounts: {buyerAccountsError}
                  </span>
                  <button
                    type="button"
                    onClick={loadBuyerAccounts}
                    title="Retry loading buyer accounts"
                    style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 12, padding: 0 }}
                  >
                    <LuRefreshCcw /> Retry
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/settings?tab=buyer-accounts")}
                    style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 12, textDecoration: "underline", padding: 0 }}
                  >
                    Settings → Buyer Accounts
                  </button>
                </div>
              ) : buyerAccounts.length ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <select
                    className="order-processing-buyer-select"
                    value={selectedBuyerAccountId}
                    onChange={(event) => setSelectedBuyerAccountId(event.target.value)}
                    aria-label="Buyer account"
                  >
                    <option value="">Auto (match order's marketplace)</option>
                    {buyerAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.nickname || account.ae_user_nick || `Buyer account #${account.id}`}
                        {account.site_ids?.length ? ` (${account.site_ids.map((id) => id.replace("EBAY_", "")).join(", ")})` : " (any marketplace)"}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => navigate("/settings?tab=buyer-accounts")}
                    title="Manage AliExpress buyer accounts and marketplace tags in Settings"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      background: "#f3f4f6",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      padding: "4px 9px",
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#374151",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <LuStore />
                    <span>Manage Accounts ({buyerAccounts.length})</span>
                  </button>
                  {!selectedBuyerAccountId ? (
                    <span className="order-processing-buyer-hint">
                      Each order auto-uses the buyer account tagged for its own eBay marketplace
                    </span>
                  ) : null}
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span className="order-processing-buyer-hint" style={{ color: "#d97706", fontWeight: 500 }}>
                    No AliExpress buyer accounts connected
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate("/settings?tab=buyer-accounts")}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "#065f46",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "5px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <LuUserRound />
                    <span>Connect Buyer Account in Settings →</span>
                  </button>
                </div>
              )
            ) : null}

            {processingMethod === "autods" && wallet ? (
              <div className="order-processing-wallet-chip">
                <span>Processing wallet</span>
                <strong>{formatMoney(wallet.processing_wallet_balance, wallet.currency)}</strong>
                <button
                  type="button"
                  className="order-processing-wallet-chip__transfer"
                  onClick={() => setTransferModalOpen(true)}
                  title="Transfer funds from your main wallet"
                >
                  <LuArrowRightLeft />
                  <span>Transfer funds</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <nav className="drafts-tabs" aria-label="Order processing sections">
        {PROCESSING_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`drafts-tab ${activeTab === tab.key ? "drafts-tab--active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section className="calculations-table-panel card-wrapper">
        {addressErrorNotice && (
          <div
            style={{
              margin: "12px 16px 0",
              padding: "12px 16px",
              borderRadius: "8px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5 }}>
              <LuTriangleAlert size={20} style={{ color: "#dc2626", flexShrink: 0 }} />
              <div>
                <strong>Shipping Address Error:</strong> {addressErrorNotice.message}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              {addressErrorNotice.order && (
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  style={{ fontSize: 12, padding: "4px 12px", borderRadius: 6 }}
                  onClick={() => {
                    setAddressModalOrder(addressErrorNotice.order);
                  }}
                >
                  Fix Address Now
                </button>
              )}
              {addressErrorNotice.isBulk && (
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  style={{ fontSize: 12, padding: "4px 12px", borderRadius: 6 }}
                  onClick={() => setBulkAddressModalOpen(true)}
                >
                  Fix Addresses
                </button>
              )}
              <button
                type="button"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#991b1b",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                }}
                onClick={() => setAddressErrorNotice(null)}
                aria-label="Dismiss error notification"
              >
                <LuX size={18} />
              </button>
            </div>
          </div>
        )}

        <div className="calculations-table-toolbar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <strong>{orders.length} orders</strong>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {selectedIds.length ? (
              <div className="order-processing-bulk-bar" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 600 }}>{selectedIds.length} selected</span>

                {activeTab === "new" ? (
                  <>
                    {addressIssueCount > 0 && (
                      <span
                        style={{
                          background: "#fee2e2",
                          color: "#dc2626",
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 12,
                        }}
                      >
                        {addressIssueCount} with address issue
                      </span>
                    )}

                    <button
                      type="button"
                      className="order-processing-bulk-bar__btn"
                      onClick={handleBulkProcess}
                      disabled={bulkProcessing}
                    >
                      {bulkProcessing ? <LuLoader className="spin-icon" /> : <LuCheck />}
                      <span>
                        {bulkProcessing
                          ? `Processing (${bulkProgress.current}/${bulkProgress.total})...`
                          : "Process selected"}
                      </span>
                    </button>

                    <button
                      type="button"
                      className="order-processing-bulk-bar__btn"
                      style={{ background: "#f8fafc", color: "#334155", border: "1px solid #cbd5e1" }}
                      onClick={() => setBulkAddressModalOpen(true)}
                      title="Fix shipping addresses for selected orders"
                      disabled={bulkProcessing}
                    >
                      <LuMapPin />
                      <span>Fix address</span>
                    </button>

                    <button
                      type="button"
                      className="order-processing-bulk-bar__btn"
                      style={{ background: "#f8fafc", color: "#334155", border: "1px solid #cbd5e1" }}
                      onClick={() => setBulkSourceModalOpen(true)}
                      title="Add or update variants across selected orders"
                      disabled={bulkProcessing}
                    >
                      <LuLayers />
                      <span>Add variants</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="order-processing-bulk-bar__btn"
                    style={{
                      background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                      borderColor: "#ea580c",
                      color: "#fff",
                    }}
                    onClick={handleBulkSyncAliExpress}
                    disabled={bulkSyncingAliExpress}
                    title="Check AliExpress for updates on selected orders"
                  >
                    {bulkSyncingAliExpress ? <LuLoader className="spin-icon" /> : <LuRefreshCcw />}
                    <span>{bulkSyncingAliExpress ? "Checking AliExpress…" : "Sync AliExpress"}</span>
                  </button>
                )}
              </div>
            ) : null}

            <div className="calculations-table-toolbar__actions">
              <button
                type="button"
                className="orders-icon-btn"
                onClick={() => scrollTable("left")}
                aria-label="Scroll grid left"
                title="Scroll left"
              >
                <LuChevronLeft />
              </button>
              <button
                type="button"
                className="orders-icon-btn"
                onClick={() => scrollTable("right")}
                aria-label="Scroll grid right"
                title="Scroll right"
              >
                <LuChevronRight />
              </button>
            </div>
          </div>
        </div>

        <div className="orders-table-shell">
          <div className="orders-table-scroll" ref={tableScrollRef}>
            <table className="orders-table calculations-table" style={{ minWidth: 1680 }}>
              <thead>
                <tr>
                  <th className="orders-table__checkbox-col" style={{ width: 44, minWidth: 44 }}>
                    <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label="Select all orders" />
                  </th>
                  <th style={{ width: 280, minWidth: 280, cursor: "pointer" }} onClick={() => handleSort("order")}>
                    <GridSortHeader columnId="order" label="Order" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th style={{ width: 110, minWidth: 110, cursor: "pointer" }} onClick={() => handleSort("date")}>
                    <GridSortHeader columnId="date" label="Date" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th style={{ width: 140, minWidth: 140, cursor: "pointer" }} onClick={() => handleSort("buyer")}>
                    <GridSortHeader columnId="buyer" label="Buyer" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th style={{ width: 110, minWidth: 110, cursor: "pointer" }} onClick={() => handleSort("sellPrice")}>
                    <GridSortHeader columnId="sellPrice" label="Sell Price" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th style={{ width: 220, minWidth: 220, cursor: "pointer" }} onClick={() => handleSort("source")}>
                    <GridSortHeader columnId="source" label="Source (AliExpress)" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th style={{ width: 110, minWidth: 110, cursor: "pointer" }} onClick={() => handleSort("cost")}>
                    <GridSortHeader columnId="cost" label="Cost" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th style={{ width: 180, minWidth: 180, cursor: "pointer" }} onClick={() => handleSort("aliexpressOrderId")}>
                    <GridSortHeader columnId="aliexpressOrderId" label="AliExpress Order ID" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th style={{ width: 140, minWidth: 140, cursor: "pointer" }} onClick={() => handleSort("aliexpressStatus")}>
                    <GridSortHeader columnId="aliexpressStatus" label="AliExpress Status" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th style={{ width: 220, minWidth: 220, cursor: "pointer" }} onClick={() => handleSort("tracking")}>
                    <GridSortHeader columnId="tracking" label="Tracking" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th style={{ width: 160, minWidth: 160 }}>Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td className="orders-table__empty" colSpan={11}>
                      <LuRefreshCcw className="spin-icon" />
                      <span>Loading orders…</span>
                    </td>
                  </tr>
                ) : visibleOrders.length ? (
                  visibleOrders.map((order) => (
                    <tr className="orders-table__row" key={order.id}>
                      <td className="orders-table__checkbox-col">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(order.id)}
                          onChange={() => toggleSelectOrder(order.id)}
                          aria-label={`Select order ${order.ebayOrderId}`}
                        />
                      </td>
                      <td>
                        <div className="orders-product calculations-product">
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
                          <div className="orders-product__copy calculations-product__copy">
                            <h3>{order.title}</h3>
                            {order.variant ? (
                              <div className="orders-product__variant-wrap">
                                <span className="orders-product__variant-badge" title={order.variant}>
                                  <LuLayers className="orders-product__variant-icon" />
                                  <span className="orders-product__variant-text">{order.variant}</span>
                                </span>
                              </div>
                            ) : null}
                            <p className="calculations-product__description">
                              {order.orderDetailUrl ? (
                                <a
                                  href={order.orderDetailUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="orders-order-id-link"
                                >
                                  {order.ebayOrderId}
                                </a>
                              ) : (
                                order.ebayOrderId
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="orders-table__date">{formatDisplayDate(order.orderDate)}</td>
                      <td>
                        <div className="orders-table__buyer-cell">
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                            <strong>{order.buyerName}</strong>
                            <button
                              type="button"
                              className="products-source-cell__edit"
                              onClick={() => setAddressModalOrder(order)}
                              title="Edit shipping address"
                              aria-label="Edit shipping address"
                            >
                              <LuPencil />
                            </button>
                          </div>
                          <span>{order.shippingAddress}</span>
                          {order.buyerPhone !== "—" ? <span>{order.buyerPhone}</span> : null}
                          {!order.shippingAddress || order.shippingAddress === "—" || !order.rawAddress?.postalCode || !order.rawAddress?.addressLine1 ? (
                            <span
                              style={{
                                display: "inline-block",
                                background: "#fee2e2",
                                color: "#b91c1c",
                                fontSize: "11px",
                                fontWeight: 700,
                                padding: "2px 6px",
                                borderRadius: "4px",
                                width: "fit-content",
                                cursor: "pointer",
                                marginTop: "3px",
                              }}
                              onClick={() => setAddressModalOrder(order)}
                              title="Incomplete or missing address. Click to update."
                            >
                              ⚠️ Address Issue
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="calculations-table__money">{formatMoney(order.sellPrice, order.currency)}</td>
                      <td>
                        <div className="products-source-cell" style={{ flexDirection: "column", alignItems: "flex-start", gap: 3 }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, maxWidth: "100%" }}>
                            {order.hasSource && order.sourcePlatform && order.sourcePlatform.toLowerCase() === "aliexpress" ? (
                              <ProductItemIdCell itemId={order.itemBuy} url={order.itemBuyUrl} />
                            ) : order.sourcePlatform && order.sourcePlatform.toLowerCase() === "ebay" ? (
                              <button
                                type="button"
                                className="products-source-btn__placeholder"
                                onClick={() => startEditSource(order)}
                                style={{
                                  cursor: "pointer",
                                  color: "#b45309",
                                  fontWeight: 600,
                                  background: "rgba(245, 158, 11, 0.12)",
                                  padding: "3px 8px",
                                  borderRadius: "4px",
                                  border: "1px dashed #f59e0b",
                                }}
                                title="Source is set to eBay. Click to enter AliExpress source."
                              >
                                + Set AliExpress Source
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="products-source-btn__placeholder"
                                onClick={() => startEditSource(order)}
                                style={{ cursor: "pointer", padding: "3px 8px", borderRadius: "4px" }}
                                title="Click to add AliExpress supplier source"
                              >
                                + Add AliExpress Source
                              </button>
                            )}
                            <button
                              type="button"
                              className="products-source-cell__edit"
                              onClick={() => startEditSource(order)}
                              title="Edit AliExpress source link"
                              aria-label="Edit source link"
                            >
                              <LuPencil />
                            </button>
                          </div>
                          {order.sourceVariationText ? (
                            <span className="orders-source-cell__variation" title={order.sourceVariationText}>
                              {order.sourceVariationText}
                            </span>
                          ) : null}
                          {order.sourcePlatform ? (
                            <span
                              className={`orders-source-badge orders-source-badge--${order.sourcePlatform.toLowerCase()}`}
                              style={
                                order.sourcePlatform.toLowerCase() === "ebay"
                                  ? { background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", fontWeight: 600 }
                                  : undefined
                              }
                            >
                              {order.sourcePlatform.toLowerCase() === "ebay"
                                ? "eBay (Needs AliExpress)"
                                : order.sourcePlatform}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="calculations-table__money">
                        <button type="button" className="products-tracking-btn" onClick={() => startEditCost(order)} title="Edit cost">
                          <span className={order.buyPrice != null ? undefined : "products-tracking-btn__placeholder"}>
                            {order.buyPrice != null ? formatMoney(order.buyPrice, order.currency) : "—"}
                          </span>
                          <LuPencil className="products-tracking-btn__icon" />
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="products-tracking-btn"
                          onClick={() => startEditFulfillment(order, "aliexpressOrderId")}
                          title="Edit AliExpress order ID"
                        >
                          <span className={order.aliexpressOrderId ? undefined : "products-tracking-btn__placeholder"}>
                            {order.aliexpressOrderId || "—"}
                          </span>
                          <LuPencil className="products-tracking-btn__icon" />
                        </button>
                      </td>
                      <td>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <button
                            type="button"
                            className="products-tracking-btn"
                            onClick={() => startEditFulfillment(order, "aliexpressOrderStatus")}
                            title="Edit AliExpress order status"
                          >
                            <span className={order.aliexpressOrderStatus ? undefined : "products-tracking-btn__placeholder"}>
                              {order.aliexpressOrderStatus || "—"}
                            </span>
                            <LuPencil className="products-tracking-btn__icon" />
                          </button>
                          {order.aliexpressOrderId ? (
                            <button
                              type="button"
                              onClick={() => handleSyncSingleAliExpress(order)}
                              disabled={syncingSingleId === order.id}
                              title="Check AliExpress for payment and tracking updates"
                              style={{
                                background: "none",
                                border: "none",
                                color: "#ea580c",
                                cursor: "pointer",
                                padding: 2,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: 4,
                              }}
                            >
                              <LuRefreshCcw className={syncingSingleId === order.id ? "spin-icon" : ""} size={13} />
                            </button>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <OrdersTrackingEditor
                          order={order}
                          isEditing={editingTrackingId === order.id}
                          trackingDraft={trackingDraft}
                          carrierDraft={carrierDraft}
                          saving={savingTrackingId === order.id}
                          pushing={pushingTrackingId === order.id}
                          onStartEdit={startEditTracking}
                          onCancel={cancelEditTracking}
                          onTrackingChange={(val) => {
                            setTrackingDraft(val);
                            const detected = detectTrackingCarrier(val);
                            if (detected) {
                              setCarrierDraft(detected);
                            }
                          }}
                          onCarrierChange={setCarrierDraft}
                          onSave={saveTracking}
                          onPushToEbay={pushTrackingToEbay}
                        />
                      </td>
                      <td>
                        <div className="order-processing-actions">
                          {activeTab === "new" || activeTab === "pending" ? (
                            <>
                              <button
                                type="button"
                                className={`order-processing-mark-btn ${
                                  order.aliexpressOrderId
                                    ? "order-processing-mark-btn--placed"
                                    : !order.hasSource ||
                                      (order.sourcePlatform && order.sourcePlatform.toLowerCase() !== "aliexpress")
                                    ? "order-processing-mark-btn--warning"
                                    : "order-processing-mark-btn--primary"
                                }`}
                                onClick={() => handleProcessOrder(order)}
                                disabled={processingId === order.id || syncingSingleId === order.id}
                                title={
                                  order.aliexpressOrderId
                                    ? `Already placed on AliExpress (#${order.aliexpressOrderId}). Click to check payment status.`
                                    : !order.hasSource
                                    ? "Missing AliExpress supplier link — click to add source"
                                    : order.sourcePlatform && order.sourcePlatform.toLowerCase() === "ebay"
                                    ? "Current source is eBay. All orders must be fulfilled with AliExpress — click to enter AliExpress source."
                                    : order.sourcePlatform && order.sourcePlatform.toLowerCase() !== "aliexpress"
                                    ? `Current source is ${order.sourcePlatform}. Orders can only be processed with AliExpress.`
                                    : "Review and process order"
                                }
                              >
                                {processingId === order.id ? (
                                  <>
                                    <LuLoader className="spin-icon" />
                                    <span>Processing…</span>
                                  </>
                                ) : order.aliexpressOrderId ? (
                                  <>
                                    <LuRefreshCcw className={syncingSingleId === order.id ? "spin-icon" : ""} />
                                    <span>{syncingSingleId === order.id ? "Checking…" : "Sync AliExpress"}</span>
                                  </>
                                ) : !order.hasSource ||
                                  (order.sourcePlatform && order.sourcePlatform.toLowerCase() !== "aliexpress") ? (
                                  <>
                                    <LuPlus />
                                    <span>Add AliExpress Source</span>
                                  </>
                                ) : (
                                  <>
                                    <LuZap />
                                    <span>Process order</span>
                                  </>
                                )}
                              </button>
                              {processingMethod === "buyer" && !hasBuyerAccountForSite(order.siteId) ? (
                                <button
                                  type="button"
                                  onClick={() => navigate("/settings?tab=buyer-accounts")}
                                  style={{
                                    marginTop: 4,
                                    background: "none",
                                    border: "none",
                                    color: "#d97706",
                                    fontSize: 11,
                                    fontWeight: 500,
                                    cursor: "pointer",
                                    padding: 0,
                                    textDecoration: "underline",
                                    display: "block",
                                  }}
                                  title="Tag a buyer account for this marketplace in Settings → Buyer Accounts"
                                >
                                  Tag Buyer Account →
                                </button>
                              ) : null}
                            </>
                          ) : activeTab === "processed" ? (
                            <span
                              className="order-processing-mark-btn order-processing-mark-btn--placed"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                cursor: "default",
                                userSelect: "none",
                              }}
                              title="Order is paid on AliExpress and marked as Processed"
                            >
                              <LuCheck />
                              <span>Processed (Paid)</span>
                            </span>
                          ) : activeTab === "shipped" ? (
                            <span
                              className="order-processing-mark-btn"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                cursor: "default",
                                userSelect: "none",
                                background: "#eff6ff",
                                color: "#2563eb",
                                borderColor: "#bfdbfe",
                              }}
                              title="Order has shipped"
                            >
                              <LuTruck />
                              <span>Shipped</span>
                            </span>
                          ) : activeTab === "completed" ? (
                            <span
                              className="order-processing-mark-btn"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                cursor: "default",
                                userSelect: "none",
                                background: "#f0fdf4",
                                color: "#16a34a",
                                borderColor: "#bbf7d0",
                              }}
                              title="Order is completed"
                            >
                              <LuPackageCheck />
                              <span>Completed</span>
                            </span>
                          ) : activeTab === "cancelled" ? (
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                              <span
                                className="order-processing-mark-btn"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  cursor: "default",
                                  userSelect: "none",
                                  background: "#fef2f2",
                                  color: "#dc2626",
                                  borderColor: "#fecaca",
                                }}
                                title="Order is cancelled"
                              >
                                <LuX />
                                <span>Cancelled</span>
                              </span>
                              <button
                                type="button"
                                className="order-processing-mark-btn order-processing-mark-btn--primary"
                                onClick={() => handleUpdateProcessingStatus(order, "new")}
                                disabled={processingId === order.id}
                                title="Move this order back to New Orders to process it again"
                                style={{ fontSize: 11, padding: "4px 8px" }}
                              >
                                <LuZap />
                                <span>Move to New</span>
                              </button>
                            </div>
                          ) : (
                            <span
                              className="order-processing-mark-btn"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                cursor: "default",
                                userSelect: "none",
                              }}
                            >
                              <span>{PROCESSING_TABS.find((t) => t.key === activeTab)?.label ?? activeTab}</span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="orders-table__empty" colSpan={11}>
                      <LuClipboardList />
                      <span>No orders in this tab.</span>
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
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                aria-label="Previous page"
              >
                <LuChevronLeft />
              </button>
              {buildPaginationItems(currentPage, totalPages).map((item, idx) =>
                item === "..." ? (
                  <span className="orders-pagination__ellipsis" key={`ellipsis-${idx}`}>...</span>
                ) : (
                  <button
                    type="button"
                    key={item}
                    className={item === currentPage ? "orders-pagination__page orders-pagination__page--active" : "orders-pagination__page"}
                    onClick={() => setCurrentPage(item)}
                  >
                    {item}
                  </button>
                )
              )}
              <button
                type="button"
                className="orders-pagination__arrow"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                aria-label="Next page"
              >
                <LuChevronRight />
              </button>
            </div>

            <div className="orders-table-footer__right">
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
                  {PAGE_SIZE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
              <span>Orders out of {sortedOrders.length}</span>
            </div>

            <div className="orders-table-footer__scroll-actions">
              <button
                type="button"
                className="orders-icon-btn"
                onClick={() => scrollTable("left")}
                aria-label="Scroll grid left"
                title="Scroll left"
              >
                <LuChevronLeft />
              </button>
              <button
                type="button"
                className="orders-icon-btn"
                onClick={() => scrollTable("right")}
                aria-label="Scroll grid right"
                title="Scroll right"
              >
                <LuChevronRight />
              </button>
            </div>
          </div>
        </div>
        </div>
      </section>

      {Boolean(editingSourceOrder) ? (
        <OrderSourceModal
          open={Boolean(editingSourceOrder)}
          order={editingSourceOrder}
          requireAliExpress={true}
          saving={Boolean(editingSourceOrder) && savingSourceId === editingSourceOrder.id}
          onClose={cancelEditSource}
          onSave={saveSource}
        />
      ) : null}

      <QuickEditModal
        open={Boolean(editingCostId)}
        title="Edit Cost"
        description="The AliExpress (or other supplier) cost for this order."
        label="Cost"
        type="number"
        min="0"
        step="0.01"
        value={costDraft}
        onChange={setCostDraft}
        onSave={saveCost}
        onClose={() => setEditingCostId("")}
        saving={Boolean(savingCostId)}
        placeholder="0.00"
      />

      <QuickEditModal
        open={Boolean(editingFulfillment)}
        title={editingFulfillment ? `Edit ${FULFILLMENT_FIELDS[editingFulfillment.field].label}` : ""}
        label={editingFulfillment ? FULFILLMENT_FIELDS[editingFulfillment.field].label : ""}
        value={fulfillmentDraft}
        onChange={setFulfillmentDraft}
        onSave={saveFulfillment}
        onClose={() => setEditingFulfillment(null)}
        saving={Boolean(savingFulfillmentKey)}
        placeholder="—"
      />

      <QuickEditModal
        open={transferModalOpen}
        title="Transfer to Processing Wallet"
        description="Move funds from your main wallet into your dedicated processing wallet used for Auto DS purchases."
        label="Amount"
        type="number"
        min="0.01"
        step="0.01"
        value={transferAmountDraft}
        onChange={setTransferAmountDraft}
        onSave={handleTransferFunds}
        onClose={() => setTransferModalOpen(false)}
        saving={transferring}
        placeholder="0.00"
      />

      <AddressRecommendationModal
        open={addressRecommendationModal.open}
        order={addressRecommendationModal.order}
        validation={addressRecommendationModal.validation}
        accepting={acceptingRecommended}
        onClose={() => setAddressRecommendationModal({ open: false, order: null, validation: null })}
        onAcceptRecommended={handleAcceptRecommendedAddress}
        onEditManual={() => {
          const ord = addressRecommendationModal.order;
          const val = addressRecommendationModal.validation;
          setAddressRecommendationModal({ open: false, order: null, validation: null });
          if (ord) {
            const bestAddress = val?.recommended_address || val?.original_address || {};
            setAddressModalOrder({
              ...ord,
              _autoResumeProcess: true,
              rawAddress: {
                fullName: ord.rawAddress?.fullName || bestAddress.fullName || ord.buyerName || "",
                addressLine1: ord.rawAddress?.addressLine1 || bestAddress.addressLine1 || "",
                addressLine2: ord.rawAddress?.addressLine2 || bestAddress.addressLine2 || "",
                city: ord.rawAddress?.city || bestAddress.city || "",
                stateOrProvince: ord.rawAddress?.stateOrProvince || bestAddress.stateOrProvince || "",
                postalCode: ord.rawAddress?.postalCode || bestAddress.postalCode || "",
                countryCode: ord.rawAddress?.countryCode || bestAddress.countryCode || "US",
                phone: ord.rawAddress?.phone || bestAddress.phone || (ord.buyerPhone !== "—" ? ord.buyerPhone : "") || "",
              },
            });
          }
        }}
      />

      <OrderConfirmModal
        open={Boolean(confirmOrder)}
        order={confirmOrder}
        quote={orderQuote}
        processingMethod={processingMethod}
        wallet={wallet}
        buyerAccount={
          buyerAccounts.find((acc) => String(acc.id) === String(selectedBuyerAccountId)) ||
          buyerAccounts[0] ||
          null
        }
        processing={Boolean(confirmOrder) && processingId === confirmOrder.id}
        onClose={() => {
          setConfirmOrder(null);
          setOrderQuote(null);
        }}
        onConfirm={executeProcessOrder}
      />

      <ExternalOrderModal
        open={Boolean(externalOrder)}
        order={externalOrder}
        onClose={() => setExternalOrder(null)}
        onMarkProcessed={async (order) => {
          await handleMarkProcessed(order);
          setExternalOrder(null);
        }}
        onEditSource={startEditSource}
        marking={Boolean(externalOrder) && processingId === externalOrder.id}
      />

      <OrderShippingAddressModal
        open={Boolean(addressModalOrder)}
        order={addressModalOrder}
        errorMessage={addressModalError}
        processingMethod={processingMethod}
        selectedBuyerAccountId={selectedBuyerAccountId}
        saving={addressModalSaving}
        onClose={() => {
          setAddressModalOrder(null);
          setAddressModalError("");
        }}
        onSave={handleSaveAddress}
      />

      <OrderShippingAddressModal
        open={bulkAddressModalOpen}
        orders={selectedOrders}
        errorMessage={addressModalError}
        processingMethod={processingMethod}
        selectedBuyerAccountId={selectedBuyerAccountId}
        saving={addressModalSaving}
        onClose={() => {
          setBulkAddressModalOpen(false);
          setAddressModalError("");
        }}
        onSave={handleBulkSaveAddress}
      />

      <OrderSourceModal
        open={bulkSourceModalOpen}
        orders={selectedOrders}
        requireAliExpress={true}
        saving={savingSourceId === "bulk"}
        onClose={() => setBulkSourceModalOpen(false)}
        onSave={handleBulkSaveVariants}
      />

      <BulkOrderFixationModal
        open={fixationModalOpen}
        failedOrders={fixationOrders}
        processingMethod={processingMethod}
        selectedBuyerAccountId={selectedBuyerAccountId}
        onClose={() => {
          setFixationModalOpen(false);
          setFixationOrders([]);
        }}
        onSuccess={async () => {
          await loadOrders();
          if (processingMethod === "autods") {
            loadWallet();
          }
        }}
      />
    </section>
  );
}

export default OrderProcessingContent;
