import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  LuCalendarDays,
  LuChevronDown,
  LuChevronRight,
  LuCircleCheck,
  LuHeart,
  LuMail,
  LuPackage,
  LuRefreshCw,
  LuShoppingCart,
  LuTag,
  LuTrendingUp,
  LuUser,
  LuWalletCards,
  LuZap,
  LuGavel,
} from "react-icons/lu";

import { dashboardMetricCards } from "../constants";

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

const dashboardPeriodData = {
  today: {
    profit: "$94.10",
    revenue: "$286.40",
    orders: "12",
    listings: "892",
    views: "842",

    profitGrowth: "8%",
    revenueGrowth: "6%",
    ordersGrowth: "4%",
    listingsGrowth: "2%",
    viewsGrowth: "9%",
  },

  15: {
    profit: "$1,275.40",
    revenue: "$4,215.60",
    orders: "156",
    listings: "892",
    views: "12,840",

    profitGrowth: "18%",
    revenueGrowth: "16%",
    ordersGrowth: "13%",
    listingsGrowth: "7%",
    viewsGrowth: "21%",
  },

  30: {
    profit: "$2,436.80",
    revenue: "$8,642.00",
    orders: "320",
    listings: "892",
    views: "24,580",

    profitGrowth: "28%",
    revenueGrowth: "24%",
    ordersGrowth: "18%",
    listingsGrowth: "11%",
    viewsGrowth: "31%",
  },

  year: {
    profit: "$26,400.00",
    revenue: "$94,820.00",
    orders: "4,286",
    listings: "892",
    views: "284,520",

    profitGrowth: "34%",
    revenueGrowth: "29%",
    ordersGrowth: "24%",
    listingsGrowth: "15%",
    viewsGrowth: "38%",
  },
};


const salesPeriodData = {
  today: {
    sales: "$286.40",
    cost: "$192.30",
    profit: "$94.10",

    salesGrowth: "6%",
    costGrowth: "4%",
    profitGrowth: "8%",

    labels: ["9 AM", "11 AM", "1 PM", "3 PM", "5 PM", "7 PM", "9 PM", "Now"],

    sales: [25, 42, 38, 58, 72, 64, 88, 100],
    cost: [18, 31, 28, 42, 51, 48, 64, 72],
    profit: [8, 14, 12, 18, 25, 20, 31, 38],
  },

  15: {
    sales: "$4,215.60",
    cost: "$2,940.20",
    profit: "$1,275.40",

    salesGrowth: "16%",
    costGrowth: "12%",
    profitGrowth: "18%",

    labels: [
      "Sep 2",
      "Sep 4",
      "Sep 6",
      "Sep 8",
      "Sep 10",
      "Sep 12",
      "Sep 14",
      "Sep 16",
    ],

    sales: [28, 42, 35, 58, 50, 69, 78, 92],
    cost: [22, 32, 29, 42, 39, 51, 58, 68],
    profit: [10, 18, 13, 25, 21, 32, 40, 52],
  },

  30: {
    sales: "$8,642.00",
    cost: "$6,205.20",
    profit: "$2,436.80",

    salesGrowth: "24%",
    costGrowth: "17%",
    profitGrowth: "28%",

    labels: [
      "Aug 18",
      "Aug 22",
      "Aug 26",
      "Aug 30",
      "Sep 3",
      "Sep 7",
      "Sep 11",
      "Sep 16",
    ],

    sales: [32, 46, 39, 57, 53, 67, 79, 94],
    cost: [24, 34, 31, 43, 41, 52, 62, 72],
    profit: [11, 18, 14, 24, 21, 31, 39, 51],
  },

  year: {
    sales: "$94,820.00",
    cost: "$68,420.00",
    profit: "$26,400.00",

    salesGrowth: "29%",
    costGrowth: "23%",
    profitGrowth: "34%",

    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],

    sales: [25, 31, 38, 42, 49, 57, 64, 76, 88],
    cost: [20, 25, 30, 34, 39, 45, 51, 59, 68],
    profit: [7, 10, 14, 18, 22, 27, 32, 41, 50],
  },
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

/* =========================================================
   COMPONENT
   ========================================================= */

