import { useEffect } from "react";
import { LuCheck, LuLoader, LuPencil, LuTruck, LuUpload, LuX } from "react-icons/lu";
import { detectTrackingCarrier, TRACKING_CARRIER_OPTIONS } from "./helpers";

export default function OrdersTrackingEditor({
  order,
  isEditing,
  trackingDraft,
  carrierDraft,
  saving,
  pushing,
  onStartEdit,
  onCancel,
  onTrackingChange,
  onCarrierChange,
  onSave,
  onPushToEbay,
  compact = false,
}) {
  const detectedCarrier = detectTrackingCarrier(trackingDraft);
  const resolvedCarrier = carrierDraft || detectedCarrier || order.carrierRaw || "";
  const canPush = Boolean(order.trackingNumberRaw?.trim() && resolvedCarrier);

  useEffect(() => {
    if (!isEditing) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isEditing]);

  const trigger = compact ? (
    (() => {
      const carrierLabel = order.carrierRaw || detectTrackingCarrier(order.trackingNumberRaw) || "";

      return (
        <button type="button" className="products-tracking-btn" onClick={() => onStartEdit(order)} title="Edit tracking & carrier">
          <span className={carrierLabel ? "orders-table__carrier" : "products-tracking-btn__placeholder"}>
            {carrierLabel || "—"}
          </span>
          <LuPencil className="products-tracking-btn__icon" />
        </button>
      );
    })()
  ) : (
    <div className="orders-tracking-display">
      <button type="button" className="products-tracking-btn" onClick={() => onStartEdit(order)} title="Edit tracking">
        <span className="orders-tracking-display__copy">
          <span className={order.trackingNumberRaw ? "orders-table__mono" : "products-tracking-btn__placeholder"}>
            {order.trackingNumberRaw || "Add tracking"}
          </span>
          {order.trackingPushed ? <span className="orders-tracking-display__badge">On eBay</span> : null}
        </span>
        <LuPencil className="products-tracking-btn__icon" />
      </button>
      {order.trackingNumberRaw && !order.trackingPushed ? (
        <button
          type="button"
          className="orders-tracking-display__push"
          onClick={(event) => {
            event.stopPropagation();
            onPushToEbay(order);
          }}
          disabled={pushing || !canPush}
          title={canPush ? "Push tracking to eBay" : "Set a carrier before pushing to eBay"}
        >
          {pushing ? <LuLoader className="orders-tracking-panel__spin" /> : <LuUpload />}
          <span>Push to eBay</span>
        </button>
      ) : null}
    </div>
  );

  if (!isEditing) {
    return trigger;
  }

  return (
    <>
      {trigger}

      <div className="quick-edit-modal-layer" role="presentation">
        <button type="button" className="quick-edit-modal-layer__backdrop" aria-label="Close" onClick={onCancel} />

        <section className="quick-edit-modal orders-tracking-modal" role="dialog" aria-modal="true" aria-label="Edit tracking">
          <button type="button" className="quick-edit-modal__close" aria-label="Close" onClick={onCancel} disabled={saving || pushing}>
            <LuX />
          </button>

          <div className="quick-edit-modal__head">
            <span className="quick-edit-modal__icon" aria-hidden="true">
              <LuTruck />
            </span>
            <div>
              <h2>Edit Tracking</h2>
              <p>Enter the shipment tracking number. The carrier is detected automatically as you type.</p>
            </div>
          </div>

          <label className="quick-edit-modal__field">
            <span>Tracking number</span>
            <input
              type="text"
              placeholder="Paste tracking number"
              value={trackingDraft}
              onChange={(event) => onTrackingChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  onSave(order);
                }
                if (event.key === "Escape") {
                  onCancel();
                }
              }}
              autoFocus
              disabled={saving || pushing}
            />
          </label>

          <label className="quick-edit-modal__field">
            <span>Carrier</span>
            <select
              className="orders-tracking-panel__select"
              value={carrierDraft}
              onChange={(event) => onCarrierChange(event.target.value)}
              disabled={saving || pushing}
            >
              <option value="">Select carrier</option>
              {TRACKING_CARRIER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {detectedCarrier && !carrierDraft ? (
              <small className="quick-edit-modal__hint">Detected carrier: {detectedCarrier}</small>
            ) : null}
          </label>

          <div className="quick-edit-modal__actions">
            <button
              type="button"
              className="quick-edit-modal__btn quick-edit-modal__btn--ghost"
              onClick={onCancel}
              disabled={saving || pushing}
            >
              Cancel
            </button>
            <button
              type="button"
              className="quick-edit-modal__btn orders-tracking-modal__push"
              onClick={() => onPushToEbay(order)}
              disabled={saving || pushing || !trackingDraft.trim() || !resolvedCarrier}
              title="Save and push tracking to eBay"
            >
              {pushing ? <LuLoader className="spin-icon" /> : <LuUpload />}
              <span>Push to eBay</span>
            </button>
            <button
              type="button"
              className="quick-edit-modal__btn quick-edit-modal__btn--primary"
              onClick={() => onSave(order)}
              disabled={saving || pushing}
            >
              {saving ? <LuLoader className="spin-icon" /> : <LuCheck />}
              <span>Save</span>
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
