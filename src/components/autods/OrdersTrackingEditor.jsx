import { LuCheck, LuLoader, LuPencil, LuUpload, LuX } from "react-icons/lu";
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

  if (isEditing) {
    return (
      <div className="orders-tracking-panel" onClick={(event) => event.stopPropagation()}>
        <label className="orders-tracking-panel__field">
          <span>Tracking number</span>
          <input
            type="text"
            className="orders-tracking-panel__input"
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

        <label className="orders-tracking-panel__field">
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
            <span className="orders-tracking-panel__hint">Detected: {detectedCarrier}</span>
          ) : null}
        </label>

        <div className="orders-tracking-panel__actions">
          <button
            type="button"
            className="orders-tracking-panel__btn orders-tracking-panel__btn--save"
            onClick={() => onSave(order)}
            disabled={saving || pushing}
          >
            {saving ? <LuLoader className="orders-tracking-panel__spin" /> : <LuCheck />}
            <span>Save</span>
          </button>
          <button
            type="button"
            className="orders-tracking-panel__btn orders-tracking-panel__btn--push"
            onClick={() => onPushToEbay(order)}
            disabled={saving || pushing || !trackingDraft.trim() || !resolvedCarrier}
            title="Save and push tracking to eBay"
          >
            {pushing ? <LuLoader className="orders-tracking-panel__spin" /> : <LuUpload />}
            <span>Push to eBay</span>
          </button>
          <button
            type="button"
            className="orders-tracking-panel__btn"
            onClick={onCancel}
            disabled={saving || pushing}
            aria-label="Cancel tracking edit"
          >
            <LuX />
          </button>
        </div>
      </div>
    );
  }

  if (compact) {
    const carrierLabel = order.carrierRaw || detectTrackingCarrier(order.trackingNumberRaw) || "";

    return (
      <button type="button" className="products-tracking-btn" onClick={() => onStartEdit(order)} title="Edit tracking & carrier">
        <span className={carrierLabel ? "orders-table__carrier" : "products-tracking-btn__placeholder"}>
          {carrierLabel || "—"}
        </span>
        <LuPencil className="products-tracking-btn__icon" />
      </button>
    );
  }

  return (
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
}
