import { useEffect, useState } from "react";
import { LuLoader, LuTriangleAlert, LuX } from "react-icons/lu";

const REFUND_REASONS = [
  { id: "BUYER_CANCEL", label: "Buyer canceled" },
  { id: "SELLER_CANCEL", label: "Seller canceled" },
  { id: "ITEM_NOT_RECEIVED", label: "Item not received" },
  { id: "OTHER", label: "Other" },
];

function RefundOrderModal({ open, order, onConfirm, onClose, saving = false }) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("BUYER_CANCEL");
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    setAmount(order?.sellPrice != null ? String(order.sellPrice) : "");
    setReason("BUYER_CANCEL");
    setComment("");

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open, order]);

  if (!open) {
    return null;
  }

  const handleConfirm = () => {
    const parsed = Number.parseFloat(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return;
    }

    onConfirm({ amount: Number(parsed.toFixed(2)), reason, comment: comment.trim() || undefined });
  };

  return (
    <div className="quick-edit-modal-layer" role="presentation">
      <button type="button" className="quick-edit-modal-layer__backdrop" aria-label="Close" onClick={onClose} />

      <section className="quick-edit-modal confirm-modal" role="dialog" aria-modal="true" aria-label="Issue refund">
        <button type="button" className="quick-edit-modal__close" aria-label="Close" onClick={onClose} disabled={saving}>
          <LuX />
        </button>

        <div className="quick-edit-modal__head">
          <span className="quick-edit-modal__icon confirm-modal__icon--danger" aria-hidden="true">
            <LuTriangleAlert />
          </span>
          <div>
            <h2>Issue refund</h2>
            <p>
              This calls eBay's live order API for order {order?.orderId ?? ""} and refunds the buyer for real —
              it cannot be undone from here.
            </p>
          </div>
        </div>

        <label className="quick-edit-modal__field">
          <span>Refund amount ({order?.currency ?? "USD"})</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            disabled={saving}
            autoFocus
          />
        </label>

        <label className="quick-edit-modal__field">
          <span>Reason</span>
          <select value={reason} onChange={(event) => setReason(event.target.value)} disabled={saving}>
            {REFUND_REASONS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="quick-edit-modal__field">
          <span>Note (optional)</span>
          <textarea
            rows={2}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            disabled={saving}
            placeholder="Shown on the refund record"
          />
        </label>

        <div className="quick-edit-modal__actions">
          <button type="button" className="quick-edit-modal__btn quick-edit-modal__btn--ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className="quick-edit-modal__btn confirm-modal__btn--danger"
            onClick={handleConfirm}
            disabled={saving || !amount}
          >
            {saving ? (
              <>
                <LuLoader className="spin-icon" />
                <span>Refunding…</span>
              </>
            ) : (
              <span>Issue refund</span>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}

export default RefundOrderModal;
