import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  LuArrowUpRight,
  LuBanknote,
  LuCalendar,
  LuCheck,
  LuCreditCard,
  LuCrown,
  LuFileText,
  LuLoader,
  LuLock,
  LuSettings,
  LuShield,
  LuSparkles,
  LuZap,
} from "react-icons/lu";
import { toast } from "../../../utils/toast";
import { openPaymentCheckout } from "../../../utils/paymentCheckout";
import { checkoutPayPal, checkoutStripe, getCurrentPlan, getPlans } from "../../../services/PlanService";
import { acceptLegalConsent } from "../../../services/AuthService";
import { getLegalDocuments } from "../../../services/LegalService";
import { selectUser } from "../../../store/selectors/AuthSelectors";
import { updateUserStateAction } from "../../../store/actions/AuthActions";
import LegalDocumentModal from "../../legal/LegalDocumentModal";
import "../../../assets/css/legal-documents.css";

function formatPlanInterval(plan) {
  if (plan.billing_type === "monthly") {
    return "month";
  }
  return `${plan.duration_days ?? 30} days`;
}

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

  useEffect(() => {
    Promise.all([getPlans(), getCurrentPlan()])
      .then(([plansRes, currentRes]) => {
        setPlans(plansRes.data?.plans ?? []);
        setCurrent(currentRes.data);
      })
      .catch(() => toast.error("Failed to load plans."))
      .finally(() => setLoading(false));
  }, []);

  const activePlanId = current?.current_plan?.id ?? current?.subscription?.plan_id;
  const featuredPlanId = useMemo(() => {
    const pro = plans.find((p) => /pro/i.test(p.title) && p.billing_type === "monthly");
    if (pro) return pro.id;
    const monthly = plans.filter((p) => p.billing_type === "monthly");
    if (monthly.length >= 2) return monthly[1]?.id;
    return plans[1]?.id ?? plans[0]?.id;
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

  const handleCheckout = async (planId, provider) => {
    if (!validateLegalAgreementBeforePayment()) {
      return;
    }

    setCheckoutId(`${planId}-${provider}`);
    try {
      const options = {
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

    navigate(
      `/wallet?method=wire&amount=${encodeURIComponent(
        plan.price
      )}&note=${encodeURIComponent(`Subscription Plan: ${plan.title}`)}`
    );
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
      <header className="plans-hub__hero">
        <div className="plans-hub__hero-copy">
          <span className="plans-hub__eyebrow"><LuSparkles /> Subscription Plans</span>
          <h1>Choose the plan that fits your store</h1>
          <p>
            Scale your dropshipping business with flexible plans. Import products, sync orders,
            and automate listings — all from one dashboard.
          </p>
        </div>
        {current?.current_plan ? (
          <div className="plans-hub__active-chip">
            <span className="plans-hub__active-chip-icon"><LuCrown /></span>
            <div>
              <span className="plans-hub__active-chip-label">
                {current.current_plan.is_custom
                  ? "Your custom package"
                  : current?.custom_overrides?.has_overrides
                  ? "Your plan · Custom quotas"
                  : "Your plan"}
              </span>
              <strong>{current.current_plan.title}</strong>
              {current.plan_expires_at ? (
                <span>Renews {formatExpiryDate(current.plan_expires_at)}</span>
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

      {plans.length ? (
        <div className="plans-hub__grid">
          {plans.map((plan) => {
            const isCurrent = activePlanId === plan.id;
            const isCustom = Boolean(plan.is_custom);
            const isFeatured = !isCustom && plan.id === featuredPlanId && !isCurrent;
            const interval = formatPlanInterval(plan);
            const isOneTime = plan.billing_type !== "monthly";

            return (
              <article
                className={`plans-hub__card ${isCurrent ? "plans-hub__card--current" : ""} ${isFeatured ? "plans-hub__card--featured" : ""} ${isCustom ? "plans-hub__card--custom" : ""}`}
                key={plan.id}
              >
                {isCurrent ? (
                  <span className="plans-hub__ribbon plans-hub__ribbon--current">Current Plan</span>
                ) : isCustom ? (
                  <span className="plans-hub__ribbon plans-hub__ribbon--custom">
                    <LuLock /> Custom Package
                  </span>
                ) : isFeatured ? (
                  <span className="plans-hub__ribbon">Most Popular</span>
                ) : null}

                <div className="plans-hub__card-head">
                  <div className="plans-hub__card-icon">
                    {isCustom ? <LuLock /> : isOneTime ? <LuCalendar /> : isFeatured ? <LuCrown /> : <LuZap />}
                  </div>
                  <div>
                    <h2>{plan.title}</h2>
                    {isCustom && isCurrent ? (
                      <span className="plans-hub__custom-badge">
                        <LuLock /> Private Custom Package
                      </span>
                    ) : null}
                    <p>{plan.description}</p>
                  </div>
                </div>

                <div className="plans-hub__price">
                  <strong>${Number(plan.price).toFixed(2)}</strong>
                  <span>{plan.currency ?? "USD"} / {interval}</span>
                </div>

                {(plan.orders_limit !== null && plan.orders_limit !== undefined) ||
                (plan.stores_limit !== null && plan.stores_limit !== undefined) ? (
                  <div className="plans-hub__quota-chips">
                    <span>{Number(plan.products_limit ?? 200).toLocaleString()} Products</span>
                    {plan.orders_limit !== null && plan.orders_limit !== undefined ? (
                      <span>{Number(plan.orders_limit).toLocaleString()} Orders</span>
                    ) : null}
                    {plan.stores_limit !== null && plan.stores_limit !== undefined ? (
                      <span>
                        {Number(plan.stores_limit).toLocaleString()}{" "}
                        {Number(plan.stores_limit) === 1 ? "Store" : "Stores"}
                      </span>
                    ) : null}
                  </div>
                ) : null}

                <ul className="plans-hub__features">
                  {(plan.inclusions ?? []).map((item) => (
                    <li key={item}>
                      <LuCheck />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="plans-hub__card-foot">
                  {isCurrent ? (
                    <button type="button" className="plans-hub__btn plans-hub__btn--current" disabled>
                      <LuCheck />
                      <span>Current Plan</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={`plans-hub__btn ${isFeatured ? "plans-hub__btn--primary" : "plans-hub__btn--secondary"}`}
                        disabled={checkoutId === `${plan.id}-stripe`}
                        onClick={() => handleCheckout(plan.id, "stripe")}
                      >
                        {checkoutId === `${plan.id}-stripe` ? (
                          <LuLoader className="spin-icon" />
                        ) : (
                          <LuCreditCard />
                        )}
                        <span>{checkoutId === `${plan.id}-stripe` ? "Redirecting…" : "Pay with Credit Card/Debit Cards"}</span>
                      </button>
                      <button
                        type="button"
                        className="plans-hub__btn plans-hub__btn--ghost"
                        disabled={checkoutId === `${plan.id}-paypal`}
                        onClick={() => handleCheckout(plan.id, "paypal")}
                      >
                        {checkoutId === `${plan.id}-paypal` ? (
                          <LuLoader className="spin-icon" />
                        ) : null}
                        <span>{checkoutId === `${plan.id}-paypal` ? "Redirecting…" : "Pay with PayPal"}</span>
                        {!checkoutId || checkoutId !== `${plan.id}-paypal` ? <LuArrowUpRight /> : null}
                      </button>
                      <button
                        type="button"
                        className="plans-hub__btn plans-hub__btn--ghost"
                        onClick={() => handleWireCheckout(plan)}
                      >
                        <LuBanknote />
                        <span>Pay with Wire Transfer/ACH</span>
                      </button>
                    </>
                  )}
                </div>
              </article>
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
