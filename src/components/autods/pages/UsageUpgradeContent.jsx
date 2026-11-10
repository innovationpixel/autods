import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  LuArrowUpRight,
  LuBadgeCheck,
  LuChartLine,
  LuCheck,
  LuChevronRight,
  LuClock,
  LuCrown,
  LuLoader,
  LuLock,
  LuPackage,
  LuShoppingCart,
  LuSparkles,
  LuStore,
  LuZap,
} from "react-icons/lu";
import { getAddonPricing, getCurrentPlan } from "../../../services/PlanService";
import { getAiConfig } from "../../../services/AiGenerationService";
import { selectUser } from "../../../store/selectors/AuthSelectors";
import { formatAiUsd, normalizeAiConfig } from "../../../utils/aiPricing";
import { toast } from "../../../utils/toast";
import BuyAiCreditsModal from "./BuyAiCreditsModal";
import { ALL_FEATURE_DEFINITIONS } from "./planFeatureDefinitions";

const CURATED_ADDONS_META = [
  {
    key: "trending_products",
    title: "Trending Products",
    subtitle: "Curated Viral & Trending Feed",
    curatedType: "trending",
    icon: LuChartLine,
    accent: "#ea580c",
    pillBg: "#ffedd5",
    iconGradient: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
    defaultDescription: "Unlock daily winning & trending product feeds curated by market research analysts.",
  },
  {
    key: "hand_picked_products",
    title: "Hand-Picked Products",
    subtitle: "Vetted High-Margin Winners Vault",
    curatedType: "hand_picked",
    icon: LuBadgeCheck,
    accent: "#4f46e5",
    pillBg: "#e0e7ff",
    iconGradient: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
    defaultDescription: "Access hand-picked high-margin winning products with verified supplier links and profit potential.",
  },
];

