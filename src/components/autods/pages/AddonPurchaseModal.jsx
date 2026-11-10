import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  LuArrowUpRight,
  LuBadgeCheck,
  LuChartLine,
  LuCreditCard,
  LuFileText,
  LuLoader,
  LuShield,
  LuWallet,
  LuX,
} from "react-icons/lu";
import { selectUser } from "../../../store/selectors/AuthSelectors";
import { fetchFreshUserAction, updateUserStateAction } from "../../../store/actions/AuthActions";
import {
  checkoutAddonPayPal,
  checkoutAddonStripe,
  purchaseAddonWithWallet,
} from "../../../services/AddonService";
import { getLegalDocuments } from "../../../services/LegalService";
import { openPaymentCheckout } from "../../../utils/paymentCheckout";
import { toast } from "../../../utils/toast";
import LegalDocumentModal from "../../legal/LegalDocumentModal";
import "../../../assets/css/legal-documents.css";

function AddonPurchaseModal({
  open,
  addon,
  walletBalance: walletBalanceProp,
  onClose,
  onSuccess,
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const authUser = useSelector(selectUser);

  const hasStoredLegalConsent = Boolean(
    authUser?.legal_accepted || (authUser?.terms_accepted_at && authUser?.privacy_accepted_at)
  );

  const [submittingProvider, setSubmittingProvider] = useState(null);
  const [termsAgreed, setTermsAgreed] = useState(hasStoredLegalConsent);
  const [privacyAgreed, setPrivacyAgreed] = useState(hasStoredLegalConsent);
  const [legalError, setLegalError] = useState(false);
  const [legalDocs, setLegalDocs] = useState({
    terms_and_conditions: null,
    privacy_policy: null,
  });
  const [legalLoading, setLegalLoading] = useState(false);
  const [legalModalType, setLegalModalType] = useState(null);

  useEffect(() => {
    if (hasStoredLegalConsent) {
      setTermsAgreed(true);
      setPrivacyAgreed(true);
      setLegalError(false);
    }
  }, [hasStoredLegalConsent]);

  useEffect(() => {
    if (!open || hasStoredLegalConsent) return;
    setLegalLoading(true);
    getLegalDocuments()
      .then((res) => {
        setLegalDocs({
          terms_and_conditions: res.data?.terms_and_conditions ?? null,
          privacy_policy: res.data?.privacy_policy ?? null,
        });
      })
      .catch(() => {})
      .finally(() => setLegalLoading(false));
  }, [open, hasStoredLegalConsent]);

  useEffect(() => {
    if (!open) {
      setSubmittingProvider(null);
      setLegalError(false);
      setLegalModalType(null);
    }
  }, [open]);

  if (!open || !addon) return null;

  const isTrending = addon.key === "trending_products";
  const price = Math.max(0, Number(addon.price ?? 0));
  const billingMode = addon.billing_mode === "one_time" ? "one_time" : "monthly";
  const intervalLabel = billingMode === "monthly" ? "/ month" : "one-time unlock";
  const walletBalance = parseFloat(
    walletBalanceProp !== undefined && walletBalanceProp !== null
      ? walletBalanceProp
      : (authUser?.wallet_balance ?? 0)
  );
  const hasEnoughWallet = walletBalance >= price;
  const currency = authUser?.wallet_currency ?? "USD";

  const validateLegalConsent = () => {
    if (hasStoredLegalConsent || (termsAgreed && privacyAgreed)) {
      setLegalError(false);
      return true;
    }
    setLegalError(true);
    toast.error("Please agree to both the Terms & Conditions and Privacy Policy before completing payment.");
    return false;
  };

  const syncConsentState = () => {
    if (!hasStoredLegalConsent) {
      const nowIso = new Date().toISOString();
      dispatch(
        updateUserStateAction({
          terms_accepted_at: authUser?.terms_accepted_at || nowIso,
          privacy_accepted_at: authUser?.privacy_accepted_at || nowIso,
          legal_accepted: true,
        })
      );
    }
  };

  const handleWalletPurchase = async () => {
    if (!validateLegalConsent()) return;

    if (!hasEnoughWallet && price > 0) {
      toast.error(
        `Insufficient wallet balance ($${walletBalance.toFixed(2)}). You need $${price.toFixed(2)}. Please top up your AutoDS Wallet or use Card / PayPal below.`
      );
      return;
    }

    setSubmittingProvider("wallet");
    try {
      const res = await purchaseAddonWithWallet(addon.key, {
        terms_accepted: true,
        privacy_accepted: true,
      });
      const data = res.data;
      syncConsentState();
      if (data?.wallet_balance !== undefined) {
        dispatch(updateUserStateAction({ wallet_balance: data.wallet_balance }));
      } else {
        dispatch(fetchFreshUserAction());
      }
      window.dispatchEvent(new CustomEvent("autods_refresh_addons"));
      try {
        localStorage.setItem("autods_addon_updated_at", String(Date.now()));
      } catch {
        // Ignore cross-tab storage errors
      }
      toast.success(data?.message || `${addon.title} activated successfully!`);
      onSuccess?.(data);
      onClose();
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.requires_legal_consent) {
        setLegalError(true);
      }
      toast.error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to unlock add-on from wallet."
      );
    } finally {
      setSubmittingProvider(null);
    }
  };

  const handleExternalCheckout = async (provider) => {
    if (!validateLegalConsent()) return;

    setSubmittingProvider(provider);
    try {
      const options = {
        return_path: "/settings?tab=plans",
        terms_accepted: true,
        privacy_accepted: true,
      };
      const res =
        provider === "stripe"
          ? await checkoutAddonStripe(addon.key, options)
          : await checkoutAddonPayPal(addon.key, options);

      syncConsentState();
      if (res.data?.url) {
        openPaymentCheckout(res.data.url);
        onClose();
      } else {
        toast.error("Could not start checkout session.");
      }
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.requires_legal_consent) {
        setLegalError(true);
      }
      toast.error(err.response?.data?.error || err.response?.data?.message || "Checkout failed.");
    } finally {
      setSubmittingProvider(null);
    }
  };

  return (
    <>
      <div className="orders-modal" style={{ zIndex: 1100 }}>
        <div className="orders-modal__backdrop" onClick={() => !submittingProvider && onClose()} />
        <div
          className="orders-modal__card"
          style={{
            maxWidth: 520,
            width: "calc(100% - 32px)",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: 24,
            borderRadius: 16,
            backgroundColor: "#ffffff",
            boxShadow: "0 20px 45px rgba(15, 23, 42, 0.22)",
            position: "relative",
          }}
        >
          <button
            type="button"
            className="orders-icon-btn"
            aria-label="Close"
            onClick={onClose}
            disabled={Boolean(submittingProvider)}
            style={{ position: "absolute", top: 16, right: 16 }}
          >
            <LuX />
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, paddingRight: 28 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: isTrending
                  ? "linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                  : "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                flexShrink: 0,
              }}
            >
              {isTrending ? <LuChartLine /> : <LuBadgeCheck />}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <h2 style={{ fontSize: 19, fontWeight: 800, margin: 0, color: "#0f172a" }}>
                  Unlock {addon.title}
                </h2>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: billingMode === "monthly" ? "#eff6ff" : "#ecfdf5",
                    color: billingMode === "monthly" ? "#1d4ed8" : "#047857",
                    border: billingMode === "monthly" ? "1px solid #bfdbfe" : "1px solid #a7f3d0",
                  }}
                >
                  {billingMode === "monthly" ? "Monthly Recurring" : "One-Time Unlock"}
                </span>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#64748b", lineHeight: 1.45 }}>
                {addon.description}
              </p>
            </div>
          </div>

          {/* Pricing + Wallet Summary */}
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
              <span
                style={{
                  fontSize: 11,
                  color: "#64748b",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  display: "block",
                }}
              >
                Add-on Price
              </span>
              <strong style={{ fontSize: 18, color: "#0f172a" }}>
                {price <= 0 ? "Free" : `$${price.toFixed(2)}`}{" "}
                {price > 0 ? (
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>
                    {intervalLabel}
                  </span>
                ) : null}
              </strong>
            </div>

            <div>
              <span
                style={{
                  fontSize: 11,
                  color: "#64748b",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  display: "block",
                }}
              >
                AutoDS Wallet Balance
              </span>
              <strong
                style={{
                  fontSize: 17,
                  color: hasEnoughWallet ? "#059669" : "#b91c1c",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <LuWallet style={{ fontSize: 15 }} /> ${walletBalance.toFixed(2)} {currency}
              </strong>
            </div>
          </div>

          {!hasStoredLegalConsent ? (
            <div
              className={`auth-page__legal-box ${legalError ? "auth-page__legal-box--error" : ""}`}
              style={{ marginBottom: 16 }}
            >
              <div className="auth-page__legal-header">
                <LuFileText />
                <span>Agreement Required Before Add-on Payment</span>
              </div>

              <div className="auth-page__legal-item">
                <label className="auth-page__checkbox">
                  <input
                    type="checkbox"
                    checked={termsAgreed}
                    onChange={(e) => {
                      setTermsAgreed(e.target.checked);
                      if (e.target.checked && privacyAgreed) setLegalError(false);
                    }}
                  />
                  <span>
                    I agree to the{" "}
                    <button
                      type="button"
                      className="auth-page__legal-link"
                      onClick={() => setLegalModalType("terms")}
                    >
                      Terms &amp; Conditions
                    </button>
                  </span>
                </label>
              </div>

              <div className="auth-page__legal-item">
                <label className="auth-page__checkbox">
                  <input
                    type="checkbox"
                    checked={privacyAgreed}
                    onChange={(e) => {
                      setPrivacyAgreed(e.target.checked);
                      if (termsAgreed && e.target.checked) setLegalError(false);
                    }}
                  />
                  <span>
                    I agree to the{" "}
                    <button
                      type="button"
                      className="auth-page__legal-link"
                      onClick={() => setLegalModalType("privacy")}
                    >
                      Privacy Policy
                    </button>
                  </span>
                </label>
              </div>
            </div>
          ) : null}

          {price > 0 && !hasEnoughWallet ? (
            <div
              style={{
                padding: "10px 14px",
                backgroundColor: "#fffbeb",
                borderRadius: 8,
                border: "1px solid #fde68a",
                marginBottom: 14,
                fontSize: 12.5,
                color: "#92400e",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <span>
                Your wallet has ${walletBalance.toFixed(2)} (${price.toFixed(2)} needed). Pay via Card/PayPal below or top up your wallet.
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate("/wallet");
                }}
                style={{
                  border: "1px solid #d97706",
                  background: "#ffffff",
                  color: "#b45309",
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Top Up Wallet
              </button>
            </div>
          ) : null}

          <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
            <button
              type="button"
              disabled={Boolean(submittingProvider) || (price > 0 && !hasEnoughWallet)}
              onClick={handleWalletPurchase}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                width: "100%",
                padding: "12px 16px",
                borderRadius: 10,
                border: "none",
                background:
                  price > 0 && !hasEnoughWallet
                    ? "#e2e8f0"
                    : "linear-gradient(135deg, #059669 0%, #047857 100%)",
                color: price > 0 && !hasEnoughWallet ? "#64748b" : "#ffffff",
                fontWeight: 700,
                fontSize: 14,
                cursor:
                  submittingProvider || (price > 0 && !hasEnoughWallet)
                    ? "not-allowed"
                    : "pointer",
                boxShadow:
                  price > 0 && !hasEnoughWallet ? "none" : "0 4px 12px rgba(5, 150, 105, 0.28)",
              }}
            >
              {submittingProvider === "wallet" ? (
                <LuLoader className="spin-icon" />
              ) : (
                <LuWallet />
              )}
              <span>
                {submittingProvider === "wallet"
                  ? "Activating with Wallet…"
                  : price <= 0
                  ? "Activate Free Add-on"
                  : `Pay $${price.toFixed(2)} with AutoDS Wallet`}
              </span>
            </button>

            {price > 0 ? (
              <>
                <button
                  type="button"
                  disabled={Boolean(submittingProvider)}
                  onClick={() => handleExternalCheckout("stripe")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    width: "100%",
                    padding: "11px 16px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    background: "#0f172a",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: 13.5,
                    cursor: submittingProvider ? "not-allowed" : "pointer",
                  }}
                >
                  {submittingProvider === "stripe" ? (
                    <LuLoader className="spin-icon" />
                  ) : (
                    <LuCreditCard />
                  )}
                  <span>
                    {submittingProvider === "stripe"
                      ? "Opening Stripe Checkout…"
                      : "Pay with Credit / Debit Card (Stripe)"}
                  </span>
                  {submittingProvider !== "stripe" ? <LuArrowUpRight /> : null}
                </button>

                <button
                  type="button"
                  disabled={Boolean(submittingProvider)}
                  onClick={() => handleExternalCheckout("paypal")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    width: "100%",
                    padding: "11px 16px",
                    borderRadius: 10,
                    border: "1px solid #bfdbfe",
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    fontWeight: 700,
                    fontSize: 13.5,
                    cursor: submittingProvider ? "not-allowed" : "pointer",
                  }}
                >
                  {submittingProvider === "paypal" ? <LuLoader className="spin-icon" /> : null}
                  <span>
                    {submittingProvider === "paypal"
                      ? "Opening PayPal Checkout…"
                      : "Pay with PayPal"}
                  </span>
                  {submittingProvider !== "paypal" ? <LuArrowUpRight /> : null}
                </button>
              </>
            ) : null}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid #f1f5f9",
              paddingTop: 12,
              fontSize: 11.5,
              color: "#64748b",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <LuShield style={{ color: "#059669" }} /> Instant unlock upon payment confirmation
            </span>
            <button
              type="button"
              onClick={onClose}
              disabled={Boolean(submittingProvider)}
              style={{
                background: "none",
                border: "none",
                color: "#475569",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <LegalDocumentModal
        open={Boolean(legalModalType)}
        type={legalModalType || "terms"}
        documentData={
          legalModalType === "privacy" ? legalDocs.privacy_policy : legalDocs.terms_and_conditions
        }
        loading={legalLoading}
        onAgree={
          !hasStoredLegalConsent
            ? () => {
                if (legalModalType === "privacy") {
                  setPrivacyAgreed(true);
                  if (termsAgreed) setLegalError(false);
                } else {
                  setTermsAgreed(true);
                  if (privacyAgreed) setLegalError(false);
                }
              }
            : undefined
        }
        onClose={() => setLegalModalType(null)}
      />
    </>
  );
}

export default AddonPurchaseModal;
