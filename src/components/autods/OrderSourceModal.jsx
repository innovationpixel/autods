import React, { useEffect, useMemo, useState } from "react";
import { LuCheck, LuLayers, LuLoader, LuPencil, LuSearch, LuTriangleAlert, LuX } from "react-icons/lu";
import { getAliExpressProduct } from "../../services/AliExpressService";
import { normalizeListingSourceInput } from "./helpers";
import { getApiErrorMessage } from "../../utils/apiErrors";
import { resolveBestSku, resolveOrderVariant } from "../../utils/orderVariants";

const PLATFORM_OPTIONS = [
  { value: "aliexpress", label: "AliExpress" },
  { value: "amazon", label: "Amazon" },
  { value: "walmart", label: "Walmart" },
  { value: "etsy", label: "Etsy" },
  { value: "ebay", label: "eBay" },
];

function buildDimensions(skus) {
  const dimensions = new Map();

  (skus || []).forEach((sku) => {
    (sku.properties ?? []).forEach((prop) => {
      const name = String(prop.name ?? "").trim();
      const value = String(prop.value ?? "").trim();
      if (!name || !value) {
        return;
      }
      if (!dimensions.has(name)) {
        dimensions.set(name, new Set());
      }
      dimensions.get(name).add(value);
    });
  });

  return Array.from(dimensions.entries()).map(([name, values]) => ({
    name,
    values: Array.from(values),
  }));
}

function skuMatchesSelection(sku, selected) {
  return (sku.properties ?? []).every((prop) => {
    const chosen = selected[prop.name];
    return !chosen || chosen === prop.value;
  });
}

