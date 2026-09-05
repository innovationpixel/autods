import { useEffect, useMemo, useState } from "react";
import {
  LuArrowRightLeft,
  LuCheck,
  LuClipboardList,
  LuLoader,
  LuPackageCheck,
  LuPencil,
  LuRefreshCcw,
  LuStore,
  LuUserRound,
  LuZap,
} from "react-icons/lu";
import { toast } from "../../../utils/toast";
import { getApiErrorMessage } from "../../../utils/apiErrors";
import {
  getOrders,
  placeAliExpressOrder,
  syncOrders,
  updateOrderCost,
  updateOrderFulfillment,
  updateOrderSource,
} from "../../../services/OrderService";
import { getWalletSummary, transferToProcessingWallet } from "../../../services/WalletService";
import { getBuyerAccounts } from "../../../services/BuyerAccountService";
import {
  buildSourceProductUrl,
  formatDisplayDate,
  getEbayOrderDetailUrl,
  normalizeTrackingCarrier,
} from "../helpers";
import ProductItemIdCell from "../ProductItemIdCell";
import QuickEditModal from "../QuickEditModal";
import OrderSourceModal from "../OrderSourceModal";

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
  const shipTo = fulfillment.shippingStep?.shipTo ?? buyer.buyerRegistrationAddress ?? {};
  const sellPrice = order.sell_price ?? pricing.total?.value ?? firstItem.lineItemCost?.value ?? 0;
  const currency = order.currency ?? pricing.total?.currency ?? "USD";
  const sourceProductId = order.source_product_id ?? order.item_buy_id ?? null;
  const sourcePlatform = order.source_platform ?? "aliexpress";
  const sourceUrl = order.source_url ?? null;

  return {
    id: String(order.id),
    title: order.item_title ?? firstItem.title ?? "Order item",
    image: firstItem.image?.imageUrl ?? order.listing_image_url ?? null,
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
    trackingNumber: order.tracking_number ?? fulfillment.shippingStep?.shipmentTrackingNumber ?? "",
    carrier:
      normalizeTrackingCarrier(order.carrier) ||
      normalizeTrackingCarrier(fulfillment.shippingStep?.shippingCarrierCode) ||
      "",
  };
}

