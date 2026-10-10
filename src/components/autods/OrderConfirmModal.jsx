import { useEffect } from "react";
import { LuCheck, LuDollarSign, LuExternalLink, LuLoader, LuShieldAlert, LuStore, LuUserRound, LuX, LuZap } from "react-icons/lu";

function OrderConfirmModal({
  open,
  order,
  quote,
  processingMethod,
  wallet,
  buyerAccount,
  processing = false,
  onClose,
  onConfirm,
}) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || !order) {
    return null;
  }

  const itemPrice = quote?.item_price != null ? Number(quote.item_price) : Number(order.buyPrice || 0);
  const shippingCost = quote?.shipping_cost != null ? Number(quote.shipping_cost) : 0;
  const taxAmount = quote?.tax_amount != null ? Number(quote.tax_amount) : 0;
  const subtotal = itemPrice + shippingCost + taxAmount;
  const autodsFee = quote?.autods_fee != null ? Number(quote.autods_fee) : Number((subtotal * 0.10).toFixed(2));
  const totalCost = quote?.total_cost != null ? Number(quote.total_cost) : Number((subtotal + autodsFee).toFixed(2));

  const sellPrice = Number(order.sellPrice || 0);
  const estProfit = sellPrice > 0 ? sellPrice - totalCost : null;
  const walletBalance = Number(wallet?.processing_wallet_balance || 0);
  const isWallet = processingMethod === "autods";
  const hasSufficientWallet = !isWallet || walletBalance >= totalCost;

  return (
    <div className="quick-edit-modal-layer" role="presentation">
      <button type="button" className="quick-edit-modal-layer__backdrop" aria-label="Close" onClick={onClose} />

      <section className="quick-edit-modal order-confirm-modal" role="dialog" aria-modal="true" aria-label="Confirm AliExpress Order Placement">
        <button type="button" className="quick-edit-modal__close" aria-label="Close" onClick={onClose} disabled={processing}>
          <LuX />
        </button>

        <div className="quick-edit-modal__head">
          <span className="quick-edit-modal__icon" style={{ background: "#ede9fe", color: "#7c3aed" }} aria-hidden="true">
            <LuZap />
          </span>
          <div>
            <h2>Confirm Order Placement</h2>
            <p>You are about to automatically purchase and ship this order via AliExpress.</p>
          </div>
        </div>

        <div className="order-confirm-card">
          <div className="order-confirm-product-row">
            {order.image ? (
              <img src={order.image} alt={order.title} className="order-confirm-product-img" referrerPolicy="no-referrer" />
            ) : (
              <div className="order-confirm-product-img" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9" }}>
                <LuStore style={{ color: "#94a3b8" }} />
              </div>
            )}
            <div className="order-confirm-product-info">
              <h4>{order.title}</h4>
              <span>eBay Order #{order.ebayOrderId}</span>
            </div>
          </div>
        </div>

        <div className="order-confirm-grid">
          <div className="order-confirm-section">
            <h5>Ship To (Buyer)</h5>
            <p>
              <strong>{order.buyerName}</strong>
              <br />
              {order.shippingAddress || "—"}
              {order.buyerPhone && order.buyerPhone !== "—" ? (
                <>
                  <br />
                  <span style={{ color: "#64748b", fontSize: 11 }}>Phone: {order.buyerPhone}</span>
                </>
              ) : null}
            </p>
          </div>

          <div className="order-confirm-section">
            <h5>Supplier Item</h5>
            <p>
              <strong>AliExpress ID:</strong> {order.itemBuy || "—"}
              <br />
              <strong>SKU ID:</strong> {order.sourceSkuId || "Default"}
              {order.itemBuyUrl ? (
                <>
                  <br />
                  <a
                    href={order.itemBuyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#6366f1", fontSize: 11, display: "inline-flex", alignItems: "center", gap: 3, marginTop: 4, textDecoration: "underline" }}
                  >
                    View on AliExpress <LuExternalLink size={11} />
                  </a>
                </>
              ) : null}
            </p>
          </div>
        </div>

        <div className="order-confirm-section">
          <h5>Billing & Processing Method</h5>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {isWallet ? (
                <>
                  <LuDollarSign style={{ color: "#16a34a", fontSize: 16 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>AutoDS Processing Wallet</span>
                </>
              ) : (
                <>
                  <LuUserRound style={{ color: "#3b82f6", fontSize: 16 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                    Buyer Account: {buyerAccount?.nickname || buyerAccount?.ae_user_nick || `Account #${buyerAccount?.id || "Auto"}`}
                  </span>
                </>
              )}
            </div>

            {isWallet ? (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 4,
                  background: hasSufficientWallet ? "#dcfce7" : "#fee2e2",
                  color: hasSufficientWallet ? "#166534" : "#991b1b",
                }}
              >
                Balance: ${walletBalance.toFixed(2)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="order-confirm-pricing-table">
          <div className="order-confirm-pricing-row">
            <span>Customer Sale Price</span>
            <strong>${sellPrice.toFixed(2)} {order.currency || "USD"}</strong>
          </div>
          <div className="order-confirm-pricing-row">
            <span>Supplier Item Price</span>
            <strong>${itemPrice.toFixed(2)}</strong>
          </div>
          <div className="order-confirm-pricing-row">
            <span>Supplier Shipping</span>
            <strong>{shippingCost > 0 ? `$${shippingCost.toFixed(2)}` : "Free"}</strong>
          </div>
          <div className="order-confirm-pricing-row">
            <span>Estimated Tax</span>
            <strong>${taxAmount.toFixed(2)}</strong>
          </div>
          <div className="order-confirm-pricing-row" style={{ color: "#7c3aed" }}>
            <span style={{ fontWeight: 600 }}>AutoDS Processing Fee (10%)</span>
            <strong>+${autodsFee.toFixed(2)}</strong>
          </div>
          <div className="order-confirm-pricing-row" style={{ borderTop: "2px solid #e2e8f0", paddingTop: 8, marginTop: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 13.5, color: "#0f172a" }}>Total to Deduct from Wallet</span>
            <strong style={{ fontWeight: 800, fontSize: 15, color: "#0f172a" }}>${totalCost.toFixed(2)} {quote?.currency || "USD"}</strong>
          </div>
          {estProfit != null ? (
            <div className="order-confirm-pricing-row order-confirm-pricing-row--profit" style={{ marginTop: 6 }}>
              <span>Estimated Net Profit</span>
              <strong className={estProfit >= 0 ? "positive" : ""}>
                {estProfit >= 0 ? `+$${estProfit.toFixed(2)}` : `-$${Math.abs(estProfit).toFixed(2)}`}
              </strong>
            </div>
          ) : null}
        </div>

        {!hasSufficientWallet ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, color: "#991b1b", fontSize: 12 }}>
            <LuShieldAlert style={{ flexShrink: 0 }} />
            <span>Processing wallet balance is lower than estimated order cost.</span>
          </div>
        ) : null}

        <div className="quick-edit-modal__actions" style={{ marginTop: 8 }}>
          <button type="button" className="quick-edit-modal__btn quick-edit-modal__btn--ghost" onClick={onClose} disabled={processing}>
            Cancel
          </button>
          <button
            type="button"
            className="quick-edit-modal__btn quick-edit-modal__btn--primary"
            onClick={() => onConfirm(order)}
            disabled={processing}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            {processing ? <LuLoader className="spin-icon" /> : <LuCheck />}
            <span>{processing ? "Submitting Order…" : "Confirm & Place Order"}</span>
          </button>
        </div>
      </section>
    </div>
  );
}

export default OrderConfirmModal;
