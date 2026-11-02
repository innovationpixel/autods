import React, { useEffect, useState } from "react";
import {
  LuCheck,
  LuLoader,
  LuMapPin,
  LuPencil,
  LuShieldAlert,
  LuSparkles,
  LuTriangleAlert,
  LuX,
} from "react-icons/lu";
import { getOrderCheckoutQuote } from "../../services/OrderService";

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri",
  "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina",
  "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
  "District of Columbia", "Puerto Rico",
];

const STATE_ABBR_MAP = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado",
  CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho",
  IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
  OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", DC: "District of Columbia", PR: "Puerto Rico",
};

function normalizeOrderAddress(order) {
  const addr = order?.rawAddress ?? {};
  const rawState = (addr.stateOrProvince || "").trim();
  const expandedState = STATE_ABBR_MAP[rawState.toUpperCase()] || rawState;
  const buyerName = order?.buyerName !== "—" ? order?.buyerName : "";

  return {
    fullName: addr.fullName || buyerName || "",
    addressLine1: addr.addressLine1 || "",
    addressLine2: addr.addressLine2 || "",
    city: addr.city || "",
    stateOrProvince: expandedState,
    postalCode: addr.postalCode || "",
    countryCode: (addr.countryCode || "US").toUpperCase(),
    phone: addr.phone || (order?.buyerPhone !== "—" ? order?.buyerPhone : "") || "",
  };
}

