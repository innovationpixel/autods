import fs from 'node:fs';

const path = 'src/components/autods/pages/DashboardContent.jsx';
let source = fs.readFileSync(path, 'utf8');

function replaceOrFail(before, after, label) {
  if (!source.includes(before)) {
    throw new Error(`Could not find ${label}`);
  }
  source = source.replace(before, after);
}

replaceOrFail(
`  LuMail,\n  LuRefreshCw,\n  LuShoppingCart,\n  LuTag,\n  LuTrendingUp,`,
`  LuMail,\n  LuMinus,\n  LuRefreshCw,\n  LuShoppingCart,\n  LuTag,\n  LuTrendingDown,\n  LuTrendingUp,`,
'import block',
);

replaceOrFail(
`function formatGrowth(value) {\n  const growth = Number(value ?? 0);\n  return \`${'${growth > 0 ? "+" : ""}'}${'${growth}'}%\`;\n}\n`,
`function formatGrowth(value) {\n  const growth = Number(value ?? 0);\n  return \`${'${growth > 0 ? "+" : ""}'}${'${growth}'}%\`;\n}\n\nfunction growthClass(value) {\n  const growth = Number(value ?? 0);\n  if (growth > 0) return "is-positive";\n  if (growth < 0) return "is-negative";\n  return "is-neutral";\n}\n`,
'growth formatter',
);

replaceOrFail(
`          <span className="ebay-marketplace-chip">eBay</span>`,
`          <span className="ebay-marketplace-chip" aria-label="eBay marketplace">\n            <span className="ebay-marketplace-chip__logo" aria-hidden="true">\n              <b>e</b><b>B</b><b>a</b><b>y</b>\n            </span>\n            <span>Marketplace</span>\n          </span>`,
'marketplace chip',
);

replaceOrFail(
`          : visibleMetrics.slice(0, 5).map((item, index) => {\n              const Icon = item.icon || LuWalletCards;\n              const positive = Number(item.growth) >= 0;\n\n              return (\n                <article className="ebay-kpi-card" key={item.id || index}>\n                  <div className="ebay-kpi-card__top">\n                    <span className="ebay-kpi-card__icon">\n                      <Icon />\n                    </span>\n                    <span className={\`ebay-kpi-card__trend ${'${positive ? "is-positive" : "is-negative"}'}\`}>\n                      <LuTrendingUp />\n                      {item.percentage}\n                    </span>\n                  </div>\n                  <div className="ebay-kpi-card__label">{item.label}</div>\n                  <div className="ebay-kpi-card__value">{item.value}</div>\n                  <span className="ebay-kpi-card__period">\n                    {positive ? "Up" : "Down"} {Math.abs(Number(item.growth))}% {selectedDashboardFilter?.comparison ?? ""}\n                  </span>\n                </article>\n              );\n            })}`,
`          : visibleMetrics.slice(0, 5).map((item, index) => {\n              const Icon = item.icon || LuWalletCards;\n              const growth = Number(item.growth) || 0;\n              const trendState = growth > 0 ? "positive" : growth < 0 ? "negative" : "neutral";\n              const TrendIcon = trendState === "positive" ? LuTrendingUp : trendState === "negative" ? LuTrendingDown : LuMinus;\n              const comparisonLabel = (selectedDashboardFilter?.comparison ?? "vs previous period").replace(/^vs\\s+/i, "");\n              const periodCopy = trendState === "neutral"\n                ? \`No change from ${'${comparisonLabel}'}\`\n                : \`${'${Math.abs(growth)}'}% ${'${trendState === "positive" ? "higher" : "lower"}'} than ${'${comparisonLabel}'}\`;\n\n              return (\n                <article className={\`ebay-kpi-card ebay-kpi-card--${'${item.id || index}'}\`} key={item.id || index}>\n                  <div className="ebay-kpi-card__top">\n                    <span className="ebay-kpi-card__icon">\n                      <Icon />\n                    </span>\n                    <span className={\`ebay-kpi-card__trend is-${'${trendState}'}\`}>\n                      <TrendIcon />\n                      {item.percentage}\n                    </span>\n                  </div>\n                  <div className="ebay-kpi-card__label">{item.label}</div>\n                  <div className="ebay-kpi-card__value">{item.value}</div>\n                  <span className="ebay-kpi-card__period">{periodCopy}</span>\n                </article>\n              );\n            })}`,
'KPI rendering block',
);

source = source
  .replace('className={salesKpis.revenue.growth >= 0 ? "is-positive" : "is-negative"}', 'className={growthClass(salesKpis.revenue.growth)}')
  .replace('className={salesKpis.cost.growth >= 0 ? "is-positive" : "is-negative"}', 'className={growthClass(salesKpis.cost.growth)}')
  .replace('className={salesKpis.profit.growth >= 0 ? "is-positive" : "is-negative"}', 'className={growthClass(salesKpis.profit.growth)}');

fs.writeFileSync(path, source);
console.log('Dashboard analytics semantics updated.');
