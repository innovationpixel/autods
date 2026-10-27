import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LuCheck, LuLoader, LuSparkles, LuWallet, LuX, LuZap } from "react-icons/lu";
import { selectUser } from "../../../store/selectors/AuthSelectors";
import { updateProfileAction } from "../../../store/actions/AuthActions";
import { buyAiCredits } from "../../../services/AiGenerationService";
import { toast } from "../../../utils/toast";

const PACKAGES = [
  { id: "1000", credits: 1000, label: "1,000 Credits", price: 20.0, rate: "$0.20 / 10 credits", badge: null },
  { id: "5000", credits: 5000, label: "5,000 Credits", price: 30.0, rate: "$0.06 / 10 credits", badge: "Most Popular" },
  { id: "10000", credits: 10000, label: "10,000 Credits", price: 50.0, rate: "$0.05 / 10 credits", badge: "Best Value" },
  { id: "20000", credits: 20000, label: "20,000 Credits", price: 80.0, rate: "$0.04 / 10 credits", badge: null },
];

function BuyAiCreditsModal({ open, onClose, onSuccess, currentCredits, requiredCredits }) {
  const dispatch = useDispatch();
  const authUser = useSelector(selectUser);
  const [selectedId, setSelectedId] = useState("5000");
  const [purchasing, setPurchasing] = useState(false);

  if (!open) return null;

  const selectedPkg = PACKAGES.find((p) => p.id === selectedId) || PACKAGES[1];
  const walletBalance = parseFloat(authUser?.wallet_balance ?? 0);
  const userAiCredits = currentCredits !== undefined ? currentCredits : (authUser?.ai_credits ?? 0);
  const hasEnoughBalance = walletBalance >= selectedPkg.price;

  const handleBuy = async () => {
    if (!hasEnoughBalance) {
      toast.error(
        `Insufficient wallet balance ($${walletBalance.toFixed(2)}). You need $${selectedPkg.price.toFixed(2)}. Please load your AutoDS wallet first.`
      );
      return;
    }

    setPurchasing(true);
    try {
      const res = await buyAiCredits(selectedPkg.id);
      const data = res.data;
      toast.success(data.message || `Purchased ${selectedPkg.credits.toLocaleString()} AI Credits!`);

      // Update Redux auth user with new credits & balance
      dispatch(
        updateProfileAction({
          ai_credits: data.ai_credits,
          wallet_balance: data.wallet_balance,
        })
      );

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
    <div className="orders-modal" style={{ zIndex: 1100 }}>
      <div className="orders-modal__backdrop" onClick={onClose} />
      <div
        className="orders-modal__card"
        style={{
          maxWidth: 540,
          width: "100%",
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

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
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
              Fast-track image and template generation with instant AI credits.
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
            marginBottom: 16,
          }}
        >
          <div>
            <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 600, display: "block" }}>
              Current Credits
            </span>
            <strong style={{ fontSize: 16, color: "#4f46e5", display: "flex", alignItems: "center", gap: 4 }}>
              <LuZap style={{ fontSize: 14 }} /> {userAiCredits.toLocaleString()} Credits
            </strong>
          </div>
          <div>
            <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 600, display: "block" }}>
              Wallet Balance
            </span>
            <strong style={{ fontSize: 16, color: "#0f172a", display: "flex", alignItems: "center", gap: 4 }}>
              <LuWallet style={{ fontSize: 14 }} /> ${walletBalance.toFixed(2)} USD
            </strong>
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
            ⚠️ You need <strong>{requiredCredits.toLocaleString()} credits</strong> to complete this action, but have{" "}
            <strong>{userAiCredits.toLocaleString()}</strong>. Choose a package below to top up.
          </div>
        ) : null}

        {/* Package list */}
        <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
          {PACKAGES.map((pkg) => {
            const isSelected = selectedId === pkg.id;
            return (
              <label
                key={pkg.id}
                onClick={() => setSelectedId(pkg.id)}
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
                    onChange={() => setSelectedId(pkg.id)}
                    style={{ accentColor: "#4f46e5", width: 18, height: 18 }}
                  />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <strong style={{ fontSize: 15, color: "#0f172a" }}>{pkg.label}</strong>
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
                    <span style={{ fontSize: 12, color: "#64748b" }}>{pkg.rate}</span>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <strong style={{ fontSize: 17, color: "#0f172a" }}>${pkg.price.toFixed(2)}</strong>
                </div>
              </label>
            );
          })}
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
            <span>Insufficient wallet balance (${walletBalance.toFixed(2)} available).</span>
            <span style={{ fontWeight: 600 }}>Top up wallet first</span>
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
              backgroundColor: hasEnoughBalance ? "#4f46e5" : "#94a3b8",
              borderColor: hasEnoughBalance ? "#4f46e5" : "#94a3b8",
              cursor: hasEnoughBalance && !purchasing ? "pointer" : "not-allowed",
            }}
            disabled={!hasEnoughBalance || purchasing}
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
                <span>Pay ${selectedPkg.price.toFixed(2)} from Wallet</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BuyAiCreditsModal;
