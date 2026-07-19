import { useEffect } from "react";
import { LuLoader, LuPencil, LuX } from "react-icons/lu";

function QuickEditModal({
  open,
  title,
  description,
  label,
  type = "text",
  value = "",
  onChange,
  onSave,
  onClose,
  saving = false,
  placeholder,
  hint,
  min,
  step,
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

  if (!open) {
    return null;
  }

  return (
    <div className="quick-edit-modal-layer" role="presentation">
      <button type="button" className="quick-edit-modal-layer__backdrop" aria-label="Close" onClick={onClose} />

      <section className="quick-edit-modal" role="dialog" aria-modal="true" aria-label={title}>
        <button type="button" className="quick-edit-modal__close" aria-label="Close" onClick={onClose} disabled={saving}>
          <LuX />
        </button>

        <div className="quick-edit-modal__head">
          <span className="quick-edit-modal__icon" aria-hidden="true">
            <LuPencil />
          </span>
          <div>
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
        </div>

        <label className="quick-edit-modal__field">
          <span>{label}</span>
          <input
            type={type}
            min={min}
            step={step}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onSave();
              }
              if (event.key === "Escape") {
                onClose();
              }
            }}
            placeholder={placeholder}
            disabled={saving}
            autoFocus
          />
          {hint ? <small className="quick-edit-modal__hint">{hint}</small> : null}
        </label>

        <div className="quick-edit-modal__actions">
          <button type="button" className="quick-edit-modal__btn quick-edit-modal__btn--ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="quick-edit-modal__btn quick-edit-modal__btn--primary" onClick={onSave} disabled={saving}>
            {saving ? (
              <>
                <LuLoader className="spin-icon" />
                <span>Saving…</span>
              </>
            ) : (
              <span>Save</span>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}

export default QuickEditModal;
