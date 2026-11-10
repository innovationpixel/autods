import { useEffect, useState } from "react";
import { LuLoader, LuTriangleAlert, LuX } from "react-icons/lu";
import "../../assets/css/legal-documents.css";

function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = true,
  saving = false,
  requireAgreement = false,
  agreementLabel = null,
  onConfirm,
  onClose,
}) {
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (open) {
      setAgreed(false);
    }
  }, [open, title]);

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

  const confirmDisabled = saving || (requireAgreement && !agreed);

  return (
    <div
      className="quick-edit-modal-layer"
      role="presentation"
      style={{ position: "fixed", inset: 0, zIndex: 2050 }}
    >
      <button type="button" className="quick-edit-modal-layer__backdrop" aria-label="Close" onClick={onClose} />

      <section
        className="quick-edit-modal confirm-modal"
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        style={{ position: "relative", zIndex: 2051 }}
      >
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

        {requireAgreement ? (
          <div className="confirm-modal__agreement">
            <label>
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span>
                {agreementLabel || "I agree to the Terms & Conditions and Privacy Policy."}
              </span>
            </label>
          </div>
        ) : null}

        <div className="quick-edit-modal__actions">
          <button
            type="button"
            className="quick-edit-modal__btn quick-edit-modal__btn--ghost"
            onClick={onClose}
            disabled={saving}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`quick-edit-modal__btn ${danger ? "confirm-modal__btn--danger" : "quick-edit-modal__btn--primary"}`}
            onClick={() => {
              if (requireAgreement && !agreed) return;
              onConfirm?.();
            }}
            disabled={confirmDisabled}
            style={confirmDisabled && !saving ? { opacity: 0.55, cursor: "not-allowed" } : undefined}
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
