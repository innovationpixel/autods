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
  LuMinus,
  LuRefreshCw,
  LuShoppingCart,
  LuTag,
  LuTrendingDown,
  LuTrendingUp,
  LuUser,
  LuWalletCards,
  LuZap,
} from "react-icons/lu";

import { selectUser } from "../../../store/selectors/AuthSelectors";
import { getDashboardSummary } from "../../../services/DashboardService";
import DashboardOrderActions from "../DashboardOrderActions";

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#eef0f4"/></svg>');

const dateFilterOptions = [
  { value: "today", label: "Today", comparison: "vs yesterday" },
  { value: "15", label: "Last 15 Days", comparison: "vs previous 15 days" },
  { value: "30", label: "Last 30 Days", comparison: "vs previous 30 days" },
  { value: "year", label: "This Year", comparison: "vs last year" },
];

function DateFilterDropdown({ value, onChange, small = false }) {
  const [open, setOpen] = useState(false);
  const selected = dateFilterOptions.find((item) => item.value === value) || dateFilterOptions[2];

  return (
    <div className={`ebay-date-filter ${small ? "ebay-date-filter--small" : ""}`}>
      <button
        type="button"
        className={small ? "ebay-small-select" : "ebay-date-button"}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <LuCalendarDays />
        <span>{selected.label}</span>
        <LuChevronDown className={open ? "ebay-chevron--open" : ""} />
      </button>

      {open && (
        <div className={`ebay-date-dropdown ${small ? "ebay-date-dropdown--small" : ""}`}>
          {dateFilterOptions.map((option) => (
            <button
              type="button"
              key={option.value}
              className={`ebay-date-option ${value === option.value ? "ebay-date-option--active" : ""}`}
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

function Skeleton({ className = "" }) {
  return <span className={`ap-skeleton ${className}`} aria-hidden="true" />;
}

function MetricSkeleton() {
  return (
    <article className="ebay-kpi-card ebay-kpi-card--loading" aria-hidden="true">
      <div className="ebay-kpi-card__top">
        <Skeleton className="ap-skeleton--icon" />
        <Skeleton className="ap-skeleton--chip" />
      </div>
      <Skeleton className="ap-skeleton--label" />
      <Skeleton className="ap-skeleton--metric" />
      <Skeleton className="ap-skeleton--caption" />
    </article>
  );
}

function PanelRowsSkeleton({ rows = 5, compact = false }) {
  return (
    <div className={`ap-list-skeleton ${compact ? "ap-list-skeleton--compact" : ""}`} aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div className="ap-list-skeleton__row" key={index}>
          <Skeleton className="ap-skeleton--avatar" />
          <div className="ap-list-skeleton__copy">
            <Skeleton className="ap-skeleton--line-wide" />
            <Skeleton className="ap-skeleton--line-short" />
          </div>
          <Skeleton className="ap-skeleton--value" />
        </div>
      ))}
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

function growthClass(value) {
  const growth = Number(value ?? 0);
  if (growth > 0) return "is-positive";
  if (growth < 0) return "is-negative";
  return "is-neutral";
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

const ACTIVITY_ICONS = { order: LuShoppingCart, listing: LuTag };

function createPolylinePoints(values) {
  if (!values?.length) return "";
  const width = 700;
  const height = 210;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
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

function DashboardContent({ searchQuery }) {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [dateFilter, setDateFilter] = useState("30");
  const [salesDateFilter, setSalesDateFilter] = useState("30");
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
  const selectedDashboardFilter = dateFilterOptions.find((item) => item.value === dateFilter);

  const openPage = (page) => {
    if (!page) return;
    navigate(page === "dashboard" ? "/" : `/${page}`);
  };

  const dynamicKpiCards = useMemo(
    () => [
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
    ],
    [kpis],
  );

  const visibleMetrics = useMemo(() => {
    const query = searchQuery?.trim().toLowerCase();
    if (!query) return dynamicKpiCards;
    return dynamicKpiCards.filter(
      (item) => item.label.toLowerCase().includes(query) || item.value.toLowerCase().includes(query),
    );
  }, [dynamicKpiCards, searchQuery]);

  const salesPoints = useMemo(() => createPolylinePoints(salesChart.sales), [salesChart]);
  const costPoints = useMemo(() => createPolylinePoints(salesChart.cost), [salesChart]);
  const profitPoints = useMemo(() => createPolylinePoints(salesChart.profit), [salesChart]);
  const chartMax = Math.max(1, ...salesChart.sales, ...salesChart.cost, ...salesChart.profit);

  const orders = summary?.recent_orders ?? [];
  const rawTopProducts = summary?.top_products ?? [];
  const maxSold = Math.max(1, ...rawTopProducts.map((product) => product.sold));
  const topProducts = rawTopProducts.map((product) => ({
    name: product.title,
    sold: `${formatNumber(product.sold)} sold`,
    price: formatMoney(product.revenue),
    width: `${Math.round((product.sold / maxSold) * 100)}%`,
    image: product.image || PLACEHOLDER_IMAGE,
  }));

  const activities = (summary?.recent_activity ?? []).map((activity) => ({
    icon: ACTIVITY_ICONS[activity.type] ?? LuTag,
    title: activity.title,
    text: activity.text,
    time: timeAgo(activity.time),
    type: activity.type,
  }));

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

  return (
    <section className="ebay-dashboard" aria-busy={summaryLoading || salesLoading}>
      <header className="ebay-dashboard__header">
        <div className="ebay-dashboard__welcome">
          <span className="ebay-dashboard__eyebrow">Store analytics</span>
          <h1>Welcome back, {firstName}</h1>
          <p>Monitor profit, sales, listings and recent store activity.</p>
        </div>

        <div className="ebay-dashboard__header-right">
          <span className="ebay-marketplace-chip" aria-label="eBay marketplace">
            <span className="ebay-marketplace-chip__logo" aria-hidden="true">
              <b>e</b><b>B</b><b>a</b><b>y</b>
            </span>
            <span>Marketplace</span>
          </span>
          <DateFilterDropdown value={dateFilter} onChange={setDateFilter} />
        </div>
      </header>

      <section className="ebay-kpi-grid" aria-label="Store performance metrics">
        {summaryLoading
          ? Array.from({ length: 5 }).map((_, index) => <MetricSkeleton key={index} />)
          : visibleMetrics.slice(0, 5).map((item, index) => {
              const Icon = item.icon || LuWalletCards;
              const growth = Number(item.growth) || 0;
              const trendState = growth > 0 ? "positive" : growth < 0 ? "negative" : "neutral";
              const TrendIcon = trendState === "positive" ? LuTrendingUp : trendState === "negative" ? LuTrendingDown : LuMinus;
              const comparisonLabel = (selectedDashboardFilter?.comparison ?? "vs previous period").replace(/^vs\s+/i, "");
              const periodCopy = trendState === "neutral"
                ? `No change from ${comparisonLabel}`
                : `${Math.abs(growth)}% ${trendState === "positive" ? "higher" : "lower"} than ${comparisonLabel}`;

              return (
                <article className={`ebay-kpi-card ebay-kpi-card--${item.id || index}`} key={item.id || index}>
                  <div className="ebay-kpi-card__top">
                    <span className="ebay-kpi-card__icon">
                      <Icon />
                    </span>
                    <span className={`ebay-kpi-card__trend is-${trendState}`}>
                      <TrendIcon />
                      {item.percentage}
                    </span>
                  </div>
                  <div className="ebay-kpi-card__label">{item.label}</div>
                  <div className="ebay-kpi-card__value">{item.value}</div>
                  <span className="ebay-kpi-card__period">{periodCopy}</span>
                </article>
              );
            })}
      </section>

      <section className="ebay-upgrade-banner">
        <div className="ebay-upgrade-banner__icon">
          <LuZap />
        </div>
        <div className="ebay-upgrade-banner__copy">
          <strong>Automate more with Pro</strong>
          <span>Higher limits, faster product workflows and more room to scale.</span>
        </div>
        <button type="button" onClick={() => openPage("plans")}>
          View plans
          <LuChevronRight />
        </button>
      </section>

      <section className="ebay-main-grid">
        <article className="ebay-card ebay-sales-card">
          <div className="ebay-card__header">
            <div>
              <div className="ebay-card__title-row">
                <span className="ebay-purple-icon"><LuTrendingUp /></span>
                <h2>Sales &amp; profit</h2>
              </div>
              <p>Revenue, costs and profit for the selected period.</p>
            </div>
            <DateFilterDropdown value={salesDateFilter} onChange={setSalesDateFilter} small />
          </div>

          {salesLoading ? (
            <div className="ebay-chart-skeleton" aria-label="Loading sales chart">
              <div className="ebay-sales-values ebay-sales-values--loading">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index}>
                    <Skeleton className="ap-skeleton--label" />
                    <Skeleton className="ap-skeleton--metric-small" />
                  </div>
                ))}
              </div>
              <div className="ebay-chart-skeleton__plot">
                <Skeleton className="ap-skeleton--chart-line ap-skeleton--chart-line-1" />
                <Skeleton className="ap-skeleton--chart-line ap-skeleton--chart-line-2" />
                <Skeleton className="ap-skeleton--chart-line ap-skeleton--chart-line-3" />
                <Skeleton className="ap-skeleton--chart-block" />
              </div>
            </div>
          ) : (
            <>
              <div className="ebay-sales-values">
                <div>
                  <span>Total Sales</span>
                  <strong>{formatMoney(salesKpis.revenue.value)}</strong>
                  <small className={growthClass(salesKpis.revenue.growth)}>
                    {formatGrowth(salesKpis.revenue.growth)}
                  </small>
                </div>
                <div>
                  <span>Total Cost</span>
                  <strong>{formatMoney(salesKpis.cost.value)}</strong>
                  <small className={growthClass(salesKpis.cost.growth)}>
                    {formatGrowth(salesKpis.cost.growth)}
                  </small>
                </div>
                <div>
                  <span>Total Profit</span>
                  <strong>{formatMoney(salesKpis.profit.value)}</strong>
                  <small className={growthClass(salesKpis.profit.growth)}>
                    {formatGrowth(salesKpis.profit.growth)}
                  </small>
                </div>
              </div>

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
                  <div className="ebay-chart__grid"><i /><i /><i /><i /><i /><i /></div>
                  <svg className="ebay-chart__svg" viewBox="0 0 700 210" preserveAspectRatio="none" aria-hidden="true">
                    <defs>
                      <linearGradient id="profitFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopOpacity="0.16" />
                        <stop offset="100%" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <polyline className="ebay-chart__profit-fill" points={`${profitPoints} 700,210 0,210`} fill="url(#profitFill)" stroke="none" />
                    <polyline className="ebay-chart__line ebay-chart__line--sales" points={salesPoints} />
                    <polyline className="ebay-chart__line ebay-chart__line--cost" points={costPoints} />
                    <polyline className="ebay-chart__line ebay-chart__line--profit" points={profitPoints} />
                  </svg>
                  <div className="ebay-chart__dates">
                    {salesChart.labels.map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}
                  </div>
                </div>
              </div>

              <div className="ebay-chart-legend">
                <span><i className="sales" />Sales</span>
                <span><i className="cost" />Cost</span>
                <span><i className="profit" />Profit</span>
              </div>
            </>
          )}
        </article>

        <article className="ebay-card ebay-performance-card">
          <div className="ebay-card__header">
            <div className="ebay-card__title-row">
              <div className="ebay-mini-logo">eBay</div>
              <div>
                <h2>Store health</h2>
                <p>Connection and marketplace status.</p>
              </div>
            </div>
            <button type="button" className="ebay-view-all" onClick={() => openPage("settings")}>Manage</button>
          </div>

          {summaryLoading ? (
            <PanelRowsSkeleton rows={7} compact />
          ) : (
            <div className="ebay-status-list">
              {storeRows.map(([label, value, Icon, targetPage]) => (
                <button className="ebay-status-row" type="button" key={label} onClick={() => openPage(targetPage)}>
                  <span className="ebay-status-row__label"><span><Icon /></span>{label}</span>
                  <span className="ebay-status-row__value"><i />{value}<LuChevronRight /></span>
                </button>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="ebay-lower-grid">
        <article className="ebay-card ebay-orders-card">
          <div className="ebay-card__header">
            <div className="ebay-card__title-row">
              <span className="ebay-purple-icon"><LuShoppingCart /></span>
              <div><h2>Recent orders</h2><p>Latest orders from your connected store.</p></div>
            </div>
            <button type="button" className="ebay-view-all" onClick={() => openPage("orders")}>View all</button>
          </div>

          {summaryLoading ? (
            <PanelRowsSkeleton rows={5} />
          ) : (
            <div className="ebay-orders-table">
              <div className="ebay-orders-table__head">
                <span>#</span><span>Product</span><span>Buyer</span><span>Amount</span><span>Status</span><span>Date</span><span />
              </div>
              {orders.length === 0 ? (
                <div className="ebay-empty-state">No orders yet.</div>
              ) : (
                orders.map((order) => (
                  <div className="ebay-order-row" key={order.id}>
                    <span className="ebay-order-id">{order.orderId ? `#${order.orderId}` : `#${order.id}`}</span>
                    <div className="ebay-order-product">
                      <img src={order.image || PLACEHOLDER_IMAGE} alt={order.product} onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }} />
                      <span>{order.product}</span>
                    </div>
                    <span>{order.buyer}</span>
                    <strong>{formatMoney(order.amount)}</strong>
                    <span className={`ebay-order-status ebay-order-status--${(order.status || "pending").toLowerCase()}`}>{order.status}</span>
                    <span>{order.date}</span>
                    <DashboardOrderActions
                      order={order}
                      store={summary?.store ?? {}}
                      onSettings={() => openPage("settings")}
                    />
                  </div>
                ))
              )}
            </div>
          )}
        </article>

        <article className="ebay-card ebay-products-card">
          <div className="ebay-card__header">
            <div className="ebay-card__title-row">
              <span className="ebay-purple-icon"><LuTrendingUp /></span>
              <div><h2>Top products</h2><p>Best performers by revenue.</p></div>
            </div>
            <button type="button" className="ebay-view-all" onClick={() => openPage("products")}>View all</button>
          </div>

          {summaryLoading ? (
            <PanelRowsSkeleton rows={5} />
          ) : (
            <div className="ebay-products-list">
              {topProducts.length === 0 ? (
                <div className="ebay-empty-state">No sales in this period yet.</div>
              ) : (
                topProducts.map((product, index) => (
                  <button className="ebay-product-row" type="button" key={`${product.name}-${index}`} onClick={() => openPage("products")}>
                    <span className="ebay-product-rank">{index + 1}</span>
                    <img src={product.image || PLACEHOLDER_IMAGE} alt={product.name} onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }} />
                    <span className="ebay-product-info"><strong>{product.name}</strong><span>{product.sold}</span></span>
                    <span className="ebay-product-bar"><i style={{ width: product.width }} /></span>
                    <strong className="ebay-product-price">{product.price}</strong>
                  </button>
                ))
              )}
            </div>
          )}
        </article>

        <article className="ebay-card ebay-activity-card">
          <div className="ebay-card__header">
            <div className="ebay-card__title-row">
              <span className="ebay-purple-icon"><LuRefreshCw /></span>
              <div><h2>Recent activity</h2><p>Store events and listing updates.</p></div>
            </div>
            <button type="button" className="ebay-view-all" onClick={() => openPage("orders")}>View all</button>
          </div>

          {summaryLoading ? (
            <PanelRowsSkeleton rows={5} />
          ) : (
            <div className="ebay-activity-list">
              {activities.length === 0 ? (
                <div className="ebay-empty-state">No recent activity.</div>
              ) : (
                activities.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <button className="ebay-activity-row" type="button" key={`${activity.title}-${index}`} onClick={() => openPage(activity.type === "order" ? "orders" : "products")}>
                      <span className="ebay-activity-icon"><Icon /></span>
                      <span><strong>{activity.title}</strong><span>{activity.text}</span><small>{activity.time}</small></span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </article>
      </section>
    </section>
  );
}

export default DashboardContent;
