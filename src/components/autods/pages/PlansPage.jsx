import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LuCheck, LuLoader } from "react-icons/lu";
import { toast } from "../../../utils/toast";
import { checkoutPayPal, checkoutStripe, getCurrentPlan, getPlans } from "../../../services/PlanService";

function PlansPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [plans, setPlans] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutId, setCheckoutId] = useState(null);

  useEffect(() => {
    if (searchParams.get("success")) {
      toast.success("Payment successful! Your plan is being activated.");
    }
    if (searchParams.get("canceled")) {
      toast.info("Checkout canceled.");
    }
  }, [searchParams]);

  useEffect(() => {
    Promise.all([getPlans(), getCurrentPlan()])
      .then(([plansRes, currentRes]) => {
        setPlans(plansRes.data?.plans ?? []);
        setCurrent(currentRes.data);
      })
      .catch(() => toast.error("Failed to load plans."))
      .finally(() => setLoading(false));
  }, []);

  const handleCheckout = async (planId, provider) => {
    setCheckoutId(`${planId}-${provider}`);
    try {
      const res = provider === "stripe"
        ? await checkoutStripe(planId)
        : await checkoutPayPal(planId);
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Checkout failed.");
    } finally {
      setCheckoutId(null);
    }
  };

  if (loading) {
    return (
      <section className="plans-page card-wrapper" style={{ padding: 40, textAlign: "center" }}>
        <LuLoader style={{ animation: "spin 1s linear infinite" }} />
      </section>
    );
  }

  const activePlanId = current?.current_plan?.id ?? current?.subscription?.plan_id;

  return (
    <section className="plans-page">
      <div className="marketplace-settings__plans-heading">Choose Your Plan</div>
      {current?.current_plan ? (
        <div className="orders-inline-note orders-inline-note--success">
          <LuCheck />
          <span>
            Current plan: <strong>{current.current_plan.title}</strong>
            {current.plan_expires_at ? ` — expires ${new Date(current.plan_expires_at).toLocaleDateString()}` : ""}
          </span>
        </div>
      ) : null}

      <div className="marketplace-settings__plans-grid">
        {plans.map((plan) => {
          const isCurrent = activePlanId === plan.id;
          return (
            <article className="marketplace-settings__plan-card" key={plan.id}>
              <h3>{plan.title}</h3>
              <p>{plan.description}</p>
              <strong>
                ${Number(plan.price).toFixed(2)} {plan.currency}
                <span> / {plan.billing_type === "monthly" ? "month" : `${plan.duration_days ?? 30} days`}</span>
              </strong>
              <ul>
                {(plan.inclusions ?? []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              {isCurrent ? (
                <button type="button" className="marketplace-settings__plan-btn" disabled>Current Plan</button>
              ) : (
                <div className="plans-page__checkout-row">
                  <button
                    type="button"
                    className="marketplace-settings__plan-btn"
                    disabled={checkoutId === `${plan.id}-stripe`}
                    onClick={() => handleCheckout(plan.id, "stripe")}
                  >
                    {checkoutId === `${plan.id}-stripe` ? "Redirecting…" : "Pay with Stripe"}
                  </button>
                  <button
                    type="button"
                    className="marketplace-settings__plan-btn marketplace-settings__plan-btn--ghost"
                    disabled={checkoutId === `${plan.id}-paypal`}
                    onClick={() => handleCheckout(plan.id, "paypal")}
                  >
                    {checkoutId === `${plan.id}-paypal` ? "Redirecting…" : "Pay with PayPal"}
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <button type="button" className="dashboard-secondary-btn dashboard-secondary-btn--orders" onClick={() => navigate("/settings")}>
        Manage payment methods in Settings
      </button>
    </section>
  );
}

export default PlansPage;
