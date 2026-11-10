import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LuCheck, LuDollarSign, LuImage, LuLoader, LuSparkles, LuType, LuWallet, LuX, LuZap } from "react-icons/lu";
import { selectUser } from "../../../store/selectors/AuthSelectors";
import { updateUserStateAction } from "../../../store/actions/AuthActions";
import { buyAiCredits, getAiConfig } from "../../../services/AiGenerationService";
import { formatAiUsd, formatCreditConversionLabel, normalizeAiConfig } from "../../../utils/aiPricing";
import { toast } from "../../../utils/toast";

function buildFallbackPackages(aiConfig) {
  const rate = aiConfig.price_per_credit;
  const imgCredits = aiConfig.credits_per_image;
  const titleCredits = aiConfig.credits_per_title;
  return [100, 500, 1000, 5000].map((credits) => ({
    id: String(credits),
    credits,
    title: `${credits.toLocaleString()} Credits`,
    price: Math.max(0.01, Math.round(credits * rate * 100) / 100),
    price_per_credit: rate,
    rate: `${formatAiUsd(rate)} / credit`,
    images_estimate: Math.floor(credits / Math.max(1, imgCredits)),
    titles_estimate: Math.floor(credits / Math.max(1, titleCredits)),
    badge: credits === 500 ? "Most Popular" : credits === 1000 ? "Best Value" : null,
  }));
}

