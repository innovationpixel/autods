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
}) {
  const currentTracking = isEditing ? trackingDraft : (order.trackingNumberRaw || "");
  const detectedCarrier = detectTrackingCarrier(currentTracking);
  const resolvedCarrier = (isEditing ? carrierDraft : "") || order.carrierRaw || detectedCarrier || "";
  const carrierLabel = order.trackingNumberRaw ? (order.carrierRaw || detectedCarrier || "") : "";

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

  const trigger = (
    <div className="orders-tracking-display">
      <div className="orders-tracking-display__copy">
        {order.trackingUrl && order.trackingNumberRaw ? (
          <a
            href={order.trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="orders-order-id-link orders-table__mono"
            title={`Track shipment: ${order.trackingNumberRaw}`}
            onClick={(event) => event.stopPropagation()}
          >
            <strong>{order.trackingNumberRaw}</strong>
          </a>
        ) : (
          <button
            type="button"
            className="products-tracking-btn"
            onClick={() => onStartEdit(order)}
            title="Edit tracking"
          >
            <span className={order.trackingNumberRaw ? "orders-table__mono" : "products-tracking-btn__placeholder"}>
              {order.trackingNumberRaw || "Add tracking"}
            </span>
          </button>
        )}

        {carrierLabel ? <span className="orders-table__carrier">{carrierLabel}</span> : null}
        {order.trackingPushed ? <span className="orders-tracking-display__badge">On eBay</span> : null}

        <button
          type="button"
          className="products-source-cell__edit"
          onClick={() => onStartEdit(order)}
          title="Edit tracking"
          aria-label="Edit tracking"
        >
          <LuPencil />
        </button>
      </div>

      <button
        type="button"
        className={`orders-tracking-display__push ${order.trackingPushed ? "orders-tracking-display__push--pushed" : ""}`}
        onClick={(event) => {
          event.stopPropagation();
          onPushToEbay(order);
        }}
        disabled={pushing}
        title={
          order.trackingPushed
            ? "Tracking already on eBay — click to re-push tracking"
            : order.trackingNumberRaw
              ? "Push tracking number to eBay"
              : "Add tracking number and push to eBay"
        }
      >
        {pushing ? <LuLoader className="orders-tracking-panel__spin" /> : <LuUpload />}
        <span>{order.trackingPushed ? "Re-push to eBay" : "Push to eBay"}</span>
      </button>
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
              disabled={saving || pushing || !trackingDraft.trim()}
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
