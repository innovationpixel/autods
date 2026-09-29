import { useEffect, useState } from "react";
import { LuCheck, LuCopy, LuExternalLink, LuPackageCheck, LuPencil, LuStore, LuX } from "react-icons/lu";
import { toast } from "../../utils/toast";

function ExternalOrderModal({
  open,
  order,
  onClose,
  onMarkProcessed,
  onEditSource,
  marking = false,
}) {
  const [copied, setCopied] = useState(false);

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

  const platformName = (order.sourcePlatform || "external").toUpperCase();

  const handleCopyAddress = async () => {
    const lines = [
      order.buyerName,
      order.shippingAddress,
      order.buyerPhone && order.buyerPhone !== "—" ? `Phone: ${order.buyerPhone}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(lines);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = lines;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      toast.success("Shipping address copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Could not copy address to clipboard.");
    }
  };

  return (
    <div className="quick-edit-modal-layer" role="presentation">
      <button type="button" className="quick-edit-modal-layer__backdrop" aria-label="Close" onClick={onClose} />

      <section className="quick-edit-modal order-confirm-modal" role="dialog" aria-modal="true" aria-label={`Fulfill order on ${platformName}`}>
        <button type="button" className="quick-edit-modal__close" aria-label="Close" onClick={onClose} disabled={marking}>
          <LuX />
        </button>

        <div className="quick-edit-modal__head">
          <span className="quick-edit-modal__icon" style={{ background: "#e0f2fe", color: "#0284c7" }} aria-hidden="true">
            <LuStore />
          </span>
          <div>
            <h2>Fulfill on {platformName}</h2>
            <p>Automated API checkout is available for AliExpress. For {platformName}, follow the steps below to fulfill manually.</p>
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
              <span>Order #{order.ebayOrderId}</span>
            </div>
          </div>
        </div>

        <div className="order-confirm-section">
          <h5>Step 1: Buyer Shipping Address</h5>
          <div className="order-address-box">
            <strong>{order.buyerName}</strong>
            <div>{order.shippingAddress || "—"}</div>
            {order.buyerPhone && order.buyerPhone !== "—" ? <div>Phone: {order.buyerPhone}</div> : null}
          </div>
          <button
            type="button"
            className={`order-address-copy-btn ${copied ? "order-address-copy-btn--copied" : ""}`}
            onClick={handleCopyAddress}
          >
            {copied ? <LuCheck /> : <LuCopy />}
            <span>{copied ? "Address Copied!" : "Copy Shipping Address"}</span>
          </button>
        </div>

        <div className="order-confirm-section">
          <h5>Step 2: Purchase from Supplier</h5>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                Supplier: <span style={{ textTransform: "capitalize" }}>{order.sourcePlatform || "External"}</span>
              </div>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                Item / ID: {order.itemBuy && order.itemBuy !== "—" ? order.itemBuy : "Source link configured"}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              {order.itemBuyUrl ? (
                <a
                  href={order.itemBuyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="quick-edit-modal__btn quick-edit-modal__btn--primary"
                  style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, height: 32, fontSize: 12 }}
                >
                  <LuExternalLink />
                  <span>Open on {platformName}</span>
                </a>
              ) : (
                <button
                  type="button"
                  className="quick-edit-modal__btn quick-edit-modal__btn--ghost"
                  style={{ height: 32, fontSize: 12 }}
                  onClick={() => {
                    onClose();
                    onEditSource(order);
                  }}
                >
                  <LuPencil />
                  <span>Edit Source Link</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="order-confirm-pricing-table">
          <div className="order-confirm-pricing-row">
            <span>Customer Paid (eBay)</span>
            <strong>${Number(order.sellPrice || 0).toFixed(2)} {order.currency}</strong>
          </div>
          {order.buyPrice != null ? (
            <div className="order-confirm-pricing-row">
              <span>Estimated Supplier Cost</span>
              <strong>${Number(order.buyPrice).toFixed(2)}</strong>
            </div>
          ) : null}
        </div>

        <div className="quick-edit-modal__actions" style={{ marginTop: 8 }}>
          <button type="button" className="quick-edit-modal__btn quick-edit-modal__btn--ghost" onClick={onClose} disabled={marking}>
            Close
          </button>
          <button
            type="button"
            className="quick-edit-modal__btn quick-edit-modal__btn--primary"
            onClick={() => onMarkProcessed(order)}
            disabled={marking}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <LuPackageCheck />
            <span>{marking ? "Marking…" : "Mark as Processed"}</span>
          </button>
        </div>
      </section>
    </div>
  );
}

export default ExternalOrderModal;
