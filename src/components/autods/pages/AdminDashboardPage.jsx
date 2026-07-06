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
  Bar,
  BarChart,
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

function TrendBadge({ current, previous, suffix = "" }) {
  const change = trendPercent(current, previous);
  const positive = change >= 0;
  const Icon = positive ? LuArrowUpRight : LuArrowDownRight;

  return (
    <span className={positive ? "admin-dash__trend admin-dash__trend--up" : "admin-dash__trend admin-dash__trend--down"}>
      <Icon />
      {Math.abs(change)}%{suffix ? ` ${suffix}` : ""}
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

  const kpiCards = useMemo(() => [
    {
      id: "clients",
      label: "Active Clients",
      value: stats.clients_active ?? 0,
      sub: `${stats.clients_total ?? 0} total · ${stats.clients_inactive ?? 0} inactive`,
      icon: LuUsers,
      tone: "indigo",
      trend: { current: trends.new_clients_30d, previous: trends.new_clients_prev_30d, suffix: "vs prior 30d" },
    },
    {
      id: "revenue",
      label: "Revenue (30d)",
      value: formatMoney(trends.revenue_30d),
      sub: `${formatMoney(stats.revenue_total)} all time`,
      icon: LuCrown,
      tone: "amber",
      trend: { current: trends.revenue_30d, previous: trends.revenue_prev_30d, suffix: "vs prior 30d" },
    },
    {
      id: "orders",
      label: "Orders (30d)",
      value: trends.orders_30d ?? 0,
      sub: `${stats.orders_total ?? 0} total synced`,
      icon: LuClipboardList,
      tone: "teal",
      trend: { current: trends.orders_30d, previous: trends.orders_prev_30d, suffix: "vs prior 30d" },
    },
    {
      id: "listings",
      label: "Listings",
      value: stats.listings_total ?? 0,
      sub: `${stats.subscriptions_active ?? 0} active subscriptions`,
      icon: LuPackage2,
      tone: "violet",
    },
  ], [stats, trends]);

  const secondaryStats = useMemo(() => [
    { label: "Client Wallets", value: formatMoney(stats.wallet_balance_total), icon: LuWalletCards },
    { label: "Support Tickets", value: stats.support_conversations_total ?? 0, icon: LuHeadphones },
    { label: "Sourcing Requests", value: stats.sourcing_requests_total ?? 0, icon: LuPackageSearch },
    { label: "Active Plans", value: stats.plans_active ?? 0, icon: LuShield },
    { label: "Total Users", value: stats.users_total ?? 0, icon: LuUserRound },
  ], [stats]);

  const activityTotal = useMemo(
    () => activityMix.reduce((sum, item) => sum + Number(item.value ?? 0), 0),
    [activityMix],
  );

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
    <section className="admin-page admin-dash">
      <header className="admin-dash__hero card-wrapper">
        <div className="admin-dash__hero-copy">
          <span className="admin-page__eyebrow"><LuTrendingUp /> Platform Overview</span>
          <h1>Admin Dashboard</h1>
          <p>Live counts, growth trends, and activity across all client accounts.</p>
        </div>
        <div className="admin-dash__hero-actions">
          <button type="button" className="admin-page__btn admin-page__btn--ghost" onClick={() => navigate("/admin/clients")}>
            <LuUsers />
            <span>Clients</span>
          </button>
          <button type="button" className="admin-page__btn admin-page__btn--primary" onClick={() => navigate("/admin/settings")}>
            <LuSettings2 />
            <span>Settings</span>
          </button>
        </div>
      </header>

      <div className="admin-dash__kpi-grid">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.id} className={`admin-dash__kpi card-wrapper admin-dash__kpi--${card.tone}`}>
              <div className="admin-dash__kpi-top">
                <span className="admin-dash__kpi-icon"><Icon /></span>
                {card.trend ? (
                  <TrendBadge
                    current={card.trend.current}
                    previous={card.trend.previous}
                    suffix={card.trend.suffix}
                  />
                ) : null}
              </div>
              <strong className="admin-dash__kpi-value">{card.value}</strong>
              <span className="admin-dash__kpi-label">{card.label}</span>
              <span className="admin-dash__kpi-sub">{card.sub}</span>
            </article>
          );
        })}
      </div>

      <div className="admin-dash__mini-stats">
        {secondaryStats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="admin-dash__mini-stat card-wrapper">
              <Icon />
              <div>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="admin-dash__charts-grid">
        <section className="admin-dash__chart card-wrapper">
          <div className="admin-dash__chart-head">
            <div>
              <h2>New Client Signups</h2>
              <p>Last 14 days</p>
            </div>
            <strong>{trends.new_clients_30d ?? 0}</strong>
          </div>
          <div className="admin-dash__chart-body">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={charts.signups ?? []}>
                <defs>
                  <linearGradient id="signupGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(148,163,184,0.25)" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={32} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2.5} fill="url(#signupGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="admin-dash__chart card-wrapper">
          <div className="admin-dash__chart-head">
            <div>
              <h2>Orders Synced</h2>
              <p>Last 14 days</p>
            </div>
            <strong>{trends.orders_30d ?? 0}</strong>
          </div>
          <div className="admin-dash__chart-body">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={charts.orders ?? []}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(148,163,184,0.25)" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={32} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" fill="#14b8a6" radius={[8, 8, 0, 0]} maxBarSize={42} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="admin-dash__charts-grid admin-dash__charts-grid--wide">
        <section className="admin-dash__chart card-wrapper">
          <div className="admin-dash__chart-head">
            <div>
              <h2>Revenue</h2>
              <p>Completed payments · last 14 days</p>
            </div>
            <strong>{formatMoney(trends.revenue_30d)}</strong>
          </div>
          <div className="admin-dash__chart-body">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={charts.revenue ?? []}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(148,163,184,0.25)" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={48} />
                <Tooltip content={<ChartTooltip valuePrefix="$" />} />
                <Area type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2.5} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="admin-dash__chart card-wrapper">
          <div className="admin-dash__chart-head">
            <div>
              <h2>Activity Mix</h2>
              <p>Platform workload distribution</p>
            </div>
            <strong>{activityTotal}</strong>
          </div>
          <div className="admin-dash__donut-wrap">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={activityMix}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={62}
                  outerRadius={92}
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
          </div>
        </section>
      </div>

      <div className="admin-dash__bottom-grid">
        <section className="card-wrapper admin-dash__panel">
          <div className="admin-dash__panel-head">
            <h2>Recent Signups</h2>
            <button type="button" className="admin-dash__link-btn" onClick={() => navigate("/admin/clients")}>
              View all <LuArrowUpRight />
            </button>
          </div>
          <div className="admin-dash__table-list">
            {recentUsers.length ? recentUsers.map((user) => (
              <div className="admin-dash__table-row" key={user.id}>
                <div className="admin-dash__avatar">{user.name?.slice(0, 1)?.toUpperCase()}</div>
                <div className="admin-dash__row-copy">
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </div>
                <div className="admin-dash__row-meta">
                  <span>{user.current_plan?.title ?? "No plan"}</span>
                  <span>{formatDate(user.created_at)}</span>
                </div>
              </div>
            )) : (
              <p className="admin-page__muted">No users yet.</p>
            )}
          </div>
        </section>

        <section className="card-wrapper admin-dash__panel">
          <div className="admin-dash__panel-head">
            <h2>Top Clients by Orders</h2>
          </div>
          <div className="admin-dash__table-list">
            {topClients.length ? topClients.map((client, index) => (
              <div className="admin-dash__table-row" key={client.id}>
                <span className="admin-dash__rank">#{index + 1}</span>
                <div className="admin-dash__row-copy">
                  <strong>{client.name}</strong>
                  <span>{client.email}</span>
                </div>
                <div className="admin-dash__row-stats">
                  <span>{client.orders_count} orders</span>
                  <span>{client.listings_count} listings</span>
                </div>
              </div>
            )) : (
              <p className="admin-page__muted">No client activity yet.</p>
            )}
          </div>
        </section>

        <section className="card-wrapper admin-dash__panel admin-dash__health">
          <div className="admin-dash__panel-head">
            <h2>Platform Health</h2>
          </div>
          <div className="admin-dash__health-grid">
            <div className="admin-dash__health-item">
              <span>AliExpress</span>
              <strong className={platform.connected ? "admin-badge admin-badge--success" : "admin-badge admin-badge--muted"}>
                {platform.connected ? (
                  <><LuBadgeCheck /> Connected</>
                ) : "Not connected"}
              </strong>
            </div>
            <div className="admin-dash__health-item">
              <span>Active Subscriptions</span>
              <strong>{stats.subscriptions_active ?? 0}</strong>
            </div>
            <div className="admin-dash__health-item">
              <span>Wallet Float</span>
              <strong>{formatMoney(stats.wallet_balance_total)}</strong>
            </div>
            <div className="admin-dash__health-item">
              <span>Super Admins</span>
              <strong>{stats.super_admins_total ?? 0}</strong>
            </div>
          </div>
          {!platform.connected ? (
            <button type="button" className="admin-page__btn admin-page__btn--primary admin-dash__health-cta" onClick={() => navigate("/admin/settings")}>
              Connect AliExpress
            </button>
          ) : null}
        </section>
      </div>
    </section>
  );
}

export default AdminDashboardPage;
