import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import {
  LuCalendarDays,
  LuChevronDown,
  LuChevronRight,
  LuCircleCheck,
  LuEye,
  LuGavel,
  LuHeart,
  LuMail,
  LuRefreshCw,
  LuShoppingCart,
  LuTag,
  LuTrendingUp,
  LuUser,
  LuWalletCards,
  LuZap,
} from "react-icons/lu";

import { selectUser } from "../../../store/selectors/AuthSelectors";
import { getDashboardSummary } from "../../../services/DashboardService";

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#eef0f4"/></svg>');

const dateFilterOptions = [
  {
    value: "today",
    label: "Today",
    comparison: "vs yesterday",
  },
  {
    value: "15",
    label: "Last 15 Days",
    comparison: "vs previous 15 days",
  },
  {
    value: "30",
    label: "Last 30 Days",
    comparison: "vs previous 30 days",
  },
  {
    value: "year",
    label: "This Year",
    comparison: "vs last year",
  },
];

function DateFilterDropdown({ value, onChange, small = false }) {
  const [open, setOpen] = useState(false);

  const selected =
    dateFilterOptions.find((item) => item.value === value) ||
    dateFilterOptions[2];

  return (
    <div
      className={`ebay-date-filter ${small ? "ebay-date-filter--small" : ""}`}
    >
      <button
        type="button"
        className={small ? "ebay-small-select" : "ebay-date-button"}
        onClick={() => setOpen((current) => !current)}
      >
        <LuCalendarDays />

        <span>{selected.label}</span>

        <LuChevronDown className={open ? "ebay-chevron--open" : ""} />
      </button>

      {open && (
        <div
          className={`ebay-date-dropdown ${
            small ? "ebay-date-dropdown--small" : ""
          }`}
        >
          {dateFilterOptions.map((option) => (
            <button
              type="button"
              key={option.value}
              className={`ebay-date-option ${
                value === option.value ? "ebay-date-option--active" : ""
              }`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <span>{option.label}</span>

              {value === option.value && <LuCircleCheck />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function formatMoney(value) {
  const amount = Number(value ?? 0);
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatNumber(value) {
  return Number(value ?? 0).toLocaleString();
}

function formatGrowth(value) {
  const growth = Number(value ?? 0);
  return `${growth > 0 ? "+" : ""}${growth}%`;
}

function timeAgo(iso) {
  if (!iso) return "";

  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diffSec < 60) return "Just now";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? "" : "s"} ago`;

  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
}

const ACTIVITY_ICONS = {
  order: LuShoppingCart,
  listing: LuTag,
};

function createPolylinePoints(values) {
  if (!values?.length) return "";

  const width = 700;
  const height = 210;

  const max = Math.max(...values);
  const min = Math.min(...values);

  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x =
        values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;

      const y = height - ((value - min) / range) * 150 - 25;

      return `${x},${y}`;
    })
    .join(" ");
}

const EMPTY_CHART = { labels: [], sales: [], cost: [], profit: [] };
const EMPTY_KPIS = {
  profit: { value: 0, growth: 0 },
  revenue: { value: 0, growth: 0 },
  cost: { value: 0, growth: 0 },
  orders: { value: 0, growth: 0 },
  listings: { value: 0, growth: 0 },
  views: { value: 0, growth: 0 },
};

/* =========================================================
   COMPONENT
   ========================================================= */

function DashboardContent({ searchQuery }) {
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  /* =======================================================
     FILTER STATE
     ======================================================= */

  // Main dashboard filter
  const [dateFilter, setDateFilter] = useState("30");

  // Sales & Profit Overview filter
  const [salesDateFilter, setSalesDateFilter] = useState("30");

  /* =======================================================
     REAL DATA
     ======================================================= */

  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [salesSummary, setSalesSummary] = useState(null);
  const [salesLoading, setSalesLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setSummaryLoading(true);

    getDashboardSummary(dateFilter)
      .then((res) => {
        if (active) setSummary(res.data);
      })
      .catch(() => {
        if (active) setSummary(null);
      })
      .finally(() => {
        if (active) setSummaryLoading(false);
      });

    return () => {
      active = false;
    };
  }, [dateFilter]);

  useEffect(() => {
    let active = true;
    setSalesLoading(true);

    getDashboardSummary(salesDateFilter)
      .then((res) => {
        if (active) setSalesSummary(res.data);
      })
      .catch(() => {
        if (active) setSalesSummary(null);
      })
      .finally(() => {
        if (active) setSalesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [salesDateFilter]);

  const kpis = summary?.kpis ?? EMPTY_KPIS;
  const salesChart = salesSummary?.sales_chart ?? EMPTY_CHART;
  const salesKpis = salesSummary?.kpis ?? EMPTY_KPIS;

  const selectedDashboardFilter = dateFilterOptions.find(
    (item) => item.value === dateFilter,
  );

  /* =======================================================
     NAVIGATION
     ======================================================= */

  const openPage = (page) => {
    if (!page) return;

    navigate(page === "dashboard" ? "/" : `/${page}`);
  };

  /* =======================================================
     DYNAMIC KPI CARDS
     ======================================================= */

  const dynamicKpiCards = useMemo(() => [
    {
      id: "profit",
      label: "Total Profit",
      value: formatMoney(kpis.profit?.value ?? 0),
      growth: kpis.profit?.growth ?? 0,
      percentage: formatGrowth(kpis.profit?.growth ?? 0),
      icon: LuWalletCards,
    },
    {
      id: "revenue",
      label: "Total Revenue",
      value: formatMoney(kpis.revenue?.value ?? 0),
      growth: kpis.revenue?.growth ?? 0,
      percentage: formatGrowth(kpis.revenue?.growth ?? 0),
      icon: LuTrendingUp,
    },
    {
      id: "orders",
      label: "Total Orders",
      value: formatNumber(kpis.orders?.value ?? 0),
      growth: kpis.orders?.growth ?? 0,
      percentage: formatGrowth(kpis.orders?.growth ?? 0),
      icon: LuShoppingCart,
    },
    {
      id: "listings",
      label: "Active Listings",
      value: formatNumber(kpis.listings?.value ?? 0),
      growth: kpis.listings?.growth ?? 0,
      percentage: formatGrowth(kpis.listings?.growth ?? 0),
      icon: LuTag,
    },
    {
      id: "views",
      label: "Views",
      value: formatNumber(kpis.views?.value ?? 0),
      growth: kpis.views?.growth ?? 0,
      percentage: formatGrowth(kpis.views?.growth ?? 0),
      icon: LuEye,
    },
  ], [kpis]);

  /* =======================================================
     SEARCH
     ======================================================= */

  const visibleMetrics = useMemo(() => {
    const query = searchQuery?.trim().toLowerCase();

    if (!query) {
      return dynamicKpiCards;
    }

    return dynamicKpiCards.filter(
      (item) =>
        item.label.toLowerCase().includes(query) ||
        item.value.toString().toLowerCase().includes(query),
    );
  }, [dynamicKpiCards, searchQuery]);

  /* =======================================================
     CHART POINTS
     ======================================================= */

  const salesPoints = useMemo(
    () => createPolylinePoints(salesChart.sales),
    [salesChart],
  );

  const costPoints = useMemo(
    () => createPolylinePoints(salesChart.cost),
    [salesChart],
  );

  const profitPoints = useMemo(
    () => createPolylinePoints(salesChart.profit),
    [salesChart],
  );

  const chartMax = Math.max(1, ...salesChart.sales, ...salesChart.cost, ...salesChart.profit);

  /* =======================================================
     ORDERS
     ======================================================= */

  const orders = summary?.recent_orders ?? [];

  /* =======================================================
     TOP PRODUCTS
     ======================================================= */

  const rawTopProducts = summary?.top_products ?? [];
  const maxSold = Math.max(1, ...rawTopProducts.map((product) => product.sold));
  const topProducts = rawTopProducts.map((product) => ({
    name: product.title,
    sold: `${formatNumber(product.sold)} sold`,
    price: formatMoney(product.revenue),
    width: `${Math.round((product.sold / maxSold) * 100)}%`,
    image: product.image || PLACEHOLDER_IMAGE,
  }));

  /* =======================================================
     ACTIVITIES
     ======================================================= */

  const activities = (summary?.recent_activity ?? []).map((activity) => ({
    icon: ACTIVITY_ICONS[activity.type] ?? LuTag,
    title: activity.title,
    text: activity.text,
    time: timeAgo(activity.time),
    type: activity.type,
  }));

  /* =======================================================
     STORE PERFORMANCE
     ======================================================= */

  const store = summary?.store ?? {};
  const storeRows = [
    ["Account Status", store.account_status ?? "—", LuGavel, "settings"],
    ["Marketplace", store.marketplace ?? "—", LuShoppingCart, "settings"],
    ["eBay Username", store.username ?? "—", LuUser, "settings"],
    ["Total Listings", formatNumber(store.total_listings), LuTag, "products"],
    ["Active Listings", formatNumber(store.active_listings), LuHeart, "products"],
    ["Total Orders", formatNumber(store.total_orders), LuMail, "orders"],
    ["Member Since", store.member_since ?? "—", LuCalendarDays, "settings"],
  ];

  const firstName = (user?.name ?? "").trim().split(/\s+/)[0] || "there";

  /* =======================================================
     RETURN
     ======================================================= */

  return (
    <section className="ebay-dashboard">
      {/* ===================================================
          HEADER
          =================================================== */}

      <header className="ebay-dashboard__header">
        <div className="ebay-dashboard__welcome">
          <h1>
            Good to see you again, {firstName}! <span>👋</span>
          </h1>

          <p>Here's your eBay business performance at a glance.</p>
        </div>

        <div className="ebay-dashboard__header-right">
          <div className="ebay-logo">
            <span className="ebay-logo__e">e</span>
            <span className="ebay-logo__b">b</span>
            <span className="ebay-logo__a">a</span>
            <span className="ebay-logo__y">y</span>
          </div>

          {/* MAIN DATE FILTER */}

          <DateFilterDropdown value={dateFilter} onChange={setDateFilter} />
        </div>
      </header>

      {/* ===================================================
          KPI CARDS
          =================================================== */}

      <section className="ebay-kpi-grid">
        {visibleMetrics.slice(0, 5).map((item, index) => {
          const Icon = item.icon || LuWalletCards;

          return (
            <article className="ebay-kpi-card" key={item.id || index}>
              <div className="ebay-kpi-card__top">
                <span className="ebay-kpi-card__icon">
                  <Icon />
                </span>

                <span className="ebay-kpi-card__trend">
                  <LuTrendingUp />
                  {summaryLoading ? "…" : item.percentage}
                </span>
              </div>

              <div className="ebay-kpi-card__label">
                {item.label}
              </div>

              <div className="ebay-kpi-card__value">
                {summaryLoading ? "…" : item.value}
              </div>

              <span className="ebay-kpi-card__period">
                {summaryLoading ? "" : `${item.growth >= 0 ? "↑" : "↓"} ${item.percentage} ${selectedDashboardFilter?.comparison ?? ""}`}
              </span>
            </article>
          );
        })}

        {/* PROMO */}

        <article className="ebay-pro-card">
          <div className="ebay-pro-card__icon">
            <LuZap />
          </div>

          <h3>
            Scale Your
            <br />
            eBay Business
          </h3>

          <p>
            Find, list and sell
            <br />
            winning products —
            <br />
            faster with AutoDropship.
          </p>

          <button type="button" onClick={() => openPage("plans")}>
            Upgrade to Pro
            <LuChevronRight />
          </button>
        </article>
      </section>

      {/* ===================================================
          MAIN GRID
          =================================================== */}

      <section className="ebay-main-grid">
        {/* =================================================
            SALES & PROFIT OVERVIEW
            ================================================= */}

        <article className="ebay-card ebay-sales-card">
          <div className="ebay-card__header">
            <div>
              <div className="ebay-card__title-row">
                <span className="ebay-purple-icon">
                  <LuTrendingUp />
                </span>

                <h2>Sales &amp; Profit Overview</h2>
              </div>

              <p>Track your revenue, costs and profit in real time.</p>
            </div>

            {/* SALES FILTER */}

            <DateFilterDropdown
              value={salesDateFilter}
              onChange={setSalesDateFilter}
              small
            />
          </div>

          {/* SALES VALUES */}

          <div className="ebay-sales-values">
            <div>
              <span>Total Sales</span>

              <strong>{salesLoading ? "…" : formatMoney(salesKpis.revenue.value)}</strong>

              <small>{salesLoading ? "" : `${salesKpis.revenue.growth >= 0 ? "↑" : "↓"} ${formatGrowth(salesKpis.revenue.growth)}`}</small>
            </div>

            <div>
              <span>Total Cost</span>

              <strong>{salesLoading ? "…" : formatMoney(salesKpis.cost.value)}</strong>

              <small>{salesLoading ? "" : `${salesKpis.cost.growth >= 0 ? "↑" : "↓"} ${formatGrowth(salesKpis.cost.growth)}`}</small>
            </div>

            <div>
              <span>Total Profit</span>

              <strong>{salesLoading ? "…" : formatMoney(salesKpis.profit.value)}</strong>

              <small>{salesLoading ? "" : `${salesKpis.profit.growth >= 0 ? "↑" : "↓"} ${formatGrowth(salesKpis.profit.growth)}`}</small>
            </div>
          </div>

          {/* CHART */}

          <div className="ebay-chart">
            <div className="ebay-chart__y">
              <span>{formatMoney(chartMax)}</span>
              <span>{formatMoney(chartMax * 0.75)}</span>
              <span>{formatMoney(chartMax * 0.5)}</span>
              <span>{formatMoney(chartMax * 0.25)}</span>
              <span>{formatMoney(chartMax * 0.1)}</span>
              <span>$0</span>
            </div>

            <div className="ebay-chart__area">
              <div className="ebay-chart__grid">
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>

              <svg
                className="ebay-chart__svg"
                viewBox="0 0 700 210"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="profitFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopOpacity="0.22" />

                    <stop offset="100%" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* PROFIT AREA */}

                <polyline
                  className="ebay-chart__profit-fill"
                  points={`${profitPoints} 700,210 0,210`}
                  fill="url(#profitFill)"
                  stroke="none"
                />

                {/* SALES */}

                <polyline
                  className="ebay-chart__line ebay-chart__line--sales"
                  points={salesPoints}
                />

                {/* COST */}

                <polyline
                  className="ebay-chart__line ebay-chart__line--cost"
                  points={costPoints}
                />

                {/* PROFIT */}

                <polyline
                  className="ebay-chart__line ebay-chart__line--profit"
                  points={profitPoints}
                />
              </svg>

              {/* X AXIS */}

              <div className="ebay-chart__dates">
                {salesChart.labels.map((label, index) => (
                  <span key={`${label}-${index}`}>{label}</span>
                ))}
              </div>
            </div>
          </div>

          {/* LEGEND */}

          <div className="ebay-chart-legend">
            <span>
              <i className="sales" />
              Sales
            </span>

            <span>
              <i className="cost" />
              Cost
            </span>

            <span>
              <i className="profit" />
              Profit
            </span>
          </div>
        </article>

        {/* =================================================
            STORE PERFORMANCE
            ================================================= */}

        <article className="ebay-card ebay-performance-card">
          <div className="ebay-card__header">
            <div className="ebay-card__title-row">
              <div className="ebay-mini-logo">eBay</div>

              <h2>eBay Store Performance</h2>
            </div>

            <button type="button" className="ebay-view-all" onClick={() => openPage("settings")}>
              View All
            </button>
          </div>

          <div className="ebay-status-list">
            {storeRows.map(([label, value, Icon, targetPage]) => (
              <div
                className="ebay-status-row"
                key={label}
                onClick={() => openPage(targetPage)}
                style={{ cursor: "pointer" }}
              >
                <div className="ebay-status-row__label">
                  <span>
                    <Icon />
                  </span>

                  {label}
                </div>

                <div className="ebay-status-row__value">
                  <i />

                  {value}

                  <LuChevronRight />
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
            RECENT ORDERS
            ================================================= */}

        <article className="ebay-card ebay-orders-card">
          <div className="ebay-card__header">
            <div className="ebay-card__title-row">
              <span className="ebay-purple-icon">
                <LuShoppingCart />
              </span>

              <h2>Recent eBay Orders</h2>
            </div>

            <button type="button" className="ebay-view-all" onClick={() => openPage("orders")}>
              View All
            </button>
          </div>

          <div className="ebay-orders-table">
            <div className="ebay-orders-table__head">
              <span>#</span>
              <span>Product</span>
              <span>Buyer</span>
              <span>Amount</span>
              <span>Status</span>
              <span>Date</span>
              <span />
            </div>

            {orders.length === 0 ? (
              <div className="ebay-orders-table__empty" style={{ padding: "20px 0", color: "#9aa0ac", textAlign: "center" }}>
                {summaryLoading ? "Loading orders…" : "No orders yet."}
              </div>
            ) : (
              orders.map((order) => (
                <div
                  className="ebay-order-row"
                  key={order.id}
                  onClick={() => openPage("orders")}
                  style={{ cursor: "pointer" }}
                >
                  <span className="ebay-order-id">{order.orderId ? `#${order.orderId}` : `#${order.id}`}</span>

                  <div className="ebay-order-product">
                    <img
                      src={order.image || PLACEHOLDER_IMAGE}
                      alt={order.product}
                      onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }}
                    />

                    <span>{order.product}</span>
                  </div>

                  <span>{order.buyer}</span>

                  <strong>{formatMoney(order.amount)}</strong>

                  <span
                    className={`ebay-order-status ebay-order-status--${(order.status || "pending").toLowerCase()}`}
                  >
                    {order.status}
                  </span>

                  <span>{order.date}</span>

                  <button
                    type="button"
                    className="ebay-more-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPage("orders");
                    }}
                  >
                    •••
                  </button>
                </div>
              ))
            )}
          </div>
        </article>

        {/* =================================================
            TOP PRODUCTS
            ================================================= */}

        <article className="ebay-card ebay-products-card">
          <div className="ebay-card__header">
            <div className="ebay-card__title-row">
              <span className="ebay-purple-icon">
                <LuTrendingUp />
              </span>

              <h2>Top Selling Products</h2>
            </div>

            <button type="button" className="ebay-view-all" onClick={() => openPage("products")}>
              View All
            </button>
          </div>

          <div className="ebay-products-list">
            {topProducts.length === 0 ? (
              <div style={{ padding: "20px 0", color: "#9aa0ac", textAlign: "center" }}>
                {summaryLoading ? "Loading products…" : "No sales in this period yet."}
              </div>
            ) : (
              topProducts.map((product, index) => (
                <div
                  className="ebay-product-row"
                  key={`${product.name}-${index}`}
                  onClick={() => openPage("products")}
                  style={{ cursor: "pointer" }}
                >
                  <span className="ebay-product-rank">{index + 1}</span>

                  <img
                    src={product.image || PLACEHOLDER_IMAGE}
                    alt={product.name}
                    onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }}
                  />

                  <div className="ebay-product-info">
                    <strong>{product.name}</strong>

                    <span>{product.sold}</span>
                  </div>

                  <div className="ebay-product-bar">
                    <i
                      style={{
                        width: product.width,
                      }}
                    />
                  </div>

                  <strong className="ebay-product-price">{product.price}</strong>
                </div>
              ))
            )}
          </div>
        </article>

        {/* =================================================
            RECENT ACTIVITY
            ================================================= */}

        <article className="ebay-card ebay-activity-card">
          <div className="ebay-card__header">
            <div className="ebay-card__title-row">
              <span className="ebay-purple-icon">
                <LuRefreshCw />
              </span>

              <h2>Recent Activity</h2>
            </div>

            <button type="button" className="ebay-view-all" onClick={() => openPage("orders")}>
              View All
            </button>
          </div>

          <div className="ebay-activity-list">
            {activities.length === 0 ? (
              <div style={{ padding: "20px 0", color: "#9aa0ac", textAlign: "center" }}>
                {summaryLoading ? "Loading activity…" : "No recent activity."}
              </div>
            ) : (
              activities.map((activity, index) => {
                const Icon = activity.icon;

                return (
                  <div
                    className="ebay-activity-row"
                    key={`${activity.title}-${index}`}
                    onClick={() => openPage(activity.type === "order" ? "orders" : "products")}
                    style={{ cursor: "pointer" }}
                  >
                    <span className="ebay-activity-icon">
                      <Icon />
                    </span>

                    <div>
                      <strong>{activity.title}</strong>

                      <span>{activity.text}</span>

                      <small>{activity.time}</small>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </article>
      </section>
    </section>
  );
}

export default DashboardContent;

