import React, { useEffect, useMemo, useState } from "react";
import {
  LuArrowRight,
  LuCheck,
  LuExternalLink,
  LuLayers,
  LuLoader,
  LuMapPin,
  LuRefreshCw,
  LuShieldAlert,
  LuSparkles,
  LuTriangleAlert,
  LuWrench,
  LuX,
} from "react-icons/lu";
import {
  acceptRecommendedAddress,
  getOrderCheckoutQuote,
  placeAliExpressOrder,
  updateOrderShippingAddress,
  updateOrderSource,
} from "../../services/OrderService";
import { getAliExpressProduct } from "../../services/AliExpressService";
import { resolveBestSku, resolveOrderVariant } from "../../utils/orderVariants";
import { getApiErrorMessage } from "../../utils/apiErrors";

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

function buildDimensions(skus) {
  const dimensions = new Map();
  (skus || []).forEach((sku) => {
    (sku.properties ?? []).forEach((prop) => {
      const name = String(prop.name ?? "").trim();
      const value = String(prop.value ?? "").trim();
      if (!name || !value) return;
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

function isAddressError(message) {
  const m = String(message ?? "").toLowerCase();
  return (
    m.includes("address") ||
    m.includes("city") ||
    m.includes("zip") ||
    m.includes("postal") ||
    m.includes("state") ||
    m.includes("province") ||
    m.includes("formatting rules") ||
    m.includes("delivery address") ||
    m.includes("recipient") ||
    m.includes("phone")
  );
}

function isVariationError(message) {
  const m = String(message ?? "").toLowerCase();
  return (
    m.includes("variation") ||
    m.includes("sku") ||
    m.includes("multiple variations") ||
    m.includes("select the correct variation") ||
    m.includes("sku_not_exist")
  );
}

export default function BulkOrderFixationModal({
  open,
  failedOrders = [],
  processingMethod = "autods",
  selectedBuyerAccountId = null,
  onClose,
  onSuccess,
}) {
  const [filterType, setFilterType] = useState("all");
  const [orderStates, setOrderStates] = useState({});
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !bulkRunning) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, bulkRunning, onClose]);

  // Initialize per-order states whenever failedOrders changes
  useEffect(() => {
    if (!open || !failedOrders.length) return;

    const initial = {};
    failedOrders.forEach(({ order, error, type }) => {
      const addr = order.rawAddress ?? {};
      const buyerName = order.buyerName !== "—" ? order.buyerName : "";
      const rawState = addr.stateOrProvince || "";
      const expandedState = STATE_ABBR_MAP[rawState.toUpperCase()] || rawState;
      const isAddr = type === "address" || isAddressError(error);
      const isVar = type === "variation" || isVariationError(error);

      initial[order.id] = {
        status: "pending", // "pending" | "processing" | "success" | "error"
        lastError: error || "",
        activeTab: isAddr ? "address" : (isVar ? "variation" : "address"),
        hasAddressIssue: isAddr,
        hasVariationIssue: isVar,
        addressForm: {
          fullName: addr.fullName || buyerName || "",
          addressLine1: addr.addressLine1 || "",
          addressLine2: addr.addressLine2 || "",
          city: addr.city || "",
          stateOrProvince: expandedState,
          postalCode: addr.postalCode || "",
          countryCode: addr.countryCode || "US",
          phone: addr.phone || (order.buyerPhone !== "—" ? order.buyerPhone : "") || "",
        },
        recommendedAddress: null,
        loadingRecommendation: false,
        variationState: {
          loading: false,
          productId: order.sourceProductId || order.itemBuy || "",
          product: null,
          dimensions: [],
          selected: {},
          matchedSku: null,
          error: "",
        },
      };
    });

    setOrderStates(initial);

    // Auto-fetch recommended address and product variation for each order
    failedOrders.forEach(({ order, error, type }) => {
      const isAddr = type === "address" || isAddressError(error);
      const isVar = type === "variation" || isVariationError(error);

      if (isAddr) {
        getOrderCheckoutQuote(order.id, {
          processing_method: processingMethod,
          buyer_account_id: selectedBuyerAccountId || undefined,
        })
          .then((res) => {
            const rec = res.data?.address_validation?.recommended_address;
            if (rec && typeof rec === "object") {
              setOrderStates((prev) => {
                const cur = prev[order.id];
                if (!cur) return prev;
                return {
                  ...prev,
                  [order.id]: {
                    ...cur,
                    recommendedAddress: rec,
                    // If user's form was missing city or state, fill from recommendation automatically
                    addressForm: {
                      ...cur.addressForm,
                      city: cur.addressForm.city || rec.city || "",
                      stateOrProvince: cur.addressForm.stateOrProvince || rec.stateOrProvince || "",
                      postalCode: cur.addressForm.postalCode || rec.postalCode || "",
                    },
                  },
                };
              });
            }
          })
          .catch(() => {
            // Recommendation fetch error is non-blocking
          });
      }

      const prodId = order.sourceProductId || order.itemBuy;
      if (prodId) {
        setOrderStates((prev) => {
          const cur = prev[order.id];
          if (!cur) return prev;
          return {
            ...prev,
            [order.id]: {
              ...cur,
              variationState: { ...cur.variationState, loading: true },
            },
          };
        });

        getAliExpressProduct(prodId)
          .then((res) => {
            const prod = res.data;
            const skus = Array.isArray(prod?.skus) ? prod.skus : [];
            const dims = buildDimensions(skus);
            const bestSku = resolveBestSku(order, skus);

            const initialSelected = {};
            if (bestSku?.properties) {
              bestSku.properties.forEach((p) => {
                if (p.name && p.value) {
                  initialSelected[p.name] = p.value;
                }
              });
            }

            setOrderStates((prev) => {
              const cur = prev[order.id];
              if (!cur) return prev;
              return {
                ...prev,
                [order.id]: {
                  ...cur,
                  variationState: {
                    ...cur.variationState,
                    loading: false,
                    product: prod,
                    dimensions: dims,
                    selected: initialSelected,
                    matchedSku: bestSku,
                    error: "",
                  },
                },
              };
            });
          })
          .catch((err) => {
            setOrderStates((prev) => {
              const cur = prev[order.id];
              if (!cur) return prev;
              return {
                ...prev,
                [order.id]: {
                  ...cur,
                  variationState: {
                    ...cur.variationState,
                    loading: false,
                    error: getApiErrorMessage(err, "Could not load AliExpress variations."),
                  },
                },
              };
            });
          });
      }
    });
  }, [open, failedOrders, processingMethod, selectedBuyerAccountId]);

  if (!open || !failedOrders.length) return null;

  const totalOrders = failedOrders.length;
  const addressIssueCount = failedOrders.filter(({ error, type }) => type === "address" || isAddressError(error)).length;
  const variationIssueCount = failedOrders.filter(({ error, type }) => type === "variation" || isVariationError(error)).length;

  const resolvedCount = Object.values(orderStates).filter((s) => s.status === "success").length;
  const pendingCount = totalOrders - resolvedCount;

  const handleFieldChange = (orderId, field, value) => {
    setOrderStates((prev) => {
      const cur = prev[orderId];
      if (!cur) return prev;
      return {
        ...prev,
        [orderId]: {
          ...cur,
          addressForm: {
            ...cur.addressForm,
            [field]: value,
          },
        },
      };
    });
  };

  const handleApplyRecommendation = (orderId) => {
    setOrderStates((prev) => {
      const cur = prev[orderId];
      if (!cur || !cur.recommendedAddress) return prev;
      const rec = cur.recommendedAddress;
      return {
        ...prev,
        [orderId]: {
          ...cur,
          addressForm: {
            ...cur.addressForm,
            fullName: rec.fullName || cur.addressForm.fullName,
            addressLine1: rec.addressLine1 || cur.addressForm.addressLine1,
            addressLine2: rec.addressLine2 || "",
            city: rec.city || cur.addressForm.city,
            stateOrProvince: rec.stateOrProvince || cur.addressForm.stateOrProvince,
            postalCode: rec.postalCode || cur.addressForm.postalCode,
            countryCode: rec.countryCode || cur.addressForm.countryCode,
            phone: rec.phone || cur.addressForm.phone,
          },
        },
      };
    });
  };

  const handleSelectVariationProperty = (orderId, propName, value) => {
    setOrderStates((prev) => {
      const cur = prev[orderId];
      if (!cur) return prev;
      const nextSelected = { ...cur.variationState.selected, [propName]: value };
      const skus = cur.variationState.product?.skus || [];
      const matched = skus.find((s) => skuMatchesSelection(s, nextSelected)) || null;

      return {
        ...prev,
        [orderId]: {
          ...cur,
          variationState: {
            ...cur.variationState,
            selected: nextSelected,
            matchedSku: matched,
          },
        },
      };
    });
  };

  const executeFixAndProcessOrder = async (orderId) => {
    const cur = orderStates[orderId];
    if (!cur) return false;

    setOrderStates((prev) => ({
      ...prev,
      [orderId]: { ...prev[orderId], status: "processing", lastError: "" },
    }));

    try {
      // 1. If address form has values, update shipping address
      const form = cur.addressForm;
      if (form.fullName && form.addressLine1 && form.city && form.stateOrProvince && form.postalCode) {
        await updateOrderShippingAddress(orderId, {
          fullName: form.fullName.trim(),
          addressLine1: form.addressLine1.trim(),
          addressLine2: (form.addressLine2 || "").trim(),
          city: form.city.trim(),
          stateOrProvince: form.stateOrProvince.trim(),
          postalCode: form.postalCode.trim(),
          countryCode: form.countryCode || "US",
          phone: form.phone || "",
        });
      }

      // 2. If variation has a matched SKU, update order source
      const matchedSku = cur.variationState.matchedSku;
      const orderItem = failedOrders.find((f) => f.order.id === orderId)?.order;
      if (matchedSku && orderItem) {
        const prodId = cur.variationState.productId || orderItem.sourceProductId || orderItem.itemBuy;
        await updateOrderSource(orderId, {
          source_input: orderItem.sourceUrl || `https://www.aliexpress.com/item/${prodId}.html`,
          source_platform: "aliexpress",
          source_sku_id: String(matchedSku.id ?? matchedSku.sku_id ?? ""),
          source_variation: Array.isArray(matchedSku.properties)
            ? matchedSku.properties.map((p) => ({ name: p.name, value: p.value }))
            : null,
        });
      }

      // 3. Re-place order on AliExpress
      const placePayload = {
        processing_method: processingMethod,
        buyer_account_id:
          processingMethod === "buyer" && selectedBuyerAccountId ? Number(selectedBuyerAccountId) : undefined,
        auto_accept_recommended_address: true,
      };

      await placeAliExpressOrder(orderId, placePayload);

      setOrderStates((prev) => ({
        ...prev,
        [orderId]: { ...prev[orderId], status: "success", lastError: "" },
      }));

      return true;
    } catch (err) {
      const errMsg = getApiErrorMessage(err, "Order could not be processed on AliExpress.");
      setOrderStates((prev) => ({
        ...prev,
        [orderId]: { ...prev[orderId], status: "error", lastError: errMsg },
      }));
      return false;
    }
  };

  const handleFixAndProcessAll = async () => {
    const pendingOrders = failedOrders.filter((f) => orderStates[f.order.id]?.status !== "success");
    if (!pendingOrders.length) return;

    setBulkRunning(true);
    setBulkProgress({ current: 0, total: pendingOrders.length });

    let count = 0;
    for (const { order } of pendingOrders) {
      count += 1;
      setBulkProgress({ current: count, total: pendingOrders.length });
      await executeFixAndProcessOrder(order.id);
    }

    setBulkRunning(false);

    if (onSuccess) {
      onSuccess();
    }
  };

  const filteredOrders = failedOrders.filter(({ error, type }) => {
    if (filterType === "address") return type === "address" || isAddressError(error);
    if (filterType === "variation") return type === "variation" || isVariationError(error);
    return true;
  });

  return (
    <div className="quick-edit-modal-layer" role="presentation" style={{ zIndex: 1100 }}>
      <button
        type="button"
        className="quick-edit-modal-layer__backdrop"
        aria-label="Close"
        onClick={() => !bulkRunning && onClose()}
      />

      <section
        className="quick-edit-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Fix Blocked Orders"
        style={{
          maxWidth: 880,
          width: "95%",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          padding: 0,
          overflow: "hidden",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            background: "#ffffff",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 42,
                height: 42,
                borderRadius: 10,
                background: "#fef3c7",
                color: "#d97706",
                fontSize: 22,
                flexShrink: 0,
              }}
            >
              <LuWrench />
            </span>
            <div>
              <h2 style={{ fontSize: 19, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                Fix Blocked Orders ({totalOrders})
              </h2>
              <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13.5 }}>
                AliExpress could not automatically fulfill {totalOrders === 1 ? "this order" : "these orders"}.
                Correct the shipping address or select the product variation below, then click{" "}
                <strong>Fix & Proceed</strong>.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="quick-edit-modal__close"
            aria-label="Close"
            onClick={onClose}
            disabled={bulkRunning}
            style={{ position: "static", marginLeft: 12 }}
          >
            <LuX size={20} />
          </button>
        </div>

        {/* Filter Tabs & Summary Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 24px",
            background: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
            fontSize: 13,
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => setFilterType("all")}
              style={{
                padding: "5px 12px",
                borderRadius: 6,
                border: "1px solid",
                borderColor: filterType === "all" ? "#3b82f6" : "#cbd5e1",
                background: filterType === "all" ? "#eff6ff" : "#ffffff",
                color: filterType === "all" ? "#1d4ed8" : "#475569",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              All Blocked ({totalOrders})
            </button>
            {addressIssueCount > 0 && (
              <button
                type="button"
                onClick={() => setFilterType("address")}
                style={{
                  padding: "5px 12px",
                  borderRadius: 6,
                  border: "1px solid",
                  borderColor: filterType === "address" ? "#f59e0b" : "#cbd5e1",
                  background: filterType === "address" ? "#fffbeb" : "#ffffff",
                  color: filterType === "address" ? "#b45309" : "#475569",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                📍 Address Fixation ({addressIssueCount})
              </button>
            )}
            {variationIssueCount > 0 && (
              <button
                type="button"
                onClick={() => setFilterType("variation")}
                style={{
                  padding: "5px 12px",
                  borderRadius: 6,
                  border: "1px solid",
                  borderColor: filterType === "variation" ? "#8b5cf6" : "#cbd5e1",
                  background: filterType === "variation" ? "#f5f3ff" : "#ffffff",
                  color: filterType === "variation" ? "#6d28d9" : "#475569",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                🎨 Variation Selection ({variationIssueCount})
              </button>
            )}
          </div>

          <div style={{ color: "#64748b", fontWeight: 500 }}>
            Resolved: <strong style={{ color: "#16a34a" }}>{resolvedCount}</strong> / {totalOrders}
          </div>
        </div>

        {/* Scrollable Orders List */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
            background: "#f1f5f9",
          }}
        >
          {filteredOrders.map(({ order, error, type }) => {
            const state = orderStates[order.id] || {};
            const isResolved = state.status === "success";
            const isProcessing = state.status === "processing";
            const form = state.addressForm || {};
            const rec = state.recommendedAddress;
            const varState = state.variationState || {};
            const currentTab = state.activeTab || (type === "variation" ? "variation" : "address");

            // Check if city was the specific culprit
            const cityProblem =
              String(state.lastError || error).toLowerCase().includes("city") || !form.city;

            return (
              <div
                key={order.id}
                style={{
                  background: "#ffffff",
                  borderRadius: 12,
                  border: isResolved ? "2px solid #86efac" : "1px solid #cbd5e1",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                  overflow: "hidden",
                  transition: "all 0.2s ease",
                }}
              >
                {/* Order Top Bar */}
                <div
                  style={{
                    padding: "14px 18px",
                    background: isResolved ? "#f0fdf4" : "#ffffff",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <img
                      src={order.imageUrl || "/img/product-placeholder.png"}
                      alt=""
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 6,
                        objectFit: "cover",
                        border: "1px solid #e2e8f0",
                        background: "#f8fafc",
                      }}
                      onError={(e) => {
                        e.target.src = "https://placehold.co/48x48?text=Item";
                      }}
                    />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>
                          Order #{order.orderId || order.id}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            padding: "2px 7px",
                            borderRadius: 4,
                            background: "#e2e8f0",
                            color: "#475569",
                            fontWeight: 600,
                          }}
                        >
                          {order.siteId ? `eBay ${order.siteId}` : "eBay"}
                        </span>
                        {isResolved ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: 11.5,
                              padding: "2px 8px",
                              borderRadius: 4,
                              background: "#dcfce7",
                              color: "#15803d",
                              fontWeight: 700,
                            }}
                          >
                            <LuCheck /> Processed Successfully
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: 11.5,
                              padding: "2px 8px",
                              borderRadius: 4,
                              background: state.hasVariationIssue ? "#ede9fe" : "#fef3c7",
                              color: state.hasVariationIssue ? "#6d28d9" : "#b45309",
                              fontWeight: 700,
                            }}
                          >
                            {state.hasVariationIssue ? "🎨 Variation Issue" : "📍 Address Issue"}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 12.5,
                          color: "#334155",
                          marginTop: 3,
                          maxWidth: 520,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={order.title}
                      >
                        {order.title || "Untitled Product"}
                      </div>
                      <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>
                        Buyer: <strong>{order.buyerName || "Customer"}</strong> · Qty: {order.quantity || 1} ·{" "}
                        {resolveOrderVariant(order) ? (
                          <span style={{ color: "#2563eb", fontWeight: 600 }}>
                            Purchased Variant: {resolveOrderVariant(order)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {!isResolved && (
                      <button
                        type="button"
                        onClick={() => executeFixAndProcessOrder(order.id)}
                        disabled={isProcessing || bulkRunning}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "8px 14px",
                          borderRadius: 6,
                          background: "#2563eb",
                          color: "#ffffff",
                          fontSize: 12.5,
                          fontWeight: 600,
                          border: 0,
                          cursor: isProcessing || bulkRunning ? "not-allowed" : "pointer",
                          opacity: isProcessing || bulkRunning ? 0.7 : 1,
                        }}
                      >
                        {isProcessing ? (
                          <>
                            <LuLoader className="spin-icon" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <LuRefreshCw size={14} />
                            <span>Fix & Process</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Error Banner Callout */}
                {!isResolved && (
                  <div
                    style={{
                      padding: "10px 18px",
                      background: "#fff1f2",
                      borderBottom: "1px solid #fecdd3",
                      color: "#9f1239",
                      fontSize: 12.5,
                      lineHeight: 1.4,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    <LuShieldAlert size={16} style={{ flexShrink: 0, marginTop: 1, color: "#e11d48" }} />
                    <div>
                      <strong>AliExpress Reason:</strong> {state.lastError || error}
                    </div>
                  </div>
                )}

                {/* Content Section when not yet resolved */}
                {!isResolved && (
                  <div style={{ padding: 18 }}>
                    {/* Tab Switcher if both or options available */}
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        marginBottom: 16,
                        borderBottom: "1px solid #e2e8f0",
                        paddingBottom: 8,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOrderStates((prev) => ({
                            ...prev,
                            [order.id]: { ...prev[order.id], activeTab: "address" },
                          }))
                        }
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 12px",
                          borderRadius: 6,
                          border: "1px solid",
                          borderColor: currentTab === "address" ? "#3b82f6" : "transparent",
                          background: currentTab === "address" ? "#eff6ff" : "transparent",
                          color: currentTab === "address" ? "#1d4ed8" : "#64748b",
                          fontWeight: 600,
                          fontSize: 12.5,
                          cursor: "pointer",
                        }}
                      >
                        <LuMapPin size={14} />
                        <span>Shipping Address {cityProblem ? "⚠️" : ""}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setOrderStates((prev) => ({
                            ...prev,
                            [order.id]: { ...prev[order.id], activeTab: "variation" },
                          }))
                        }
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 12px",
                          borderRadius: 6,
                          border: "1px solid",
                          borderColor: currentTab === "variation" ? "#8b5cf6" : "transparent",
                          background: currentTab === "variation" ? "#f5f3ff" : "transparent",
                          color: currentTab === "variation" ? "#6d28d9" : "#64748b",
                          fontWeight: 600,
                          fontSize: 12.5,
                          cursor: "pointer",
                        }}
                      >
                        <LuLayers size={14} />
                        <span>AliExpress Variation / SKU</span>
                      </button>
                    </div>

                    {/* ADDRESS TAB */}
                    {currentTab === "address" && (
                      <div>
                        {/* Recommended Address Banner if available */}
                        {rec && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 12,
                              padding: "10px 14px",
                              background: "#ecfdf5",
                              border: "1px solid #a7f3d0",
                              borderRadius: 8,
                              marginBottom: 14,
                              fontSize: 12.5,
                              color: "#065f46",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <LuSparkles size={16} color="#059669" />
                              <div>
                                <strong>AliExpress Format Suggestion:</strong>{" "}
                                {[rec.addressLine1, rec.city, rec.stateOrProvince, rec.postalCode]
                                  .filter(Boolean)
                                  .join(", ")}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleApplyRecommendation(order.id)}
                              style={{
                                padding: "4px 10px",
                                borderRadius: 6,
                                background: "#059669",
                                color: "#ffffff",
                                fontSize: 11.5,
                                fontWeight: 600,
                                border: 0,
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Apply Suggestion
                            </button>
                          </div>
                        )}

                        {/* Address Form Inputs Grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600, color: "#334155" }}>
                            Recipient Full Name *
                            <input
                              type="text"
                              value={form.fullName || ""}
                              onChange={(e) => handleFieldChange(order.id, "fullName", e.target.value)}
                              placeholder="Recipient full name"
                              style={{
                                padding: "8px 10px",
                                borderRadius: 6,
                                border: "1px solid #cbd5e1",
                                fontSize: 13,
                              }}
                            />
                          </label>

                          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600, color: "#334155" }}>
                            Phone Number (AliExpress requires digits)
                            <input
                              type="text"
                              value={form.phone || ""}
                              onChange={(e) => handleFieldChange(order.id, "phone", e.target.value)}
                              placeholder="e.g. 5551234567"
                              style={{
                                padding: "8px 10px",
                                borderRadius: 6,
                                border: "1px solid #cbd5e1",
                                fontSize: 13,
                              }}
                            />
                          </label>

                          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600, color: "#334155", gridColumn: "span 2" }}>
                            Street Address (Line 1) *
                            <input
                              type="text"
                              value={form.addressLine1 || ""}
                              onChange={(e) => handleFieldChange(order.id, "addressLine1", e.target.value)}
                              placeholder="e.g. 123 Main St"
                              style={{
                                padding: "8px 10px",
                                borderRadius: 6,
                                border: "1px solid #cbd5e1",
                                fontSize: 13,
                              }}
                            />
                          </label>

                          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600, color: "#334155" }}>
                            Apt / Suite / Unit (Line 2)
                            <input
                              type="text"
                              value={form.addressLine2 || ""}
                              onChange={(e) => handleFieldChange(order.id, "addressLine2", e.target.value)}
                              placeholder="e.g. Apt 4B"
                              style={{
                                padding: "8px 10px",
                                borderRadius: 6,
                                border: "1px solid #cbd5e1",
                                fontSize: 13,
                              }}
                            />
                          </label>

                          {/* CITY FIELD - Highlighted if City was the rejected field */}
                          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600, color: cityProblem ? "#b45309" : "#334155" }}>
                            <span>
                              City * {cityProblem && <span style={{ color: "#dc2626", fontWeight: 700 }}>(Please enter valid City)</span>}
                            </span>
                            <input
                              type="text"
                              value={form.city || ""}
                              onChange={(e) => handleFieldChange(order.id, "city", e.target.value)}
                              placeholder="e.g. Los Angeles"
                              style={{
                                padding: "8px 10px",
                                borderRadius: 6,
                                border: cityProblem ? "2px solid #f59e0b" : "1px solid #cbd5e1",
                                background: cityProblem ? "#fffbeb" : "#ffffff",
                                fontSize: 13,
                                outline: "none",
                              }}
                            />
                          </label>

                          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600, color: "#334155" }}>
                            State / Province *
                            <input
                              type="text"
                              list={`us-states-${order.id}`}
                              value={form.stateOrProvince || ""}
                              onChange={(e) => handleFieldChange(order.id, "stateOrProvince", e.target.value)}
                              placeholder="e.g. Idaho (or ID)"
                              style={{
                                padding: "8px 10px",
                                borderRadius: 6,
                                border: "1px solid #cbd5e1",
                                fontSize: 13,
                              }}
                            />
                            <datalist id={`us-states-${order.id}`}>
                              {US_STATES.map((s) => (
                                <option key={s} value={s} />
                              ))}
                            </datalist>
                          </label>

                          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600, color: "#334155" }}>
                            ZIP / Postal Code *
                            <input
                              type="text"
                              value={form.postalCode || ""}
                              onChange={(e) => handleFieldChange(order.id, "postalCode", e.target.value)}
                              placeholder="e.g. 83814"
                              style={{
                                padding: "8px 10px",
                                borderRadius: 6,
                                border: "1px solid #cbd5e1",
                                fontSize: 13,
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    )}

                    {/* VARIATION TAB */}
                    {currentTab === "variation" && (
                      <div>
                        {varState.loading ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "20px 0", color: "#64748b" }}>
                            <LuLoader className="spin-icon" />
                            <span>Loading AliExpress product variations...</span>
                          </div>
                        ) : varState.error ? (
                          <div style={{ padding: "10px 14px", background: "#fef2f2", color: "#991b1b", borderRadius: 6, fontSize: 13 }}>
                            {varState.error}
                          </div>
                        ) : varState.dimensions.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            <div style={{ fontSize: 12.5, color: "#475569" }}>
                              Select the matching AliExpress variation attributes for this order:
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                              {varState.dimensions.map((dim) => (
                                <label key={dim.name} style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600, color: "#334155" }}>
                                  {dim.name}
                                  <select
                                    value={varState.selected[dim.name] || ""}
                                    onChange={(e) => handleSelectVariationProperty(order.id, dim.name, e.target.value)}
                                    style={{
                                      padding: "8px 10px",
                                      borderRadius: 6,
                                      border: "1px solid #cbd5e1",
                                      fontSize: 13,
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

                            {/* Matched SKU Preview Box */}
                            {varState.matchedSku ? (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                  padding: "10px 14px",
                                  background: "#f8fafc",
                                  borderRadius: 8,
                                  border: "1px solid #cbd5e1",
                                }}
                              >
                                {varState.matchedSku.image && (
                                  <img
                                    src={varState.matchedSku.image}
                                    alt=""
                                    style={{ width: 44, height: 44, borderRadius: 4, objectFit: "cover", border: "1px solid #e2e8f0" }}
                                  />
                                )}
                                <div style={{ fontSize: 12.5, flex: 1 }}>
                                  <div style={{ fontWeight: 600, color: "#0f172a" }}>
                                    Matched SKU ID: {varState.matchedSku.id || varState.matchedSku.sku_id}
                                  </div>
                                  <div style={{ color: "#64748b", marginTop: 2 }}>
                                    Supplier Cost: <strong>${Number(varState.matchedSku.price || 0).toFixed(2)}</strong> · Stock:{" "}
                                    <span style={{ color: Number(varState.matchedSku.stock ?? 1) > 0 ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                                      {Number(varState.matchedSku.stock ?? 1) > 0 ? "In Stock" : "Out of Stock"}
                                    </span>
                                  </div>
                                </div>
                                <span style={{ color: "#16a34a", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700 }}>
                                  <LuCheck /> SKU Selected
                                </span>
                              </div>
                            ) : (
                              <div style={{ padding: "8px 12px", background: "#fffbeb", borderRadius: 6, color: "#92400e", fontSize: 12 }}>
                                Please select all variation options to match an AliExpress SKU.
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ fontSize: 12.5, color: "#64748b" }}>
                            No multiple variations found on this product. Verify source product ID: {varState.productId || "None"}.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Sticky Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#ffffff",
          }}
        >
          <div style={{ fontSize: 13, color: "#64748b" }}>
            {resolvedCount === totalOrders ? (
              <span style={{ color: "#16a34a", fontWeight: 700 }}>
                ✓ All {totalOrders} order(s) successfully processed!
              </span>
            ) : (
              <span>
                {pendingCount} order{pendingCount === 1 ? "" : "s"} remaining to fix and process.
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={bulkRunning}
              style={{
                padding: "9px 18px",
                borderRadius: 7,
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#475569",
                fontSize: 13,
                fontWeight: 600,
                cursor: bulkRunning ? "not-allowed" : "pointer",
              }}
            >
              {resolvedCount === totalOrders ? "Close" : "Cancel"}
            </button>

            {resolvedCount === totalOrders ? (
              <button
                type="button"
                onClick={onClose}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 22px",
                  borderRadius: 7,
                  border: 0,
                  background: "#16a34a",
                  color: "#ffffff",
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <LuCheck size={16} />
                <span>Done</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFixAndProcessAll}
                disabled={bulkRunning || pendingCount === 0}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 22px",
                  borderRadius: 7,
                  border: 0,
                  background: "#2563eb",
                  color: "#ffffff",
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: bulkRunning || pendingCount === 0 ? "not-allowed" : "pointer",
                  opacity: bulkRunning || pendingCount === 0 ? 0.7 : 1,
                  boxShadow: "0 2px 6px rgba(37, 99, 235, 0.3)",
                }}
              >
                {bulkRunning ? (
                  <>
                    <LuLoader className="spin-icon" />
                    <span>
                      Fixing & Processing ({bulkProgress.current}/{bulkProgress.total})...
                    </span>
                  </>
                ) : (
                  <>
                    <LuWrench size={16} />
                    <span>Fix & Process All ({pendingCount})</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
