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

function OrderShippingAddressModal({ open, order, saving = false, onClose, onSave }) {
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
    if (!open || !order) return;
    const addr = order.rawAddress ?? {};
    setForm({
      fullName: addr.fullName || order.buyerName || "",
      addressLine1: addr.addressLine1 || "",
      addressLine2: addr.addressLine2 || "",
      city: addr.city || "",
      stateOrProvince: addr.stateOrProvince || "",
      postalCode: addr.postalCode || "",
      countryCode: addr.countryCode || "US",
      phone: addr.phone || (order.buyerPhone !== "—" ? order.buyerPhone : ""),
    });
    setError("");
  }, [open, order]);

  if (!open || !order) return null;

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
    <div className="orders-modal-backdrop" onClick={onClose}>
      <section
        className="order-source-modal card-wrapper"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 560, width: "100%" }}
      >
        <header className="order-source-modal__header">
          <div>
            <h3>Edit Shipping Address</h3>
            <p className="order-source-modal__subtitle">
              Order #{order.ebayOrderId || order.id} · Recipient destination
            </p>
          </div>
          <button
            type="button"
            className="order-source-modal__close"
            onClick={onClose}
            aria-label="Close dialog"
            disabled={saving}
          >
            <LuX />
          </button>
        </header>

        <div style={{ padding: "0 20px 20px" }}>
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "6px",
              background: "rgba(59, 130, 246, 0.08)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
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
              AliExpress validates states/provinces using full names (e.g. <strong>California</strong> instead of <strong>CA</strong>). AutoDS automatically normalizes standard abbreviations upon placing the order.
            </span>
          </div>

          {error ? (
            <div
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#b91c1c",
                fontSize: "13px",
                marginBottom: 14,
              }}
            >
              {error}
            </div>
          ) : null}

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "13px", fontWeight: 500 }}>
              Recipient Full Name *
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                placeholder="e.g. Jane Doe"
                disabled={saving}
                style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border-color, #d1d5db)" }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "13px", fontWeight: 500 }}>
              Street Address (Line 1) *
              <input
                type="text"
                value={form.addressLine1}
                onChange={(e) => handleChange("addressLine1", e.target.value)}
                placeholder="e.g. 123 Main Street"
                disabled={saving}
                style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border-color, #d1d5db)" }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "13px", fontWeight: 500 }}>
              Address Line 2 (Apt / Suite / Unit)
              <input
                type="text"
                value={form.addressLine2}
                onChange={(e) => handleChange("addressLine2", e.target.value)}
                placeholder="e.g. Apt 4B"
                disabled={saving}
                style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border-color, #d1d5db)" }}
              />
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "13px", fontWeight: 500 }}>
                City *
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="e.g. Los Angeles"
                  disabled={saving}
                  style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border-color, #d1d5db)" }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "13px", fontWeight: 500 }}>
                State / Province *
                <input
                  type="text"
                  list="us-states-list"
                  value={form.stateOrProvince}
                  onChange={(e) => handleChange("stateOrProvince", e.target.value)}
                  placeholder="e.g. California (or CA)"
                  disabled={saving}
                  style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border-color, #d1d5db)" }}
                />
                <datalist id="us-states-list">
                  {US_STATES.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "13px", fontWeight: 500 }}>
                Postal / ZIP Code *
                <input
                  type="text"
                  value={form.postalCode}
                  onChange={(e) => handleChange("postalCode", e.target.value)}
                  placeholder="e.g. 90001"
                  disabled={saving}
                  style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border-color, #d1d5db)" }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "13px", fontWeight: 500 }}>
                Country Code
                <select
                  value={form.countryCode}
                  onChange={(e) => handleChange("countryCode", e.target.value)}
                  disabled={saving}
                  style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border-color, #d1d5db)" }}
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

            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "13px", fontWeight: 500 }}>
              Phone Number
              <input
                type="text"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="e.g. 555-123-4567"
                disabled={saving}
                style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border-color, #d1d5db)" }}
              />
            </label>
          </div>
        </div>

        <div className="quick-edit-modal__actions" style={{ padding: "14px 20px", borderTop: "1px solid var(--border-color, #e5e7eb)" }}>
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
          >
            {saving ? (
              <>
                <LuLoader className="spin-icon" />
                <span>Saving…</span>
              </>
            ) : (
              <>
                <LuCheck />
                <span>Save Address</span>
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}

export default OrderShippingAddressModal;