function BuyAiCreditsModal({ open, onClose, onSuccess, currentCredits, requiredCredits }) {
  const dispatch = useDispatch();
  const authUser = useSelector(selectUser);
  const [aiConfig, setAiConfig] = useState(() => normalizeAiConfig());
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [selectedId, setSelectedId] = useState("500");
  const [customCreditsInput, setCustomCreditsInput] = useState("250");
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoadingConfig(true);

    const load = () => {
      getAiConfig()
        .then((res) => {
          if (!active) return;
          const normalized = normalizeAiConfig(res.data);
          setAiConfig(normalized);
          if (normalized.min_custom_credits) {
            setCustomCreditsInput((prev) =>
              Number(prev) < normalized.min_custom_credits
                ? String(Math.max(normalized.min_custom_credits, 100))
                : prev
            );
          }
        })
        .catch(() => {})
        .finally(() => {
          if (active) setLoadingConfig(false);
        });
    };

    load();
    window.addEventListener("autods_refresh_ai_config", load);
    return () => {
      active = false;
      window.removeEventListener("autods_refresh_ai_config", load);
    };
  }, [open]);

  if (!open) return null;

  const packages = aiConfig.packages?.length ? aiConfig.packages : buildFallbackPackages(aiConfig);
  const isCustom = selectedId === "custom";
  const parsedCustomCredits = Math.max(0, Math.floor(Number(customCreditsInput) || 0));
  const customPrice = Math.round(parsedCustomCredits * aiConfig.price_per_credit * 100) / 100;

  const selectedPkg = isCustom
    ? {
        id: "custom",
        credits: parsedCustomCredits,
        title: `${parsedCustomCredits.toLocaleString()} Custom Credits`,
        price: customPrice,
        rate: `${formatAiUsd(aiConfig.price_per_credit)} / credit`,
      }
    : packages.find((p) => String(p.id) === String(selectedId)) || packages[1] || packages[0];

  const walletBalance =
    aiConfig.wallet_balance !== undefined && Number.isFinite(aiConfig.wallet_balance)
      ? aiConfig.wallet_balance
      : parseFloat(authUser?.wallet_balance ?? 0);
  const userAiCredits =
    currentCredits !== undefined
      ? currentCredits
      : aiConfig.ai_credits !== undefined
        ? aiConfig.ai_credits
        : (authUser?.ai_credits ?? 0);

  const isValidCustom = !isCustom || (parsedCustomCredits >= aiConfig.min_custom_credits && customPrice >= 0.01);
  const hasEnoughBalance = walletBalance >= selectedPkg.price;
  const canBuy = isValidCustom && selectedPkg.price >= 0.01 && hasEnoughBalance && !purchasing;

  const handleBuy = async () => {
    if (!isValidCustom) {
      toast.error(
        `Minimum custom purchase at ${formatAiUsd(aiConfig.price_per_credit)}/credit is ${aiConfig.min_custom_credits} credit(s) ($0.01).`
      );
      return;
    }

    if (!hasEnoughBalance) {
      toast.error(
        `Insufficient wallet balance ($${walletBalance.toFixed(2)}). You need $${selectedPkg.price.toFixed(2)}. Please load your AutoDS wallet first.`
      );
      return;
    }

    setPurchasing(true);
    try {
      const payload = isCustom
        ? { package_id: "custom", custom_credits: parsedCustomCredits }
        : { package_id: String(selectedPkg.id) };

      const res = await buyAiCredits(payload);
      const data = res.data;
      toast.success(
        data.message ||
          `Purchased ${selectedPkg.credits.toLocaleString()} AI Credits for $${Number(data.charged_usd ?? selectedPkg.price).toFixed(2)}!`
      );

      dispatch(
        updateUserStateAction({
          ai_credits: data.ai_credits,
          wallet_balance: data.wallet_balance,
        })
      );
      window.dispatchEvent(new CustomEvent("autods_refresh_ai_config"));

      if (onSuccess) {
        onSuccess(data);
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to purchase AI credits.");
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="orders-modal" style={{ zIndex: 2200 }}>
      <div className="orders-modal__backdrop" onClick={onClose} />
      <div
        className="orders-modal__card"
        style={{
          maxWidth: 580,
          width: "95%",
          maxHeight: "92vh",
          overflowY: "auto",
          padding: 24,
          borderRadius: 16,
          backgroundColor: "#ffffff",
          boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
          position: "relative",
        }}
      >
        <button
          type="button"
          className="orders-icon-btn"
          aria-label="Close"
          onClick={onClose}
          style={{ position: "absolute", top: 16, right: 16 }}
        >
          <LuX />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: "rgba(99, 102, 241, 0.12)",
              color: "#4f46e5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
            }}
          >
            <LuSparkles />
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#0f172a" }}>Buy AI Credits</h2>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
              Transparent pay-per-credit pricing for AI Product Images &amp; Product Titles.
            </p>
          </div>
        </div>

        {/* Current status bar */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            padding: "12px 16px",
            backgroundColor: "#f8fafc",
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            marginBottom: 12,
          }}
        >
          <div>
            <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 600, display: "block" }}>
              Current Credits
            </span>
            <strong style={{ fontSize: 16, color: "#4f46e5", display: "flex", alignItems: "center", gap: 4 }}>
              <LuZap style={{ fontSize: 14 }} /> {Number(userAiCredits).toLocaleString()} Credits
            </strong>
          </div>
          <div>
            <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 600, display: "block" }}>
              Wallet Balance
            </span>
            <strong style={{ fontSize: 16, color: "#0f172a", display: "flex", alignItems: "center", gap: 4 }}>
              <LuWallet style={{ fontSize: 14 }} /> ${Number(walletBalance).toFixed(2)} USD
            </strong>
          </div>
        </div>

        {/* Transparent AI Pricing Breakdown */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 8,
            padding: "10px 12px",
            backgroundColor: "#eef2ff",
            borderRadius: 10,
            border: "1px solid #c7d2fe",
            marginBottom: 16,
          }}
        >
          <div>
            <span style={{ fontSize: 10.5, color: "#4338ca", fontWeight: 700, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4 }}>
              <LuDollarSign /> Rate / Credit
            </span>
            <strong style={{ fontSize: 13.5, color: "#1e1b4b", display: "block" }}>
              {loadingConfig ? "…" : `${formatAiUsd(aiConfig.price_per_credit)} / credit`}
            </strong>
            <span style={{ fontSize: 10.5, color: "#4338ca" }}>
              {formatCreditConversionLabel(aiConfig.price_per_credit)}
            </span>
          </div>
          <div>
            <span style={{ fontSize: 10.5, color: "#4338ca", fontWeight: 700, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4 }}>
              <LuImage /> Per AI Image
            </span>
            <strong style={{ fontSize: 13.5, color: "#1e1b4b", display: "block" }}>
              {aiConfig.credits_per_image} credit{aiConfig.credits_per_image === 1 ? "" : "s"}
            </strong>
            <span style={{ fontSize: 10.5, color: "#4338ca", fontWeight: 600 }}>
              {formatAiUsd(aiConfig.image_cost_usd)} / image
            </span>
          </div>
          <div>
            <span style={{ fontSize: 10.5, color: "#4338ca", fontWeight: 700, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4 }}>
              <LuType /> Per Product Title
            </span>
            <strong style={{ fontSize: 13.5, color: "#1e1b4b", display: "block" }}>
              {aiConfig.credits_per_title} credit{aiConfig.credits_per_title === 1 ? "" : "s"}
            </strong>
            <span style={{ fontSize: 10.5, color: "#4338ca", fontWeight: 600 }}>
              {formatAiUsd(aiConfig.title_cost_usd)} / title
            </span>
          </div>
        </div>

        {requiredCredits && requiredCredits > userAiCredits ? (
          <div
            style={{
              padding: "10px 14px",
              backgroundColor: "#fffbeb",
              borderRadius: 8,
              border: "1px solid #fef3c7",
              marginBottom: 16,
              fontSize: 13,
              color: "#92400e",
            }}
          >
            You need <strong>{requiredCredits.toLocaleString()} credits</strong> (
            {formatAiUsd(requiredCredits * aiConfig.price_per_credit)}) to complete this action, and currently have{" "}
            <strong>{Number(userAiCredits).toLocaleString()}</strong>. Select a package or custom amount below.
          </div>
        ) : null}

        {/* Package list */}
        <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
          {packages.map((pkg) => {
            const isSelected = String(selectedId) === String(pkg.id);
            const label = pkg.title || pkg.label || `${Number(pkg.credits).toLocaleString()} Credits`;
            return (
              <label
                key={pkg.id}
                onClick={() => setSelectedId(String(pkg.id))}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: isSelected ? "2px solid #4f46e5" : "1px solid #e2e8f0",
                  backgroundColor: isSelected ? "rgba(99, 102, 241, 0.04)" : "#ffffff",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input
                    type="radio"
                    name="aiCreditPackage"
                    value={pkg.id}
                    checked={isSelected}
                    onChange={() => setSelectedId(String(pkg.id))}
                    style={{ accentColor: "#4f46e5", width: 18, height: 18 }}
                  />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <strong style={{ fontSize: 15, color: "#0f172a" }}>{label}</strong>
                      {pkg.badge && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 12,
                            backgroundColor: "#10b981",
                            color: "#ffffff",
                            textTransform: "uppercase",
                          }}
                        >
                          {pkg.badge}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: "#64748b", display: "block" }}>
                      {pkg.rate}
                      {pkg.images_estimate !== undefined
                        ? ` · ~${pkg.images_estimate.toLocaleString()} imgs or ~${(pkg.titles_estimate ?? 0).toLocaleString()} titles`
                        : ""}
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <strong style={{ fontSize: 17, color: "#0f172a" }}>${Number(pkg.price).toFixed(2)}</strong>
                </div>
              </label>
            );
          })}

          {/* Custom Amount Option */}
          <div
            onClick={() => setSelectedId("custom")}
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: isCustom ? "2px solid #4f46e5" : "1px solid #e2e8f0",
              backgroundColor: isCustom ? "rgba(99, 102, 241, 0.04)" : "#ffffff",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input
                  type="radio"
                  name="aiCreditPackage"
                  value="custom"
                  checked={isCustom}
                  onChange={() => setSelectedId("custom")}
                  style={{ accentColor: "#4f46e5", width: 18, height: 18 }}
                />
                <div>
                  <strong style={{ fontSize: 15, color: "#0f172a", display: "block" }}>Custom Credits</strong>
                  <span style={{ fontSize: 12, color: "#64748b" }}>
                    Buy any exact amount @ {formatAiUsd(aiConfig.price_per_credit)} / credit
                  </span>
                </div>
              </label>

              <strong style={{ fontSize: 17, color: "#0f172a" }}>${customPrice.toFixed(2)}</strong>
            </div>

            {isCustom && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed #cbd5e1", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <input
                    type="number"
                    min={aiConfig.min_custom_credits}
                    max={100000}
                    step={1}
                    value={customCreditsInput}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setCustomCreditsInput(e.target.value)}
                    placeholder="Enter credits"
                    style={{
                      width: 140,
                      height: 36,
                      padding: "0 10px",
                      border: "1.5px solid #cbd5e1",
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#0f172a",
                    }}
                  />
                  {[50, 100, 250, 2000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCustomCreditsInput(String(preset));
                      }}
                      style={{
                        border: "1px solid #cbd5e1",
                        backgroundColor: Number(customCreditsInput) === preset ? "#eef2ff" : "#f8fafc",
                        color: Number(customCreditsInput) === preset ? "#4338ca" : "#475569",
                        borderRadius: 6,
                        padding: "5px 10px",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {preset.toLocaleString()}
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: 12, color: isValidCustom ? "#475569" : "#dc2626" }}>
                  {isValidCustom
                    ? `${parsedCustomCredits.toLocaleString()} credits × ${formatAiUsd(aiConfig.price_per_credit)}/credit = $${customPrice.toFixed(2)} USD (~${Math.floor(parsedCustomCredits / Math.max(1, aiConfig.credits_per_image))} images · ~${Math.floor(parsedCustomCredits / Math.max(1, aiConfig.credits_per_title))} titles)`
                    : `Enter at least ${aiConfig.min_custom_credits} credit(s) ($0.01 minimum).`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Balance notice if insufficient */}
        {!hasEnoughBalance && (
          <div
            style={{
              padding: "10px 14px",
              backgroundColor: "#fef2f2",
              borderRadius: 8,
              border: "1px solid #fee2e2",
              marginBottom: 16,
              fontSize: 13,
              color: "#991b1b",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>
              Insufficient wallet balance (${Number(walletBalance).toFixed(2)} available · ${selectedPkg.price.toFixed(2)} needed).
            </span>
            <span style={{ fontWeight: 600 }}>Load wallet first</span>
          </div>
        )}

        {/* Modal footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button
            type="button"
            className="admin-page__btn admin-page__btn--ghost"
            onClick={onClose}
            disabled={purchasing}
          >
            Cancel
          </button>
          <button
            type="button"
            className="admin-page__btn admin-page__btn--primary"
            style={{
              backgroundColor: canBuy ? "#4f46e5" : "#94a3b8",
              borderColor: canBuy ? "#4f46e5" : "#94a3b8",
              cursor: canBuy ? "pointer" : "not-allowed",
            }}
            disabled={!canBuy}
            onClick={handleBuy}
          >
            {purchasing ? (
              <>
                <LuLoader className="spin-icon" />
                <span>Processing…</span>
              </>
            ) : (
              <>
                <LuCheck />
                <span>
                  Pay ${selectedPkg.price.toFixed(2)} for {selectedPkg.credits.toLocaleString()} Credits
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BuyAiCreditsModal;