function OrderSourceItem({
  order,
  requireAliExpress = true,
  disabled = false,
  onChange,
}) {
  const [input, setInput] = useState("");
  const [platform, setPlatform] = useState("aliexpress");
  const [ebayNotice, setEbayNotice] = useState(false);
  const [lookupState, setLookupState] = useState("idle");
  const [lookupError, setLookupError] = useState("");
  const [product, setProduct] = useState(null);
  const [selected, setSelected] = useState({});

  const dimensions = useMemo(() => (product ? buildDimensions(product.skus) : []), [product]);

  const matchingSkus = useMemo(() => {
    if (!product) return [];
    return product.skus.filter((sku) => skuMatchesSelection(sku, selected));
  }, [product, selected]);

  const resolvedSku = useMemo(() => {
    if (!product) return null;
    if (product.skus.length === 1) return product.skus[0];
    return matchingSkus.length === 1 ? matchingSkus[0] : null;
  }, [product, matchingSkus]);

  const performLookup = async (targetInput, targetPlatform) => {
    const trimmed = (targetInput ?? input).trim();
    if (!trimmed) {
      setLookupState("error");
      setLookupError("Enter a source link or item ID first.");
      return;
    }

    const resolved = normalizeListingSourceInput(trimmed, targetPlatform ?? platform);

    if (resolved.source_platform !== "aliexpress" || !resolved.source_product_id) {
      setLookupState("unsupported");
      setLookupError("");
      return;
    }

    setLookupState("loading");
    setLookupError("");

    try {
      const res = await getAliExpressProduct(resolved.source_product_id);
      const skus = Array.isArray(res.data?.skus) ? res.data.skus : [];
      const dims = buildDimensions(skus);

      setProduct({ title: res.data?.title ?? "", image: res.data?.image_url ?? null, skus });

      if (skus.length <= 1 || dims.length === 0) {
        setLookupState("single");
        setSelected({});
        return;
      }

      // Check for existing SKU or best match
      let matched = null;
      if (order?.sourceSkuId) {
        matched = skus.find((sku) => String(sku.id) === String(order.sourceSkuId));
      }
      if (!matched) {
        matched = resolveBestSku(order, skus);
      }

      if (matched && matched.properties) {
        const prefill = {};
        matched.properties.forEach((prop) => {
          if (prop.name && prop.value) prefill[prop.name] = prop.value;
        });
        setSelected(prefill);
      } else {
        setSelected({});
      }

      setLookupState("ready");
    } catch (err) {
      setLookupState("error");
      setLookupError(getApiErrorMessage(err, "Could not look up variations for this item."));
    }
  };

  useEffect(() => {
    if (!order) return;
    const orderPlatform = (order.sourcePlatform ?? "aliexpress").toLowerCase();
    const isEbay =
      orderPlatform === "ebay" ||
      (typeof order.sourceUrl === "string" && order.sourceUrl.toLowerCase().includes("ebay."));

    const mustUseAliExpress = requireAliExpress || isEbay;
    const initialPlatform = mustUseAliExpress ? "aliexpress" : (order.sourcePlatform ?? "aliexpress");
    const initialInput = isEbay
      ? ""
      : (order.sourceUrl ?? (order.itemBuy && order.itemBuy !== "—" ? order.itemBuy : ""));

    setInput(initialInput);
    setPlatform(initialPlatform);
    setEbayNotice(isEbay);
    setLookupState("idle");
    setLookupError("");
    setProduct(null);
    setSelected({});

    if (initialInput && initialPlatform === "aliexpress") {
      performLookup(initialInput, initialPlatform);
    }
  }, [order, requireAliExpress]);

  // Notify parent on changes
  useEffect(() => {
    const trimmed = input.trim();
    const resolved = normalizeListingSourceInput(trimmed, platform);
    const skuToSave = resolvedSku || (product?.skus?.length === 1 ? product.skus[0] : null);

    onChange({
      source_input: resolved.source_input,
      source_platform: resolved.source_platform,
      source_sku_id: skuToSave ? String(skuToSave.id ?? skuToSave.sku_id ?? "") : null,
      source_variation: skuToSave && Array.isArray(skuToSave.properties)
        ? skuToSave.properties.map((p) => ({ name: p.name, value: p.value }))
        : null,
      isValid: Boolean(trimmed),
    });
  }, [input, platform, resolvedSku, product]);

  const handleSelectProperty = (propName, value) => {
    setSelected((prev) => ({ ...prev, [propName]: value }));
  };

  return (
    <div>
      {ebayNotice ? (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "10px 14px",
            marginBottom: 14,
            borderRadius: 8,
            background: "rgba(245, 158, 11, 0.12)",
            border: "1px solid rgba(245, 158, 11, 0.35)",
            color: "#b45309",
            fontSize: 12.5,
            lineHeight: 1.45,
          }}
        >
          <LuTriangleAlert style={{ flexShrink: 0, marginTop: 2, fontSize: 16 }} />
          <div>
            <strong>eBay Source Detected:</strong> All orders in AutoDS are processed through AliExpress.
            Please paste the AliExpress product link or item ID below to continue.
          </div>
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 12, marginBottom: 12 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600, color: "#334155" }}>
          <span>AliExpress link or item ID *</span>
          <input
            type="text"
            value={input}
            placeholder="https://www.aliexpress.com/item/... or product ID"
            onChange={(e) => {
              setInput(e.target.value);
              setLookupState("idle");
              setProduct(null);
            }}
            disabled={disabled}
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

        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600, color: "#334155" }}>
          <span>Platform</span>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            disabled={disabled || requireAliExpress}
            style={{
              padding: "8px 11px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontSize: "13px",
              color: "#0f172a",
              background: "#ffffff",
              outline: "none",
              height: "36px",
            }}
          >
            {PLATFORM_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={requireAliExpress && opt.value !== "aliexpress"}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => performLookup(input, platform)}
          disabled={disabled || lookupState === "loading" || !input.trim()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 14px",
            borderRadius: 6,
            border: "1px solid #cbd5e1",
            background: "#ffffff",
            color: "#334155",
            fontSize: 12.5,
            fontWeight: 600,
            cursor: disabled || lookupState === "loading" || !input.trim() ? "not-allowed" : "pointer",
          }}
        >
          {lookupState === "loading" ? <LuLoader className="spin-icon" /> : <LuSearch />}
          <span>{lookupState === "loading" ? "Checking variations…" : "Check for variations"}</span>
        </button>

        {lookupState === "ready" && product && (
          <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
            <LuCheck /> {product.skus.length} variation(s) loaded
          </span>
        )}
      </div>

      {lookupState === "single" ? (
        <p style={{ margin: "4px 0 8px", fontSize: 12, color: "#64748b" }}>
          Single variation product — no additional options required.
        </p>
      ) : null}

      {lookupState === "error" ? (
        <div style={{ padding: "8px 12px", background: "#fef2f2", color: "#b91c1c", borderRadius: 6, fontSize: 12, marginBottom: 10 }}>
          {lookupError}
        </div>
      ) : null}

      {lookupState === "ready" && product ? (
        <div
          style={{
            padding: 12,
            background: "#f8fafc",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {product.image ? (
              <img
                src={product.image}
                alt=""
                style={{ width: 40, height: 40, borderRadius: 4, objectFit: "cover", border: "1px solid #e2e8f0" }}
              />
            ) : null}
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>
              {product.title}
            </div>
          </div>

          {dimensions.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
              {dimensions.map((dim) => (
                <label key={dim.name} style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600, color: "#334155" }}>
                  <span>{dim.name}</span>
                  <select
                    value={selected[dim.name] || ""}
                    onChange={(e) => handleSelectProperty(dim.name, e.target.value)}
                    style={{
                      padding: "7px 10px",
                      borderRadius: 6,
                      border: "1px solid #cbd5e1",
                      fontSize: 12.5,
                      background: "#ffffff",
                    }}
                  >
                    <option value="">-- Choose {dim.name} --</option>
                    {dim.values.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          ) : null}

          {resolvedSku ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                background: "#ffffff",
                borderRadius: 6,
                border: "1px solid #cbd5e1",
                fontSize: 12,
              }}
            >
              <div>
                <strong>Selected SKU:</strong> {resolvedSku.id || resolvedSku.sku_id} · Price:{" "}
                <strong>${Number(resolvedSku.price || 0).toFixed(2)}</strong>
              </div>
              <span style={{ color: Number(resolvedSku.stock ?? 1) > 0 ? "#16a34a" : "#dc2626", fontWeight: 700 }}>
                {Number(resolvedSku.stock ?? 1) > 0 ? "In Stock" : "Out of Stock"}
              </span>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "#92400e" }}>
              Please select all variation options to match an AliExpress SKU.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function OrderSourceModal({
  open,
  order = null,
  orders = null,
  requireAliExpress = true,
  saving = false,
  onClose,
  onSave,
  onSaveAndProcess = null,
}) {
  const ordersList = orders && orders.length > 0 ? orders : (order ? [order] : []);
  const isMultiple = ordersList.length > 1;

  const [itemPayloads, setItemPayloads] = useState({});

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

  if (!open || !ordersList.length) return null;

  const handleItemChange = (orderId, payload) => {
    setItemPayloads((prev) => ({
      ...prev,
      [orderId]: payload,
    }));
  };

  const getPayload = () => {
    if (!isMultiple) {
      const singleId = ordersList[0].id;
      const payload = itemPayloads[singleId];
      if (!payload || !payload.source_input) {
        return null;
      }
      return {
        source_input: payload.source_input,
        source_platform: payload.source_platform,
        source_sku_id: payload.source_sku_id,
        source_variation: payload.source_variation,
      };
    } else {
      return itemPayloads;
    }
  };

  const handleSave = () => {
    const payload = getPayload();
    if (!payload) return;
    onSave(payload);
  };

  const handleSaveAndProcess = () => {
    const payload = getPayload();
    if (!payload) return;
    if (onSaveAndProcess) {
      onSaveAndProcess(payload);
    } else {
      onSave(payload);
    }
  };

  return (
    <div className="quick-edit-modal-layer" role="presentation" style={{ zIndex: 1100 }}>
      <button
        type="button"
        className="quick-edit-modal-layer__backdrop"
        aria-label="Close"
        onClick={() => !saving && onClose()}
      />

      <section
        className="quick-edit-modal order-source-modal"
        role="dialog"
        aria-modal="true"
        aria-label={isMultiple ? "Add Variants for Selected Orders" : "Edit Source Link"}
        style={{
          maxWidth: isMultiple ? 720 : 580,
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
          aria-label="Close"
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
            style={{ background: "#f5f3ff", color: "#7c3aed", borderRadius: "8px" }}
            aria-hidden="true"
          >
            <LuLayers size={20} />
          </span>
          <div style={{ paddingRight: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#0f172a" }}>
              {isMultiple
                ? `Add Variants (${ordersList.length} Orders)`
                : (requireAliExpress ? "Link AliExpress Supplier & Variation" : "Edit Source Link")}
            </h2>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>
              {isMultiple
                ? `Select or verify AliExpress supplier link and variations for ${ordersList.length} orders.`
                : "Enter the AliExpress product link or item ID required to fulfill this order."}
            </p>
          </div>
        </div>

        {/* Scrollable Order Items */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {ordersList.map((ord, idx) => {
            const purchasedVariant = resolveOrderVariant(ord);

            return (
              <div key={ord.id} style={{ marginBottom: idx < ordersList.length - 1 ? 0 : 4 }}>
                {/* Header for this Order */}
                {isMultiple && (
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
                          width: 38,
                          height: 38,
                          borderRadius: 6,
                          objectFit: "cover",
                          border: "1px solid #cbd5e1",
                          background: "#fff",
                        }}
                        onError={(e) => {
                          e.target.src = "https://placehold.co/38x38?text=Item";
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13.5, color: "#0f172a" }}>
                          Order #{ord.orderId || ord.id}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          Buyer: <strong>{ord.buyerName || "Customer"}</strong>
                          {purchasedVariant ? (
                            <span style={{ marginLeft: 8, color: "#2563eb", fontWeight: 600 }}>
                              · Purchased: {purchasedVariant}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Exact controls for this order */}
                <OrderSourceItem
                  order={ord}
                  requireAliExpress={requireAliExpress}
                  disabled={saving}
                  onChange={(data) => handleItemChange(ord.id, data)}
                />

                {/* Separator between orders */}
                {idx < ordersList.length - 1 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      margin: "24px 0 20px",
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
                        padding: "3px 10px",
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
              background: "#7c3aed",
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
                    ? `Save All Variants (${ordersList.length})`
                    : "Save Source Link"}
                </span>
              </>
            )}
          </button>
          {onSaveAndProcess && (
            <button
              type="button"
              className="quick-edit-modal__btn"
              onClick={handleSaveAndProcess}
              disabled={saving}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#059669",
                color: "#ffffff",
                fontWeight: 600,
                border: 0,
                borderRadius: 6,
                padding: "8px 16px",
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? <LuLoader className="spin-icon" /> : <LuCheck size={16} />}
              <span>
                {isMultiple
                  ? `Save & Process All (${ordersList.length})`
                  : "Save & Process"}
              </span>
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

export default OrderSourceModal;
