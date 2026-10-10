import React, { useEffect } from "react";
import { LuCheck, LuMapPin, LuPencil, LuShieldAlert, LuSparkles, LuX } from "react-icons/lu";

export default function AddressRecommendationModal({
  open,
  order,
  validation,
  onClose,
  onAcceptRecommended,
  onEditManual,
  accepting = false,
}) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || !validation) return null;

  const original = validation.original_address || {};
  const recommended = validation.recommended_address || {};
  const discrepancies = validation.discrepancies || [];
  const errors = validation.errors || [];

  return (
    <div className="quick-edit-modal-layer" role="presentation" style={{ zIndex: 1050 }}>
      <button
        type="button"
        className="quick-edit-modal-layer__backdrop"
        aria-label="Close"
        onClick={onClose}
      />

      <section
        className="quick-edit-modal address-recommendation-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Address Validation & AliExpress Recommendation"
        style={{ maxWidth: 740, width: "95%" }}
      >
        <button
          type="button"
          className="quick-edit-modal__close"
          aria-label="Close"
          onClick={onClose}
          disabled={accepting}
        >
          <LuX />
        </button>

        <div className="quick-edit-modal__head" style={{ marginBottom: 16 }}>
          <span
            className="quick-edit-modal__icon"
            style={{ background: "#fef3c7", color: "#d97706" }}
            aria-hidden="true"
          >
            <LuMapPin />
          </span>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#0f172a" }}>
              Address Validation Required
            </h2>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>
              AliExpress delivery validation requires exact address formatting. Please review and accept the recommended address to proceed.
            </p>
          </div>
        </div>

        {/* Informational banner */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "10px 14px",
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: 8,
            marginBottom: 16,
            color: "#92400e",
            fontSize: 12.5,
            lineHeight: 1.45,
          }}
        >
          <LuShieldAlert size={18} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong>Why is this needed?</strong> AliExpress dropshipping orders fail automatically if state abbreviations, non-numeric phones, or invalid postal formats are sent. To prevent rejected orders and failed charges, our system resolved the AliExpress-compliant format below.
          </div>
        </div>

        {/* Discrepancies list if any */}
        {discrepancies.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b" }}>
              Adjustments Detected ({discrepancies.length})
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
              {discrepancies.map((item, idx) => (
                <span
                  key={idx}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11.5,
                    padding: "3px 8px",
                    background: "#ede9fe",
                    color: "#5b21b6",
                    borderRadius: 4,
                    fontWeight: 500,
                  }}
                >
                  <LuSparkles size={11} /> {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Errors list if any */}
        {errors.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "8px 12px", color: "#991b1b", fontSize: 12 }}>
              <strong>Missing required details:</strong>
              <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
                {errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Side-by-side comparison */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
          {/* Your Address */}
          <div
            style={{
              padding: 14,
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>
                Your Address (eBay)
              </span>
              <span style={{ fontSize: 11, padding: "2px 6px", background: "#f1f5f9", color: "#475569", borderRadius: 4 }}>
                Raw
              </span>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.5, color: "#334155" }}>
              <div style={{ fontWeight: 600 }}>{original.fullName || "—"}</div>
              <div>{original.addressLine1 || "—"}</div>
              {original.addressLine2 ? <div>{original.addressLine2}</div> : null}
              <div>
                {[original.city, original.stateOrProvince, original.postalCode].filter(Boolean).join(", ")}
              </div>
              <div>{original.countryCode || "—"}</div>
              <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 4 }}>
                Phone: {original.phone || "—"}
              </div>
            </div>
          </div>

          {/* Recommended Address */}
          <div
            style={{
              padding: 14,
              borderRadius: 8,
              border: "2px solid #818cf8",
              background: "#f5f3ff",
              boxShadow: "0 2px 8px rgba(99, 102, 241, 0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#4338ca", display: "inline-flex", alignItems: "center", gap: 4 }}>
                <LuSparkles size={13} /> Recommended (AliExpress)
              </span>
              <span style={{ fontSize: 11, padding: "2px 6px", background: "#dcfce7", color: "#166534", borderRadius: 4, fontWeight: 600 }}>
                Valid
              </span>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.5, color: "#1e1b4b" }}>
              <div style={{ fontWeight: 600 }}>{recommended.fullName || "—"}</div>
              <div>{recommended.addressLine1 || "—"}</div>
              {recommended.addressLine2 ? <div>{recommended.addressLine2}</div> : null}
              <div>
                {[recommended.city, recommended.stateOrProvince, recommended.postalCode].filter(Boolean).join(", ")}
              </div>
              <div>{recommended.countryCode || "—"}</div>
              <div style={{ fontSize: 11.5, color: "#4f46e5", marginTop: 4 }}>
                Phone: {recommended.phone || "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Modal actions */}
        <div
          className="quick-edit-modal__actions"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}
        >
          <button
            type="button"
            className="quick-edit-modal__btn quick-edit-modal__btn--ghost"
            onClick={onClose}
            disabled={accepting}
          >
            Cancel
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              className="quick-edit-modal__btn"
              onClick={onEditManual}
              disabled={accepting}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "#f1f5f9",
                color: "#334155",
                border: "1px solid #cbd5e1",
              }}
            >
              <LuPencil size={14} />
              <span>Edit Address</span>
            </button>

            <button
              type="button"
              className="quick-edit-modal__btn quick-edit-modal__btn--primary"
              onClick={onAcceptRecommended}
              disabled={accepting || errors.length > 0}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#4f46e5",
                color: "#ffffff",
                padding: "8px 16px",
                fontWeight: 600,
              }}
            >
              <LuCheck size={16} />
              <span>{accepting ? "Applying Address…" : "Accept Recommended & Proceed"}</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
