import { useMemo, useState } from "react";
import { FaTiktok } from "react-icons/fa6";
import {
  LuChevronDown,
  LuEyeOff,
  LuInbox,
  LuPencil,
  LuPlay,
  LuSparkles,
} from "react-icons/lu";
import CompactDateRange from "../CompactDateRange";
import DashboardSparkline from "../DashboardSparkline";
import {
  dashboardOverviewRows,
  dashboardStatCards,
  dashboardTopProducts,
  filterOptions,
} from "../constants";

function DashboardContent({ searchQuery }) {
  const [fromDate, setFromDate] = useState("2026-04-16");
  const [toDate, setToDate] = useState("2026-04-23");
  const [currency, setCurrency] = useState("USD");
  const [showTutorialNote, setShowTutorialNote] = useState(false);
  const [promoStarted, setPromoStarted] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [overviewEditing, setOverviewEditing] = useState(false);
  const [overviewValues, setOverviewValues] = useState(() =>
    Object.fromEntries(dashboardOverviewRows.map((row) => [row.label, row.value])),
  );

  const visibleProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return dashboardTopProducts.slice(0, 3);
    }

    return dashboardTopProducts.filter((item) => item.title.toLowerCase().includes(query)).slice(0, 3);
  }, [searchQuery]);

  return (
    <section className="dashboard-page-content">
      <section className="dashboard-block">
        <div className="dashboard-block__head dashboard-block__head--controls">
          <div className="dashboard-toolbar">
            <CompactDateRange
              from={fromDate}
              to={toDate}
              onFromChange={setFromDate}
              onToChange={setToDate}
            />

            <label className="dashboard-inline-select">
              <span className="dashboard-inline-select__label">Currency:</span>
              <span className="dashboard-inline-select__field">
                <select value={currency} onChange={(event) => setCurrency(event.target.value)}>
                  {filterOptions.currency.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <LuChevronDown />
              </span>
            </label>
          </div>

          <button
            type="button"
            className="dashboard-secondary-btn"
            onClick={() => setShowTutorialNote((current) => !current)}
          >
            <LuPlay />
            <span>Watch Tutorial</span>
          </button>
        </div>

        {showTutorialNote ? (
          <div className="dashboard-tutorial-note">
            <LuPlay />
            <span>Tutorial ready: this dashboard mirrors the AutoDS overview layout and keeps its controls interactive.</span>
          </div>
        ) : null}

        <div className="dashboard-summary card-wrapper">
          <div className="dashboard-summary__stats">
            {dashboardStatCards.map((item) => {
              const Icon = item.icon;

              return (
                <article className="dashboard-stat" key={item.label}>
                  <span className={`dashboard-stat__icon dashboard-stat__icon--${item.tone}`}>
                    <Icon />
                  </span>

                  <div className="dashboard-stat__copy">
                    <div className="dashboard-stat__value">{item.value}</div>
                    <div className="dashboard-stat__label">
                      <span>{item.label}</span>
                      <span className="dashboard-stat__help">?</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="dashboard-summary__promo">
            <div className="dashboard-summary__promo-copy">
              <span className="dashboard-summary__promo-icon">
                <LuSparkles />
              </span>
              <div>
                <div className="dashboard-summary__promo-title-row">
                  <strong>Want to boost these numbers?</strong>
                  <span className="dashboard-summary__promo-chip">Limited time offer!</span>
                </div>
                <p>
                  Boost your business on TikTok and achieve real results! Take advantage of our limited-time offer -
                  start growing today!
                </p>
              </div>
            </div>

            <button
              type="button"
              className={`dashboard-promo-btn ${promoStarted ? "dashboard-promo-btn--active" : ""}`}
              onClick={() => setPromoStarted((current) => !current)}
            >
              <FaTiktok />
              <span>{promoStarted ? "Campaign Ready" : "Get Started with TikTok Ads"}</span>
            </button>
          </div>
        </div>
      </section>

      <section className="dashboard-analytics">
        <div className="dashboard-analytics__head">
          <h2 className="dashboard-block__title">Sales Overview</h2>

          <div className="dashboard-legend">
            <span className="dashboard-legend__item">
              <span className="dashboard-legend__dot dashboard-legend__dot--revenue" />
              Revenue
            </span>
            <span className="dashboard-legend__item">
              <span className="dashboard-legend__dot dashboard-legend__dot--cost" />
              Product Cost
            </span>
            <span className="dashboard-legend__item">
              <span className="dashboard-legend__dot dashboard-legend__dot--profit" />
              Profit
            </span>
          </div>
        </div>

        <div className="dashboard-analytics__grid">
          <div className="dashboard-sales-board card-wrapper">
            <div className="dashboard-sales-board__grid">
              {[3000, 2000, 1000, 0].map((amount) => (
                <div className="dashboard-sales-board__line" key={amount}>
                  <span className="dashboard-sales-board__amount">${amount}</span>
                </div>
              ))}
              <span className="dashboard-sales-board__empty">No data</span>
            </div>
          </div>

          <aside className="dashboard-overview card-wrapper">
            <div className="dashboard-overview__head">
              <span>Overview</span>
              <button
                type="button"
                aria-label={overviewEditing ? "Save overview" : "Edit overview"}
                onClick={() => setOverviewEditing((current) => !current)}
              >
                <LuPencil />
              </button>
            </div>

            <div className="dashboard-overview__rows">
              {dashboardOverviewRows.map((row) => (
                <div className="dashboard-overview__row" key={row.label}>
                  <span>{row.label}</span>
                  {overviewEditing ? (
                    <input
                      value={overviewValues[row.label]}
                      onChange={(event) =>
                        setOverviewValues((current) => ({
                          ...current,
                          [row.label]: event.target.value,
                        }))
                      }
                    />
                  ) : (
                    <strong>{overviewValues[row.label]}</strong>
                  )}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="dashboard-bottom-grid">
        <div className="dashboard-card card-wrapper">
          <div className="dashboard-card__head">
            <h2 className="dashboard-block__title">Top 0 Selling Tags</h2>
            <CompactDateRange
              from={fromDate}
              to={toDate}
              onFromChange={setFromDate}
              onToChange={setToDate}
            />
          </div>

          <div className="dashboard-empty-card">
            <span className="dashboard-empty-card__icon">
              <LuEyeOff />
            </span>
            <p>We didn&apos;t find any tags</p>
          </div>
        </div>

        <div className="dashboard-card card-wrapper">
          <div className="dashboard-card__head">
            <h2 className="dashboard-block__title">Top 3 Selling Products</h2>
            <CompactDateRange
              from={fromDate}
              to={toDate}
              onFromChange={setFromDate}
              onToChange={setToDate}
            />
          </div>

          {visibleProducts.length ? (
            <div className="dashboard-top-products">
              {visibleProducts.map((item, index) => (
                <article
                  className={`dashboard-top-products__item ${selectedProductId === item.id ? "dashboard-top-products__item--active" : ""}`}
                  key={item.id}
                  onClick={() => setSelectedProductId(item.id)}
                >
                  <div className="dashboard-top-products__rank">{index + 1}</div>

                  <div className="dashboard-top-products__thumb">
                    <img src={item.image} alt={item.title} />
                  </div>

                  <div className="dashboard-top-products__copy">
                    <h3>{item.title}</h3>
                    <span>{item.sold}</span>
                  </div>

                  <DashboardSparkline values={item.sparkline} />
                </article>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty-card dashboard-empty-card--products">
              <span className="dashboard-empty-card__icon">
                <LuInbox />
              </span>
              <p>No products match the current search.</p>
            </div>
          )}
        </div>
      </section>
    </section>
  );
}

export default DashboardContent;