function DashboardContent({ searchQuery }) {
  const navigate = useNavigate();

  /* =======================================================
     FILTER STATE
     ======================================================= */

  // Main dashboard filter
  const [dateFilter, setDateFilter] = useState("30");

  // Sales & Profit Overview filter
  const [salesDateFilter, setSalesDateFilter] = useState("30");

  /* =======================================================
     CURRENT DATA
     ======================================================= */

  const currentDashboardData = dashboardPeriodData[dateFilter];

  const currentSalesData = salesPeriodData[salesDateFilter];

  const selectedDashboardFilter = dateFilterOptions.find(
    (item) => item.value === dateFilter,
  );

  const selectedSalesFilter = dateFilterOptions.find(
    (item) => item.value === salesDateFilter,
  );

  /* =======================================================
     SEARCH
     ======================================================= */

  const visibleMetrics = useMemo(() => {
    const query = searchQuery?.trim().toLowerCase();

    if (!query) {
      return dashboardMetricCards;
    }

    return dashboardMetricCards.filter(
      (item) =>
        item.label?.toLowerCase().includes(query) ||
        item.value?.toString().toLowerCase().includes(query),
    );
  }, [searchQuery]);

  /* =======================================================
     NAVIGATION
     ======================================================= */

  const openPage = (page) => {
    if (!page) return;

    navigate(page === "dashboard" ? "/" : `/${page}`);
  };

  /* =======================================================
     KPI DATA
     ======================================================= */

  const kpiValues = [
    currentDashboardData.profit,
    currentDashboardData.revenue,
    currentDashboardData.orders,
    currentDashboardData.listings,
    currentDashboardData.views,
  ];

  const kpiLabels = [
    "Total Profit",
    "Total Revenue",
    "Total Orders",
    "Active Listings",
    "Views",
  ];

  const kpiPercentages = [
    currentDashboardData.profitGrowth,
    currentDashboardData.revenueGrowth,
    currentDashboardData.ordersGrowth,
    currentDashboardData.listingsGrowth,
    currentDashboardData.viewsGrowth,
  ];

  /* =======================================================
     CHART POINTS
     ======================================================= */

  const salesPoints = useMemo(
    () => createPolylinePoints(currentSalesData.sales),
    [currentSalesData],
  );

  const costPoints = useMemo(
    () => createPolylinePoints(currentSalesData.cost),
    [currentSalesData],
  );

  const profitPoints = useMemo(
    () => createPolylinePoints(currentSalesData.profit),
    [currentSalesData],
  );

  /* =======================================================
     ORDERS
     ======================================================= */

  const orders = [
    {
      id: "#12-11835",
      product: "Wireless Headphones",
      buyer: "j.smith",
      amount: "$32.99",
      status: "Processing",
      date: "Sep 14",
      image:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80",
    },
    {
      id: "#12-11834",
      product: "Smart Watch",
      buyer: "a.johnson",
      amount: "$45.50",
      status: "Shipped",
      date: "Sep 14",
      image:
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80",
    },
    {
      id: "#12-11833",
      product: "Phone Case",
      buyer: "m.brown",
      amount: "$18.20",
      status: "Delivered",
      date: "Sep 13",
      image:
        "https://images.unsplash.com/photo-1603313011100-3e07f16a0f2e?w=100&q=80",
    },
    {
      id: "#12-11832",
      product: "Bluetooth Speaker",
      buyer: "s.davis",
      amount: "$36.99",
      status: "Processing",
      date: "Sep 13",
      image:
        "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=100&q=80",
    },
    {
      id: "#12-11831",
      product: "Laptop Stand",
      buyer: "r.wilson",
      amount: "$28.20",
      status: "Shipped",
      date: "Sep 12",
      image:
        "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=100&q=80",
    },
  ];

  /* =======================================================
     TOP PRODUCTS
     ======================================================= */

  const topProducts = [
    {
      name: "Wireless Headphones",
      sold: "1,234 sold",
      price: "$32.99",
      width: "88%",
      image: orders[0].image,
    },
    {
      name: "Smart Watch",
      sold: "980 sold",
      price: "$45.50",
      width: "68%",
      image: orders[1].image,
    },
    {
      name: "Bluetooth Speaker",
      sold: "875 sold",
      price: "$36.99",
      width: "60%",
      image: orders[3].image,
    },
    {
      name: "Laptop Stand",
      sold: "642 sold",
      price: "$28.20",
      width: "48%",
      image: orders[4].image,
    },
    {
      name: "Phone Case",
      sold: "590 sold",
      price: "$18.20",
      width: "40%",
      image: orders[2].image,
    },
  ];

  /* =======================================================
     ACTIVITIES
     ======================================================= */

  const activities = [
    {
      icon: LuShoppingCart,
      title: "New order received",
      text: "#12-11835",
      time: "5 minutes ago",
    },
    {
      icon: LuTag,
      title: "Listing updated",
      text: "Wireless Headphones",
      time: "12 minutes ago",
    },
    {
      icon: LuTag,
      title: "Price changed",
      text: "Smart Watch",
      time: "25 minutes ago",
    },
    {
      icon: LuPackage,
      title: "Order shipped",
      text: "#12-11834",
      time: "1 hour ago",
    },
    {
      icon: LuMail,
      title: "New message",
      text: "From eBay buyer",
      time: "2 hours ago",
    },
  ];

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
            Good to see you again, Muzammil! <span>👋</span>
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
                  {kpiPercentages[index]}
                </span>
              </div>

              <div className="ebay-kpi-card__label">
                {kpiLabels[index] || item.label}
              </div>

              <div className="ebay-kpi-card__value">
                {kpiValues[index] || item.value}
              </div>

              <span className="ebay-kpi-card__period">
                ↑ {kpiPercentages[index]} {selectedDashboardFilter?.comparison}
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

          <button type="button" onClick={() => openPage("premium")}>
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

              <strong>{currentSalesData.sales}</strong>

              <small>↑ {currentSalesData.salesGrowth}</small>
            </div>

            <div>
              <span>Total Cost</span>

              <strong>{currentSalesData.cost}</strong>

              <small>↑ {currentSalesData.costGrowth}</small>
            </div>

            <div>
              <span>Total Profit</span>

              <strong>{currentSalesData.profit}</strong>

              <small>↑ {currentSalesData.profitGrowth}</small>
            </div>
          </div>

          {/* CHART */}

          <div className="ebay-chart">
            <div className="ebay-chart__y">
              <span>$2.5K</span>
              <span>$2K</span>
              <span>$1.5K</span>
              <span>$1K</span>
              <span>$500</span>
              <span>0</span>
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
                {currentSalesData.labels.map((label, index) => (
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

            <button type="button" className="ebay-view-all">
              View All
            </button>
          </div>

          <div className="ebay-status-list">
            {[
              ["Account Status", "Healthy", LuGavel],
              ["Selling Limits", "Good", LuShoppingCart],
              ["Policy Compliance", "100%", LuMail],
              ["Feedback Score", "99.8%", LuHeart],
              ["Positive Feedback", "1,842 (99.8%)", LuTag],
              ["Account Type", "Business", LuUser],
              ["Member Since", "Jan 12, 2023", LuCalendarDays],
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

            <button type="button" className="ebay-view-all">
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

            {orders.map((order) => (
              <div className="ebay-order-row" key={order.id}>
                <span className="ebay-order-id">{order.id}</span>

                <div className="ebay-order-product">
                  <img src={order.image} alt={order.product} />

                  <span>{order.product}</span>
                </div>

                <span>{order.buyer}</span>

                <strong>{order.amount}</strong>

                <span
                  className={`ebay-order-status ebay-order-status--${order.status.toLowerCase()}`}
                >
                  {order.status}
                </span>

                <span>{order.date}</span>

                <button type="button" className="ebay-more-button">
                  •••
                </button>
              </div>
            ))}
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

            <button type="button" className="ebay-view-all">
              View All
            </button>
          </div>

          <div className="ebay-products-list">
            {topProducts.map((product, index) => (
              <div className="ebay-product-row" key={product.name}>
                <span className="ebay-product-rank">{index + 1}</span>

                <img src={product.image} alt={product.name} />

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
            ))}
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

            <button type="button" className="ebay-view-all">
              View All
            </button>
          </div>

          <div className="ebay-activity-list">
            {activities.map((activity) => {
              const Icon = activity.icon;

              return (
                <div className="ebay-activity-row" key={activity.title}>
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
            })}
          </div>
        </article>
      </section>
    </section>
  );
}

export default DashboardContent;
