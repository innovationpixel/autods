import { useEffect, useMemo, useRef, useState } from "react";
import {
  LuBadgeCheck,
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuEllipsisVertical,
  LuExternalLink,
  LuInbox,
  LuMenu,
  LuPencil,
  LuPlay,
  LuSlidersHorizontal,
  LuSparkles,
  LuStore,
  LuX,
} from "react-icons/lu";
import { buildPaginationItems, formatDisplayDate, rewriteProductTitle } from "../helpers";
import { initialProductAlerts, initialProducts } from "../constants";

function ProductsContent({ searchQuery }) {
  const [products, setProducts] = useState(initialProducts);
  const [alerts, setAlerts] = useState(initialProductAlerts);
  const [showFilters, setShowFilters] = useState(false);
  const [showTutorialNote, setShowTutorialNote] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortDirection, setSortDirection] = useState("desc");
  const [filterDate, setFilterDate] = useState("All Dates");
  const [notice, setNotice] = useState("");
  const [openMenuId, setOpenMenuId] = useState("");
  const [tableView, setTableView] = useState("compact");
  const tableScrollRef = useRef(null);

  useEffect(() => {
    const closeMenus = () => setOpenMenuId("");

    document.addEventListener("click", closeMenus);

    return () => document.removeEventListener("click", closeMenus);
  }, []);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const visible = products.filter((item) => {
      if (filterDate !== "All Dates" && item.uploaded !== filterDate) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        item.title,
        item.uploaded,
        item.priceBuy,
        item.priceSell,
        item.itemBuy,
        item.itemSell,
        item.store,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });

    return visible.sort((left, right) =>
      sortDirection === "desc"
        ? right.uploaded.localeCompare(left.uploaded)
        : left.uploaded.localeCompare(right.uploaded),
    );
  }, [filterDate, products, searchQuery, sortDirection]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredProducts.length, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const visibleProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const allVisibleSelected =
    visibleProducts.length > 0 && visibleProducts.every((item) => selectedIds.includes(item.id));
  const paginationItems = buildPaginationItems(currentPage, totalPages);

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((current) => current.filter((id) => !visibleProducts.some((item) => item.id === id)));
      return;
    }

    setSelectedIds((current) => [...new Set([...current, ...visibleProducts.map((item) => item.id)])]);
  };

  const toggleSelectOne = (productId) => {
    setSelectedIds((current) =>
      current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId],
    );
  };

  const dismissAlert = (alertId) => {
    setAlerts((current) => current.filter((item) => item.id !== alertId));
  };

  const applyBulkAction = (action) => {
    if (!selectedIds.length) {
      setNotice("Select at least one product to use bulk actions.");
      return;
    }

    if (action === "relist") {
      setNotice(`${selectedIds.length} products marked for relist.`);
    }

    if (action === "delete") {
      setProducts((current) => current.filter((item) => !selectedIds.includes(item.id)));
      setNotice(`${selectedIds.length} products removed from the table.`);
      setSelectedIds([]);
    }

    if (action === "rewrite") {
      setProducts((current) =>
        current.map((item) =>
          selectedIds.includes(item.id)
            ? {
                ...item,
                title: rewriteProductTitle(item.title),
              }
            : item,
        ),
      );
      setNotice(`${selectedIds.length} product titles rewritten with AI.`);
    }

    if (action === "edit") {
      setNotice(`${selectedIds.length} products opened for bulk edit.`);
    }
  };

  const handleProductAction = (productId, action) => {
    if (action === "request-sourcing") {
      setProducts((current) =>
        current.map((item) =>
          item.id === productId
            ? {
                ...item,
                sourcingRequested: !item.sourcingRequested,
              }
            : item,
        ),
      );
      setNotice(`Sourcing state updated for ${productId.replace("product-", "product #")}.`);
    }

    if (action === "open-editor") {
      setNotice(`Editor opened for ${productId.replace("product-", "product #")}.`);
    }

    if (action === "delete") {
      setProducts((current) => current.filter((item) => item.id !== productId));
      setSelectedIds((current) => current.filter((id) => id !== productId));
      setNotice(`${productId.replace("product-", "Product #")} deleted.`);
    }

    if (action === "menu-edit") {
      setNotice(`${productId.replace("product-", "Product #")} ready for manual editing.`);
    }

    if (action === "menu-store") {
      setNotice(`${productId.replace("product-", "Product #")} marked for store sync.`);
    }

    setOpenMenuId("");
  };

  const scrollTable = (position) => {
    const element = tableScrollRef.current;

    if (!element) {
      return;
    }

    element.scrollTo({
      left: position === "end" ? element.scrollWidth : 0,
      behavior: "smooth",
    });
  };

  return (
    <section className="products-page-content">
      <div className="products-heading">
        <h2 className="products-heading__title">
          Products ({products.length}) <span>and 1 more untracked products</span>
        </h2>
      </div>

      {alerts.length ? (
        <div className="products-alerts card-wrapper">
          {alerts.map((alert) => (
            <div className="products-alert" key={alert.id}>
              <div className="products-alert__copy">
                <span className={`products-alert__dot products-alert__dot--${alert.tone}`} />
                <span>{alert.message}</span>
                <button type="button" className="products-alert__link">
                  View details
                </button>
              </div>

              <button
                type="button"
                className="products-alert__dismiss"
                aria-label="Dismiss product alert"
                onClick={() => dismissAlert(alert.id)}
              >
                <LuX />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="products-toolbar">
        <button type="button" className="orders-filter-toggle" onClick={() => setShowFilters((current) => !current)}>
          <LuSlidersHorizontal />
          <span>Add Filter</span>
        </button>

        <div className="products-toolbar__actions">
          <button
            type="button"
            className="dashboard-secondary-btn dashboard-secondary-btn--orders"
            onClick={() => setShowTutorialNote((current) => !current)}
          >
            <LuPlay />
            <span>Watch Tutorial</span>
          </button>
          <button
            type="button"
            className="marketplace-search-panel__ugc-btn products-toolbar__ugc-btn"
            onClick={() => setNotice("UGC generation queue started for selected products.")}
          >
            <LuSparkles />
            <span>Generate Sales Ready UGC Ads</span>
          </button>
        </div>
      </div>

      {showTutorialNote ? (
        <div className="orders-inline-note">
          <LuPlay />
          <span>Products tutorial is active: use bulk tools, sourcing requests, and scrollable fields to manage listings.</span>
        </div>
      ) : null}

      {notice ? (
        <div className="orders-inline-note orders-inline-note--success">
          <LuBadgeCheck />
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss products note">
            <LuX />
          </button>
        </div>
      ) : null}

      {showFilters ? (
        <div className="products-filter-panel card-wrapper">
          <label className="orders-filter-panel__field">
            <span>Uploaded</span>
            <div className="orders-filter-panel__select">
              <select value={filterDate} onChange={(event) => setFilterDate(event.target.value)}>
                <option value="All Dates">All Dates</option>
                {["2026-04-17", "2026-04-18", "2026-04-19", "2026-04-20"].map((option) => (
                  <option key={option} value={option}>
                    {formatDisplayDate(option)}
                  </option>
                ))}
              </select>
              <LuChevronDown />
            </div>
          </label>

          <label className="orders-filter-panel__field">
            <span>View Mode</span>
            <div className="orders-filter-panel__select">
              <select value={tableView} onChange={(event) => setTableView(event.target.value)}>
                <option value="compact">Compact</option>
                <option value="comfortable">Comfortable</option>
              </select>
              <LuChevronDown />
            </div>
          </label>
        </div>
      ) : null}

      <div className="products-selection-row">
        <div className="products-selection-row__left">
          <label className="orders-select-all">
            <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} />
            <span>{selectedIds.length} Results Selected</span>
          </label>

          <div className="products-bulk-actions">
            <button type="button" onClick={() => applyBulkAction("edit")}>
              Bulk Edit
            </button>
            <button type="button" onClick={() => applyBulkAction("relist")}>
              Bulk Relist
            </button>
            <button type="button" onClick={() => applyBulkAction("delete")}>
              Bulk Delete
            </button>
            <button type="button" onClick={() => applyBulkAction("rewrite")}>
              Bulk AI Rewrite
            </button>
          </div>
        </div>

        <div className="products-selection-row__right">
          <button
            type="button"
            className={`products-history-btn ${historyVisible ? "products-history-btn--active" : ""}`}
            onClick={() => setHistoryVisible((current) => !current)}
          >
            View History
          </button>
          <button type="button" className="orders-icon-btn" onClick={() => scrollTable("end")} aria-label="Show more columns">
            <LuMenu />
          </button>
          <button type="button" className="orders-icon-btn" onClick={() => scrollTable("start")} aria-label="Return table start">
            <LuExternalLink />
          </button>
        </div>
      </div>

      {historyVisible ? (
        <div className="products-history">
          <span>Recent activity:</span>
          <span>3 sourcing requests sent today, 2 product titles rewritten, 1 product deleted.</span>
        </div>
      ) : null}

      <div className="products-table-shell">
        <div className="products-table-scroll" ref={tableScrollRef}>
          <table className={`products-table ${tableView === "comfortable" ? "products-table--comfortable" : ""}`}>
            <thead>
              <tr className="products-table__group-row">
                <th className="products-table__checkbox-col" rowSpan={2} />
                <th rowSpan={2}>Name</th>
                <th rowSpan={2}>
                  <button
                    type="button"
                    className="orders-sort-btn"
                    onClick={() => setSortDirection((current) => (current === "desc" ? "asc" : "desc"))}
                  >
                    <span>Uploaded</span>
                    <LuChevronDown className={sortDirection === "asc" ? "orders-sort-btn__icon orders-sort-btn__icon--asc" : "orders-sort-btn__icon"} />
                  </button>
                </th>
                <th rowSpan={2}>Sourcing Request</th>
                <th className="products-table__actions-col" rowSpan={2} />
                <th className="products-table__group products-table__group--divider" colSpan={6}>
                  Variations
                </th>
                <th rowSpan={2}>Profit</th>
                <th rowSpan={2}>Item ID</th>
                <th rowSpan={2}>Sold</th>
                <th rowSpan={2}>DWS</th>
                <th rowSpan={2}>Store</th>
                <th rowSpan={2}>Asin</th>
                <th rowSpan={2}>Views</th>
                <th rowSpan={2}>Watchers</th>
                <th rowSpan={2}>Days Left</th>
                <th rowSpan={2}>Tags</th>
              </tr>
              <tr className="products-table__sub-row">
                <th className="products-table__group--divider">Available</th>
                <th>On Hold</th>
                <th>Out Of Stock</th>
                <th>Total</th>
                <th>OOS Days</th>
                <th>Price</th>
              </tr>
            </thead>

            <tbody>
              {visibleProducts.length ? (
                visibleProducts.map((item) => (
                  <tr className="products-table__row" key={item.id}>
                    <td className="products-table__checkbox-col">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleSelectOne(item.id)}
                      />
                    </td>

                    <td>
                      <div className="products-item">
                        <div className="products-item__thumb">
                          <img src={item.image} alt={item.title} />
                        </div>
                        <div className="products-item__copy">
                          <h3>{item.title}</h3>
                        </div>
                      </div>
                    </td>

                    <td className="products-table__date">{formatDisplayDate(item.uploaded)}</td>

                    <td>
                      <button
                        type="button"
                        className={`products-sourcing-btn ${item.sourcingRequested ? "products-sourcing-btn--active" : ""}`}
                        onClick={() => handleProductAction(item.id, "request-sourcing")}
                      >
                        <LuSparkles />
                        <span>{item.sourcingRequested ? "Requested" : "Request Sourcing"}</span>
                      </button>
                    </td>

                    <td className="products-table__actions-col">
                      <div className="products-row-actions" onClick={(event) => event.stopPropagation()}>
                        <button
                          type="button"
                          className="orders-row-actions__icon"
                          onClick={() => handleProductAction(item.id, "open-editor")}
                          aria-label="Open product editor"
                        >
                          <LuExternalLink />
                        </button>
                        <button
                          type="button"
                          className="orders-row-actions__icon"
                          onClick={() => setOpenMenuId((current) => (current === item.id ? "" : item.id))}
                          aria-label="Open product menu"
                        >
                          <LuEllipsisVertical />
                        </button>

                        {openMenuId === item.id ? (
                          <div className="products-actions-menu">
                            <button type="button" onClick={() => handleProductAction(item.id, "menu-edit")}>
                              <LuPencil />
                              <span>Edit Product</span>
                            </button>
                            <button type="button" onClick={() => handleProductAction(item.id, "menu-store")}>
                              <LuStore />
                              <span>Sync To Store</span>
                            </button>
                            <button type="button" onClick={() => handleProductAction(item.id, "delete")}>
                              <LuX />
                              <span>Delete Product</span>
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </td>

                    <td className="products-table__group--divider">
                      <span className="products-count products-count--green">{item.available}</span>
                    </td>
                    <td>
                      <span className="products-count products-count--amber">{item.onHold}</span>
                    </td>
                    <td>
                      <span className="products-count products-count--red">{item.outOfStock}</span>
                    </td>
                    <td>{item.total}</td>
                    <td>{item.oosDays}</td>

                    <td>
                      <div className="products-paired-values">
                        <div>
                          <span className="orders-paired-values__type">BUY</span>
                          <strong>{item.priceBuy}</strong>
                        </div>
                        <div>
                          <span className="orders-paired-values__type">SELL</span>
                          <strong>{item.priceSell}</strong>
                        </div>
                      </div>
                    </td>

                    <td>{item.profit}</td>

                    <td>
                      <div className="products-paired-values">
                        <div>
                          <span className="orders-paired-values__type">BUY</span>
                          <span className="orders-paired-values__platform">ebay</span>
                          <strong>{item.itemBuy}</strong>
                        </div>
                        <div>
                          <span className="orders-paired-values__type">SELL</span>
                          <span className="orders-paired-values__platform">ebay</span>
                          <strong>{item.itemSell}</strong>
                        </div>
                      </div>
                    </td>

                    <td>{item.sold}</td>
                    <td>{item.dws}</td>
                    <td className="products-table__store">{item.store}</td>
                    <td>{item.asin}</td>
                    <td>{item.views}</td>
                    <td>{item.watchers}</td>
                    <td>{item.daysLeft}</td>
                    <td>{item.tags}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="orders-table__empty" colSpan={20}>
                    <LuInbox />
                    <span>No products match the current search.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="orders-table-footer products-table-footer">
          <div className="orders-pagination">
            <button
              type="button"
              className="orders-pagination__arrow"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              <LuChevronLeft />
            </button>

            {paginationItems.map((page, index) =>
              page === "..." ? (
                <span className="products-pagination__ellipsis" key={`ellipsis-${index}`}>
                  ...
                </span>
              ) : (
                <button
                  type="button"
                  className={page === currentPage ? "orders-pagination__page orders-pagination__page--active" : "orders-pagination__page"}
                  key={page}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ),
            )}

            <button
              type="button"
              className="orders-pagination__arrow"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            >
              <LuChevronRight />
            </button>
          </div>

          <div className="orders-table-footer__meta">
            <label>
              <span>Show</span>
              <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={40}>40</option>
              </select>
            </label>
            <span>Products out of {products.length}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProductsContent;
