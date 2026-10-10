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
  LuLoader,
  LuPackageCheck,
  LuPencil,
  LuPlus,
  LuRefreshCcw,
  LuStore,
  LuUserRound,
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
  syncOrders,
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

const PROCESSING_TABS = [
  { key: "new", label: "New Orders" },
  { key: "pending", label: "Pending" },
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

  return {
    id: String(order.id),
    title: order.item_title ?? firstItem.title ?? "Order item",
    image: order.image_url ?? order.listing_image_url ?? firstItem.image?.imageUrl ?? null,
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
    processingStatus: order.processing_status ?? "new",
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
  const [processingId, setProcessingId] = useState("");
  const [wallet, setWallet] = useState(null);

  const [activeTab, setActiveTab] = useState("new");
  const [processingMethod, setProcessingMethod] = useState("autods");
  const [buyerAccounts, setBuyerAccounts] = useState([]);
  const [buyerAccountsError, setBuyerAccountsError] = useState("");
  const [selectedBuyerAccountId, setSelectedBuyerAccountId] = useState("");

  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
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
  const [addressModalSaving, setAddressModalSaving] = useState(false);
  const tableScrollRef = useRef(null);

  const scrollTable = (direction) => {
    if (!tableScrollRef.current) return;
    const offset = direction === "left" ? -400 : 400;
    tableScrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  const FULFILLMENT_FIELDS = {
    aliexpressOrderId: { key: "aliexpress_order_id", label: "AliExpress order ID" },
    aliexpressOrderStatus: { key: "aliexpress_order_status", label: "AliExpress order status" },
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await getOrders({ processing_status: activeTab, sort: "asc", limit: 100 });
      const mapped = (res.data?.data ?? []).map(mapProcessingOrder);
      setOrders(mapped);
      setSelectedIds([]);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to load orders."));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadWallet = async () => {
    try {
      const res = await getWalletSummary();
      setWallet(res.data ?? null);
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
    setTrackingDraft(order.trackingNumberRaw || "");
    setCarrierDraft(order.carrierRaw || order.carrier || "");
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

    // Condition 2: Already placed on AliExpress / supplier
    if (order.aliexpressOrderId) {
      toast.info(
        `This order has already been placed on AliExpress (Supplier Order #${order.aliexpressOrderId}). You can track shipment status or update fulfillment details directly.`,
        { autoClose: 7000 }
      );
      return;
    }

    // Condition 3: Missing shipping address from buyer
    const cleanAddress = (order.shippingAddress || "").trim();
    if (!cleanAddress || cleanAddress === "—") {
      toast.error(
        "Buyer shipping address is missing from the order data. Please enter the delivery address to proceed.",
        { autoClose: 8000 }
      );
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
      toast.error(getApiErrorMessage(err, "Could not fetch checkout quote for order."));
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

    // Wallet balance verification with full quote total cost (Item + Shipping + Tax + 10% AutoDS Fee)
    if (processingMethod === "autods") {
      const walletBalance = Number(wallet?.processing_wallet_balance ?? 0);
      const totalRequired = Number(quote?.total_cost ?? order.buyPrice ?? 0);
      if (totalRequired > 0 && walletBalance < totalRequired) {
        const shortfall = (totalRequired - walletBalance).toFixed(2);
        setTransferAmountDraft(shortfall);
        setTransferModalOpen(true);
        toast.warn(
          `Insufficient Processing Wallet balance ($${walletBalance.toFixed(2)}). Total order cost is $${totalRequired.toFixed(2)} ($${shortfall} more). Please transfer funds from your main wallet to proceed.`,
          { autoClose: 8000 }
        );
        return;
      }
    }

    // Condition 6: Open pre-flight confirmation modal with full cost breakdown
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
    try {
      const res = await placeAliExpressOrder(order.id, {
        processing_method: processingMethod,
        buyer_account_id:
          processingMethod === "buyer" && selectedBuyerAccountId ? Number(selectedBuyerAccountId) : undefined,
      });
      toast.success(res.data?.message ?? "Order successfully submitted to AliExpress!");
      setConfirmOrder(null);
      if (processingMethod === "autods") {
        loadWallet();
      }
      setActiveTab("processed");
    } catch (err) {
      setConfirmOrder(null);
      const message = getApiErrorMessage(err, "Could not process this order.");
      const lower = message.toLowerCase();

      if (lower.includes("insufficient") || lower.includes("balance") || lower.includes("wallet")) {
        setTransferModalOpen(true);
      } else if (
        lower.includes("source") ||
        lower.includes("link") ||
        lower.includes("product") ||
        lower.includes("sku") ||
        lower.includes("variation")
      ) {
        startEditSource(order);
      }

      toast.error(message, { autoClose: 9000 });
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
    setAddressModalSaving(true);
    try {
      const res = await updateOrderShippingAddress(addressModalOrder.id, addressData);
      toast.success("Shipping address updated.");
      const updatedOrder = res.data?.order;
      if (updatedOrder) {
        const mapped = mapProcessingOrder(updatedOrder);
        setOrders((current) => current.map((item) => (item.id === mapped.id ? mapped : item)));
      }
      setAddressModalOrder(null);
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

    if (!selected.length) {
      if (nonAliExpressCount > 0) {
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
    let succeeded = 0;
    let failed = 0;
    const failureMessages = new Set();

    for (const order of eligible) {
      setProcessingId(order.id);
      try {
        await placeAliExpressOrder(order.id, {
          processing_method: processingMethod,
          buyer_account_id:
            processingMethod === "buyer" && selectedBuyerAccountId ? Number(selectedBuyerAccountId) : undefined,
        });
        succeeded += 1;
      } catch (err) {
        failed += 1;
        failureMessages.add(getApiErrorMessage(err, "Could not process this order."));
      }
    }

    setProcessingId("");
    setBulkProcessing(false);
    setSelectedIds([]);

    if (succeeded) toast.success(`${succeeded} order${succeeded === 1 ? "" : "s"} processed.`);
    if (failed) {
      const reasons = Array.from(failureMessages).slice(0, 2).join(" · ");
      toast.error(`${failed} order${failed === 1 ? "" : "s"} could not be processed: ${reasons}`, { autoClose: 8000 });
    }
    if (skippedForBuyerAccount) {
      toast.warn(
        `${skippedForBuyerAccount} order${skippedForBuyerAccount === 1 ? "" : "s"} skipped — no buyer account tagged for their marketplace.`,
      );
    }

    if (succeeded) {
      await loadOrders();
      if (processingMethod === "autods") {
        loadWallet();
      }
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
      setWallet(res.data?.summary ?? wallet);
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
            <button type="button" className="order-processing-btn order-processing-btn--primary" onClick={handleSync} disabled={syncing}>
              <span className="order-processing-btn__icon">
                {syncing ? <LuLoader className="spin-icon" /> : <LuRefreshCcw />}
              </span>
              <span className="order-processing-btn__copy">
                <strong>{syncing ? "Syncing…" : "Sync Orders"}</strong>
                <small>Pull the latest orders from eBay</small>
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
        <div className="calculations-table-toolbar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <strong>{orders.length} orders</strong>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {selectedIds.length ? (
              <div className="order-processing-bulk-bar">
                <span>{selectedIds.length} selected</span>
                <button
                  type="button"
                  className="order-processing-bulk-bar__btn"
                  onClick={handleBulkProcess}
                  disabled={bulkProcessing}
                >
                  {bulkProcessing ? <LuLoader className="spin-icon" /> : <LuCheck />}
                  <span>{bulkProcessing ? "Processing…" : "Process selected"}</span>
                </button>
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
                          onTrackingChange={setTrackingDraft}
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
                                disabled={processingId === order.id}
                                title={
                                  order.aliexpressOrderId
                                    ? `Already placed on AliExpress (#${order.aliexpressOrderId})`
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
                                    <LuCheck />
                                    <span>Placed</span>
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
                          ) : (
                            <select
                              className="order-processing-status-select"
                              value={order.processingStatus}
                              disabled={processingId === order.id}
                              onChange={(e) => handleUpdateProcessingStatus(order, e.target.value)}
                              title="Move this order to another tab"
                            >
                              {PROCESSING_TABS.map((tab) => (
                                <option key={tab.key} value={tab.key}>
                                  {tab.label}
                                </option>
                              ))}
                            </select>
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
          setAddressRecommendationModal({ open: false, order: null, validation: null });
          if (ord) setAddressModalOrder(ord);
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
        saving={addressModalSaving}
        onClose={() => setAddressModalOrder(null)}
        onSave={handleSaveAddress}
      />
    </section>
  );
}

export default OrderProcessingContent;
