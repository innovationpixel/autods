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

      // Check first variant or target variants for existing quantity & profit/price
      const first = targetVariants && targetVariants[0];
      const initialQty = first ? Math.max(1, Number(first.quantity) || 1) : 1;
      setQuantity(String(initialQty));

      if (first) {
        const cost = Number(first.buyPrice ?? first.price ?? 0);
        const profit = Number(first.profit ?? 0);
        const listPrice = Number(first.listingPrice ?? (cost + profit));

        setProfitAmount(profit > 0 ? String(round2(profit)) : "");
        if (cost > 0 && profit > 0) {
          setProfitPercent(String(round2((profit / cost) * 100)));
        } else {
          setProfitPercent("");
        }

        if (listPrice > 0) {
          setSellPrice(String(round2(listPrice)));
        } else {
          setSellPrice("");
        }
      } else {
        setProfitPercent("");
        setProfitAmount("");
        setSellPrice("");
      }
    }
  }, [open, defaultFeesPercent, targetVariants]);

  if (!open) {
    return null;
  }

  // Handle changes with automatic calculation
  const handleFeesChange = (val) => {
    setFeesPercent(val);
    const fPct = Number(val) || 0;
    if (profitAmount !== "" && !isNaN(Number(profitAmount))) {
      const pAmt = Number(profitAmount) || 0;
      const calculatedSell = computeSellPrice(baseCost, fPct, pAmt);
      setSellPrice(String(calculatedSell));
    } else if (profitPercent !== "" && !isNaN(Number(profitPercent))) {
      const pPct = Number(profitPercent) || 0;
      const pAmt = round2(baseCost * (pPct / 100));
      const calculatedSell = computeSellPrice(baseCost, fPct, pAmt);
      setSellPrice(String(calculatedSell));
    }
  };

  const handleProfitPercentChange = (val) => {
    setProfitPercent(val);
    if (val === "" || isNaN(Number(val))) {
      setProfitAmount("");
      if (sellPrice !== "") {
        // If cleared profit %, don't blow away sell price immediately or set to cost + fees
        const fPct = Number(feesPercent) || 0;
        setSellPrice(String(computeSellPrice(baseCost, fPct, 0)));
      }
      return;
    }

    const pPct = Number(val);
    const pAmt = round2(baseCost * (pPct / 100));
    setProfitAmount(String(pAmt));

    const fPct = Number(feesPercent) || 0;
    const calculatedSell = computeSellPrice(baseCost, fPct, pAmt);
    setSellPrice(String(calculatedSell));
  };

  const handleProfitAmountChange = (val) => {
    setProfitAmount(val);
    if (val === "" || isNaN(Number(val))) {
      setProfitPercent("");
      return;
    }

    const pAmt = Number(val);
    if (baseCost > 0) {
      setProfitPercent(String(round2((pAmt / baseCost) * 100)));
    }

    const fPct = Number(feesPercent) || 0;
    const calculatedSell = computeSellPrice(baseCost, fPct, pAmt);
    setSellPrice(String(calculatedSell));
  };

  const handleSellPriceChange = (val) => {
    setSellPrice(val);
    if (val === "" || isNaN(Number(val))) {
      return;
    }

    const sPrice = Number(val);
    const fPct = Number(feesPercent) || 0;
    const pAmt = computeProfitFromSellPrice(sPrice, baseCost, fPct);
    setProfitAmount(String(pAmt));

    if (baseCost > 0) {
      setProfitPercent(String(round2((pAmt / baseCost) * 100)));
    }
  };

  const parsedQty = Number(quantity);
  const isValidQty = !isNaN(parsedQty) && parsedQty >= 1;
  const isFeesValid = feesPercent === "" || (!isNaN(Number(feesPercent)) && Number(feesPercent) >= 0);
  const isSellPriceValid = sellPrice === "" || (!isNaN(Number(sellPrice)) && Number(sellPrice) >= 0);
  const canApply = isValidQty && isFeesValid && isSellPriceValid;

  const handleApply = () => {
    if (!canApply) return;

    onApply({
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

          <BulkFieldRow label="Profit %">
            <div className="bulk-edit-modal__percent">
              <input
                type="number"
                step="0.1"
                placeholder="0"
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

          <BulkFieldRow label="Sell Price">
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
  const feesPct = Math.max(0, Number(changes.feesPercent) || 0);

  // If sellPrice is explicitly specified and non-null
  if (changes.sellPrice != null && changes.sellPrice > 0) {
    // If all variants share baseCost or there is a single direct sellPrice
    next.listingPrice = round2(changes.sellPrice);
    const feeAmount = round2(cost * (feesPct / 100));
    next.profit = round2(next.listingPrice - cost - feeAmount);
  } else if (changes.profitPercent != null) {
    const profitPct = Number(changes.profitPercent) || 0;
    const profit = round2(cost * (profitPct / 100));
    const feeAmount = round2(cost * (feesPct / 100));
    next.profit = profit;
    next.listingPrice = round2(cost + feeAmount + profit);
  } else if (changes.profitAmount != null) {
    const profit = Number(changes.profitAmount) || 0;
    const feeAmount = round2(cost * (feesPct / 100));
    next.profit = round2(profit);
    next.listingPrice = round2(cost + feeAmount + profit);
  }

  return next;
}

export default BulkEditVariantsModal;
