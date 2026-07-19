import { useEffect } from "react";
import { LuLoader, LuTriangleAlert, LuX } from "react-icons/lu";

function ConfirmModal({
  open,
  title = "Are you sure?",
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  danger = true,
  saving = false,
  onConfirm,
  onClose,
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

      <section className="quick-edit-modal confirm-modal" role="alertdialog" aria-modal="true" aria-label={title}>
        <button type="button" className="quick-edit-modal__close" aria-label="Close" onClick={onClose} disabled={saving}>
          <LuX />
        </button>

        <div className="quick-edit-modal__head">
          <span className={`quick-edit-modal__icon ${danger ? "confirm-modal__icon--danger" : ""}`} aria-hidden="true">
            <LuTriangleAlert />
          </span>
          <div>
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
        </div>

        <div className="quick-edit-modal__actions">
          <button type="button" className="quick-edit-modal__btn quick-edit-modal__btn--ghost" onClick={onClose} disabled={saving}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={danger ? "quick-edit-modal__btn confirm-modal__btn--danger" : "quick-edit-modal__btn quick-edit-modal__btn--primary"}
            onClick={onConfirm}
            disabled={saving}
          >
            {saving ? (
              <>
                <LuLoader className="spin-icon" />
                <span>Working…</span>
              </>
            ) : (
              <span>{confirmLabel}</span>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}

export default ConfirmModal;
