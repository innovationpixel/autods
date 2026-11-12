import { useMemo, useState } from "react";
import {
  LuArrowRight,
  LuArrowUpRight,
  LuBanknote,
  LuBuilding2,
  LuCalendar,
  LuChartLine,
  LuCheck,
  LuChevronDown,
  LuChevronUp,
  LuClock,
  LuCrown,
  LuFileSpreadsheet,
  LuFlaskConical,
  LuGlobe,
  LuHeadphones,
  LuLayers,
  LuLoader,
  LuLock,
  LuPencil,
  LuRotateCcw,
  LuSearch,
  LuSend,
  LuSparkles,
  LuStore,
  LuTrash2,
  LuTruck,
  LuUsers,
} from "react-icons/lu";
import {
  buildPlanCardRows,
  resolvePlanThemeVariant,
} from "./planFeatureDefinitions";

function formatReferencePrice(price) {
  const num = Number(price ?? 0);
  if (!Number.isFinite(num)) return "0";
  const rounded = Math.round(num * 100) / 100;
  return Number.isInteger(rounded) ? rounded.toLocaleString() : rounded.toFixed(2);
}

function resolveAnnualPricingMetrics(plan, billingCycle = "monthly") {
  const baseType = plan?.base_billing_type ?? plan?.billing_type ?? "monthly";
  const rawPrice = Number(plan?.monthly_price ?? plan?.price ?? 0);
  const rawAnnual =
    plan?.annual_price !== null &&
    plan?.annual_price !== undefined &&
    plan?.annual_price !== ""
      ? Number(plan.annual_price)
      : null;

  if (baseType === "one_time") {
    const oneTimePrice = Number(plan?.price ?? 0);
    return {
      baseType,
      isAnnualView: false,
      hasAnnual: false,
      displayPrice: oneTimePrice,
      interval: `${plan?.duration_days ?? 30} days`,
      checkoutCycle: "one_time",
      effectiveCheckoutPrice: oneTimePrice,
      monthlyPrice: null,
      annualPrice: null,
      monthly12Months: null,
      savingsAmount: 0,
      discountPercent: 0,
      monthlyEquivalent: null,
    };
  }

  if (baseType === "yearly") {
    const annualVal = rawAnnual !== null && Number.isFinite(rawAnnual) ? rawAnnual : Number(plan?.price ?? 0);
    const monthlyEq =
      plan?.annual_monthly_equivalent !== null && plan?.annual_monthly_equivalent !== undefined
        ? Number(plan.annual_monthly_equivalent)
        : Math.round((annualVal / 12) * 100) / 100;

    return {
      baseType,
      isAnnualView: true,
      hasAnnual: true,
      displayPrice: annualVal,
      interval: "year",
      checkoutCycle: "yearly",
      effectiveCheckoutPrice: annualVal,
      monthlyPrice: null,
      annualPrice: annualVal,
      monthly12Months: null,
      savingsAmount: 0,
      discountPercent: 0,
      monthlyEquivalent: monthlyEq,
    };
  }

  // Monthly base plan (with optional annual_price)
  const monthlyPrice = Number.isFinite(rawPrice) ? rawPrice : 0;
  const hasAnnual = rawAnnual !== null && Number.isFinite(rawAnnual);
  const monthly12Months =
    plan?.monthly_12_months_price !== null && plan?.monthly_12_months_price !== undefined
      ? Number(plan.monthly_12_months_price)
      : Math.round(monthlyPrice * 12 * 100) / 100;

  let savingsAmount = 0;
  let discountPercent = 0;
  if (hasAnnual && monthly12Months > 0 && rawAnnual < monthly12Months) {
    savingsAmount =
      plan?.annual_savings_amount !== undefined && plan?.annual_savings_amount !== null
        ? Number(plan.annual_savings_amount)
        : Math.round((monthly12Months - rawAnnual) * 100) / 100;
    discountPercent =
      plan?.annual_discount_percent !== undefined && plan?.annual_discount_percent !== null
        ? Number(plan.annual_discount_percent)
        : Math.round(((monthly12Months - rawAnnual) / monthly12Months) * 1000) / 10;
  }

  const monthlyEquivalent = hasAnnual
    ? plan?.annual_monthly_equivalent !== undefined && plan?.annual_monthly_equivalent !== null
      ? Number(plan.annual_monthly_equivalent)
      : Math.round((rawAnnual / 12) * 100) / 100
    : null;

  const isAnnualView = billingCycle === "annual" && hasAnnual;

  return {
    baseType,
    isAnnualView,
    hasAnnual,
    displayPrice: isAnnualView ? rawAnnual : monthlyPrice,
    interval: isAnnualView ? "year" : "month",
    checkoutCycle: isAnnualView ? "yearly" : "monthly",
    effectiveCheckoutPrice: isAnnualView ? rawAnnual : monthlyPrice,
    monthlyPrice,
    annualPrice: hasAnnual ? rawAnnual : null,
    monthly12Months,
    savingsAmount,
    discountPercent,
    monthlyEquivalent,
  };
}

