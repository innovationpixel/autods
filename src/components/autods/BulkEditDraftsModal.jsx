import { useEffect, useState } from "react";
import { LuLoader, LuPencil, LuX } from "react-icons/lu";
import { getListingImageUrl } from "./helpers";

const CONDITION_OPTIONS = [
  { value: "NEW", label: "New" },
  { value: "USED", label: "Used" },
  { value: "REFURBISHED", label: "Refurbished" },
];

const INITIAL_STATE = {
  quantityEnabled: false,
  quantity: "1",
  conditionEnabled: false,
  condition: "NEW",
  buyPriceEnabled: false,
  buyPrice: "",
  profitEnabled: false,
  profit: "",
  listPriceEnabled: false,
  listPrice: "",
  titlePrefixEnabled: false,
  titlePrefix: "",
  titleSuffixEnabled: false,
  titleSuffix: "",
  titleFindEnabled: false,
  titleFind: "",
  titleReplace: "",
};

function BulkFieldRow({ enabled, onToggle, label, children }) {
  return (
    <div className={`bulk-edit-modal__row ${enabled ? "bulk-edit-modal__row--active" : ""}`}>
      <input
        type="checkbox"
        className="bulk-edit-modal__row-check"
        checked={enabled}
        onChange={(event) => onToggle(event.target.checked)}
        aria-label={`Update ${label}`}
      />
      <span className="bulk-edit-modal__row-label">{label}</span>
      <div className="bulk-edit-modal__row-control">{children}</div>
    </div>
  );
}

