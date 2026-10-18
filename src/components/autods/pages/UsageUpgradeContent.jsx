import { useEffect, useState } from "react";
import {
  LuBadgeCheck,
  LuCheck,
  LuChevronRight,
  LuClock,
  LuCrown,
  LuLayers,
  LuLoader,
  LuPackage,
  LuShoppingCart,
  LuSparkles,
  LuStore,
  LuWallet,
  LuZap,
} from "react-icons/lu";
import { getCurrentPlan } from "../../../services/PlanService";
import { toast } from "../../../utils/toast";

export default function UsageUpgradeContent({ onNavigateToPlans }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getCurrentPlan()
      .then((res) => {
        if (mounted) {
          setData(res.data);
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

    return () => {
      mounted = false;
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

  const listingsLimit = plan?.limits?.listings ?? plan?.listings_limit ?? 50;
  const listingsUsed = usage.listings_count ?? 0;
  const listingsPct = listingsLimit > 0 ? Math.min(100, Math.round((listingsUsed / listingsLimit) * 100)) : 0;

  const ordersLimit = plan?.limits?.orders ?? plan?.orders_limit ?? 100;
  const ordersUsed = usage.orders_count ?? 0;
  const ordersPct = ordersLimit > 0 ? Math.min(100, Math.round((ordersUsed / ordersLimit) * 100)) : 0;

  const storesLimit = plan?.limits?.stores ?? plan?.stores_limit ?? 1;
  const storesUsed = usage.connections_count ?? 0;
  const storesPct = storesLimit > 0 ? Math.min(100, Math.round((storesUsed / storesLimit) * 100)) : 0;

  const features = Array.isArray(plan?.features)
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
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
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
              <LuPackage style={{ color: "#3b82f6" }} /> Products / Listings
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
              ? `${listingsLimit - listingsUsed} listings remaining this cycle`
              : "Quota reached. Upgrade to add more listings."}
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
    </div>
  );
}