function getHeaderIcon(themeKey) {
  switch (themeKey) {
    case "emerald":
      return LuFlaskConical;
    case "blue":
      return LuSend;
    case "purple":
      return LuCrown;
    case "orange":
      return LuBuilding2;
    case "rose":
      return LuHeadphones;
    default:
      return LuCrown;
  }
}

function getRowIconComponent(visualType) {
  switch (visualType) {
    case "import":
      return LuGlobe;
    case "research":
      return LuSearch;
    case "ai":
      return LuSparkles;
    case "schedule":
      return LuCalendar;
    case "monitor":
    case "trending":
      return LuChartLine;
    case "orders":
      return LuTruck;
    case "sheets":
      return LuFileSpreadsheet;
    case "returns":
      return LuRotateCcw;
    case "stores":
      return LuStore;
    case "team":
      return LuUsers;
    case "support":
      return LuHeadphones;
    case "hand_picked":
      return LuCrown;
    default:
      return LuLayers;
  }
}

function getPlanSubTagline(plan, isCustom, isFeatured, themeKey) {
  if (isCustom) return "Contact Sales";
  if (themeKey === "emerald") return "Test the platform";
  if (themeKey === "blue") return "Perfect for beginners";
  if (isFeatured || themeKey === "purple") return "For growing sellers";
  if (themeKey === "orange") return "For high volume sellers";
  if (plan?.billing_type === "yearly") return "Annual subscription";
  return plan?.billing_type === "monthly"
    ? "Flexible monthly plan"
    : `${plan?.duration_days ?? 30}-day access`;
}

