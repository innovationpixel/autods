import fs from 'node:fs';

const dashboardPath = 'src/components/dashboard/MarketplaceDashboard.jsx';
const cssPath = 'src/assets/css/autoprime-finder-polish.css';

let dashboard = fs.readFileSync(dashboardPath, 'utf8');

const reactImport = 'import { useContext, useEffect, useMemo, useRef, useState } from "react";';
if (!dashboard.includes('import { Input } from "antd";')) {
  dashboard = dashboard.replace(reactImport, `${reactImport}\nimport { Input } from "antd";`);
}

if (!dashboard.includes('const { Search } = Input;')) {
  dashboard = dashboard.replace('const ALIEXPRESS_CATEGORY_MAP = {', 'const { Search } = Input;\n\nconst ALIEXPRESS_CATEGORY_MAP = {');
}

const keywordState = '  const [keywordSearch, setKeywordSearch] = useState("");';
if (!dashboard.includes('const [marketplaceSearchInput, setMarketplaceSearchInput]')) {
  dashboard = dashboard.replace(keywordState, `${keywordState}\n  const [marketplaceSearchInput, setMarketplaceSearchInput] = useState("");`);
}

const resetOld = '    setKeywordSearch("");\n    setCuratedType(null);';
if (dashboard.includes(resetOld)) {
  dashboard = dashboard.replace(resetOld, '    setKeywordSearch("");\n    setMarketplaceSearchInput("");\n    setCuratedType(null);');
}

const oldSearch = `                  <div className="marketplace-search-panel__top-row">
                    <div className="marketplace-main-search">
                      <LuSearch />
                      <input
                        type="text"
                        className="form-control-ui input-border-style"
                        placeholder="Search by product title, supplier or product description..."
                        value={keywordSearch}
                        onChange={(event) => setKeywordSearch(event.target.value)}
                      />
                    </div>

                    <button type="button" className="button-base button-primary marketplace-search-panel__submit">
                      Search
                    </button>
                  </div>`;

const newSearch = `                  <div className="marketplace-search-panel__top-row">
                    <Search
                      className="marketplace-ant-search"
                      placeholder="Search by product title, supplier or product description..."
                      value={marketplaceSearchInput}
                      allowClear
                      size="large"
                      enterButton="Search"
                      loading={aliLoading}
                      aria-label="Search marketplace products"
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setMarketplaceSearchInput(nextValue);
                        if (!nextValue.trim() && keywordSearch) {
                          setKeywordSearch("");
                          setAliPage(1);
                        }
                      }}
                      onSearch={(value) => {
                        const nextKeyword = value.trim();
                        setMarketplaceSearchInput(value);
                        setKeywordSearch(nextKeyword);
                        setAliPage(1);
                        setExpandedProductsTitle("");
                      }}
                    />
                  </div>`;

if (!dashboard.includes('className="marketplace-ant-search"')) {
  if (!dashboard.includes(oldSearch)) {
    throw new Error('Expected marketplace search block not found');
  }
  dashboard = dashboard.replace(oldSearch, newSearch);
}

fs.writeFileSync(dashboardPath, dashboard);

let css = fs.readFileSync(cssPath, 'utf8');
const marker = '/* ANT DESIGN MARKETPLACE SEARCH FINAL */';
if (!css.includes(marker)) {
  css += `

${marker}
.marketplace-dashboard-page .marketplace-search-panel__top-row,
.marketplace-dashboard-page .marketplace-search-panel__filters {
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

.marketplace-dashboard-page .marketplace-search-panel__top-row {
  display: block !important;
  padding: 0 !important;
  margin: 0 !important;
}

.marketplace-dashboard-page .marketplace-search-panel__filters {
  padding: 0 !important;
  margin-top: 20px !important;
  border-top: 0 !important;
}

.marketplace-dashboard-page .marketplace-ant-search.ant-input-search {
  display: block;
  width: 100%;
}

.marketplace-dashboard-page .marketplace-ant-search .ant-input-group {
  display: flex !important;
  width: 100%;
}

.marketplace-dashboard-page .marketplace-ant-search .ant-input-affix-wrapper,
.marketplace-dashboard-page .marketplace-ant-search .ant-input {
  min-height: 48px !important;
  height: 48px !important;
  padding-inline: 15px !important;
  border: 1px solid #ddd6e8 !important;
  border-right: 0 !important;
  border-radius: 12px 0 0 12px !important;
  background: #fff !important;
  color: #211b2d !important;
  font-size: 15px !important;
  box-shadow: none !important;
}

.marketplace-dashboard-page .marketplace-ant-search .ant-input-affix-wrapper:hover,
.marketplace-dashboard-page .marketplace-ant-search .ant-input:hover {
  border-color: #bda9e8 !important;
}

.marketplace-dashboard-page .marketplace-ant-search:focus-within .ant-input-affix-wrapper,
.marketplace-dashboard-page .marketplace-ant-search:focus-within .ant-input {
  border-color: #6d28d9 !important;
  box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.10) !important;
}

.marketplace-dashboard-page .marketplace-ant-search .ant-input::placeholder {
  color: #aaa3b5 !important;
}

.marketplace-dashboard-page .marketplace-ant-search .ant-input-group-addon {
  width: auto !important;
  padding: 0 !important;
  border: 0 !important;
  background: transparent !important;
}

.marketplace-dashboard-page .marketplace-ant-search .ant-input-search-button {
  width: 112px !important;
  min-width: 112px !important;
  height: 48px !important;
  border: 1px solid #6d28d9 !important;
  border-radius: 0 12px 12px 0 !important;
  background: #6d28d9 !important;
  color: #fff !important;
  font-size: 14px !important;
  font-weight: 700 !important;
  box-shadow: none !important;
}

.marketplace-dashboard-page .marketplace-ant-search .ant-input-search-button:hover,
.marketplace-dashboard-page .marketplace-ant-search .ant-input-search-button:focus-visible {
  border-color: #5b21b6 !important;
  background: #5b21b6 !important;
  color: #fff !important;
}

.marketplace-dashboard-page .marketplace-ant-search .ant-input-clear-icon {
  color: #958ca4 !important;
}

.marketplace-dashboard-page .marketplace-ant-search .ant-input-clear-icon:hover {
  color: #6d28d9 !important;
}

@media (max-width: 640px) {
  .marketplace-dashboard-page .marketplace-ant-search .ant-input-search-button {
    width: 92px !important;
    min-width: 92px !important;
  }
}
`;
}

fs.writeFileSync(cssPath, css);
