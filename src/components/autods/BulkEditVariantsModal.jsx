import { useEffect, useState } from "react";
import { LuPencil, LuX } from "react-icons/lu";

function round2(val) {
  const num = Number(val);
  if (isNaN(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

function computeSellPrice(cost, feesPct, profit) {
  const c = Math.max(0, Number(cost) || 0);
  const fPct = Math.max(0, Number(feesPct) || 0);
  const p = Number(profit) || 0;
  const feeAmount = c * (fPct / 100);
  return round2(c + feeAmount + p);
}

function computeProfitFromSellPrice(sellPrice, cost, feesPct) {
  const sp = Math.max(0, Number(sellPrice) || 0);
  const c = Math.max(0, Number(cost) || 0);
  const fPct = Math.max(0, Number(feesPct) || 0);
  const feeAmount = c * (fPct / 100);
  return round2(sp - c - feeAmount);
}

function BulkFieldRow({ label, children }) {
  return (
    <div className="bulk-edit-modal__row bulk-edit-modal__row--no-check bulk-edit-modal__row--active">
      <span className="bulk-edit-modal__row-label">{label}</span>
      <div className="bulk-edit-modal__row-control">{children}</div>
    </div>
  );
}

function BulkEditVariantsModal({
  open,
  variantCount = 0,
  isSelectionOnly = false,
  totalCount = null,
  targetVariants = [],
  defaultFeesPercent = 0,
  onClose,
  onApply,
}) {
  const [feesPercent, setFeesPercent] = useState("0");
  const [quantity, setQuantity] = useState("1");
  const [profitPercent, setProfitPercent] = useState("");
  const [profitAmount, setProfitAmount] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [pricingMode, setPricingMode] = useState("none"); // "percent" | "amount" | "sellPrice" | "none"

  // Determine baseline cost from target variants (or default to first variant / 0)
  const baseCost = (() => {
    if (!targetVariants || targetVariants.length === 0) return 0;
    const costs = targetVariants.map((v) => Number(v.buyPrice ?? v.price ?? 0)).filter((c) => c > 0);
    if (costs.length === 0) return Number(targetVariants[0]?.buyPrice ?? 0);
    return costs[0];
  })();

  useEffect(() => {
    if (open) {
      const initialFees = Number(defaultFeesPercent) || 0;
      setFeesPercent(String(initialFees));

      const first = targetVariants && targetVariants[0];
      const initialQty = first ? Math.max(1, Number(first.quantity) || 1) : 1;
      setQuantity(String(initialQty));

      setProfitPercent("");
      setProfitAmount("");
      setSellPrice("");
      setPricingMode("none");
    }
  }, [open, defaultFeesPercent, targetVariants]);

  if (!open) {
    return null;
  }

  // Handle changes with automatic calculation
  const handleFeesChange = (val) => {
    setFeesPercent(val);
  };

  const handleProfitPercentChange = (val) => {
    setProfitPercent(val);
    if (val === "" || isNaN(Number(val))) {
      setPricingMode("none");
      return;
    }
    setPricingMode("percent");
    setProfitAmount("");
    setSellPrice("");
  };

  const handleProfitAmountChange = (val) => {
    setProfitAmount(val);
    if (val === "" || isNaN(Number(val))) {
      setPricingMode("none");
      return;
    }
    setPricingMode("amount");
    setProfitPercent("");
    setSellPrice("");
  };

  const handleSellPriceChange = (val) => {
    setSellPrice(val);
    if (val === "" || isNaN(Number(val))) {
      setPricingMode("none");
      return;
    }
    setPricingMode("sellPrice");
    setProfitPercent("");
    setProfitAmount("");
  };

  const parsedQty = Number(quantity);
  const isValidQty = !isNaN(parsedQty) && parsedQty >= 1;
  const isFeesValid = feesPercent === "" || (!isNaN(Number(feesPercent)) && Number(feesPercent) >= 0);
  const isSellPriceValid = sellPrice === "" || (!isNaN(Number(sellPrice)) && Number(sellPrice) >= 0);
  const isProfitPercentValid = profitPercent === "" || !isNaN(Number(profitPercent));
  const isProfitAmountValid = profitAmount === "" || !isNaN(Number(profitAmount));
  const canApply = isValidQty && isFeesValid && isSellPriceValid && isProfitPercentValid && isProfitAmountValid;

  const handleApply = () => {
    if (!canApply) return;

    onApply({
      mode: pricingMode,
      feesPercent: Number(feesPercent) || 0,
      quantity: Math.max(1, Number(quantity) || 1),
      profitPercent: profitPercent !== "" ? Number(profitPercent) : null,
      profitAmount: profitAmount !== "" ? Number(profitAmount) : null,
      sellPrice: sellPrice !== "" ? Number(sellPrice) : null,
      baseCost,
    });
  };

  const handleClose = () => {
    onClose();
  };

  const targetDescription = isSelectionOnly
    ? `${variantCount} selected variant${variantCount === 1 ? "" : "s"}${totalCount ? ` (out of ${totalCount})` : ""}`
    : `${variantCount} variant${variantCount === 1 ? "" : "s"}`;

  return (
    <div className="bulk-edit-modal-layer" role="presentation">
      <button
        type="button"
        className="bulk-edit-modal-layer__backdrop"
        aria-label="Close bulk edit dialog"
        onClick={handleClose}
      />

      <section className="bulk-edit-modal" role="dialog" aria-modal="true" aria-label="Bulk edit variants">
        <button type="button" className="bulk-edit-modal__close" aria-label="Close" onClick={handleClose}>
          <LuX />
        </button>

        <div className="bulk-edit-modal__head">
          <span className="bulk-edit-modal__icon" aria-hidden="true">
            <LuPencil />
          </span>
          <div>
            <h2>Bulk Edit Variants</h2>
            <p>
              Update pricing and quantity for {targetDescription}.
            </p>
          </div>
        </div>

        <div className="bulk-edit-modal__fields">
          <BulkFieldRow label="Fees %">
            <div className="bulk-edit-modal__percent">
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="0"
                value={feesPercent}
                onChange={(e) => handleFeesChange(e.target.value)}
              />
              <span className="bulk-edit-modal__percent-suffix">%</span>
            </div>
          </BulkFieldRow>

          <BulkFieldRow label="Default Quantity">
            <input
              type="number"
              min="1"
              step="1"
              placeholder="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </BulkFieldRow>

          <BulkFieldRow label="Profit Increase %">
            <div className="bulk-edit-modal__percent">
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 20"
                value={profitPercent}
                onChange={(e) => handleProfitPercentChange(e.target.value)}
              />
              <span className="bulk-edit-modal__percent-suffix">%</span>
            </div>
          </BulkFieldRow>

          <BulkFieldRow label="Profit $">
            <div className="bulk-edit-modal__money">
              <span className="bulk-edit-modal__money-prefix">$</span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={profitAmount}
                onChange={(e) => handleProfitAmountChange(e.target.value)}
              />
            </div>
          </BulkFieldRow>

          <BulkFieldRow label="Sell Price (Fixed)">
            <div className="bulk-edit-modal__money">
              <span className="bulk-edit-modal__money-prefix">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={sellPrice}
                onChange={(e) => handleSellPriceChange(e.target.value)}
              />
            </div>
          </BulkFieldRow>
        </div>

        {profitPercent !== "" && !isNaN(Number(profitPercent)) ? (
          <div
            className="bulk-edit-modal__calc-preview"
            style={{
              padding: "10px 14px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: 6,
              fontSize: 12,
              color: "#166534",
              marginTop: 12,
            }}
          >
            <strong>Preview: </strong>
            Each variation's listing price will increase by{" "}
            <strong>{Number(profitPercent) >= 0 ? `+${profitPercent}%` : `${profitPercent}%`}</strong> according to its own price.
            {targetVariants.slice(0, 3).map((v, i) => {
              const cur = Number(v.listingPrice ?? v.listPrice ?? v.price ?? v.buyPrice ?? 0);
              const after = round2(cur * (1 + Number(profitPercent) / 100));
              return (
                <div key={v.id || i} style={{ marginTop: 3 }}>
                  {v.label || `Variation ${i + 1}`}: ${cur.toFixed(2)} → <strong>${after.toFixed(2)}</strong>
                </div>
              );
            })}
            {targetVariants.length > 3 ? (
              <div style={{ color: "#15803d", fontStyle: "italic", marginTop: 3 }}>
                ... and {targetVariants.length - 3} more
              </div>
            ) : null}
          </div>
        ) : null}

        {!isValidQty ? (
          <p className="bulk-edit-modal__hint" style={{ color: "#e05252" }}>
            Default quantity must be at least 1.
          </p>
        ) : null}

        <div className="bulk-edit-modal__actions">
          <button type="button" className="bulk-edit-modal__btn bulk-edit-modal__btn--ghost" onClick={handleClose}>
            Cancel
          </button>
          <button
            type="button"
            className="bulk-edit-modal__btn bulk-edit-modal__btn--primary"
            onClick={handleApply}
            disabled={!canApply}
          >
            <span>Apply to {isSelectionOnly ? `${variantCount} selected` : variantCount} variant{variantCount === 1 ? "" : "s"}</span>
          </button>
        </div>
      </section>
    </div>
  );
}

export function applyBulkEditToVariant(variant, changes) {
  const next = { ...variant };

  if (changes.quantity != null) {
    next.quantity = Math.max(1, Number(changes.quantity) || 1);
  }

  const cost = Math.max(0, Number(next.buyPrice ?? next.price ?? 0));
  const currentListingPrice = Number(
    next.listingPrice ?? next.listPrice ?? next.price ?? (cost + Number(next.profit ?? 0)),
  );
  const feesPct = Math.max(0, Number(changes.feesPercent) || 0);

  if (
    changes.mode === "percent" ||
    (changes.profitPercent != null && changes.mode !== "sellPrice" && changes.mode !== "amount")
  ) {
    const pct = Number(changes.profitPercent) || 0;
    // Apply profit increase percentage to each variation according to its OWN listing price
    // Example: 1st Variation: $5, 2nd Variation: $6, increase 20% -> 1st: $6, 2nd: $7.2
    const basePrice = currentListingPrice > 0 ? currentListingPrice : cost;
    const newListingPrice = round2(basePrice * (1 + pct / 100));
    next.listingPrice = Math.max(0.01, newListingPrice);
    next.listPrice = next.listingPrice;
    next.price = next.listingPrice;
    const feeAmount = round2(cost * (feesPct / 100));
    next.profit = round2(next.listingPrice - cost - feeAmount);
  } else if (changes.mode === "sellPrice" || (changes.sellPrice != null && changes.sellPrice > 0)) {
    next.listingPrice = round2(changes.sellPrice);
    next.listPrice = next.listingPrice;
    next.price = next.listingPrice;
    const feeAmount = round2(cost * (feesPct / 100));
    next.profit = round2(next.listingPrice - cost - feeAmount);
  } else if (changes.mode === "amount" || changes.profitAmount != null) {
    const profit = Number(changes.profitAmount) || 0;
    const feeAmount = round2(cost * (feesPct / 100));
    next.profit = round2(profit);
    next.listingPrice = round2(cost + feeAmount + profit);
    next.listPrice = next.listingPrice;
    next.price = next.listingPrice;
  } else if (changes.feesPercent != null) {
    const feeAmount = round2(cost * (feesPct / 100));
    next.profit = round2(currentListingPrice - cost - feeAmount);
    next.listingPrice = currentListingPrice;
    next.listPrice = currentListingPrice;
    next.price = currentListingPrice;
  }

  return next;
}

export default BulkEditVariantsModal;