function OrderProcessingContent() {
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

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferAmountDraft, setTransferAmountDraft] = useState("");
  const [transferring, setTransferring] = useState(false);

  const [editingSourceOrder, setEditingSourceOrder] = useState(null);
  const [savingSourceId, setSavingSourceId] = useState("");

  const [editingCostId, setEditingCostId] = useState("");
  const [costDraft, setCostDraft] = useState("");
  const [savingCostId, setSavingCostId] = useState("");

  const [editingFulfillment, setEditingFulfillment] = useState(null);
  const [fulfillmentDraft, setFulfillmentDraft] = useState("");
  const [savingFulfillmentKey, setSavingFulfillmentKey] = useState("");

  const FULFILLMENT_FIELDS = {
    aliexpressOrderId: { key: "aliexpress_order_id", label: "AliExpress order ID" },
    aliexpressOrderStatus: { key: "aliexpress_order_status", label: "AliExpress order status" },
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await getOrders({ processing_status: activeTab, sort: "asc", limit: 100 });
      const mapped = (res.data?.data ?? []).map(mapProcessingOrder);
      setOrders(mapped.filter((order) => order.sourcePlatform === "aliexpress"));
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
  }, []);

  useEffect(() => {
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
    if (processingMethod === "buyer" && !hasBuyerAccountForSite(order.siteId)) {
      toast.warn("Connect or tag a buyer account for this order's marketplace in Settings → Buyer Accounts first.");
      return;
    }

    setProcessingId(order.id);
    try {
      const res = await placeAliExpressOrder(order.id, {
        processing_method: processingMethod,
        buyer_account_id:
          processingMethod === "buyer" && selectedBuyerAccountId ? Number(selectedBuyerAccountId) : undefined,
      });
      toast.success(res.data?.message ?? "Order processed.");
      setOrders((current) => current.filter((item) => item.id !== order.id));
      setSelectedIds((current) => current.filter((id) => id !== order.id));
      if (processingMethod === "autods") {
        loadWallet();
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not process this order."), { autoClose: 8000 });
    } finally {
      setProcessingId("");
    }
  };

  const allSelected = orders.length > 0 && orders.every((order) => selectedIds.includes(order.id));

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : orders.map((order) => order.id));
  };

  const toggleSelectOrder = (id) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const handleBulkProcess = async () => {
    const selected = orders.filter((order) => selectedIds.includes(order.id) && order.hasSource && !order.aliexpressOrderId);

    if (!selected.length) {
      toast.warn("Select orders with a source link that haven't been processed yet.");
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
                <span className="order-processing-buyer-hint order-processing-buyer-hint--error">
                  Could not load buyer accounts: {buyerAccountsError}
                </span>
              ) : buyerAccounts.length ? (
                <>
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
                  {!selectedBuyerAccountId ? (
                    <span className="order-processing-buyer-hint">
                      Each order auto-uses the buyer account tagged for its own eBay marketplace
                    </span>
                  ) : null}
                </>
              ) : (
                <span className="order-processing-buyer-hint">
                  Connect a buyer account in Settings → Buyer Accounts
                </span>
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
          <strong>{orders.length} orders</strong>
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
        </div>

        <div className="orders-table-shell">
          <div className="orders-table-scroll">
            <table className="orders-table calculations-table">
              <thead>
                <tr>
                  <th className="orders-table__checkbox-col">
                    <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label="Select all orders" />
                  </th>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Buyer</th>
                  <th>Sell Price</th>
                  <th>Source (AliExpress)</th>
                  <th>Cost</th>
                  <th>AliExpress Order ID</th>
                  <th>AliExpress Status</th>
                  <th>Tracking</th>
                  <th>Action</th>
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
                ) : orders.length ? (
                  orders.map((order) => (
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
                              <img src={order.image} alt={order.title} referrerPolicy="no-referrer" />
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
                          <strong>{order.buyerName}</strong>
                          <span>{order.shippingAddress}</span>
                          {order.buyerPhone !== "—" ? <span>{order.buyerPhone}</span> : null}
                        </div>
                      </td>
                      <td className="calculations-table__money">{formatMoney(order.sellPrice, order.currency)}</td>
                      <td>
                        <div className="products-source-cell">
                          {order.hasSource ? (
                            <ProductItemIdCell itemId={order.itemBuy} url={order.itemBuyUrl} />
                          ) : (
                            <span className="products-source-btn__placeholder">Add source</span>
                          )}
                          <button
                            type="button"
                            className="products-source-cell__edit"
                            onClick={() => startEditSource(order)}
                            title="Edit source link"
                            aria-label="Edit source link"
                          >
                            <LuPencil />
                          </button>
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
                        {order.trackingNumber ? (
                          <div className="orders-tracking-display">
                            <span className="orders-tracking-display__copy">
                              <span className="orders-table__mono">{order.trackingNumber}</span>
                              {order.carrier ? <span className="orders-table__carrier">{order.carrier}</span> : null}
                            </span>
                          </div>
                        ) : (
                          <span className="products-tracking-btn__placeholder">—</span>
                        )}
                      </td>
                      <td>
                        <div className="order-processing-actions">
                          <button
                            type="button"
                            className="order-processing-mark-btn order-processing-mark-btn--primary"
                            onClick={() => handleProcessOrder(order)}
                            disabled={
                              processingId === order.id ||
                              !order.hasSource ||
                              Boolean(order.aliexpressOrderId) ||
                              (processingMethod === "buyer" && !hasBuyerAccountForSite(order.siteId))
                            }
                            title={
                              !order.hasSource
                                ? "Add a source link before processing"
                                : order.aliexpressOrderId
                                  ? "Already placed on AliExpress"
                                  : processingMethod === "buyer" && !hasBuyerAccountForSite(order.siteId)
                                    ? "No buyer account is tagged for this order's marketplace — tag one in Settings → Buyer Accounts"
                                    : `Automatically purchase this item via ${processingMethod === "autods" ? "AutoDS" : "your buyer account"} and ship it to the buyer`
                            }
                          >
                            {processingId === order.id ? <LuLoader className="spin-icon" /> : <LuCheck />}
                            <span>{processingId === order.id ? "Processing…" : "Process the order"}</span>
                          </button>
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
        </div>
      </section>

      <OrderSourceModal
        open={Boolean(editingSourceOrder)}
        order={editingSourceOrder}
        saving={Boolean(editingSourceOrder) && savingSourceId === editingSourceOrder.id}
        onClose={cancelEditSource}
        onSave={saveSource}
      />

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
    </section>
  );
}

export default OrderProcessingContent;
