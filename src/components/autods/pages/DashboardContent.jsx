import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuChevronDown, LuExternalLink } from "react-icons/lu";
import CompactDateRange from "../CompactDateRange";
import {
  dashboardMetricCards,
  dashboardProfitCards,
  dashboardTools,
  filterOptions,
} from "../constants";

function DashboardContent({ searchQuery }) {
  const navigate = useNavigate();
  const [fromDate, setFromDate] = useState("2026-04-16");
  const [toDate, setToDate] = useState("2026-04-23");
  const [currency, setCurrency] = useState("USD");
  const [toolStates, setToolStates] = useState(() =>
    Object.fromEntries(dashboardTools.map((tool) => [tool.id, tool.enabled])),
  );

  const visibleTools = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return dashboardTools;
    }

    return dashboardTools.filter(
      (tool) =>
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  const toggleTool = (toolId) => {
    setToolStates((current) => ({
      ...current,
      [toolId]: !current[toolId],
    }));
  };

  const openTool = (page) => {
    if (!page) {
      return;
    }
    navigate(page === "dashboard" ? "/" : `/${page}`);
  };

  return (
    <section className="dashboard-page-content dashboard-page-content--3ds">
      <header className="dashboard-hero">
        <div>
          <h1 className="dashboard-hero__title">Dashboard</h1>
          <p className="dashboard-hero__subtitle">
            View your account statistics and activate the tools you need to run your eBay business.
          </p>
        </div>

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
      </header>

      <section className="dashboard-block">
        <div className="dashboard-summary card-wrapper">
          <div className="dashboard-summary__stats dashboard-summary__stats--metrics">
            {dashboardMetricCards.map((item) => {
              const Icon = item.icon;

              return (
                <article className="dashboard-stat" key={item.id}>
                  <span className={`dashboard-stat__icon dashboard-stat__icon--${item.tone}`}>
                    <Icon />
                  </span>

                  <div className="dashboard-stat__copy">
                    <div className="dashboard-stat__value">{item.value}</div>
                    <div className="dashboard-stat__label">
                      <span>{item.label}</span>
                      <span className="dashboard-stat__help" title={item.help}>
                        ?
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="dashboard-block">
        <div className="dashboard-profit card-wrapper">
          <div className="dashboard-profit__head">
            <h2 className="dashboard-block__title">Profit Overview</h2>
            <span className="dashboard-profit__hint">Based on pricing settings and eBay sales</span>
          </div>

          <div className="dashboard-profit__grid">
            {dashboardProfitCards.map((item) => {
              const Icon = item.icon;

              return (
                <article className={`dashboard-profit__item dashboard-profit__item--${item.tone}`} key={item.id}>
                  <span className="dashboard-profit__icon">
                    <Icon />
                  </span>
                  <div className="dashboard-profit__copy">
                    <span className="dashboard-profit__label">{item.label}</span>
                    <strong className="dashboard-profit__value">{item.value}</strong>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="dashboard-block">
        <div className="dashboard-tools card-wrapper">
          <div className="dashboard-tools__head">
            <div>
              <h2 className="dashboard-block__title">Tools &amp; Features</h2>
              <p className="dashboard-tools__subtitle">
                Activate or deactivate tools for your connected eBay account.
              </p>
            </div>
            <span className="dashboard-tools__count">
              {Object.values(toolStates).filter(Boolean).length} active
            </span>
          </div>

          {visibleTools.length ? (
            <div className="dashboard-tools__grid">
              {visibleTools.map((tool) => {
                const Icon = tool.icon;
                const isEnabled = toolStates[tool.id];

                return (
                  <article
                    className={`dashboard-tool-card ${isEnabled ? "dashboard-tool-card--active" : ""}`}
                    key={tool.id}
                  >
                    <div className="dashboard-tool-card__main">
                      <span className="dashboard-tool-card__icon">
                        <Icon />
                      </span>

                      <div className="dashboard-tool-card__copy">
                        <h3 className="dashboard-tool-card__name">{tool.name}</h3>
                        <p className="dashboard-tool-card__desc">{tool.description}</p>
                      </div>
                    </div>

                    <div className="dashboard-tool-card__actions">
                      <button
                        type="button"
                        className={`dashboard-tool-toggle ${isEnabled ? "dashboard-tool-toggle--on" : ""}`}
                        role="switch"
                        aria-checked={isEnabled}
                        aria-label={`${isEnabled ? "Disable" : "Enable"} ${tool.name}`}
                        onClick={() => toggleTool(tool.id)}
                      >
                        <span className="dashboard-tool-toggle__track">
                          <span className="dashboard-tool-toggle__thumb" />
                        </span>
                        <span className="dashboard-tool-toggle__label">
                          {isEnabled ? "Active" : "Inactive"}
                        </span>
                      </button>

                      <button
                        type="button"
                        className="dashboard-tool-card__open"
                        onClick={() => openTool(tool.page)}
                        disabled={!isEnabled}
                      >
                        <LuExternalLink />
                        <span>Open</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="dashboard-empty-card">
              <p>No tools match your search.</p>
            </div>
          )}
        </div>
      </section>
    </section>
  );
}

export default DashboardContent;
