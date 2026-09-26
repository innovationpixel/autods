import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  LuArrowDownRight,
  LuArrowUpRight,
  LuBadgeCheck,
  LuClipboardList,
  LuCrown,
  LuHeadphones,
  LuLoader,
  LuPackage2,
  LuPackageSearch,
  LuRefreshCw,
  LuSettings2,
  LuShield,
  LuTrendingUp,
  LuUserRound,
  LuUsers,
  LuWalletCards,
} from "react-icons/lu";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { selectUserRole } from "../../../store/selectors/AuthSelectors";
import { toast } from "../../../utils/toast";
import { getAdminDashboard } from "../../../services/AdminService";

function formatMoney(value, currency = "USD") {
  const amount = Number(value ?? 0);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function trendPercent(current, previous) {
  const cur = Number(current ?? 0);
  const prev = Number(previous ?? 0);
  if (prev === 0) {
    return cur > 0 ? 100 : 0;
  }
  return Math.round(((cur - prev) / prev) * 100);
}

function EbayTrend({ current, previous }) {
  const change = trendPercent(current, previous);
  const positive = change >= 0;
  const Icon = positive ? LuTrendingUp : LuArrowDownRight;

  return (
    <span
      className="ebay-kpi-card__trend"
      style={!positive ? { color: "#e5484d" } : undefined}
    >
      <Icon />
      {Math.abs(change)}%
    </span>
  );
}

function ChartTooltip({ active, payload, label, valuePrefix = "" }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="admin-dash__tooltip">
      <strong>{label}</strong>
      <span>{valuePrefix}{payload[0]?.value}</span>
    </div>
  );
}

