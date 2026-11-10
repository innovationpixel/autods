import { useEffect, useState } from "react";
import { LuLoader, LuPackage, LuX } from "react-icons/lu";

function parseQty(value) {
  if (value === "" || value === null || value === undefined) {
    return 0;
  }
  const num = Number(value);
  return Number.isFinite(num) ? Math.max(0, Math.floor(num)) : 0;
}

function VariantStockModal({
  open,
  item,
  form,
  onChange,
  onSave,
  onClose,
  saving = false,
}) {
  const [applyAllQty, setApplyAllQty] = useState("");

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    setApplyAllQty("");
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || !form) {
    return null;
  }

  const variants = Array.isArray(form.variants) ? form.variants : [];
  const totalActiveStock = variants.reduce(
    (sum, v) => (v.selected === false ? sum : sum + parseQty(v.quantity)),
    0,
  );

  const handleVariantQtyChange = (variantId, rawValue) => {
    const nextQty = rawValue === "" ? "" : Math.max(0, Math.floor(Number(rawValue) || 0));
    const nextVariants = variants.map((v) =>
      v.id === variantId ? { ...v, quantity: nextQty } : v,
    );
    const nextTotal = nextVariants.reduce(
      (sum, v) => (v.selected === false ? sum : sum + parseQty(v.quantity)),
      0,
    );
    onChange({
      ...form,
      variants: nextVariants,
      quantity: nextTotal,
    });
  };

  const handleApplyAll = () => {
    if (applyAllQty === "") {
      return;
    }
    const parsed = Math.max(0, Math.floor(Number(applyAllQty) || 0));
    const nextVariants = variants.map((v) =>
      v.selected === false ? { ...v, quantity: 0 } : { ...v, quantity: parsed },
    );
    const activeCount = nextVariants.filter((v) => v.selected !== false).length;
    onChange({
      ...form,
      variants: nextVariants,
      quantity: parsed * activeCount,
    });
  };

  return (
    <div
      className="quick-edit-modal-layer"
      role="presentation"
      style={{ position: "fixed", inset: 0, zIndex: 2050 }}
    >
      <button
        type="button"
        className="quick-edit-modal-layer__backdrop"
        aria-label="Close"
        onClick={onClose}
        disabled={saving}
      />

      <section
        className="quick-edit-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Update Variant Stock Quantities"
        style={{
          position: "relative",
          zIndex: 2051,
          width: "min(560px, calc(100vw - 32px))",
          margin: "8vh auto 0",
        }}
      >
        <button
          type="button"
          className="quick-edit-modal__close"
          aria-label="Close"
          onClick={onClose}
          disabled={saving}
        >
          <LuX />
        </button>

        <div className="quick-edit-modal__head">
          <span className="quick-edit-modal__icon" aria-hidden="true">
            <LuPackage />
          </span>
          <div>
            <h2>Update Variant Stock Quantities</h2>
            {item?.title ? (
              <p
                style={{
                  maxWidth: 420,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={item.title}
              >
                {item.title}
              </p>
            ) : null}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            padding: "8px 10px",
            borderRadius: 6,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>
            Set all active variants to:
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="number"
              min="0"
              step="1"
              placeholder="Qty"
              value={applyAllQty}
              disabled={saving}
              onChange={(event) => setApplyAllQty(event.target.value)}
              style={{
                width: 84,
                height: 32,
                padding: "0 8px",
                border: "1px solid #dfe3ed",
                borderRadius: 6,
                fontSize: 13,
              }}
            />
            <button
              type="button"
              className="quick-edit-modal__btn quick-edit-modal__btn--ghost"
              style={{ height: 32, minWidth: 82, padding: "0 12px", fontSize: 12 }}
              disabled={saving || applyAllQty === "" || Number(applyAllQty) < 0}
              onClick={handleApplyAll}
            >
              Apply all
            </button>
          </div>
        </div>

        <div
          style={{
            maxHeight: 300,
            overflowY: "auto",
            display: "grid",
            gap: 8,
            paddingRight: 2,
          }}
        >
          {variants.map((variant, index) => {
            const isActive = variant.selected !== false;
            const qtyVal = variant.quantity === "" ? "" : parseQty(variant.quantity);
            const isOos = isActive && parseQty(variant.quantity) === 0;

            return (
              <div
                key={variant.id ?? index}
                style={{
                  display: "grid",
                  gridTemplateColumns: "36px minmax(0, 1fr) 108px",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "1px solid #eceef3",
                  background: isActive ? "#ffffff" : "#f8fafc",
                  opacity: isActive ? 1 : 0.65,
                }}
              >
                {variant.image ? (
                  <img
                    src={variant.image}
                    alt={variant.label ?? ""}
                    referrerPolicy="no-referrer"
                    style={{
                      width: 36,
                      height: 36,
                      objectFit: "cover",
                      borderRadius: 4,
                      border: "1px solid #e1e4ec",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 4,
                      border: "1px solid #e1e4ec",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#94a3b8",
                      background: "#f8fafc",
                    }}
                  >
                    <LuPackage size={16} />
                  </div>
                )}

                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#2b2a33",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={variant.label}
                  >
                    {variant.label || `Variant ${index + 1}`}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                    {variant.ebaySku ? (
                      <span style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>
                        {variant.ebaySku}
                      </span>
                    ) : null}
                    {!isActive ? (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#64748b",
                          background: "#e2e8f0",
                          padding: "1px 6px",
                          borderRadius: 4,
                        }}
                      >
                        Disabled (0)
                      </span>
                    ) : isOos ? (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#b91c1c",
                          background: "#fee2e2",
                          padding: "1px 6px",
                          borderRadius: 4,
                        }}
                      >
                        Out of stock
                      </span>
                    ) : null}
                  </div>
                </div>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={isActive ? qtyVal : 0}
                  disabled={saving || !isActive}
                  onChange={(event) => handleVariantQtyChange(variant.id, event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !saving) {
                      onSave();
                    }
                    if (event.key === "Escape" && !saving) {
                      onClose();
                    }
                  }}
                  style={{
                    width: "100%",
                    height: 34,
                    padding: "0 10px",
                    border: "1px solid #dfe3ed",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 700,
                    textAlign: "right",
                  }}
                />
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 12,
            color: "#475569",
            paddingTop: 4,
            borderTop: "1px solid #eceef3",
          }}
        >
          <span>Quantity updates sync via eBay Inventory API.</span>
          <strong>Total active stock: {totalActiveStock}</strong>
        </div>

        <div className="quick-edit-modal__actions">
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
            onClick={onSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <LuLoader className="spin-icon" />
                <span>Saving…</span>
              </>
            ) : (
              <span>Save Stock</span>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}

export default VariantStockModal;