export default function UsageUpgradeContent({ onNavigateToPlans }) {
  const navigate = useNavigate();
  const authUser = useSelector(selectUser);
  const [data, setData] = useState(null);
  const [addonCatalog, setAddonCatalog] = useState(null);
  const [aiConfig, setAiConfig] = useState(() => normalizeAiConfig());
  const [aiCreditsModalOpen, setAiCreditsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      getCurrentPlan(),
      getAddonPricing().catch(() => null),
      getAiConfig().catch(() => null),
    ])
      .then(([planRes, addonRes, aiRes]) => {
        if (!mounted) return;
        setData(planRes.data);
        if (addonRes?.data?.addons) {
          setAddonCatalog(addonRes.data.addons);
        }
        if (aiRes?.data) {
          setAiConfig(normalizeAiConfig(aiRes.data));
        }
      })
      .catch(() => {
        if (mounted) {
          toast.error("Could not load usage and plan details.");
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const refreshAddons = () => {
      getAddonPricing()
        .then((res) => {
          if (mounted && res.data?.addons) {
            setAddonCatalog(res.data.addons);
          }
        })
        .catch(() => {});
    };
    const refreshAiConfig = () => {
      getAiConfig()
        .then((res) => {
          if (mounted && res.data) {
            setAiConfig(normalizeAiConfig(res.data));
          }
        })
        .catch(() => {});
    };
    const handleStorage = (event) => {
      if (event.key === "autods_addon_updated_at") {
        refreshAddons();
      }
      if (event.key === "autods_ai_config_updated_at") {
        refreshAiConfig();
      }
    };
    window.addEventListener("autods_refresh_addons", refreshAddons);
    window.addEventListener("autods_refresh_ai_config", refreshAiConfig);
    window.addEventListener("ai_credits_updated", refreshAiConfig);
    window.addEventListener("focus", refreshAddons);
    window.addEventListener("focus", refreshAiConfig);
    window.addEventListener("storage", handleStorage);

    return () => {
      mounted = false;
      window.removeEventListener("autods_refresh_addons", refreshAddons);
      window.removeEventListener("autods_refresh_ai_config", refreshAiConfig);
      window.removeEventListener("ai_credits_updated", refreshAiConfig);
      window.removeEventListener("focus", refreshAddons);
      window.removeEventListener("focus", refreshAiConfig);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  if (loading) {
    return (
      <div className="usage-upgrade-page card-wrapper" style={{ padding: "48px 24px", textAlign: "center" }}>
        <LuLoader className="spin-icon" style={{ fontSize: 28, color: "#3b82f6", margin: "0 auto 12px" }} />
        <p style={{ color: "#64748b" }}>Loading your plan usage & limits…</p>
      </div>
    );
  }

  const plan = data?.current_plan;
  const subscription = data?.subscription;
  const usage = data?.usage ?? {};
  const expiresAt = data?.plan_expires_at || subscription?.current_period_end;
  const isCustomPlan = Boolean(plan?.is_custom);
  const hasCustomOverrides = Boolean(data?.custom_overrides?.has_overrides || plan?.has_custom_overrides);

  const listingsLimit = Number(
    usage.products_limit ?? plan?.products_limit ?? plan?.limits?.listings ?? plan?.listings_limit ?? 100
  );
  const listingsUsed = Number(usage.products_quota_used ?? usage.listings_count ?? 0);
  const listingsPct = listingsLimit > 0 ? Math.min(100, Math.round((listingsUsed / listingsLimit) * 100)) : 0;

  const ordersLimit = Number(
    usage.orders_limit ?? plan?.limits?.orders ?? plan?.orders_limit ?? 100
  );
  const ordersUsed = Number(usage.orders_count ?? 0);
  const ordersPct = ordersLimit > 0 ? Math.min(100, Math.round((ordersUsed / ordersLimit) * 100)) : 0;

  const storesLimit = Number(
    usage.stores_limit ?? plan?.limits?.stores ?? plan?.stores_limit ?? 1
  );
  const storesUsed = Number(usage.connections_count ?? 0);
  const storesPct = storesLimit > 0 ? Math.min(100, Math.round((storesUsed / storesLimit) * 100)) : 0;

  const resolvedInclusions =
    Array.isArray(data?.effective_inclusions) && data.effective_inclusions.length > 0
      ? data.effective_inclusions
      : Array.isArray(plan?.inclusions) && plan.inclusions.length > 0
      ? plan.inclusions
      : null;

  const effectiveFeatureMap =
    data?.effective_features && typeof data.effective_features === "object" && !Array.isArray(data.effective_features)
      ? data.effective_features
      : plan?.features && typeof plan.features === "object" && !Array.isArray(plan.features)
      ? plan.features
      : null;

  const mappedFeatureTitles = effectiveFeatureMap
    ? ALL_FEATURE_DEFINITIONS.filter((def) => Boolean(effectiveFeatureMap[def.key])).map((def) => def.title)
    : [];

  const features = resolvedInclusions
    ? resolvedInclusions
    : mappedFeatureTitles.length > 0
    ? mappedFeatureTitles
    : Array.isArray(plan?.features) && plan.features.length > 0
    ? plan.features
    : [
        "Automated Price & Stock Monitoring (every 60 mins)",
        "One-click AliExpress & Supplier Product Import",
        "Automated Order Fulfillment & Tracking Updates",
        "eBay Multi-Account & Multi-Marketplace Support",
        "Variation Publishing with Custom Pricing & Stock",
        "24/7 Priority In-App Customer Support",
      ];

  return (
    <div className="usage-upgrade-page" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Hero / Plan Summary Card */}
      <div
        className="card-wrapper"
        style={{
          padding: "32px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "#fff",
          borderRadius: 16,
          boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.2)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 20,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "rgba(59, 130, 246, 0.2)",
                color: "#60a5fa",
                padding: "4px 10px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                border: "1px solid rgba(96, 165, 250, 0.3)",
              }}
            >
              <LuCrown /> ACTIVE PLAN
            </span>
            {isCustomPlan && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  background: "rgba(168, 85, 247, 0.22)",
                  color: "#e9d5ff",
                  padding: "4px 10px",
                  borderRadius: 999,
                  fontSize: 11.5,
                  fontWeight: 700,
                  border: "1px solid rgba(192, 132, 252, 0.38)",
                }}
              >
                <LuLock /> CUSTOM PACKAGE
              </span>
            )}
            {hasCustomOverrides && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  background: "rgba(16, 185, 129, 0.2)",
                  color: "#6ee7b7",
                  padding: "4px 10px",
                  borderRadius: 999,
                  fontSize: 11.5,
                  fontWeight: 700,
                  border: "1px solid rgba(52, 211, 153, 0.38)",
                }}
              >
                <LuSparkles /> CUSTOM QUOTAS / FEATURES
              </span>
            )}
            {expiresAt && (
              <span style={{ fontSize: 13, color: "#94a3b8", display: "inline-flex", alignItems: "center", gap: 4 }}>
                <LuClock /> Renews on {new Date(expiresAt).toLocaleDateString()}
              </span>
            )}
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 6px 0", color: "#f8fafc" }}>
            {plan?.title ?? plan?.name ?? "Starter Plan"}
          </h1>
          <p style={{ margin: 0, color: "#cbd5e1", fontSize: 14, maxWidth: 540 }}>
            {plan?.description ??
              "You are currently subscribed to the standard dropshipping plan. Track your monthly quotas below and upgrade anytime to scale."}
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToPlans}
          style={{
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "14px 24px",
            fontSize: 15,
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <LuSparkles />
          <span>Upgrade Your Plan</span>
          <LuChevronRight />
        </button>
      </div>

      {/* Quota Progress Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        {/* Listings Quota */}
        <div className="card-wrapper" style={{ padding: "20px", borderRadius: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#475569", display: "flex", alignItems: "center", gap: 6 }}>
              <LuPackage style={{ color: "#3b82f6" }} /> Products & Variations Quota
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: listingsPct > 90 ? "#ef4444" : "#1e293b" }}>
              {listingsUsed} / {listingsLimit}
            </span>
          </div>
          <div style={{ width: "100%", height: 8, background: "#e2e8f0", borderRadius: 999, overflow: "hidden" }}>
            <div
              style={{
                width: `${listingsPct}%`,
                height: "100%",
                background: listingsPct > 90 ? "#ef4444" : "#3b82f6",
                borderRadius: 999,
                transition: "width 0.4s ease",
              }}
            />
          </div>
          <span style={{ fontSize: 12, color: "#64748b", display: "block", marginTop: 8 }}>
            {listingsLimit - listingsUsed > 0
              ? `${listingsLimit - listingsUsed} product/variation units remaining`
              : "Quota reached. Upgrade to add more products & variations."}
          </span>
        </div>

        {/* Orders Quota */}
        <div className="card-wrapper" style={{ padding: "20px", borderRadius: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#475569", display: "flex", alignItems: "center", gap: 6 }}>
              <LuShoppingCart style={{ color: "#10b981" }} /> Auto-Orders
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: ordersPct > 90 ? "#ef4444" : "#1e293b" }}>
              {ordersUsed} / {ordersLimit}
            </span>
          </div>
          <div style={{ width: "100%", height: 8, background: "#e2e8f0", borderRadius: 999, overflow: "hidden" }}>
            <div
              style={{
                width: `${ordersPct}%`,
                height: "100%",
                background: ordersPct > 90 ? "#ef4444" : "#10b981",
                borderRadius: 999,
                transition: "width 0.4s ease",
              }}
            />
          </div>
          <span style={{ fontSize: 12, color: "#64748b", display: "block", marginTop: 8 }}>
            {ordersLimit - ordersUsed > 0
              ? `${ordersLimit - ordersUsed} orders remaining this billing cycle`
              : "Quota reached. Upgrade to process more orders."}
          </span>
        </div>

        {/* Connected Stores */}
        <div className="card-wrapper" style={{ padding: "20px", borderRadius: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#475569", display: "flex", alignItems: "center", gap: 6 }}>
              <LuStore style={{ color: "#f59e0b" }} /> Connected Stores
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: storesPct > 90 ? "#ef4444" : "#1e293b" }}>
              {storesUsed} / {storesLimit}
            </span>
          </div>
          <div style={{ width: "100%", height: 8, background: "#e2e8f0", borderRadius: 999, overflow: "hidden" }}>
            <div
              style={{
                width: `${storesPct}%`,
                height: "100%",
                background: storesPct > 90 ? "#ef4444" : "#f59e0b",
                borderRadius: 999,
                transition: "width 0.4s ease",
              }}
            />
          </div>
          <span style={{ fontSize: 12, color: "#64748b", display: "block", marginTop: 8 }}>
            {storesLimit - storesUsed > 0
              ? `${storesLimit - storesUsed} store slot(s) available`
              : "Maximum store limit reached."}
          </span>
        </div>

        {/* AI Studio Credits */}
        <div className="card-wrapper" style={{ padding: "20px", borderRadius: 12, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#475569", display: "flex", alignItems: "center", gap: 6 }}>
              <LuSparkles style={{ color: "#8b5cf6" }} /> AI Studio Credits
            </span>
            <button
              type="button"
              onClick={() => setAiCreditsModalOpen(true)}
              style={{
                background: "#f3e8ff",
                color: "#7e22ce",
                border: "none",
                borderRadius: 6,
                padding: "3px 9px",
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              + Buy Credits
            </button>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#1e293b" }}>
              {Number(authUser?.ai_credits ?? aiConfig.ai_credits ?? 0).toLocaleString()}{" "}
              <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Credits</span>
            </div>
            <span style={{ fontSize: 11.5, color: "#64748b", display: "block", marginTop: 4 }}>
              Rate: <strong>{formatAiUsd(aiConfig.price_per_credit)} / credit</strong> · Image:{" "}
              <strong>
                {aiConfig.credits_per_image}⚡ ({formatAiUsd(aiConfig.image_cost_usd)})
              </strong>{" "}
              · Title:{" "}
              <strong>
                {aiConfig.credits_per_title}⚡ ({formatAiUsd(aiConfig.title_cost_usd)})
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Curated Marketplace Research Add-ons */}
      <div className="card-wrapper" style={{ padding: "24px 28px", borderRadius: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px 0", color: "#1e293b" }}>
              Marketplace Research Add-ons
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
              Unlock Trending Products and Hand-Picked Products feeds configured by platform administration.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/settings?tab=plans")}
            style={{
              background: "#f8fafc",
              color: "#1e293b",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
            }}
          >
            <span>Manage in Plans &amp; Add-ons</span>
            <LuArrowUpRight />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 16 }}>
          {CURATED_ADDONS_META.map((meta) => {
            const Icon = meta.icon;
            const cfg = addonCatalog?.[meta.key] ?? {};
            const enabled = cfg.enabled !== false;
            const price = Math.max(0, Number(cfg.price ?? 0));
            const billingMode = cfg.billing_mode === "one_time" ? "one_time" : "monthly";
            const isFree = enabled && price <= 0;
            const entitled = Boolean(cfg.entitled) || isFree || authUser?.role === "super_admin";
            const sub = cfg.subscription;
            const cancelPending = Boolean(sub?.cancel_at_period_end);
            const isVaUser = authUser?.role === "va" || Boolean(authUser?.parent_id);

            let badgeLabel = "Add-on";
            let badgeBg = meta.pillBg;
            let badgeColor = meta.accent;

            if (!enabled && !entitled) {
              badgeLabel = "Disabled";
              badgeBg = "#f1f5f9";
              badgeColor = "#64748b";
            } else if (cfg.access_source === "super_admin") {
              badgeLabel = "Admin Access";
              badgeBg = "#ede9fe";
              badgeColor = "#5b21b6";
            } else if (cfg.access_source === "plan_override") {
              badgeLabel = "Included in Plan";
              badgeBg = "#ecfdf5";
              badgeColor = "#059669";
            } else if (isFree) {
              badgeLabel = "Included Free";
              badgeBg = "#ecfdf5";
              badgeColor = "#059669";
            } else if (entitled && cancelPending) {
              badgeLabel = "Canceling";
              badgeBg = "#fffbeb";
              badgeColor = "#b45309";
            } else if (entitled) {
              badgeLabel = "Active";
              badgeBg = "#ecfdf5";
              badgeColor = "#059669";
            }

            return (
              <div
                key={meta.key}
                style={{
                  padding: 18,
                  borderRadius: 12,
                  border: entitled ? `1px solid ${meta.accent}44` : "1px solid #e2e8f0",
                  background: "#ffffff",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 14,
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 9,
                          background: meta.iconGradient,
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 18,
                          flexShrink: 0,
                        }}
                      >
                        <Icon />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{meta.title}</h4>
                        <span style={{ fontSize: 12, color: "#64748b" }}>{meta.subtitle}</span>
                      </div>
                    </div>
                    <span
                      style={{
                        background: badgeBg,
                        color: badgeColor,
                        padding: "3px 9px",
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {badgeLabel}
                    </span>
                  </div>

                  <p style={{ margin: "0 0 10px 0", fontSize: 12.5, color: "#475569", lineHeight: 1.5 }}>
                    {cfg.description || meta.defaultDescription}
                  </p>

                  <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                    {!addonCatalog
                      ? "Checking pricing…"
                      : isFree
                      ? "Free ($0.00)"
                      : `$${price.toFixed(2)}`}
                    {addonCatalog && !isFree ? (
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginLeft: 4 }}>
                        {billingMode === "monthly" ? "/ month" : "one-time unlock"}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #f1f5f9", paddingTop: 12, gap: 10, flexWrap: "wrap" }}>
                  {entitled ? (
                    <>
                      <span style={{ fontSize: 12, color: "#059669", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <LuCheck /> Unlocked
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate(`/marketplace?curated=${meta.curatedType}`)}
                        style={{
                          background: "#0f172a",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: 7,
                          padding: "7px 13px",
                          fontSize: 12.5,
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          cursor: "pointer",
                        }}
                      >
                        <span>Open Feed</span>
                        <LuArrowUpRight />
                      </button>
                    </>
                  ) : !enabled ? (
                    <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                      Currently unavailable
                    </span>
                  ) : isVaUser ? (
                    <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                      Managed by Store Owner
                    </span>
                  ) : (
                    <>
                      <span style={{ fontSize: 12, color: "#64748b", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <LuLock /> Locked
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate("/settings?tab=plans")}
                        style={{
                          background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: 7,
                          padding: "7px 14px",
                          fontSize: 12.5,
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          cursor: "pointer",
                        }}
                      >
                        <span>Unlock in Plans &amp; Add-ons</span>
                        <LuArrowUpRight />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Plan Features Checklist */}
      <div className="card-wrapper" style={{ padding: "28px", borderRadius: 12 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px 0", color: "#1e293b" }}>
          What's Included In Your Plan
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 12,
          }}
        >
          {features.map((feature, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                background: "#f8fafc",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "#dcfce7",
                  color: "#16a34a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                <LuCheck />
              </div>
              <span style={{ fontSize: 13.5, color: "#334155", fontWeight: 500 }}>{feature}</span>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 24,
            padding: "16px 20px",
            background: "#eff6ff",
            borderRadius: 8,
            border: "1px solid #bfdbfe",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LuZap style={{ color: "#2563eb", fontSize: 20 }} />
            <span style={{ fontSize: 14, color: "#1e40af", fontWeight: 500 }}>
              Need more listings, orders, or multiple stores? Upgrade anytime with instant prorated billing.
            </span>
          </div>
          <button
            type="button"
            onClick={onNavigateToPlans}
            style={{
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "8px 16px",
              fontSize: 13.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            View All Plans
          </button>
        </div>
      </div>

      <BuyAiCreditsModal
        open={aiCreditsModalOpen}
        onClose={() => setAiCreditsModalOpen(false)}
      />
    </div>
  );
}