function AdminDashboardPage() {
  const role = useSelector(selectUserRole);
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role !== "super_admin") {
      navigate("/");
    }
  }, [role, navigate]);

  useEffect(() => {
    if (role !== "super_admin") return;

    getAdminDashboard()
      .then((res) => setDashboard(res.data))
      .catch(() => toast.error("Failed to load admin dashboard."))
      .finally(() => setLoading(false));
  }, [role]);

  const stats = dashboard?.stats ?? {};
  const trends = dashboard?.trends ?? {};
  const charts = dashboard?.charts ?? {};
  const activityMix = dashboard?.activity_mix ?? [];
  const recentUsers = dashboard?.recent_users ?? [];
  const topClients = dashboard?.top_clients ?? [];
  const platform = dashboard?.platform ?? {};

  const kpiCards = useMemo(
    () => [
      {
        id: "clients",
        label: "Active Clients",
        value: stats.clients_active ?? 0,
        sub: `${stats.clients_total ?? 0} total · ${stats.clients_inactive ?? 0} inactive`,
        icon: LuUsers,
        trend: { current: trends.new_clients_30d, previous: trends.new_clients_prev_30d },
      },
      {
        id: "revenue",
        label: "Total Revenue",
        value: formatMoney(trends.revenue_30d),
        sub: `${formatMoney(stats.revenue_total)} all time`,
        icon: LuCrown,
        trend: { current: trends.revenue_30d, previous: trends.revenue_prev_30d },
      },
      {
        id: "orders",
        label: "Total Orders",
        value: trends.orders_30d ?? 0,
        sub: `${stats.orders_total ?? 0} total synced`,
        icon: LuClipboardList,
        trend: { current: trends.orders_30d, previous: trends.orders_prev_30d },
      },
      {
        id: "listings",
        label: "Active Listings",
        value: stats.listings_total ?? 0,
        sub: `${stats.subscriptions_active ?? 0} active subscriptions`,
        icon: LuPackage2,
      },
      {
        id: "users",
        label: "Total Users",
        value: stats.users_total ?? 0,
        sub: "Across all client accounts",
        icon: LuUserRound,
      },
    ],
    [stats, trends],
  );

  const activityTotal = useMemo(
    () => activityMix.reduce((sum, item) => sum + Number(item.value ?? 0), 0),
    [activityMix],
  );

  const topClientsMax = topClients[0]?.orders_count || 1;

  if (role !== "super_admin") {
    return null;
  }

  if (loading) {
    return (
      <section className="admin-page__loading card-wrapper">
        <LuLoader className="spin-icon" />
        <span>Loading dashboard…</span>
      </section>
    );
  }

  return (
    <section className="ebay-dashboard">
      {/* ===================================================
          HEADER
          =================================================== */}

      <header className="ebay-dashboard__header">
        <div className="ebay-dashboard__welcome">
          <h1>Admin Dashboard</h1>

          <p>Live counts, growth trends, and activity across all client accounts.</p>
        </div>

        <div className="ebay-dashboard__header-right">
          <button
            type="button"
            className="ebay-date-button"
            onClick={() => navigate("/admin/clients")}
          >
            <LuUsers />
            <span>Clients</span>
          </button>

          <button
            type="button"
            className="ebay-date-button"
            onClick={() => navigate("/admin/settings")}
          >
            <LuSettings2 />
            <span>Settings</span>
          </button>
        </div>
      </header>

      {/* ===================================================
          KPI CARDS
          =================================================== */}

      <section className="ebay-kpi-grid">
        {kpiCards.map((card) => {
          const Icon = card.icon;

          return (
            <article className="ebay-kpi-card" key={card.id}>
              <div className="ebay-kpi-card__top">
                <span className="ebay-kpi-card__icon">
                  <Icon />
                </span>

                {card.trend ? (
                  <EbayTrend current={card.trend.current} previous={card.trend.previous} />
                ) : null}
              </div>

              <div className="ebay-kpi-card__label">{card.label}</div>

              <div className="ebay-kpi-card__value">{card.value}</div>

              <span className="ebay-kpi-card__period">{card.sub}</span>
            </article>
          );
        })}

        {/* PROMO */}

        <article className="ebay-pro-card">
          <div className="ebay-pro-card__icon">
            <LuShield />
          </div>

          <h3>
            Keep The
            <br />
            Platform Secure
          </h3>

          <p>
            Review connections,
            <br />
            plans and admin
            <br />
            access in Settings.
          </p>

          <button type="button" onClick={() => navigate("/admin/settings")}>
            Open Settings
            <LuArrowUpRight />
          </button>
        </article>
      </section>

      {/* ===================================================
          MAIN GRID
          =================================================== */}

      <section className="ebay-main-grid">
        {/* =================================================
            REVENUE & GROWTH
            ================================================= */}

        <article className="ebay-card ebay-sales-card">
          <div className="ebay-card__header">
            <div>
              <div className="ebay-card__title-row">
                <span className="ebay-purple-icon">
                  <LuTrendingUp />
                </span>

                <h2>Revenue &amp; Client Growth</h2>
              </div>

              <p>Track platform revenue and new client signups.</p>
            </div>
          </div>

          {/* VALUES */}

          <div className="ebay-sales-values">
            <div>
              <span>Revenue (30d)</span>

              <strong>{formatMoney(trends.revenue_30d)}</strong>
            </div>

            <div>
              <span>New Clients</span>

              <strong>{trends.new_clients_30d ?? 0}</strong>
            </div>

            <div>
              <span>Orders Synced</span>

              <strong>{trends.orders_30d ?? 0}</strong>
            </div>
          </div>

          {/* CHART */}

          <div style={{ padding: "0 15px 10px" }}>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={charts.revenue ?? []}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8c3df4" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#8c3df4" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(148,163,184,0.25)" />

                <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />

                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={44} />

                <Tooltip content={<ChartTooltip valuePrefix="$" />} />

                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#8c3df4"
                  strokeWidth={2.4}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* =================================================
            PLATFORM HEALTH
            ================================================= */}

        <article className="ebay-card ebay-performance-card">
          <div className="ebay-card__header">
            <div className="ebay-card__title-row">
              <span className="ebay-purple-icon">
                <LuShield />
              </span>

              <h2>Platform Health</h2>
            </div>

            <button
              type="button"
              className="ebay-view-all"
              onClick={() => navigate("/admin/settings")}
            >
              Manage
            </button>
          </div>

          <div className="ebay-status-list">
            {[
              ["AliExpress", platform.connected ? "Connected" : "Not connected", LuBadgeCheck],
              ["Active Subscriptions", stats.subscriptions_active ?? 0, LuShield],
              ["Active Plans", stats.plans_active ?? 0, LuClipboardList],
              ["Wallet Float", formatMoney(stats.wallet_balance_total), LuWalletCards],
              ["Support Tickets", stats.support_conversations_total ?? 0, LuHeadphones],
              ["Sourcing Requests", stats.sourcing_requests_total ?? 0, LuPackageSearch],
              ["Super Admins", stats.super_admins_total ?? 0, LuUserRound],
            ].map(([label, value, Icon]) => (
              <div className="ebay-status-row" key={label}>
                <div className="ebay-status-row__label">
                  <span>
                    <Icon />
                  </span>

                  {label}
                </div>

                <div className="ebay-status-row__value">
                  <i />

                  {value}
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* ===================================================
          LOWER GRID
          =================================================== */}

      <section className="ebay-lower-grid">
        {/* =================================================
            RECENT SIGNUPS
            ================================================= */}

        <article className="ebay-card ebay-orders-card">
          <div className="ebay-card__header">
            <div className="ebay-card__title-row">
              <span className="ebay-purple-icon">
                <LuUsers />
              </span>

              <h2>Recent Signups</h2>
            </div>

            <button
              type="button"
              className="ebay-view-all"
              onClick={() => navigate("/admin/clients")}
            >
              View All
            </button>
          </div>

          <div className="ebay-activity-list">
            {recentUsers.length ? (
              recentUsers.map((user) => (
                <div className="ebay-activity-row" key={user.id}>
                  <span className="ebay-activity-icon">
                    {user.name?.slice(0, 1)?.toUpperCase() || "?"}
                  </span>

                  <div>
                    <strong>{user.name}</strong>

                    <span>{user.email}</span>

                    <small>
                      {user.current_plan?.title ?? "No plan"} · {formatDate(user.created_at)}
                    </small>
                  </div>
                </div>
              ))
            ) : (
              <p className="admin-page__muted">No users yet.</p>
            )}
          </div>
        </article>

        {/* =================================================
            TOP CLIENTS
            ================================================= */}

        <article className="ebay-card ebay-products-card">
          <div className="ebay-card__header">
            <div className="ebay-card__title-row">
              <span className="ebay-purple-icon">
                <LuTrendingUp />
              </span>

              <h2>Top Clients by Orders</h2>
            </div>
          </div>

          <div className="ebay-products-list">
            {topClients.length ? (
              topClients.map((client, index) => (
                <div className="ebay-product-row" key={client.id}>
                  <span className="ebay-product-rank">{index + 1}</span>

                  <span
                    className="ebay-activity-icon"
                    style={{ width: 31, height: 31, flex: "0 0 31px", borderRadius: 5 }}
                  >
                    {client.name?.slice(0, 1)?.toUpperCase() || "?"}
                  </span>

                  <div className="ebay-product-info">
                    <strong>{client.name}</strong>

                    <span>{client.orders_count} orders</span>
                  </div>

                  <div className="ebay-product-bar">
                    <i
                      style={{
                        width: `${Math.max(8, Math.round((client.orders_count / topClientsMax) * 100))}%`,
                      }}
                    />
                  </div>

                  <strong className="ebay-product-price">{client.listings_count} lst</strong>
                </div>
              ))
            ) : (
              <p className="admin-page__muted">No client activity yet.</p>
            )}
          </div>
        </article>

        {/* =================================================
            ACTIVITY MIX
            ================================================= */}

        <article className="ebay-card ebay-activity-card">
          <div className="ebay-card__header">
            <div className="ebay-card__title-row">
              <span className="ebay-purple-icon">
                <LuRefreshCw />
              </span>

              <h2>Activity Mix</h2>
            </div>
          </div>

          <div style={{ padding: "0 13px 14px" }}>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={activityMix}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={44}
                  outerRadius={64}
                  paddingAngle={3}
                >
                  {activityMix.map((entry) => (
                    <Cell key={entry.label} fill={entry.color} />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <ul className="admin-dash__legend">
              {activityMix.map((item) => (
                <li key={item.label}>
                  <span style={{ backgroundColor: item.color }} />

                  <div>
                    <strong>{item.value}</strong>

                    <span>{item.label}</span>
                  </div>
                </li>
              ))}
            </ul>

            {!activityMix.length ? (
              <p className="admin-page__muted">{activityTotal} events tracked.</p>
            ) : null}
          </div>
        </article>
      </section>
    </section>
  );
}

export default AdminDashboardPage;
