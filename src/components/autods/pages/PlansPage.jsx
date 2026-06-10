import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  LuArrowUpRight,
  LuCalendar,
  LuCheck,
  LuCreditCard,
  LuCrown,
  LuLoader,
  LuSettings,
  LuShield,
  LuSparkles,
  LuZap,
} from "react-icons/lu";
import { toast } from "../../../utils/toast";
import { openPaymentCheckout } from "../../../utils/paymentCheckout";
import { checkoutPayPal, checkoutStripe, getCurrentPlan, getPlans } from "../../../services/PlanService";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [plans, setPlans] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutId, setCheckoutId] = useState(null);

  const checkoutSuccess = searchParams.get("success");
  const checkoutCanceled = searchParams.get("canceled");

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

  const handleCheckout = async (planId, provider) => {
    setCheckoutId(`${planId}-${provider}`);
    try {
      const res = provider === "stripe"
        ? await checkoutStripe(planId)
        : await checkoutPayPal(planId);
      if (res.data?.url) {
        openPaymentCheckout(res.data.url);
      }
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Checkout failed.");
    } finally {
      setCheckoutId(null);
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
              <span className="plans-hub__active-chip-label">Your plan</span>
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

      {plans.length ? (
        <div className="plans-hub__grid">
          {plans.map((plan) => {
            const isCurrent = activePlanId === plan.id;
            const isFeatured = plan.id === featuredPlanId && !isCurrent;
            const interval = formatPlanInterval(plan);
            const isOneTime = plan.billing_type !== "monthly";

            return (
              <article
                className={`plans-hub__card ${isCurrent ? "plans-hub__card--current" : ""} ${isFeatured ? "plans-hub__card--featured" : ""}`}
                key={plan.id}
              >
                {isFeatured ? <span className="plans-hub__ribbon">Most Popular</span> : null}
                {isCurrent ? <span className="plans-hub__ribbon plans-hub__ribbon--current">Current Plan</span> : null}

                <div className="plans-hub__card-head">
                  <div className="plans-hub__card-icon">
                    {isOneTime ? <LuCalendar /> : isFeatured ? <LuCrown /> : <LuZap />}
                  </div>
                  <div>
                    <h2>{plan.title}</h2>
                    <p>{plan.description}</p>
                  </div>
                </div>

                <div className="plans-hub__price">
                  <strong>${Number(plan.price).toFixed(2)}</strong>
                  <span>{plan.currency ?? "USD"} / {interval}</span>
                </div>

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
                        <span>{checkoutId === `${plan.id}-stripe` ? "Redirecting…" : "Pay with Stripe"}</span>
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
              <span>Manage cards and PayPal in settings</span>
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
    </section>
  );
}

export default PlansPage;
