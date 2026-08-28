import { useEffect, useState } from "react";
import { LuCheck, LuLoader, LuTruck, LuX } from "react-icons/lu";
import { detectTrackingCarrier, TRACKING_CARRIER_OPTIONS } from "./helpers";

function buildDrafts(orders) {
  const drafts = {};
  orders.forEach((order) => {
    drafts[order.id] = {
      tracking: order.trackingNumberRaw ?? "",
      carrier: order.carrierRaw ?? "",
      saved: false,
    };
  });
  return drafts;
}

function BulkTrackingModal({ open, orders, saving = false, onClose, onSaveOne, onSaveAll }) {
  const [drafts, setDrafts] = useState({});

  useEffect(() => {
    if (open) {
      setDrafts(buildDrafts(orders));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) {
    return null;
  }

  const updateDraft = (orderId, partial) => {
    setDrafts((current) => ({
      ...current,
      [orderId]: { ...current[orderId], ...partial, saved: false },
    }));
  };

  const handleTrackingChange = (order, value) => {
    const detected = detectTrackingCarrier(value);
    updateDraft(order.id, {
      tracking: value,
      carrier: drafts[order.id]?.carrier || detected || "",
    });
  };

  const handleSaveOne = async (order) => {
    const draft = drafts[order.id];
    if (!draft?.tracking?.trim()) {
      return;
    }

    const ok = await onSaveOne(order, {
      tracking_number: draft.tracking.trim(),
      carrier: draft.carrier || null,
    });

    if (ok) {
      setDrafts((current) => ({ ...current, [order.id]: { ...current[order.id], saved: true } }));
    }
  };

  const handleSaveAll = () => {
    const rows = orders
      .filter((order) => drafts[order.id]?.tracking?.trim() && !drafts[order.id]?.saved)
      .map((order) => ({
        order,
        payload: {
          tracking_number: drafts[order.id].tracking.trim(),
          carrier: drafts[order.id].carrier || null,
        },
      }));

    onSaveAll(rows, (savedIds) => {
      setDrafts((current) => {
        const next = { ...current };
        savedIds.forEach((id) => {
          next[id] = { ...next[id], saved: true };
        });
        return next;
      });
    });
  };

  const pendingCount = orders.filter((order) => drafts[order.id]?.tracking?.trim() && !drafts[order.id]?.saved).length;

  return (
    <div className="quick-edit-modal-layer" role="presentation">
      <button type="button" className="quick-edit-modal-layer__backdrop" aria-label="Close" onClick={onClose} />

      <section className="quick-edit-modal bulk-tracking-modal" role="dialog" aria-modal="true" aria-label="Add tracking">
        <button type="button" className="quick-edit-modal__close" aria-label="Close" onClick={onClose} disabled={saving}>
          <LuX />
        </button>

        <div className="quick-edit-modal__head">
          <span className="quick-edit-modal__icon" aria-hidden="true">
            <LuTruck />
          </span>
          <div>
            <h2>Add Tracking</h2>
            <p>Enter a tracking number for each order below, then save them one by one or all at once.</p>
          </div>
        </div>

        <div className="bulk-tracking-modal__list">
          {orders.map((order) => {
            const draft = drafts[order.id] ?? { tracking: "", carrier: "", saved: false };
            const rowSaving = saving === order.id;

            return (
              <div className="bulk-tracking-modal__row" key={order.id}>
                <div className="bulk-tracking-modal__row-info">
                  <strong>{order.orderId}</strong>
                  <span>{order.title}</span>
                </div>

                <input
                  type="text"
                  className="bulk-tracking-modal__input"
                  placeholder="Paste tracking number"
                  value={draft.tracking}
                  onChange={(event) => handleTrackingChange(order, event.target.value)}
                  disabled={Boolean(saving)}
                />

                <select
                  className="bulk-tracking-modal__select"
                  value={draft.carrier}
                  onChange={(event) => updateDraft(order.id, { carrier: event.target.value })}
                  disabled={Boolean(saving)}
                >
                  <option value="">Select carrier</option>
                  {TRACKING_CARRIER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className={`bulk-tracking-modal__save ${draft.saved ? "bulk-tracking-modal__save--done" : ""}`}
                  onClick={() => handleSaveOne(order)}
                  disabled={Boolean(saving) || !draft.tracking?.trim()}
                  title={draft.saved ? "Saved" : "Save this order's tracking"}
                >
                  {rowSaving ? <LuLoader className="spin-icon" /> : <LuCheck />}
                </button>
              </div>
            );
          })}
        </div>

        <div className="quick-edit-modal__actions">
          <button type="button" className="quick-edit-modal__btn quick-edit-modal__btn--ghost" onClick={onClose} disabled={Boolean(saving)}>
            Close
          </button>
          <button
            type="button"
            className="quick-edit-modal__btn quick-edit-modal__btn--primary"
            onClick={handleSaveAll}
            disabled={Boolean(saving) || !pendingCount}
          >
            {saving === "all" ? (
              <>
                <LuLoader className="spin-icon" />
                <span>Saving…</span>
              </>
            ) : (
              <span>Save all{pendingCount ? ` (${pendingCount})` : ""}</span>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}

export default BulkTrackingModal;