function PlanReferenceCard({
  plan,
  index = 0,
  isCurrent = false,
  isOnFreeTrial = false,
  hasUsedFreeTrial = false,
  hasActivePaidPlan = false,
  activeBillingCycle = null,
  isFeatured = false,
  mode = "user",
  billingCycle = "monthly",
  checkoutId = null,
  activatingId = null,
  trialStartingId = null,
  onCheckoutStripe,
  onCheckoutPayPal,
  onWireCheckout,
  onStartFreeTrial,
  onActivateFreePlan,
  onEdit,
  onDeactivate,
  onActivate,
}) {
  const [expandedFeatures, setExpandedFeatures] = useState(false);

  const isCustom = Boolean(plan?.is_custom);
  const isInactive = plan?.is_active === false;
  const theme = useMemo(
    () => resolvePlanThemeVariant(plan, index, isFeatured),
    [plan, index, isFeatured]
  );

  const rows = useMemo(() => buildPlanCardRows(plan), [plan]);
  const maxCollapsed = 11;
  const hasMoreRows = rows.length > maxCollapsed + 1;
  const visibleRows =
    !hasMoreRows || expandedFeatures ? rows : rows.slice(0, maxCollapsed);

  const HeaderIcon = getHeaderIcon(theme.key);
  const pricing = useMemo(
    () => resolveAnnualPricingMetrics(plan, billingCycle),
    [plan, billingCycle]
  );
  const priceNum = Number(pricing.displayPrice ?? 0);
  const effectiveCheckoutNum = Number(pricing.effectiveCheckoutPrice ?? priceNum);
  const interval = pricing.interval;
  const hasFreeTrial =
    !isCustom && Boolean(plan?.has_free_trial) && Number(plan?.free_trial_days) > 0;
  const freeTrialDays = hasFreeTrial ? Number(plan.free_trial_days) : null;
  const isSignFree = !isCustom && Boolean(plan?.is_sign_free);
  const isFreeFallbackZeroPrice = isSignFree && effectiveCheckoutNum <= 0;
  const showCustomPriceWord =
    isCustom && priceNum <= 0 && (!pricing.hasAnnual || Number(pricing.annualPrice ?? 0) <= 0);
  const isTrialPromo =
    !isCustom &&
    !hasFreeTrial &&
    (/trial/i.test(plan?.title || "") ||
      (pricing.baseType === "one_time" && priceNum > 0 && priceNum <= 10));

  const isExactCurrentCycle =
    isCurrent && (!activeBillingCycle || activeBillingCycle === pricing.checkoutCycle);
  const showLockedCurrent = isExactCurrentCycle && !isOnFreeTrial;
  const canStartTrialBtn =
    mode === "user" &&
    hasFreeTrial &&
    !hasUsedFreeTrial &&
    !isCurrent &&
    !isOnFreeTrial &&
    !hasActivePaidPlan &&
    !isFreeFallbackZeroPrice;

  const assignedUsers = Array.isArray(plan?.assigned_users)
    ? plan.assigned_users
    : [];

  let bannerConfig = null;
  if (isInactive) {
    bannerConfig = {
      tone: "inactive",
      left: "INACTIVE",
      right: "Paused",
      icon: null,
    };
  } else if (isFeatured) {
    bannerConfig = {
      tone: "purple",
      left: theme.tierLabel,
      right: "MOST POPULAR",
      icon: LuCrown,
    };
  }

  let headCornerTag = null;
  if (!isInactive) {
    if (isCurrent && isOnFreeTrial) {
      headCornerTag = { tone: "trial", label: "On Free Trial" };
    } else if (isCurrent) {
      headCornerTag = { tone: "current", label: "Current" };
    } else if (isSignFree) {
      headCornerTag = {
        tone: "free",
        label: mode === "admin" ? "Sign Free" : "Free Plan",
      };
    } else if (isCustom) {
      headCornerTag = {
        tone: "rose",
        label: mode === "admin" ? `${assignedUsers.length} Assigned` : "Custom",
      };
    }
  }

  const BannerIcon = bannerConfig?.icon;

  return (
    <article
      className={`pricing-tier pricing-tier--${theme.key} ${
        isFeatured ? "pricing-tier--featured" : ""
      } ${isCurrent ? "pricing-tier--current" : ""} ${
        isCustom ? "pricing-tier--custom" : ""
      } ${isInactive ? "pricing-tier--inactive" : ""}`}
    >
      {bannerConfig ? (
        <div
          className={`pricing-tier__banner pricing-tier__banner--${bannerConfig.tone}`}
        >
          <span className="pricing-tier__banner-left">
            {BannerIcon ? <BannerIcon /> : null}
            <span>{bannerConfig.left}</span>
          </span>
          <span className="pricing-tier__banner-tag">{bannerConfig.right}</span>
        </div>
      ) : null}

      <div className="pricing-tier__head">
        <div className="pricing-tier__icon">
          <HeaderIcon />
        </div>
        <div className="pricing-tier__head-copy">
          <h2>{plan?.title}</h2>
          <span>{getPlanSubTagline(plan, isCustom, isFeatured, theme.key)}</span>
        </div>
      </div>

      <div className="pricing-tier__body">
        {hasFreeTrial ? (
          <div className="pricing-tier__promo-strip">
            {mode === "admin"
              ? `Free Trail · ${freeTrialDays} ${freeTrialDays === 1 ? "Day" : "Days"}`
              : `${freeTrialDays}-${freeTrialDays === 1 ? "Day" : "Days"} Free Trial · Full Access`}
          </div>
        ) : isTrialPromo ? (
          <div className="pricing-tier__promo-strip">
            Start for just ${formatReferencePrice(priceNum)} · {plan?.duration_days ?? 3} Days Trial
          </div>
        ) : null}

        {isSignFree ? (
          <div className="pricing-tier__promo-strip pricing-tier__promo-strip--free">
            {mode === "admin"
              ? "Sign Free · Fallback after trial ends"
              : isFreeFallbackZeroPrice
              ? "Free Fallback Plan · $0 Forever"
              : "Post-Trial Fallback Plan"}
          </div>
        ) : null}

        <div className="pricing-tier__price-block">
          <div className="pricing-tier__price-row">
            <div className="pricing-tier__price">
              {showCustomPriceWord ? (
                <strong>Custom</strong>
              ) : (
                <>
                  <strong>${formatReferencePrice(priceNum)}</strong>
                  <span>/ {interval}</span>
                </>
              )}
            </div>
            {(!showCustomPriceWord &&
              pricing.isAnnualView &&
              pricing.discountPercent > 0) ||
            headCornerTag ? (
              <div className="pricing-tier__price-badges">
                {!showCustomPriceWord &&
                pricing.isAnnualView &&
                pricing.discountPercent > 0 ? (
                  <span className="pricing-tier__save-pill">
                    Save {pricing.discountPercent}%
                  </span>
                ) : null}
                {headCornerTag ? (
                  <span
                    className={`pricing-tier__head-pill pricing-tier__head-pill--${headCornerTag.tone}`}
                  >
                    {headCornerTag.tone === "rose" ? (
                      <LuLock />
                    ) : headCornerTag.tone === "trial" ? (
                      <LuClock />
                    ) : (
                      <LuCheck />
                    )}
                    <span>{headCornerTag.label}</span>
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          {!showCustomPriceWord && pricing.isAnnualView ? (
            <div className="pricing-tier__annual-sub">
              {pricing.discountPercent > 0 && pricing.monthly12Months ? (
                <>
                  <s className="pricing-tier__compare-price">
                    ${formatReferencePrice(pricing.monthly12Months)}/yr
                  </s>
                  <span>·</span>
                </>
              ) : null}
              <span>
                <strong>${formatReferencePrice(pricing.monthlyEquivalent)}/mo</strong>{" "}
                billed annually
              </span>
              {pricing.savingsAmount > 0 ? (
                <span>· Save ${formatReferencePrice(pricing.savingsAmount)}/yr</span>
              ) : null}
            </div>
          ) : !showCustomPriceWord &&
            pricing.baseType === "monthly" &&
            billingCycle === "annual" &&
            !pricing.hasAnnual ? (
            <div className="pricing-tier__annual-sub pricing-tier__annual-sub--muted">
              Billed monthly (${formatReferencePrice(pricing.monthly12Months)}/yr)
            </div>
          ) : !showCustomPriceWord &&
            pricing.baseType === "monthly" &&
            billingCycle === "monthly" &&
            pricing.hasAnnual ? (
            <div className="pricing-tier__annual-sub">
              Or{" "}
              <strong>${formatReferencePrice(pricing.annualPrice)}/yr</strong>
              {pricing.discountPercent > 0
                ? ` (Save ${pricing.discountPercent}%)`
                : " billed annually"}
            </div>
          ) : null}
        </div>

        <p className="pricing-tier__desc">
          {plan?.description ||
            (isCustom
              ? "Tailored package built specifically around your store limits and features."
              : "Automation tools to import, monitor, and scale your dropshipping store.")}
        </p>

        {/* Action Buttons */}
        {mode === "user" ? (
          <div className="pricing-tier__actions">
            {showLockedCurrent ? (
              <button
                type="button"
                className="pricing-tier__cta pricing-tier__cta--current"
                disabled
              >
                <LuCheck />
                <span>Current Plan</span>
              </button>
            ) : isFreeFallbackZeroPrice ? (
              <button
                type="button"
                className="pricing-tier__cta"
                disabled={activatingId === plan?.id || trialStartingId === plan?.id || Boolean(checkoutId)}
                onClick={() => onActivateFreePlan?.(plan.id)}
              >
                {activatingId === plan?.id ? (
                  <>
                    <LuLoader className="spin-icon" />
                    <span>Activating…</span>
                  </>
                ) : (
                  <>
                    <span>Activate Free Plan</span>
                    <LuArrowRight />
                  </>
                )}
              </button>
            ) : (
              <>
                {canStartTrialBtn ? (
                  <button
                    type="button"
                    className="pricing-tier__cta-trial"
                    disabled={
                      trialStartingId === plan?.id ||
                      activatingId === plan?.id ||
                      Boolean(checkoutId)
                    }
                    onClick={() => onStartFreeTrial?.(plan.id)}
                  >
                    {trialStartingId === plan?.id ? (
                      <>
                        <LuLoader className="spin-icon" />
                        <span>Starting Trial…</span>
                      </>
                    ) : (
                      <>
                        <LuClock />
                        <span>
                          Start {freeTrialDays}-{freeTrialDays === 1 ? "Day" : "Days"} Free Trial
                        </span>
                        <LuArrowRight />
                      </>
                    )}
                  </button>
                ) : null}

                <button
                  type="button"
                  className="pricing-tier__cta"
                  disabled={
                    checkoutId === `${plan.id}-stripe` ||
                    trialStartingId === plan?.id ||
                    activatingId === plan?.id
                  }
                  onClick={() => onCheckoutStripe?.(plan.id, pricing.checkoutCycle)}
                >
                  {checkoutId === `${plan.id}-stripe` ? (
                    <>
                      <LuLoader className="spin-icon" />
                      <span>Redirecting…</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {isCurrent && isOnFreeTrial
                          ? pricing.isAnnualView
                            ? `Upgrade to Annual${
                                pricing.discountPercent > 0
                                  ? ` (Save ${pricing.discountPercent}%)`
                                  : ""
                              }`
                            : "Upgrade Now"
                          : isCurrent && pricing.checkoutCycle === "yearly"
                          ? `Switch to Annual${
                              pricing.discountPercent > 0
                                ? ` (Save ${pricing.discountPercent}%)`
                                : ""
                            }`
                          : isCurrent && pricing.checkoutCycle === "monthly"
                          ? "Switch to Monthly"
                          : isTrialPromo
                          ? `Start ${plan?.duration_days ?? 3}-Day Trial`
                          : "Get Started"}
                      </span>
                      <LuArrowRight />
                    </>
                  )}
                </button>
                <div className="pricing-tier__alt-pays">
                  <button
                    type="button"
                    className="pricing-tier__alt-btn"
                    disabled={
                      checkoutId === `${plan.id}-paypal` ||
                      trialStartingId === plan?.id ||
                      activatingId === plan?.id
                    }
                    onClick={() => onCheckoutPayPal?.(plan.id, pricing.checkoutCycle)}
                    title="Pay with PayPal"
                  >
                    {checkoutId === `${plan.id}-paypal` ? (
                      <LuLoader className="spin-icon" />
                    ) : (
                      <>
                        <span>PayPal</span>
                        <LuArrowUpRight />
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="pricing-tier__alt-btn"
                    disabled={trialStartingId === plan?.id || activatingId === plan?.id}
                    onClick={() =>
                      onWireCheckout?.({
                        ...plan,
                        effective_checkout_price: pricing.effectiveCheckoutPrice,
                        effective_checkout_cycle: pricing.checkoutCycle,
                      })
                    }
                    title="Pay with Wire Transfer / ACH"
                  >
                    <LuBanknote />
                    <span>Wire / ACH</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="pricing-tier__actions">
            <button
              type="button"
              className="pricing-tier__cta"
              onClick={() => onEdit?.(plan)}
            >
              <LuPencil />
              <span>{isCustom ? "Edit Package" : "Edit Plan"}</span>
              <LuArrowRight />
            </button>
            <div className="pricing-tier__admin-foot">
              <span
                className={`pricing-tier__state-chip ${
                  isInactive ? "is-inactive" : "is-active"
                }`}
              >
                <span className="pricing-tier__state-dot" />
                <span>{isInactive ? "Inactive" : "Active"}</span>
              </span>
              {isInactive ? (
                <button
                  type="button"
                  className="pricing-tier__alt-btn pricing-tier__admin-toggle is-activate"
                  disabled={activatingId === plan?.id}
                  onClick={() => (onActivate ? onActivate(plan) : onEdit?.(plan))}
                >
                  {activatingId === plan?.id ? (
                    <>
                      <LuLoader className="spin-icon" />
                      <span>Activating…</span>
                    </>
                  ) : (
                    <>
                      <LuRotateCcw />
                      <span>Activate</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  className="pricing-tier__alt-btn pricing-tier__admin-toggle is-deactivate"
                  onClick={() => onDeactivate?.(plan)}
                >
                  <LuTrash2 />
                  <span>Deactivate</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Structured Feature & Quota Checklist Rows */}
        <ul className="pricing-tier__rows">
          {visibleRows.map((row) => {
            const RowIcon = getRowIconComponent(row.visualType);
            return (
              <li key={row.id} className="pricing-tier__row">
                <div className="pricing-tier__row-left">
                  <span
                    className={`pricing-tier__row-icon pricing-tier__row-icon--${row.visualType}`}
                  >
                    <RowIcon />
                  </span>
                  <span className="pricing-tier__row-label">
                    {row.label}
                    {row.isAddon ? (
                      <em className="pricing-tier__addon-tag">Add-on</em>
                    ) : null}
                  </span>
                </div>
                <div className="pricing-tier__row-right">
                  {row.valueText ? (
                    <strong className="pricing-tier__row-val">{row.valueText}</strong>
                  ) : (
                    <span className="pricing-tier__check-mark" aria-label="Included">
                      <LuCheck />
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {hasMoreRows ? (
          <button
            type="button"
            className="pricing-tier__more-toggle"
            onClick={() => setExpandedFeatures((v) => !v)}
          >
            {expandedFeatures ? (
              <>
                <span>Show fewer features</span>
                <LuChevronUp />
              </>
            ) : (
              <>
                <span>+{rows.length - maxCollapsed} more included features</span>
                <LuChevronDown />
              </>
            )}
          </button>
        ) : null}

        {mode === "admin" || isCustom || pricing.baseType === "one_time" ? (
          <div className="pricing-tier__bottom">
            {mode === "admin" && isCustom ? (
              <div className="pricing-tier__assigned-box">
                <div className="pricing-tier__assigned-head">
                  <LuUsers />
                  <span>Assigned Customers ({assignedUsers.length})</span>
                </div>
                {assignedUsers.length ? (
                  <div className="pricing-tier__assigned-chips">
                    {assignedUsers.slice(0, 3).map((u) => (
                      <span
                        key={u.id}
                        className="pricing-tier__assigned-chip"
                        title={u.email}
                      >
                        {u.name}
                      </span>
                    ))}
                    {assignedUsers.length > 3 ? (
                      <span className="pricing-tier__assigned-chip pricing-tier__assigned-chip--more">
                        +{assignedUsers.length - 3} more
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <span className="pricing-tier__assigned-empty">
                    No customers assigned yet
                  </span>
                )}
              </div>
            ) : null}

            {isCustom ? (
              <div className="pricing-tier__footnote">
                {mode === "admin"
                  ? `Order #${plan?.sort_order ?? 0} · Private package for assigned customer(s).`
                  : "Custom package configured exclusively for your account."}
              </div>
            ) : pricing.baseType === "one_time" ? (
              <div className="pricing-tier__footnote">
                {mode === "admin"
                  ? `Order #${plan?.sort_order ?? 0} · One-time payment covering ${plan?.duration_days ?? 30} days.${hasFreeTrial ? ` · Free Trail (${freeTrialDays}d)` : ""}${isSignFree ? " · Sign Free" : ""}`
                  : `One-time payment covering ${plan?.duration_days ?? 30} days with full quota access.`}
              </div>
            ) : mode === "admin" ? (
              <div className="pricing-tier__admin-submeta">
                Order #{plan?.sort_order ?? 0} ·{" "}
                {pricing.baseType === "yearly"
                  ? "Annual subscription"
                  : pricing.hasAnnual
                  ? "Monthly + Annual billing"
                  : "Monthly only"}
                {hasFreeTrial ? ` · Free Trail (${freeTrialDays}d)` : ""}
                {isSignFree ? " · Sign Free" : ""}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default PlanReferenceCard;
