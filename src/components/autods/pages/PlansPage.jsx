import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  LuArrowUpRight,
  LuCheck,
  LuClock,
  LuCreditCard,
  LuCrown,
  LuFileText,
  LuLoader,
  LuSettings,
  LuShield,
  LuSparkles,
} from "react-icons/lu";
import { toast } from "../../../utils/toast";
import { openPaymentCheckout } from "../../../utils/paymentCheckout";
import {
  activatePlan,
  checkoutPayPal,
  checkoutStripe,
  getCurrentPlan,
  getPlans,
  startPlanFreeTrial,
} from "../../../services/PlanService";
import { acceptLegalConsent } from "../../../services/AuthService";
import { getLegalDocuments } from "../../../services/LegalService";
import { selectUser } from "../../../store/selectors/AuthSelectors";
import {
  fetchFreshUserAction,
  updateUserStateAction,
} from "../../../store/actions/AuthActions";
import LegalDocumentModal from "../../legal/LegalDocumentModal";
import PlanReferenceCard from "./PlanReferenceCard";
import "../../../assets/css/legal-documents.css";

function formatExpiryDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function PlansPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [searchParams, setSearchParams] = useSearchParams();
  const [plans, setPlans] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutId, setCheckoutId] = useState(null);
  const [trialStartingId, setTrialStartingId] = useState(null);
  const [activatingId, setActivatingId] = useState(null);
  const initialCycleParam = (
    searchParams.get("billing_cycle") ||
    searchParams.get("billing_type") ||
    ""
  ).toLowerCase();
  const [billingCycle, setBillingCycle] = useState(
    initialCycleParam === "yearly" || initialCycleParam === "annual"
      ? "annual"
      : "monthly"
  );

  const hasStoredLegalConsent = Boolean(
    user?.legal_accepted || (user?.terms_accepted_at && user?.privacy_accepted_at)
  );
  const [termsAgreed, setTermsAgreed] = useState(hasStoredLegalConsent);
  const [privacyAgreed, setPrivacyAgreed] = useState(hasStoredLegalConsent);
  const [legalError, setLegalError] = useState(false);
  const [legalDocs, setLegalDocs] = useState({
    terms_and_conditions: null,
    privacy_policy: null,
  });
  const [legalLoading, setLegalLoading] = useState(false);
  const [legalModalType, setLegalModalType] = useState(null);

  const checkoutSuccess = searchParams.get("success");
  const checkoutCanceled = searchParams.get("canceled");

  useEffect(() => {
    if (hasStoredLegalConsent) {
      setTermsAgreed(true);
      setPrivacyAgreed(true);
      setLegalError(false);
    }
  }, [hasStoredLegalConsent]);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (checkoutSuccess) {
      toast.success("Payment successful! Your plan is being activated.");
      setSearchParams({}, { replace: true });
    }
    if (checkoutCanceled) {
      toast.info("Checkout canceled.");
      setSearchParams({}, { replace: true });
    }
  }, [checkoutSuccess, checkoutCanceled, setSearchParams]);

  const reloadPlansAndStatus = useCallback(async () => {
    try {
      const [plansRes, currentRes] = await Promise.all([getPlans(), getCurrentPlan()]);
      const list = plansRes.data?.plans ?? [];
      const currentData = currentRes.data;
      setPlans(list);
      setCurrent(currentData);
      if (currentData?.subscription?.billing_type === "yearly" && !initialCycleParam) {
        setBillingCycle("annual");
      }
      dispatch(fetchFreshUserAction());
      window.dispatchEvent(new CustomEvent("autods_refresh_quota"));
      window.dispatchEvent(new CustomEvent("autods_refresh_addons"));
    } catch {
      toast.error("Failed to load plans.");
    }
  }, [dispatch, initialCycleParam]);

  useEffect(() => {
    Promise.all([getPlans(), getCurrentPlan()])
      .then(([plansRes, currentRes]) => {
        const list = plansRes.data?.plans ?? [];
        const currentData = currentRes.data;
        setPlans(list);
        setCurrent(currentData);
        if (currentData?.subscription?.billing_type === "yearly" && !initialCycleParam) {
          setBillingCycle("annual");
        }
      })
      .catch(() => toast.error("Failed to load plans."))
      .finally(() => setLoading(false));
  }, [initialCycleParam]);

  const activePlanId = current?.current_plan?.id ?? current?.subscription?.plan_id;
  const activeBillingCycle = current?.subscription?.billing_type ?? current?.current_plan?.billing_type ?? null;
  const isOnFreeTrial = Boolean(current?.is_on_free_trial);
  const hasUsedFreeTrial = Boolean(current?.has_used_free_trial);
  const hasActivePaidPlan = Boolean(
    current?.is_plan_paid &&
      current?.plan_expires_at &&
      new Date(current.plan_expires_at).getTime() > Date.now()
  );
  const signFreeAvailable = Boolean(current?.sign_free_available);
  const isSignFreeCurrent = Boolean(current?.current_plan?.is_sign_free && !current?.is_plan_paid);
  const hasAnyAnnualOption = useMemo(
    () =>
      plans.some(
        (p) =>
          Boolean(p.has_annual_plan) ||
          p.billing_type === "yearly" ||
          (p.billing_type === "monthly" &&
            p.annual_price !== null &&
            p.annual_price !== undefined &&
            p.annual_price !== "")
      ),
    [plans]
  );

  const maxAnnualDiscount = useMemo(() => {
    let best = 0;
    plans.forEach((p) => {
      let pct = Number(p.annual_discount_percent ?? 0);
      if (!pct && p.billing_type === "monthly" && p.annual_price !== null && p.annual_price !== undefined) {
        const m12 = Number(p.price ?? 0) * 12;
        const a = Number(p.annual_price);
        if (m12 > 0 && a < m12) {
          pct = Math.round(((m12 - a) / m12) * 1000) / 10;
        }
      }
      if (pct > best) {
        best = pct;
      }
    });
    return best;
  }, [plans]);

  const featuredPlanId = useMemo(() => {
    const publicPlans = plans.filter((p) => !p.is_custom);
    if (!publicPlans.length) return null;
    const pro =
      publicPlans.find(
        (p) =>
          /\bpro\b|professional/i.test(p.title || "") &&
          (p.base_billing_type || p.billing_type) === "monthly"
      ) ??
      publicPlans.find(
        (p) =>
          /pro/i.test(p.title || "") &&
          (p.base_billing_type || p.billing_type) === "monthly"
      );
    if (pro) return pro.id;
    const monthly = publicPlans.filter(
      (p) => (p.base_billing_type || p.billing_type) === "monthly"
    );
    if (monthly.length >= 2) return monthly[1]?.id;
    return publicPlans[1]?.id ?? publicPlans[0]?.id;
  }, [plans]);

  const validateLegalAgreementBeforePayment = () => {
    if (hasStoredLegalConsent || (termsAgreed && privacyAgreed)) {
      setLegalError(false);
      return true;
    }
    setLegalError(true);
    toast.error("Please agree to both the Terms & Conditions and Privacy Policy before proceeding to payment.");
    return false;
  };

  const handleCheckout = async (planId, provider, requestedCycle = null) => {
    if (!validateLegalAgreementBeforePayment()) {
      return;
    }

    const plan = plans.find((p) => p.id === planId);
    const resolvedCycle =
      requestedCycle ||
      (plan?.billing_type === "one_time"
        ? "one_time"
        : billingCycle === "annual" && plan?.has_annual_plan
        ? "yearly"
        : plan?.billing_type === "yearly"
        ? "yearly"
        : "monthly");

    setCheckoutId(`${planId}-${provider}`);
    try {
      const options = {
        billing_cycle: resolvedCycle,
        terms_accepted: true,
        privacy_accepted: true,
      };
      const res = provider === "stripe"
        ? await checkoutStripe(planId, options)
        : await checkoutPayPal(planId, options);
      if (!hasStoredLegalConsent) {
        const nowIso = new Date().toISOString();
        dispatch(
          updateUserStateAction({
            terms_accepted_at: user?.terms_accepted_at || nowIso,
            privacy_accepted_at: user?.privacy_accepted_at || nowIso,
            legal_accepted: true,
          })
        );
      }
      if (res.data?.url) {
        openPaymentCheckout(res.data.url);
      }
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.requires_legal_consent) {
        setLegalError(true);
      }
      toast.error(err.response?.data?.error ?? err.response?.data?.message ?? "Checkout failed.");
    } finally {
      setCheckoutId(null);
    }
  };

  const handleWireCheckout = async (plan) => {
    if (!validateLegalAgreementBeforePayment()) {
      return;
    }

    if (!hasStoredLegalConsent) {
      try {
        const consentRes = await acceptLegalConsent({
          terms_accepted: true,
          privacy_accepted: true,
        });
        dispatch(updateUserStateAction(consentRes.data));
      } catch (err) {
        toast.error(err.response?.data?.message ?? "Failed to record agreement consent.");
        return;
      }
    }

    const checkoutPrice =
      plan.effective_checkout_price !== undefined && plan.effective_checkout_price !== null
        ? plan.effective_checkout_price
        : plan.price;
    const cycleNote =
      plan.effective_checkout_cycle === "yearly"
        ? "Annual"
        : plan.effective_checkout_cycle === "one_time"
        ? `${plan.duration_days ?? 30}-Day`
        : "Monthly";

    navigate(
      `/wallet?method=wire&amount=${encodeURIComponent(
        checkoutPrice
      )}&note=${encodeURIComponent(`Subscription Plan: ${plan.title} (${cycleNote})`)}`
    );
  };

  const handleStartFreeTrial = async (planId) => {
    if (!validateLegalAgreementBeforePayment()) {
      return;
    }

    setTrialStartingId(planId);
    try {
      const res = await startPlanFreeTrial(planId, {
        terms_accepted: true,
        privacy_accepted: true,
      });

      const nextUser = res.data?.user;
      if (nextUser) {
        dispatch(updateUserStateAction({ ...nextUser, legal_accepted: true }));
      } else if (!hasStoredLegalConsent) {
        const nowIso = new Date().toISOString();
        dispatch(
          updateUserStateAction({
            terms_accepted_at: user?.terms_accepted_at || nowIso,
            privacy_accepted_at: user?.privacy_accepted_at || nowIso,
            legal_accepted: true,
          })
        );
      }

      toast.success(res.data?.message || "Free trial started!");
      await reloadPlansAndStatus();
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.requires_legal_consent) {
        setLegalError(true);
      }
      toast.error(err.response?.data?.error ?? err.response?.data?.message ?? "Failed to start free trial.");
    } finally {
      setTrialStartingId(null);
    }
  };

  const handleActivateFreePlan = async (planId) => {
    if (!validateLegalAgreementBeforePayment()) {
      return;
    }

    const plan = plans.find((p) => p.id === planId);
    const resolvedCycle =
      plan?.base_billing_type === "one_time" || plan?.billing_type === "one_time"
        ? "one_time"
        : plan?.base_billing_type === "yearly" || plan?.billing_type === "yearly"
        ? "yearly"
        : "monthly";

    setActivatingId(planId);
    try {
      const res = await activatePlan(planId, {
        provider: "system",
        billing_cycle: resolvedCycle,
        terms_accepted: true,
        privacy_accepted: true,
      });

      const nextUser = res.data?.user;
      if (nextUser) {
        dispatch(updateUserStateAction({ ...nextUser, legal_accepted: true }));
      }

      toast.success(res.data?.message || "Free plan activated!");
      await reloadPlansAndStatus();
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.requires_legal_consent) {
        setLegalError(true);
      }
      toast.error(err.response?.data?.error ?? err.response?.data?.message ?? "Failed to activate free plan.");
    } finally {
      setActivatingId(null);
    }
  };

  if (loading) {
    return (
      <section className="plans-hub card-wrapper">
        <div className="plans-hub__loading">
          <LuLoader className="spin-icon" />
          <span>Loading plans…</span>
        </div>
        <div className="plans-hub__grid plans-hub__grid--loading">
          {[1, 2, 3].map((key) => (
            <div className="plans-hub__skeleton" key={key} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="plans-hub card-wrapper">
      <header className="plans-hub__hero plans-hub__hero--ref">
        <div className="plans-hub__hero-copy">
          <span className="plans-hub__eyebrow"><LuSparkles /> Pricing &amp; Plans</span>
          <h1>Choose the plan that fits your store</h1>
          <p>
            Powerful automation tools to help you import, list, manage and grow your dropshipping business.
          </p>
        </div>
        {current?.current_plan ? (
          <div className="plans-hub__active-chip">
            <span className="plans-hub__active-chip-icon">
              {isOnFreeTrial ? <LuClock /> : <LuCrown />}
            </span>
            <div>
              <span className="plans-hub__active-chip-label">
                {isOnFreeTrial
                  ? "Free trial active"
                  : isSignFreeCurrent
                  ? "Sign Free Plan"
                  : current.current_plan.is_custom
                  ? "Your custom package"
                  : current?.custom_overrides?.has_overrides
                  ? "Your plan · Custom quotas"
                  : "Your plan"}
              </span>
              <strong>{current.current_plan.title}</strong>
              {isOnFreeTrial ? (
                <span>
                  Ends {formatExpiryDate(current.trial_ends_at || current.plan_expires_at)} ·{" "}
                  {signFreeAvailable
                    ? "Auto-switches to Free plan unless upgraded"
                    : "Upgrade before end to stay active"}
                </span>
              ) : current.plan_expires_at ? (
                <span>Renews {formatExpiryDate(current.plan_expires_at)}</span>
              ) : isSignFreeCurrent ? (
                <span>No expiry · Upgrade anytime</span>
              ) : (
                <span>Active subscription</span>
              )}
            </div>
          </div>
        ) : null}
      </header>

      {checkoutSuccess ? (
        <div className="plans-hub__banner plans-hub__banner--success">
          <LuCheck />
          <span>Payment received — your plan will activate shortly.</span>
        </div>
      ) : null}

      {checkoutCanceled ? (
        <div className="plans-hub__banner plans-hub__banner--info">
          <span>Checkout was canceled. You can try again anytime.</span>
        </div>
      ) : null}

      {!hasStoredLegalConsent ? (
        <div
          className={`auth-page__legal-box ${legalError ? "auth-page__legal-box--error" : ""}`}
          style={{ marginBottom: "20px" }}
        >
          <div className="auth-page__legal-header">
            <LuFileText />
            <span>Agreement Required Before Plan Payment</span>
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
                I have read and agree to the{" "}
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
                I have read and agree to the{" "}
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

          {legalError ? (
            <span className="auth-page__field-error">
              You must agree to both the Terms &amp; Conditions and Privacy Policy before completing payment.
            </span>
          ) : null}
        </div>
      ) : null}

      {plans.length && hasAnyAnnualOption ? (
        <div className="plans-billing-bar">
          <div className="plans-billing-toggle" role="group" aria-label="Billing Cycle">
            <button
              type="button"
              className={`plans-billing-toggle__btn ${billingCycle === "monthly" ? "is-active" : ""}`}
              onClick={() => setBillingCycle("monthly")}
            >
              <span>Monthly</span>
            </button>
            <button
              type="button"
              className={`plans-billing-toggle__btn ${billingCycle === "annual" ? "is-active" : ""}`}
              onClick={() => setBillingCycle("annual")}
            >
              <span>Annual</span>
              {maxAnnualDiscount > 0 ? (
                <span className="plans-billing-toggle__save-badge">
                  Save up to {maxAnnualDiscount}%
                </span>
              ) : null}
            </button>
          </div>
          {billingCycle === "annual" && maxAnnualDiscount > 0 ? (
            <span className="plans-billing-bar__hint">
              Discount calculated against 12 months of monthly billing.
            </span>
          ) : null}
        </div>
      ) : null}

      {plans.length ? (
        <div
          className={`pricing-grid ${
            plans.length >= 5 ? "pricing-grid--dense" : ""
          }`}
        >
          {plans.map((plan, index) => {
            const isCurrent = activePlanId === plan.id;
            const isCustom = Boolean(plan.is_custom);
            const isFeatured = !isCustom && plan.id === featuredPlanId;

            return (
              <PlanReferenceCard
                key={plan.id}
                plan={plan}
                index={index}
                isCurrent={isCurrent}
                isOnFreeTrial={isOnFreeTrial}
                hasUsedFreeTrial={hasUsedFreeTrial}
                hasActivePaidPlan={hasActivePaidPlan}
                activeBillingCycle={activeBillingCycle}
                isFeatured={isFeatured}
                mode="user"
                billingCycle={billingCycle}
                checkoutId={checkoutId}
                trialStartingId={trialStartingId}
                activatingId={activatingId}
                onCheckoutStripe={(id, cycle) => handleCheckout(id, "stripe", cycle)}
                onCheckoutPayPal={(id, cycle) => handleCheckout(id, "paypal", cycle)}
                onWireCheckout={handleWireCheckout}
                onStartFreeTrial={handleStartFreeTrial}
                onActivateFreePlan={handleActivateFreePlan}
              />
            );
          })}
        </div>
      ) : (
        <div className="plans-hub__empty">
          <LuCrown />
          <strong>No plans available</strong>
          <span>Plans haven&apos;t been configured yet. Check back soon or contact support.</span>
        </div>
      )}

      <footer className="plans-hub__footer">
        <div className="plans-hub__trust">
          <div className="plans-hub__trust-item">
            <LuShield />
            <div>
              <strong>Secure checkout</strong>
              <span>Stripe &amp; PayPal encrypted payments</span>
            </div>
          </div>
          <div className="plans-hub__trust-item">
            <LuCreditCard />
            <div>
              <strong>Flexible billing</strong>
              <span>
                By paying you agree to our{" "}
                <Link to="/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="auth-page__legal-link">
                  Terms &amp; Conditions
                </Link>{" "}
                &amp;{" "}
                <Link to="/privacy-policy" target="_blank" rel="noopener noreferrer" className="auth-page__legal-link">
                  Privacy Policy
                </Link>
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          className="plans-hub__settings-link"
          onClick={() => navigate("/settings?tab=billing")}
        >
          <LuSettings />
          <span>Manage payment methods in Settings</span>
          <LuArrowUpRight />
        </button>
      </footer>

      <LegalDocumentModal
        open={Boolean(legalModalType)}
        type={legalModalType || "terms"}
        documentData={
          legalModalType === "privacy"
            ? legalDocs.privacy_policy
            : legalDocs.terms_and_conditions
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
    </section>
  );
}

export default PlansPage;
