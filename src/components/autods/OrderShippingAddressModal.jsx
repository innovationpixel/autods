import { useEffect, useState } from "react";
import { LuCheck, LuLoader, LuMapPin, LuX } from "react-icons/lu";

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri",
  "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina",
  "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
  "District of Columbia", "Puerto Rico"
];

function OrderShippingAddressModal({ open, order, saving = false, isBulk = false, bulkCount = 0, onClose, onSave }) {
  const [form, setForm] = useState({
    fullName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    stateOrProvince: "",
    postalCode: "",
    countryCode: "US",
    phone: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !saving) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, saving, onClose]);

  useEffect(() => {
    if (!open) return;
    const addr = order?.rawAddress ?? {};
    setForm({
      fullName: addr.fullName || order?.buyerName || "",
      addressLine1: addr.addressLine1 || "",
      addressLine2: addr.addressLine2 || "",
      city: addr.city || "",
      stateOrProvince: addr.stateOrProvince || "",
      postalCode: addr.postalCode || "",
      countryCode: addr.countryCode || "US",
      phone: addr.phone || (order?.buyerPhone !== "—" ? order?.buyerPhone : "") || "",
    });
    setError("");
  }, [open, order]);

  if (!open) return null;
  if (!isBulk && !order) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!form.fullName.trim()) {
      setError("Please enter the recipient full name.");
      return;
    }
    if (!form.addressLine1.trim()) {
      setError("Please enter the street address.");
      return;
    }
    if (!form.city.trim()) {
      setError("Please enter the city.");
      return;
    }
    if (!form.stateOrProvince.trim()) {
      setError("Please enter the state or province.");
      return;
    }
    if (!form.postalCode.trim()) {
      setError("Please enter the postal / ZIP code.");
      return;
    }

    setError("");
    onSave({
      ...form,
      fullName: form.fullName.trim(),
      addressLine1: form.addressLine1.trim(),
      addressLine2: form.addressLine2.trim(),
      city: form.city.trim(),
      stateOrProvince: form.stateOrProvince.trim(),
      postalCode: form.postalCode.trim(),
      countryCode: form.countryCode.trim().toUpperCase(),
      phone: form.phone.trim(),
    });
  };

  return (
    <div
      className="quick-edit-modal-layer"
      role="presentation"
      style={{
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        overflowY: "auto",
      }}
    >
      <button
        type="button"
        className="quick-edit-modal-layer__backdrop"
        aria-label="Close"
        onClick={onClose}
      />

      <section
        className="quick-edit-modal order-shipping-modal"
        role="dialog"
        aria-modal="true"
        aria-label={isBulk ? "Bulk Update Shipping Address" : "Edit Shipping Address"}
        style={{
          maxWidth: 580,
          width: "100%",
          margin: "auto",
          position: "relative",
          zIndex: 1,
          background: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 20px 48px rgba(15, 23, 42, 0.25)",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <button
          type="button"
          className="quick-edit-modal__close"
          aria-label="Close dialog"
          onClick={onClose}
          disabled={saving}
          style={{ position: "absolute", top: 14, right: 14, zIndex: 2 }}
        >
          <LuX />
        </button>

        <div
          className="quick-edit-modal__head"
          style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f1f5f9" }}
        >
          <span
            className="quick-edit-modal__icon"
            style={{ background: "#eff6ff", color: "#2563eb", borderRadius: "8px" }}
            aria-hidden="true"
          >
            <LuMapPin size={20} />
          </span>
          <div style={{ paddingRight: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#0f172a" }}>
              {isBulk ? "Bulk Update Shipping Address" : "Edit Shipping Address"}
            </h2>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>
              {isBulk
                ? `${bulkCount} orders selected for batch address update`
                : `Order #${order?.ebayOrderId || order?.id} · Recipient destination`}
            </p>
          </div>
        </div>

        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "6px",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              fontSize: "12.5px",
              color: "#1e40af",
              marginBottom: 16,
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              lineHeight: 1.45,
            }}
          >
            <LuMapPin style={{ marginTop: 2, flexShrink: 0, fontSize: 16 }} />
            <span>
              AliExpress validates addresses strictly. AutoDS normalizes standard abbreviations and states upon order placement.
            </span>
          </div>

          {error ? (
            <div
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                fontSize: "13px",
                marginBottom: 14,
              }}
            >
              {error}
            </div>
          ) : null}

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
              Recipient Full Name *
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                placeholder="e.g. Jane Doe"
                disabled={saving}
                style={{
                  padding: "9px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13.5px",
                  color: "#0f172a",
                  background: "#ffffff",
                  outline: "none",
                }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
              Street Address (Line 1) *
              <input
                type="text"
                value={form.addressLine1}
                onChange={(e) => handleChange("addressLine1", e.target.value)}
                placeholder="e.g. 123 Main Street"
                disabled={saving}
                style={{
                  padding: "9px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13.5px",
                  color: "#0f172a",
                  background: "#ffffff",
                  outline: "none",
                }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
              Address Line 2 (Apt / Suite / Unit)
              <input
                type="text"
                value={form.addressLine2}
                onChange={(e) => handleChange("addressLine2", e.target.value)}
                placeholder="e.g. Apt 4B"
                disabled={saving}
                style={{
                  padding: "9px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13.5px",
                  color: "#0f172a",
                  background: "#ffffff",
                  outline: "none",
                }}
              />
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                City *
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="e.g. Los Angeles"
                  disabled={saving}
                  style={{
                    padding: "9px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13.5px",
                    color: "#0f172a",
                    background: "#ffffff",
                    outline: "none",
                  }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                State / Province *
                <input
                  type="text"
                  list="us-states-list"
                  value={form.stateOrProvince}
                  onChange={(e) => handleChange("stateOrProvince", e.target.value)}
                  placeholder="e.g. California (or CA)"
                  disabled={saving}
                  style={{
                    padding: "9px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13.5px",
                    color: "#0f172a",
                    background: "#ffffff",
                    outline: "none",
                  }}
                />
                <datalist id="us-states-list">
                  {US_STATES.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                Postal / ZIP Code *
                <input
                  type="text"
                  value={form.postalCode}
                  onChange={(e) => handleChange("postalCode", e.target.value)}
                  placeholder="e.g. 90001"
                  disabled={saving}
                  style={{
                    padding: "9px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13.5px",
                    color: "#0f172a",
                    background: "#ffffff",
                    outline: "none",
                  }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                Country Code
                <select
                  value={form.countryCode}
                  onChange={(e) => handleChange("countryCode", e.target.value)}
                  disabled={saving}
                  style={{
                    padding: "9px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13.5px",
                    color: "#0f172a",
                    background: "#ffffff",
                    outline: "none",
                    height: "39px",
                  }}
                >
                  <option value="US">United States (US)</option>
                  <option value="CA">Canada (CA)</option>
                  <option value="GB">United Kingdom (GB)</option>
                  <option value="AU">Australia (AU)</option>
                  <option value="DE">Germany (DE)</option>
                  <option value="FR">France (FR)</option>
                  <option value="IT">Italy (IT)</option>
                  <option value="ES">Spain (ES)</option>
                  <option value="MX">Mexico (MX)</option>
                  <option value="BR">Brazil (BR)</option>
                </select>
              </label>
            </div>

            <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
              Phone Number
              <input
                type="text"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="e.g. 555-123-4567"
                disabled={saving}
                style={{
                  padding: "9px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13.5px",
                  color: "#0f172a",
                  background: "#ffffff",
                  outline: "none",
                }}
              />
            </label>
          </div>
        </div>

        <div
          className="quick-edit-modal__actions"
          style={{
            padding: "16px 24px",
            background: "#f8fafc",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <button
            type="button"
            className="quick-edit-modal__btn quick-edit-modal__btn--ghost"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="quick-edit-modal__btn quick-edit-modal__btn--primary"
            onClick={handleSave}
            disabled={saving}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#4f46e5",
              color: "#ffffff",
              fontWeight: 600,
            }}
          >
            {saving ? (
              <>
                <LuLoader className="spin-icon" />
                <span>Saving…</span>
              </>
            ) : (
              <>
                <LuCheck size={16} />
                <span>{isBulk ? `Apply to ${bulkCount} Orders` : "Save Address"}</span>
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}

export default OrderShippingAddressModal;