function BulkEditDraftsModal({
  open,
  drafts = [],
  saving = false,
  onClose,
  onApply,
  itemLabel = "draft",
  itemLabelPlural,
}) {
  const [fields, setFields] = useState(INITIAL_STATE);

  useEffect(() => {
    if (open) {
      setFields(INITIAL_STATE);
    }
  }, [open, drafts]);

  if (!open) {
    return null;
  }

  const count = drafts.length;
  const pluralLabel = itemLabelPlural ?? `${itemLabel}s`;
  const dialogLabel = `Bulk edit ${pluralLabel}`;
  const hasSelection =
    fields.quantityEnabled ||
    fields.conditionEnabled ||
    fields.buyPriceEnabled ||
    fields.profitEnabled ||
    fields.listPriceEnabled ||
    fields.titlePrefixEnabled ||
    fields.titleSuffixEnabled ||
    fields.titleFindEnabled;

  const patch = (partial) => setFields((current) => ({ ...current, ...partial }));

  const handleApply = () => {
    if (!hasSelection) {
      return;
    }
    onApply(fields);
  };

  const handleClose = () => {
    setFields(INITIAL_STATE);
    onClose();
  };

  return (
    <div className="bulk-edit-modal-layer" role="presentation">
      <button
        type="button"
        className="bulk-edit-modal-layer__backdrop"
        aria-label="Close bulk edit dialog"
        onClick={handleClose}
      />

      <section className="bulk-edit-modal" role="dialog" aria-modal="true" aria-label={dialogLabel}>
        <button type="button" className="bulk-edit-modal__close" aria-label="Close" onClick={handleClose}>
          <LuX />
        </button>

        <div className="bulk-edit-modal__head">
          <span className="bulk-edit-modal__icon" aria-hidden="true">
            <LuPencil />
          </span>
          <div>
            <h2>Bulk Edit</h2>
            <p>
              Update {count} selected {count === 1 ? itemLabel : pluralLabel}. Check the fields you want to change, then apply.
            </p>
          </div>
        </div>

        {drafts.length ? (
          <div className="bulk-edit-modal__drafts">
            {drafts.slice(0, 4).map((draft) => {
              const image = getListingImageUrl(draft);
              return (
                <div className="bulk-edit-modal__draft" key={draft.id}>
                  {image ? <img src={image} alt="" /> : <span className="bulk-edit-modal__draft-fallback" />}
                  <span>{draft.title}</span>
                </div>
              );
            })}
            {drafts.length > 4 ? (
              <div className="bulk-edit-modal__draft bulk-edit-modal__draft--more">+{drafts.length - 4} more</div>
            ) : null}
          </div>
        ) : null}

        <div className="bulk-edit-modal__fields">
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

          <BulkFieldRow
            label="Condition"
            enabled={fields.conditionEnabled}
            onToggle={(conditionEnabled) => patch({ conditionEnabled })}
          >
            <select
              value={fields.condition}
              disabled={!fields.conditionEnabled}
              onChange={(event) => patch({ condition: event.target.value })}
            >
              {CONDITION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </BulkFieldRow>

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
            label="List price"
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
            label="Title prefix"
            enabled={fields.titlePrefixEnabled}
            onToggle={(titlePrefixEnabled) => patch({ titlePrefixEnabled })}
          >
            <input
              type="text"
              placeholder="Add to start of title"
              value={fields.titlePrefix}
              disabled={!fields.titlePrefixEnabled}
              onChange={(event) => patch({ titlePrefix: event.target.value })}
            />
          </BulkFieldRow>

          <BulkFieldRow
            label="Title suffix"
            enabled={fields.titleSuffixEnabled}
            onToggle={(titleSuffixEnabled) => patch({ titleSuffixEnabled })}
          >
            <input
              type="text"
              placeholder="Add to end of title"
              value={fields.titleSuffix}
              disabled={!fields.titleSuffixEnabled}
              onChange={(event) => patch({ titleSuffix: event.target.value })}
            />
          </BulkFieldRow>

          <BulkFieldRow
            label="Find in title"
            enabled={fields.titleFindEnabled}
            onToggle={(titleFindEnabled) => patch({ titleFindEnabled })}
          >
            <div className="bulk-edit-modal__replace">
              <input
                type="text"
                placeholder="Find"
                value={fields.titleFind}
                disabled={!fields.titleFindEnabled}
                onChange={(event) => patch({ titleFind: event.target.value })}
              />
              <input
                type="text"
                placeholder="Replace with"
                value={fields.titleReplace}
                disabled={!fields.titleFindEnabled}
                onChange={(event) => patch({ titleReplace: event.target.value })}
              />
            </div>
          </BulkFieldRow>
        </div>

        {!hasSelection ? (
          <p className="bulk-edit-modal__hint">Select at least one field to update.</p>
        ) : null}

        <div className="bulk-edit-modal__actions">
          <button type="button" className="bulk-edit-modal__btn bulk-edit-modal__btn--ghost" onClick={handleClose}>
            Cancel
          </button>
          <button
            type="button"
            className="bulk-edit-modal__btn bulk-edit-modal__btn--primary"
            onClick={handleApply}
            disabled={saving || !hasSelection}
          >
            {saving ? (
              <>
                <LuLoader className="spin-icon" />
                <span>Applying…</span>
              </>
            ) : (
              <span>Apply to {count} {count === 1 ? itemLabel : pluralLabel}</span>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}

export function applyBulkEditToForm(form, changes) {
  const next = { ...form };

  if (changes.quantityEnabled) {
    next.quantity = Math.max(1, Number(changes.quantity) || 1);
  }

  if (changes.conditionEnabled) {
    next.condition = changes.condition;
  }

  if (changes.buyPriceEnabled) {
    next.monitoring = {
      ...next.monitoring,
      buyPrice: Number(changes.buyPrice) || 0,
    };
  }

  if (changes.profitEnabled) {
    next.monitoring = {
      ...next.monitoring,
      profit: Number(changes.profit) || 0,
    };
  }

  if (changes.listPriceEnabled) {
    next.price = Number(changes.listPrice) || 0;
  } else if (changes.buyPriceEnabled || changes.profitEnabled) {
    const buyPrice = Number(next.monitoring?.buyPrice) || 0;
    const profit = Number(next.monitoring?.profit) || 0;
    next.price = Math.round((buyPrice + profit) * 100) / 100;
  }

  let title = String(next.title ?? "");

  if (changes.titlePrefixEnabled && changes.titlePrefix) {
    title = `${changes.titlePrefix}${title}`;
  }

  if (changes.titleSuffixEnabled && changes.titleSuffix) {
    title = `${title}${changes.titleSuffix}`;
  }

  if (changes.titleFindEnabled && changes.titleFind) {
    title = title.split(changes.titleFind).join(changes.titleReplace ?? "");
  }

  next.title = title.slice(0, 80);

  return next;
}

export default BulkEditDraftsModal;