function OrderShippingAddressModal({
  open,
  order = null,
  orders = null,
  saving = false,
  onClose,
  onSave,
}) {
  const ordersList = orders && orders.length > 0 ? orders : (order ? [order] : []);
  const isMultiple = ordersList.length > 1;

  const [forms, setForms] = useState({});
  const [validations, setValidations] = useState({});
  const [loadingValidations, setLoadingValidations] = useState(false);
  const [errors, setErrors] = useState({});
  const [showEditManual, setShowEditManual] = useState({});

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

  // Initialize forms and fetch address validations on modal open
  useEffect(() => {
    if (!open || !ordersList.length) return;

    const initialForms = {};
    const manualToggles = {};
    ordersList.forEach((ord) => {
      initialForms[ord.id] = normalizeOrderAddress(ord);
      manualToggles[ord.id] = true; // Always show editable fields
    });

    setForms(initialForms);
    setShowEditManual(manualToggles);
    setErrors({});
    setLoadingValidations(true);

    // Fetch checkout quote / address validation for each order in parallel
    Promise.allSettled(
      ordersList.map((ord) =>
        getOrderCheckoutQuote(ord.id)
          .then((res) => ({ id: ord.id, validation: res.data?.address_validation }))
          .catch(() => ({ id: ord.id, validation: null }))
      )
    ).then((results) => {
      const valMap = {};
      results.forEach((r) => {
        if (r.status === "fulfilled" && r.value) {
          valMap[r.value.id] = r.value.validation;
        }
      });
      setValidations(valMap);
      setLoadingValidations(false);
    });
  }, [open, orders, order]);

  if (!open || !ordersList.length) return null;

  const handleChange = (orderId, field, value) => {
    setForms((prev) => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] || {}),
        [field]: value,
      },
    }));
    if (errors[orderId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    }
  };

  const handleApplyRecommended = (orderId, rec) => {
    if (!rec) return;
    setForms((prev) => ({
      ...prev,
      [orderId]: {
        fullName: rec.fullName || prev[orderId]?.fullName || "",
        addressLine1: rec.addressLine1 || prev[orderId]?.addressLine1 || "",
        addressLine2: rec.addressLine2 || "",
        city: rec.city || prev[orderId]?.city || "",
        stateOrProvince: rec.stateOrProvince || prev[orderId]?.stateOrProvince || "",
        postalCode: rec.postalCode || prev[orderId]?.postalCode || "",
        countryCode: (rec.countryCode || prev[orderId]?.countryCode || "US").toUpperCase(),
        phone: rec.phone || prev[orderId]?.phone || "",
      },
    }));
    setShowEditManual((prev) => ({ ...prev, [orderId]: true }));
    if (errors[orderId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    }
  };

  const handleSave = () => {
    const nextErrors = {};
    let hasError = false;

    for (const ord of ordersList) {
      const f = forms[ord.id] || {};
      if (!f.fullName || !f.fullName.trim()) {
        nextErrors[ord.id] = "Recipient full name is required.";
        hasError = true;
      } else if (!f.addressLine1 || !f.addressLine1.trim()) {
        nextErrors[ord.id] = "Street address line 1 is required.";
        hasError = true;
      } else if (!f.city || !f.city.trim()) {
        nextErrors[ord.id] = "City is required by AliExpress.";
        hasError = true;
      } else if (!f.stateOrProvince || !f.stateOrProvince.trim()) {
        nextErrors[ord.id] = "State / Province is required.";
        hasError = true;
      } else if (!f.postalCode || !f.postalCode.trim()) {
        nextErrors[ord.id] = "Postal / ZIP code is required.";
        hasError = true;
      }
    }

    if (hasError) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});

    if (!isMultiple) {
      const singleId = ordersList[0].id;
      const f = forms[singleId];
      onSave({
        fullName: f.fullName.trim(),
        addressLine1: f.addressLine1.trim(),
        addressLine2: (f.addressLine2 || "").trim(),
        city: f.city.trim(),
        stateOrProvince: f.stateOrProvince.trim(),
        postalCode: f.postalCode.trim(),
        countryCode: (f.countryCode || "US").trim().toUpperCase(),
        phone: (f.phone || "").trim(),
      });
    } else {
      const cleaned = {};
      ordersList.forEach((ord) => {
        const f = forms[ord.id] || {};
        cleaned[ord.id] = {
          fullName: (f.fullName || "").trim(),
          addressLine1: (f.addressLine1 || "").trim(),
          addressLine2: (f.addressLine2 || "").trim(),
          city: (f.city || "").trim(),
          stateOrProvince: (f.stateOrProvince || "").trim(),
          postalCode: (f.postalCode || "").trim(),
          countryCode: (f.countryCode || "US").trim().toUpperCase(),
          phone: (f.phone || "").trim(),
        };
      });
      onSave(cleaned);
    }
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
        onClick={() => !saving && onClose()}
      />

      <section
        className="quick-edit-modal order-shipping-modal"
        role="dialog"
        aria-modal="true"
        aria-label={isMultiple ? "Fix Shipping Addresses" : "Edit Shipping Address"}
        style={{
          maxWidth: 780,
          width: "96%",
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

        {/* Modal Header */}
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
              {isMultiple
                ? `Fix Shipping Addresses (${ordersList.length} Orders)`
                : "Address Validation & Fixation"}
            </h2>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>
              {isMultiple
                ? `Review the current eBay address, AliExpress recommended format, and adjust details for ${ordersList.length} orders.`
                : `Order #${ordersList[0]?.orderId || ordersList[0]?.id} · Review current vs recommended address.`}
            </p>
          </div>
        </div>

        {/* Informational Banner */}
        <div style={{ padding: "12px 24px 0" }}>
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              background: "#fffbeb",
              border: "1px solid #fde68a",
              color: "#92400e",
              fontSize: "12.5px",
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              lineHeight: 1.45,
            }}
          >
            <LuShieldAlert size={17} style={{ flexShrink: 0, marginTop: 1, color: "#d97706" }} />
            <div>
              <strong>AliExpress Address Rules:</strong> AliExpress orders fail automatically if state abbreviations, non-numeric phones, or invalid postal formats are sent. Review the recommended address format below or edit manually.
            </div>
          </div>
        </div>

        {/* Scrollable Orders List */}
        <div style={{ padding: "18px 24px", overflowY: "auto", flex: 1 }}>
          {ordersList.map((ord, idx) => {
            const form = forms[ord.id] || normalizeOrderAddress(ord);
            const ordError = errors[ord.id];
            const val = validations[ord.id];
            const raw = ord.rawAddress ?? {};
            const cityMissing = !form.city || !form.city.trim();

            const originalAddr = val?.original_address || {
              fullName: raw.fullName || ord.buyerName || "—",
              addressLine1: raw.addressLine1 || "—",
              addressLine2: raw.addressLine2 || "",
              city: raw.city || "—",
              stateOrProvince: raw.stateOrProvince || "—",
              postalCode: raw.postalCode || "—",
              countryCode: raw.countryCode || "US",
              phone: raw.phone || (ord.buyerPhone !== "—" ? ord.buyerPhone : "") || "—",
            };

            const recommendedAddr = val?.recommended_address || {
              fullName: form.fullName || originalAddr.fullName,
              addressLine1: form.addressLine1 || originalAddr.addressLine1,
              addressLine2: form.addressLine2 || "",
              city: form.city || (raw.city ? raw.city : ""),
              stateOrProvince: form.stateOrProvince || STATE_ABBR_MAP[(raw.stateOrProvince || "").toUpperCase()] || raw.stateOrProvince || "",
              postalCode: form.postalCode || raw.postalCode || "",
              countryCode: form.countryCode || "US",
              phone: form.phone || (raw.phone ? raw.phone.replace(/[^\d\-\/]/g, "") : "") || "5551234567",
            };

            const discrepancies = val?.discrepancies || [];
            const valErrors = val?.errors || [];

            return (
              <div key={ord.id} style={{ marginBottom: idx < ordersList.length - 1 ? 0 : 4 }}>
                {/* Order Top Bar */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: "#f8fafc",
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    marginBottom: 14,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <img
                      src={ord.imageUrl || "/img/product-placeholder.png"}
                      alt=""
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 6,
                        objectFit: "cover",
                        border: "1px solid #cbd5e1",
                        background: "#fff",
                      }}
                      onError={(e) => {
                        e.target.src = "https://placehold.co/40x40?text=Item";
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: "#0f172a" }}>
                        Order #{ord.orderId || ord.id}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        Buyer: <strong>{ord.buyerName || "Customer"}</strong> · {ord.siteId ? `eBay ${ord.siteId}` : "eBay"}
                      </div>
                    </div>
                  </div>

                  {cityMissing ? (
                    <span
                      style={{
                        fontSize: 11.5,
                        padding: "3px 8px",
                        borderRadius: 4,
                        background: "#fee2e2",
                        color: "#dc2626",
                        fontWeight: 700,
                      }}
                    >
                      ⚠️ Missing City
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: 11.5,
                        padding: "3px 8px",
                        borderRadius: 4,
                        background: "#f1f5f9",
                        color: "#475569",
                        fontWeight: 600,
                      }}
                    >
                      Order {idx + 1} of {ordersList.length}
                    </span>
                  )}
                </div>

                {/* Adjustments Detected if any */}
                {discrepancies.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {discrepancies.map((item, dIdx) => (
                        <span
                          key={dIdx}
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

                {/* Missing required details alert if any */}
                {valErrors.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: 6,
                        padding: "8px 12px",
                        color: "#991b1b",
                        fontSize: 12,
                      }}
                    >
                      <strong>AliExpress Notice:</strong> {valErrors.join("; ")}
                    </div>
                  </div>
                )}

                {ordError && (
                  <div
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#b91c1c",
                      fontSize: "12.5px",
                      marginBottom: 12,
                      fontWeight: 600,
                    }}
                  >
                    {ordError}
                  </div>
                )}

                {/* SIDE-BY-SIDE COMPARISON: Current Address (eBay) vs Recommended Address (AliExpress) */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 14,
                    marginBottom: 16,
                  }}
                >
                  {/* Current Address (eBay) Card */}
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          color: "#64748b",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Current Address (eBay)
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 6px",
                          background: "#e2e8f0",
                          color: "#475569",
                          borderRadius: 4,
                          fontWeight: 600,
                        }}
                      >
                        Raw
                      </span>
                    </div>

                    <div style={{ fontSize: 12.5, lineHeight: 1.5, color: "#334155" }}>
                      <div style={{ fontWeight: 600, color: "#0f172a" }}>
                        {originalAddr.fullName || "—"}
                      </div>
                      <div>{originalAddr.addressLine1 || "—"}</div>
                      {originalAddr.addressLine2 ? <div>{originalAddr.addressLine2}</div> : null}
                      <div>
                        {[originalAddr.city, originalAddr.stateOrProvince, originalAddr.postalCode]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                      <div>{originalAddr.countryCode || "US"}</div>
                      <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 4 }}>
                        Phone: {originalAddr.phone || "—"}
                      </div>
                    </div>
                  </div>

                  {/* Recommended Address (AliExpress) Card */}
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 8,
                      border: "2px solid #818cf8",
                      background: "#f5f3ff",
                      boxShadow: "0 2px 8px rgba(99, 102, 241, 0.08)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11.5,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            color: "#4338ca",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            letterSpacing: "0.05em",
                          }}
                        >
                          <LuSparkles size={13} /> Recommended (AliExpress)
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            padding: "2px 6px",
                            background: "#dcfce7",
                            color: "#166534",
                            borderRadius: 4,
                            fontWeight: 600,
                          }}
                        >
                          Valid Format
                        </span>
                      </div>

                      <div style={{ fontSize: 12.5, lineHeight: 1.5, color: "#1e1b4b" }}>
                        <div style={{ fontWeight: 600 }}>{recommendedAddr.fullName || "—"}</div>
                        <div>{recommendedAddr.addressLine1 || "—"}</div>
                        {recommendedAddr.addressLine2 ? <div>{recommendedAddr.addressLine2}</div> : null}
                        <div>
                          {[
                            recommendedAddr.city || (cityMissing ? "—" : ""),
                            recommendedAddr.stateOrProvince,
                            recommendedAddr.postalCode,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </div>
                        <div>{recommendedAddr.countryCode || "US"}</div>
                        <div style={{ fontSize: 11.5, color: "#4f46e5", marginTop: 4 }}>
                          Phone: {recommendedAddr.phone || "—"}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        onClick={() => handleApplyRecommended(ord.id, recommendedAddr)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "5px 12px",
                          borderRadius: 6,
                          background: "#4f46e5",
                          color: "#ffffff",
                          fontSize: 11.5,
                          fontWeight: 600,
                          border: 0,
                          cursor: "pointer",
                        }}
                      >
                        <LuSparkles size={12} />
                        <span>Apply Recommended</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Editable Address Form Fields */}
                <div
                  style={{
                    padding: 14,
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    background: "#ffffff",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#475569",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <LuPencil size={13} />
                    <span>Editable Address Details</span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 11 }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "12px", fontWeight: 600, color: "#334155" }}>
                      Recipient Full Name *
                      <input
                        type="text"
                        value={form.fullName}
                        onChange={(e) => handleChange(ord.id, "fullName", e.target.value)}
                        placeholder="e.g. Jane Doe"
                        disabled={saving}
                        style={{
                          padding: "8px 11px",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          fontSize: "13px",
                          color: "#0f172a",
                          background: "#ffffff",
                          outline: "none",
                        }}
                      />
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "12px", fontWeight: 600, color: "#334155" }}>
                      Street Address (Line 1) *
                      <input
                        type="text"
                        value={form.addressLine1}
                        onChange={(e) => handleChange(ord.id, "addressLine1", e.target.value)}
                        placeholder="e.g. 123 Main Street"
                        disabled={saving}
                        style={{
                          padding: "8px 11px",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          fontSize: "13px",
                          color: "#0f172a",
                          background: "#ffffff",
                          outline: "none",
                        }}
                      />
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "12px", fontWeight: 600, color: "#334155" }}>
                      Address Line 2 (Apt / Suite / Unit)
                      <input
                        type="text"
                        value={form.addressLine2}
                        onChange={(e) => handleChange(ord.id, "addressLine2", e.target.value)}
                        placeholder="e.g. Apt 4B"
                        disabled={saving}
                        style={{
                          padding: "8px 11px",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          fontSize: "13px",
                          color: "#0f172a",
                          background: "#ffffff",
                          outline: "none",
                        }}
                      />
                    </label>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "12px", fontWeight: 600, color: cityMissing ? "#b45309" : "#334155" }}>
                        <span>
                          City * {cityMissing && <span style={{ color: "#dc2626", fontWeight: 700 }}>(Please enter valid City)</span>}
                        </span>
                        <input
                          type="text"
                          value={form.city}
                          onChange={(e) => handleChange(ord.id, "city", e.target.value)}
                          placeholder="e.g. Los Angeles"
                          disabled={saving}
                          style={{
                            padding: "8px 11px",
                            borderRadius: "6px",
                            border: cityMissing ? "2px solid #f59e0b" : "1px solid #cbd5e1",
                            background: cityMissing ? "#fffbeb" : "#ffffff",
                            fontSize: "13px",
                            color: "#0f172a",
                            outline: "none",
                          }}
                        />
                      </label>

                      <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "12px", fontWeight: 600, color: "#334155" }}>
                        State / Province *
                        <input
                          type="text"
                          list={`us-states-${ord.id}`}
                          value={form.stateOrProvince}
                          onChange={(e) => handleChange(ord.id, "stateOrProvince", e.target.value)}
                          placeholder="e.g. California (or CA)"
                          disabled={saving}
                          style={{
                            padding: "8px 11px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            fontSize: "13px",
                            color: "#0f172a",
                            background: "#ffffff",
                            outline: "none",
                          }}
                        />
                        <datalist id={`us-states-${ord.id}`}>
                          {US_STATES.map((s) => (
                            <option key={s} value={s} />
                          ))}
                        </datalist>
                      </label>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "12px", fontWeight: 600, color: "#334155" }}>
                        Postal / ZIP Code *
                        <input
                          type="text"
                          value={form.postalCode}
                          onChange={(e) => handleChange(ord.id, "postalCode", e.target.value)}
                          placeholder="e.g. 90001"
                          disabled={saving}
                          style={{
                            padding: "8px 11px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            fontSize: "13px",
                            color: "#0f172a",
                            background: "#ffffff",
                            outline: "none",
                          }}
                        />
                      </label>

                      <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "12px", fontWeight: 600, color: "#334155" }}>
                        Country Code
                        <select
                          value={form.countryCode}
                          onChange={(e) => handleChange(ord.id, "countryCode", e.target.value)}
                          disabled={saving}
                          style={{
                            padding: "8px 11px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            fontSize: "13px",
                            color: "#0f172a",
                            background: "#ffffff",
                            outline: "none",
                            height: "37px",
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
                        </select>
                      </label>
                    </div>

                    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "12px", fontWeight: 600, color: "#334155" }}>
                      Phone Number
                      <input
                        type="text"
                        value={form.phone}
                        onChange={(e) => handleChange(ord.id, "phone", e.target.value)}
                        placeholder="e.g. 555-123-4567"
                        disabled={saving}
                        style={{
                          padding: "8px 11px",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          fontSize: "13px",
                          color: "#0f172a",
                          background: "#ffffff",
                          outline: "none",
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Separator between orders in multiple mode */}
                {idx < ordersList.length - 1 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      margin: "28px 0 24px",
                    }}
                  >
                    <div style={{ flex: 1, height: 1, background: "#cbd5e1" }} />
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#64748b",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        background: "#f1f5f9",
                        padding: "4px 12px",
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      Next Order (#{ordersList[idx + 1]?.orderId || ordersList[idx + 1]?.id})
                    </span>
                    <div style={{ flex: 1, height: 1, background: "#cbd5e1" }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Actions */}
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
              background: "#2563eb",
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
                <span>
                  {isMultiple
                    ? `Save All Addresses (${ordersList.length})`
                    : "Save Address"}
                </span>
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}

export default OrderShippingAddressModal;
