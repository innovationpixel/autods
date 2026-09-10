import { useEffect, useState } from "react";
import { LuPencil, LuX } from "react-icons/lu";

const INITIAL_STATE = {
  buyPriceEnabled: false,
  buyPrice: "",
  listPriceEnabled: false,
  listPrice: "",
  profitEnabled: false,
  profit: "",
  quantityEnabled: false,
  quantity: "1",
};

function BulkFieldRow({ enabled, onToggle, label, children }) {
  return (
    <div
      className={`bulk-edit-modal__row ${enabled ? "bulk-edit-modal__row--active" : ""}`}
      onClick={(e) => {
        if (!enabled && e.target.tagName !== "INPUT" && e.target.tagName !== "BUTTON") {
          onToggle(true);
        }
      }}
    >
      <input
        type="checkbox"
        className="bulk-edit-modal__row-check"
        checked={enabled}
        onChange={(event) => onToggle(event.target.checked)}
        aria-label={`Update ${label}`}
      />
      <span
        className="bulk-edit-modal__row-label"
        style={{ cursor: "pointer" }}
        onClick={() => onToggle(!enabled)}
      >
        {label}
      </span>
      <div className="bulk-edit-modal__row-control">{children}</div>
    </div>
  );
}

function BulkEditVariantsModal({
  open,
  variantCount = 0,
  isSelectionOnly = false,
  totalCount = null,
  onClose,
  onApply,
}) {
  const [fields, setFields] = useState(INITIAL_STATE);

  useEffect(() => {
    if (open) {
      setFields(INITIAL_STATE);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const hasSelection =
    fields.buyPriceEnabled || fields.listPriceEnabled || fields.profitEnabled || fields.quantityEnabled;

  const hasEmptySelectedField =
    (fields.buyPriceEnabled && (fields.buyPrice === "" || isNaN(Number(fields.buyPrice)) || Number(fields.buyPrice) < 0)) ||
    (fields.listPriceEnabled && (fields.listPrice === "" || isNaN(Number(fields.listPrice)) || Number(fields.listPrice) < 0)) ||
    (fields.profitEnabled && (fields.profit === "" || isNaN(Number(fields.profit)))) ||
    (fields.quantityEnabled && (fields.quantity === "" || isNaN(Number(fields.quantity)) || Number(fields.quantity) < 1));

  const canApply = hasSelection && !hasEmptySelectedField;

  const patch = (partial) => setFields((current) => ({ ...current, ...partial }));

  const handleApply = () => {
    if (!canApply) {
      return;
    }
    onApply(fields);
  };

  const handleClose = () => {
    setFields(INITIAL_STATE);
    onClose();
  };

  const targetDescription = isSelectionOnly
    ? `${variantCount} selected variant${variantCount === 1 ? "" : "s"}${totalCount ? ` (out of ${totalCount})` : ""}`
    : `${variantCount} variant${variantCount === 1 ? "" : "s"}`;

  return (
    <div className="bulk-edit-modal-layer" role="presentation">
      <button
        type="button"
        className="bulk-edit-modal-layer__backdrop"
        aria-label="Close bulk edit dialog"
        onClick={handleClose}
      />

      <section className="bulk-edit-modal" role="dialog" aria-modal="true" aria-label="Bulk edit variants">
        <button type="button" className="bulk-edit-modal__close" aria-label="Close" onClick={handleClose}>
          <LuX />
        </button>

        <div className="bulk-edit-modal__head">
          <span className="bulk-edit-modal__icon" aria-hidden="true">
            <LuPencil />
          </span>
          <div>
            <h2>Bulk Edit Variants</h2>
            <p>
              Update {targetDescription}. Check the fields you want to change, then apply.
            </p>
          </div>
        </div>

        <div className="bulk-edit-modal__fields">
          <BulkFieldRow
            label="Buy price"
            enabled={fields.buyPriceEnabled}
            onToggle={(buyPriceEnabled) => patch({ buyPriceEnabled })}
          >
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={fields.buyPrice}
              disabled={!fields.buyPriceEnabled}
              onChange={(event) => patch({ buyPrice: event.target.value })}
            />
          </BulkFieldRow>

          <BulkFieldRow
            label="Listing price"
            enabled={fields.listPriceEnabled}
            onToggle={(listPriceEnabled) => patch({ listPriceEnabled })}
          >
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={fields.listPrice}
              disabled={!fields.listPriceEnabled}
              onChange={(event) => patch({ listPrice: event.target.value })}
            />
          </BulkFieldRow>

          <BulkFieldRow
            label="Profit"
            enabled={fields.profitEnabled}
            onToggle={(profitEnabled) => patch({ profitEnabled })}
          >
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={fields.profit}
              disabled={!fields.profitEnabled}
              onChange={(event) => patch({ profit: event.target.value })}
            />
          </BulkFieldRow>

          <BulkFieldRow
            label="Quantity"
            enabled={fields.quantityEnabled}
            onToggle={(quantityEnabled) => patch({ quantityEnabled })}
          >
            <input
              type="number"
              min="1"
              value={fields.quantity}
              disabled={!fields.quantityEnabled}
              onChange={(event) => patch({ quantity: event.target.value })}
            />
          </BulkFieldRow>
        </div>

        {!hasSelection ? (
          <p className="bulk-edit-modal__hint">Select at least one field to update.</p>
        ) : hasEmptySelectedField ? (
          <p className="bulk-edit-modal__hint" style={{ color: "#e05252" }}>
            Please enter a valid value for each selected field before applying.
          </p>
        ) : null}

        <div className="bulk-edit-modal__actions">
          <button type="button" className="bulk-edit-modal__btn bulk-edit-modal__btn--ghost" onClick={handleClose}>
            Cancel
          </button>
          <button
            type="button"
            className="bulk-edit-modal__btn bulk-edit-modal__btn--primary"
            onClick={handleApply}
            disabled={!canApply}
          >
            <span>Apply to {isSelectionOnly ? `${variantCount} selected` : variantCount} variant{variantCount === 1 ? "" : "s"}</span>
          </button>
        </div>
      </section>
    </div>
  );
}

export function applyBulkEditToVariant(variant, changes) {
  const next = { ...variant };

  if (changes.buyPriceEnabled) {
    next.buyPrice = Number(changes.buyPrice) || 0;
  }

  if (changes.profitEnabled) {
    next.profit = Number(changes.profit) || 0;
  }

  if (changes.listPriceEnabled) {
    next.listingPrice = Number(changes.listPrice) || 0;
    next.profit = Math.round((next.listingPrice - Number(next.buyPrice ?? 0)) * 100) / 100;
  } else if (changes.buyPriceEnabled || changes.profitEnabled) {
    next.listingPrice = Math.round((Number(next.buyPrice ?? 0) + Number(next.profit ?? 0)) * 100) / 100;
  }

  if (changes.quantityEnabled) {
    next.quantity = Math.max(1, Number(changes.quantity) || 1);
  }

  return next;
}

export default BulkEditVariantsModal;
