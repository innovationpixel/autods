import { useEffect, useMemo, useState } from "react";
import { LuCheck, LuLoader, LuPencil, LuSearch, LuTriangleAlert, LuX } from "react-icons/lu";
import { getAliExpressProduct } from "../../services/AliExpressService";
import { normalizeListingSourceInput } from "./helpers";
import { getApiErrorMessage } from "../../utils/apiErrors";

const PLATFORM_OPTIONS = [
  { value: "aliexpress", label: "AliExpress" },
  { value: "amazon", label: "Amazon" },
  { value: "walmart", label: "Walmart" },
  { value: "etsy", label: "Etsy" },
  { value: "ebay", label: "eBay" },
];

function buildDimensions(skus) {
  const dimensions = new Map();

  skus.forEach((sku) => {
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

function OrderSourceModal({ open, order, requireAliExpress = false, saving = false, onClose, onSave }) {
  const [input, setInput] = useState("");
  const [platform, setPlatform] = useState("aliexpress");
  const [ebayNotice, setEbayNotice] = useState(false);
  const [lookupState, setLookupState] = useState("idle");
  const [lookupError, setLookupError] = useState("");
  const [product, setProduct] = useState(null);
  const [selected, setSelected] = useState({});

  const dimensions = useMemo(() => (product ? buildDimensions(product.skus) : []), [product]);

  const matchingSkus = useMemo(() => {
    if (!product) {
      return [];
    }
    return product.skus.filter((sku) => skuMatchesSelection(sku, selected));
  }, [product, selected]);

  const resolvedSku = useMemo(() => {
    if (!product) return null;
    if (product.skus.length === 1) return product.skus[0];
    return matchingSkus.length === 1 ? matchingSkus[0] : null;
  }, [product, matchingSkus]);

  const resetLookup = () => {
    if (lookupState !== "idle") {
      setLookupState("idle");
      setLookupError("");
      setProduct(null);
      setSelected({});
    }
  };

  const handleInputChange = (value) => {
    setInput(value);
    resetLookup();
  };

  const handlePlatformChange = (value) => {
    setPlatform(value);
    resetLookup();
  };

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

      const existingSku = order?.sourceSkuId
        ? skus.find((sku) => String(sku.id) === String(order.sourceSkuId))
        : null;

      if (existingSku) {
        const prefill = {};
        (existingSku.properties ?? []).forEach((prop) => {
          prefill[prop.name] = prop.value;
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

  const handleLookup = () => {
    performLookup(input, platform);
  };

  useEffect(() => {
    if (!open || !order) {
      return;
    }
    const orderPlatform = (order.sourcePlatform ?? "aliexpress").toLowerCase();
    const isEbay =
      orderPlatform === "ebay" ||
      (typeof order.sourceUrl === "string" && order.sourceUrl.toLowerCase().includes("ebay."));

    const mustUseAliExpress = requireAliExpress || isEbay;
    const initialPlatform = mustUseAliExpress ? "aliexpress" : (order.sourcePlatform ?? "aliexpress");
    // If the existing source was eBay, its URL/itemBuy is an eBay link/item ID, NOT an AliExpress link.
    // Clear it so the user can paste the actual AliExpress supplier link.
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
  }, [open, order, requireAliExpress]);

  const handleSave = () => {
    const trimmed = input.trim();
    if (!trimmed) {
      setLookupState("error");
      setLookupError("Enter a source link or item ID.");
      return;
    }

    if (lookupState === "ready" && !resolvedSku) {
      return;
    }

    const resolved = normalizeListingSourceInput(trimmed, platform);

    if (requireAliExpress && (resolved.source_platform !== "aliexpress" || !resolved.source_product_id)) {
      setLookupState("error");
      setLookupError("All orders are fulfilled via AliExpress. Please enter a valid AliExpress product link or item ID.");
      return;
    }

    onSave({
      source_input: resolved.source_input,
      source_platform: resolved.source_platform,
      source_sku_id: resolvedSku ? String(resolvedSku.id) : null,
      source_variation: resolvedSku
        ? (resolvedSku.properties ?? []).map((prop) => ({ name: prop.name, value: prop.value }))
        : null,
    });
  };

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

  const canSave = !saving && !(lookupState === "ready" && !resolvedSku);

  return (
    <div className="quick-edit-modal-layer" role="presentation">
      <button type="button" className="quick-edit-modal-layer__backdrop" aria-label="Close" onClick={onClose} />

      <section
        className="quick-edit-modal order-source-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Edit Source Link"
      >
        <button type="button" className="quick-edit-modal__close" aria-label="Close" onClick={onClose} disabled={saving}>
          <LuX />
        </button>

        <div className="quick-edit-modal__head">
          <span className="quick-edit-modal__icon" aria-hidden="true">
            <LuPencil />
          </span>
          <div>
            <h2>{requireAliExpress ? "Link AliExpress Supplier" : "Edit Source Link"}</h2>
            <p>
              {requireAliExpress
                ? "Enter the AliExpress product link or item ID required to fulfill this order."
                : "Paste the AliExpress (or other supplier) URL or item ID this order was sourced from."}
            </p>
          </div>
        </div>

        {ebayNotice ? (
          <div
            className="order-source-modal__ebay-notice"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "11px 14px",
              marginBottom: 16,
              borderRadius: 8,
              background: "rgba(245, 158, 11, 0.12)",
              border: "1px solid rgba(245, 158, 11, 0.35)",
              color: "#b45309",
              fontSize: 13,
              lineHeight: 1.45,
            }}
          >
            <LuTriangleAlert style={{ flexShrink: 0, marginTop: 2, fontSize: 16 }} />
            <div>
              <strong>eBay Source Detected:</strong> This order originated on eBay. All orders in AutoDS are processed through AliExpress. Please paste the AliExpress product link or item ID below to continue.
            </div>
          </div>
        ) : null}

        <div className="order-source-modal__row">
          <label className="quick-edit-modal__field order-source-modal__input-field">
            <span>AliExpress link or item ID</span>
            <input
              type="text"
              value={input}
              placeholder="https://www.aliexpress.com/item/... or product ID"
              onChange={(event) => handleInputChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  onClose();
                }
              }}
              disabled={saving}
              autoFocus
            />
          </label>
          <label className="quick-edit-modal__field order-source-modal__platform-field">
            <span>Platform</span>
            <select
              value={platform}
              onChange={(event) => handlePlatformChange(event.target.value)}
              disabled={saving || requireAliExpress}
            >
              {PLATFORM_OPTIONS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={requireAliExpress && option.value !== "aliexpress"}
                >
                  {option.label}
                  {requireAliExpress && option.value !== "aliexpress" ? " (Unsupported)" : ""}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="button"
          className="order-source-modal__lookup-btn"
          onClick={handleLookup}
          disabled={saving || lookupState === "loading" || !input.trim()}
        >
          {lookupState === "loading" ? <LuLoader className="spin-icon" /> : <LuSearch />}
          <span>{lookupState === "loading" ? "Checking for variations…" : "Check for variations"}</span>
        </button>

        {lookupState === "single" ? (
          <p className="order-source-modal__hint">No additional variations found for this item.</p>
        ) : null}

        {lookupState === "unsupported" ? (
          <p className="order-source-modal__hint">
            Variation selection isn&apos;t available for this supplier yet — the source will be saved as entered.
          </p>
        ) : null}

        {lookupState === "error" ? (
          <p className="order-source-modal__error">
            <LuTriangleAlert /> <span>{lookupError}</span>
          </p>
        ) : null}

        {lookupState === "ready" && product ? (
          <div className="order-source-modal__variations">
            <div className="order-source-modal__product">
              {product.image ? <img src={product.image} alt="" referrerPolicy="no-referrer" /> : null}
              <span>{product.title}</span>
            </div>

            {dimensions.map((dimension) => (
              <label key={dimension.name} className="quick-edit-modal__field">
                <span>{dimension.name}</span>
                <select
                  value={selected[dimension.name] ?? ""}
                  onChange={(event) =>
                    setSelected((current) => ({ ...current, [dimension.name]: event.target.value }))
                  }
                  disabled={saving}
                >
                  <option value="">Select {dimension.name}…</option>
                  {dimension.values.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
            ))}

            {resolvedSku ? (
              <p className="order-source-modal__match">
                <LuCheck />
                <span>
                  Matched variant · ${Number(resolvedSku.price ?? 0).toFixed(2)}
                  {resolvedSku.stock ? ` · ${resolvedSku.stock} in stock` : ""}
                </span>
              </p>
            ) : (
              <p className="order-source-modal__hint">Select every option to match the exact variant this order was for.</p>
            )}
          </div>
        ) : null}

        <div className="quick-edit-modal__actions">
          <button type="button" className="quick-edit-modal__btn quick-edit-modal__btn--ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className="quick-edit-modal__btn quick-edit-modal__btn--primary"
            onClick={handleSave}
            disabled={!canSave}
          >
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

export default OrderSourceModal;
