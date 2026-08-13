import { useEffect, useMemo, useState } from "react";
import {
  LuArrowRightLeft,
  LuCheck,
  LuClipboardList,
  LuLoader,
  LuPackageCheck,
  LuPencil,
  LuRefreshCcw,
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
import { buildSourceProductUrl, formatDisplayDate, normalizeListingSourceInput } from "../helpers";
import ProductItemIdCell from "../ProductItemIdCell";
import QuickEditModal from "../QuickEditModal";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=120&q=80";

const PROCESSING_TABS = [
  { key: "new", label: "New Orders" },
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
    image: firstItem.image?.imageUrl ?? PLACEHOLDER_IMAGE,
    ebayOrderId: order.ebay_order_id ?? raw.orderId ?? "—",
    orderDate: typeof order.order_date === "string" ? order.order_date.slice(0, 10) : order.order_date,
    buyerName: shipTo.fullName ?? buyer.buyerRegistrationAddress?.fullName ?? order.buyer_name ?? "—",
    location: [shipTo.contactAddress?.city ?? shipTo.city, shipTo.contactAddress?.countryCode ?? shipTo.countryCode]
      .filter(Boolean)
      .join(", ") || "—",
    sellPrice: Number(sellPrice) || 0,
    currency,
    itemBuy: sourceProductId ?? "—",
    itemBuyUrl: buildSourceProductUrl(sourcePlatform, sourceProductId, sourceUrl),
    sourceUrl,
    sourcePlatform,
    hasSource: Boolean(sourceProductId || sourceUrl),
    buyPrice: order.buy_price != null ? Number(order.buy_price) : null,
    aliexpressOrderId: order.aliexpress_order_id ?? "",
    aliexpressOrderStatus: order.aliexpress_order_status ?? "",
    processingStatus: order.processing_status ?? "new",
    processingMethod: order.processing_method ?? "",
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
  const [selectedBuyerAccountId, setSelectedBuyerAccountId] = useState("");

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferAmountDraft, setTransferAmountDraft] = useState("");
  const [transferring, setTransferring] = useState(false);

  const [editingSourceId, setEditingSourceId] = useState("");
  const [sourceDraft, setSourceDraft] = useState("");
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
      setOrders((res.data?.data ?? []).map(mapProcessingOrder));
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
      setSelectedBuyerAccountId((current) => {
        if (current && accounts.some((account) => String(account.id) === String(current))) {
          return current;
        }
        const primary = accounts.find((account) => account.is_primary) ?? accounts[0];
        return primary ? String(primary.id) : "";
      });
    } catch {
      setBuyerAccounts([]);
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
    setEditingSourceId(order.id);
    setSourceDraft(order.sourceUrl ?? (order.itemBuy !== "—" ? order.itemBuy : ""));
  };

  const saveSource = async () => {
    const order = orders.find((item) => item.id === editingSourceId);
    const trimmed = sourceDraft.trim();
    if (!order || !trimmed) {
      toast.error("Enter a source link or item ID.");
      return;
    }

    setSavingSourceId(order.id);
    try {
      const source = normalizeListingSourceInput(trimmed, order.sourcePlatform);
      const res = await updateOrderSource(order.id, {
        source_input: source.source_input,
        source_platform: source.source_platform,
      });
      toast.success(res.data?.message ?? "Source link updated.");
      setEditingSourceId("");
      setSourceDraft("");
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
    if (processingMethod === "buyer" && !selectedBuyerAccountId) {
      toast.warn("Connect and select a buyer account in Settings → Buyer Accounts first.");
      return;
    }

    setProcessingId(order.id);
    try {
      const res = await placeAliExpressOrder(order.id, {
        processing_method: processingMethod,
        buyer_account_id: processingMethod === "buyer" ? Number(selectedBuyerAccountId) : undefined,
      });
      toast.success(res.data?.message ?? "Order processed.");
      setOrders((current) => current.filter((item) => item.id !== order.id));
      if (processingMethod === "autods") {
        loadWallet();
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not process this order."));
    } finally {
      setProcessingId("");
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
              buyerAccounts.length ? (
                <select
                  className="order-processing-buyer-select"
                  value={selectedBuyerAccountId}
                  onChange={(event) => setSelectedBuyerAccountId(event.target.value)}
                  aria-label="Buyer account"
                >
                  {buyerAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.nickname || account.ae_user_nick || `Buyer account #${account.id}`}
                    </option>
                  ))}
                </select>
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
        </div>

        <div className="orders-table-shell">
          <div className="orders-table-scroll">
            <table className="orders-table calculations-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Buyer</th>
                  <th>Sell Price</th>
                  <th>Source (AliExpress)</th>
                  <th>Cost</th>
                  <th>AliExpress Order ID</th>
                  <th>AliExpress Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td className="orders-table__empty" colSpan={9}>
                      <LuRefreshCcw className="spin-icon" />
                      <span>Loading orders…</span>
                    </td>
                  </tr>
                ) : orders.length ? (
                  orders.map((order) => (
                    <tr className="orders-table__row" key={order.id}>
                      <td>
                        <div className="orders-product calculations-product">
                          <div className="orders-product__thumb">
                            <img src={order.image} alt={order.title} />
                          </div>
                          <div className="orders-product__copy calculations-product__copy">
                            <h3>{order.title}</h3>
                            <p className="calculations-product__description">{order.ebayOrderId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="orders-table__date">{formatDisplayDate(order.orderDate)}</td>
                      <td>
                        <div className="orders-table__buyer-cell">
                          <strong>{order.buyerName}</strong>
                          <span>{order.location}</span>
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
                        <div className="order-processing-actions">
                          <button
                            type="button"
                            className="order-processing-mark-btn order-processing-mark-btn--primary"
                            onClick={() => handleProcessOrder(order)}
                            disabled={
                              processingId === order.id ||
                              !order.hasSource ||
                              Boolean(order.aliexpressOrderId) ||
                              (processingMethod === "buyer" && !selectedBuyerAccountId)
                            }
                            title={
                              !order.hasSource
                                ? "Add a source link before processing"
                                : order.aliexpressOrderId
                                  ? "Already placed on AliExpress"
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
                    <td className="orders-table__empty" colSpan={9}>
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

      <QuickEditModal
        open={Boolean(editingSourceId)}
        title="Edit Source Link"
        description="Paste the AliExpress URL or item ID this order should be fulfilled from."
        label="Source link or item ID"
        value={sourceDraft}
        onChange={setSourceDraft}
        onSave={saveSource}
        onClose={() => setEditingSourceId("")}
        saving={Boolean(savingSourceId)}
        placeholder="https://www.aliexpress.com/item/... or item ID"
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
