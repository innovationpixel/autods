import { useEffect, useMemo, useRef, useState } from "react";
import {
  LuBadgeCheck,
  LuBox,
  LuCheck,
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuClipboardList,
  LuClock3,
  LuEllipsisVertical,
  LuExternalLink,
  LuInbox,
  LuMenu,
  LuPencil,
  LuPlay,
  LuSlidersHorizontal,
  LuTruck,
  LuX,
  LuZap,
} from "react-icons/lu";
import CompactDateRange from "../CompactDateRange";
import { formatDisplayDate } from "../helpers";
import { initialOrders, orderStatusOptions } from "../constants";

function OrdersContent({ searchQuery }) {
  const [orders, setOrders] = useState(initialOrders);
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const [showTutorialNote, setShowTutorialNote] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [buyerFilter, setBuyerFilter] = useState("");
  const [fromDate, setFromDate] = useState("2026-04-17");
  const [toDate, setToDate] = useState("2026-04-21");
  const [sortDirection, setSortDirection] = useState("desc");
  const [credits, setCredits] = useState(5);
  const [ordersNotice, setOrdersNotice] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [openStatusId, setOpenStatusId] = useState("");
  const [openActionsId, setOpenActionsId] = useState("");
  const [openDetailsId, setOpenDetailsId] = useState("");
  const tableScrollRef = useRef(null);

  useEffect(() => {
    const handleDocumentClick = () => {
      setOpenStatusId("");
      setOpenActionsId("");
    };

    document.addEventListener("click", handleDocumentClick);

    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const nextOrders = orders.filter((order) => {
      if (showOnlyActive && order.status === "Canceled") {
        return false;
      }

      if (statusFilter !== "All Statuses" && order.status !== statusFilter) {
        return false;
      }

      if (buyerFilter.trim()) {
        if (!order.buyer.toLowerCase().includes(buyerFilter.trim().toLowerCase())) {
          return false;
        }
      }

      if (order.date < fromDate || order.date > toDate) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        order.title,
        order.color,
        order.buyer,
        order.itemBuy,
        order.itemSell,
        order.orderSellId,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });

    return nextOrders.sort((left, right) =>
      sortDirection === "desc" ? right.date.localeCompare(left.date) : left.date.localeCompare(right.date),
    );
  }, [buyerFilter, fromDate, orders, searchQuery, showOnlyActive, sortDirection, statusFilter, toDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredOrders.length, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const visibleOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const allVisibleSelected =
    visibleOrders.length > 0 && visibleOrders.every((order) => selectedIds.includes(order.id));

  const activeFilterChips = [
    showOnlyActive
      ? {
          key: "active",
          label: "Active",
          onRemove: () => setShowOnlyActive(false),
        }
      : null,
    statusFilter !== "All Statuses"
      ? {
          key: "status",
          label: statusFilter,
          onRemove: () => setStatusFilter("All Statuses"),
        }
      : null,
    buyerFilter.trim()
      ? {
          key: "buyer",
          label: buyerFilter.trim(),
          onRemove: () => setBuyerFilter(""),
        }
      : null,
  ].filter(Boolean);

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((current) => current.filter((id) => !visibleOrders.some((order) => order.id === id)));
      return;
    }

    setSelectedIds((current) => [...new Set([...current, ...visibleOrders.map((order) => order.id)])]);
  };

  const toggleSelection = (orderId) => {
    setSelectedIds((current) =>
      current.includes(orderId) ? current.filter((id) => id !== orderId) : [...current, orderId],
    );
  };

  const updateOrderStatus = (orderId, nextStatus) => {
    setOrders((current) =>
      current.map((order) => (order.id === orderId ? { ...order, status: nextStatus } : order)),
    );
    setOpenStatusId("");
    setOrdersNotice(`Order ${orderId.replace("order-", "#")} moved to ${nextStatus}.`);
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

  const statusMeta = {
    Pending: { icon: LuClock3, className: "pending" },
    Ordered: { icon: LuClipboardList, className: "ordered" },
    Shipped: { icon: LuTruck, className: "shipped" },
    Delivered: { icon: LuBadgeCheck, className: "delivered" },
    Canceled: { icon: LuX, className: "canceled" },
  };

  const handleOrderAction = (orderId, action) => {
    if (action === "edit-order") {
      setOrdersNotice(`Order ${orderId.replace("order-", "#")} opened for editing.`);
    }

    if (action === "edit-product") {
      setOrdersNotice(`Product linked to ${orderId.replace("order-", "#")} opened for editing.`);
    }

    if (action === "ticket") {
      setOrdersNotice(`Support ticket draft created for ${orderId.replace("order-", "#")}.`);
    }

    setOpenActionsId("");
  };

  return (
    <section className="orders-page-content">
      {showWelcomeModal ? (
        <div className="orders-modal">
          <div className="orders-modal__backdrop" onClick={() => setShowWelcomeModal(false)} />
          <div className="orders-modal__card">
            <button
              type="button"
              className="orders-modal__close"
              aria-label="Close orders modal"
              onClick={() => setShowWelcomeModal(false)}
            >
              <LuX />
            </button>

            <div className="orders-modal__celebration">
              <span className="orders-modal__check">
                <LuCheck />
              </span>
            </div>

            <h2>Congratulations!</h2>
            <h3>First Order Received</h3>
            <p>You&apos;ve just received your very first order — amazing job!</p>
            <p>Time to grow your business — take a 1-minute tour to learn the basics.</p>

            <button type="button" className="orders-modal__primary" onClick={() => setShowWelcomeModal(false)}>
              Take a Tour
            </button>
            <button type="button" className="orders-modal__secondary" onClick={() => setShowWelcomeModal(false)}>
              No, I know how to do it
            </button>
          </div>
        </div>
      ) : null}

      <div className="orders-toolbar">
        <div className="orders-toolbar__left">
          <button type="button" className="orders-filter-toggle" onClick={() => setShowFilters((current) => !current)}>
            <LuSlidersHorizontal />
            <span>Add Filter</span>
          </button>

          {activeFilterChips.length ? (
            <div className="orders-filter-chips">
              {activeFilterChips.map((chip) => (
                <button type="button" className="orders-filter-chip" key={chip.key} onClick={chip.onRemove}>
                  <span>x</span>
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="orders-toolbar__actions">
          <button type="button" className="orders-tour-btn" onClick={() => setShowWelcomeModal(true)}>
            <LuPlay />
            <span>Take Orders Demo Tour</span>
          </button>
          <button
            type="button"
            className="dashboard-secondary-btn dashboard-secondary-btn--orders"
            onClick={() => setShowTutorialNote((current) => !current)}
          >
            <LuPlay />
            <span>Watch Tutorial</span>
          </button>
        </div>
      </div>

      {showTutorialNote ? (
        <div className="orders-inline-note">
          <LuPlay />
          <span>Orders tutorial is active: use filters, status dropdowns, and row actions to manage order flow.</span>
        </div>
      ) : null}

      {ordersNotice ? (
        <div className="orders-inline-note orders-inline-note--success">
          <LuBadgeCheck />
          <span>{ordersNotice}</span>
          <button type="button" onClick={() => setOrdersNotice("")} aria-label="Dismiss orders note">
            <LuX />
          </button>
        </div>
      ) : null}

      {showFilters ? (
        <div className="orders-filter-panel card-wrapper">
          <label className="orders-filter-panel__field">
            <span>Status</span>
            <div className="orders-filter-panel__select">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="All Statuses">All Statuses</option>
                {orderStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <LuChevronDown />
            </div>
          </label>

          <label className="orders-filter-panel__field">
            <span>Buyer Username</span>
            <input
              type="text"
              value={buyerFilter}
              onChange={(event) => setBuyerFilter(event.target.value)}
              placeholder="Search buyer"
            />
          </label>

          <CompactDateRange
            from={fromDate}
            to={toDate}
            onFromChange={setFromDate}
            onToChange={setToDate}
          />

          <label className="orders-active-toggle">
            <input
              type="checkbox"
              checked={showOnlyActive}
              onChange={(event) => setShowOnlyActive(event.target.checked)}
            />
            <span>Show active orders only</span>
          </label>
        </div>
      ) : null}

      <div className="orders-summary-row">
        <label className="orders-select-all">
          <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} />
          <span>{selectedIds.length} Results Selected</span>
        </label>

        <div className="orders-summary-row__actions">
          <div className="orders-credits">
            <LuZap />
            <span>Auto Order Credits: {credits}</span>
            <span className="orders-credits__help">?</span>
          </div>

          <button
            type="button"
            className="orders-buy-btn"
            onClick={() => {
              setCredits((current) => current + 5);
              setOrdersNotice("5 auto order credits added to your balance.");
            }}
          >
            Buy Credits
          </button>

          <button type="button" className="orders-icon-btn" onClick={() => scrollTable("end")} aria-label="Show more columns">
            <LuMenu />
          </button>
          <button type="button" className="orders-icon-btn" onClick={() => scrollTable("start")} aria-label="Return to start">
            <LuExternalLink />
          </button>
        </div>
      </div>

      <div className="orders-table-shell">
        <div className="orders-table-scroll" ref={tableScrollRef}>
          <table className="orders-table">
            <thead>
              <tr>
                <th className="orders-table__checkbox-col" />
                <th>Name</th>
                <th>
                  <button type="button" className="orders-sort-btn" onClick={() => setSortDirection((current) => (current === "desc" ? "asc" : "desc"))}>
                    <span>Date</span>
                    <LuChevronDown className={sortDirection === "asc" ? "orders-sort-btn__icon orders-sort-btn__icon--asc" : "orders-sort-btn__icon"} />
                  </button>
                </th>
                <th>Order Status</th>
                <th>Estimated Arrival</th>
                <th className="orders-table__actions-col" />
                <th>Sourcing Request</th>
                <th>Tracking Number</th>
                <th>Item ID</th>
                <th>Buyer Username</th>
                <th>Price</th>
                <th>Profit</th>
                <th>Fee/Tax</th>
                <th>Order ID</th>
                <th>Tags</th>
              </tr>
            </thead>

            <tbody>
              {visibleOrders.length ? (
                visibleOrders.map((order) => {
                  const meta = statusMeta[order.status];
                  const StatusIcon = meta.icon;

                  return (
                    <tr
                      className={openDetailsId === order.id ? "orders-table__row orders-table__row--active" : "orders-table__row"}
                      key={order.id}
                    >
                      <td className="orders-table__checkbox-col">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(order.id)}
                          onChange={() => toggleSelection(order.id)}
                        />
                      </td>

                      <td>
                        <div className="orders-product">
                          <div className="orders-product__thumb">
                            <img src={order.image} alt={order.title} />
                          </div>
                          <div className="orders-product__copy">
                            <h3>{order.title}</h3>
                            <p>{order.color}</p>
                          </div>
                        </div>
                      </td>

                      <td className="orders-table__date">{formatDisplayDate(order.date)}</td>

                      <td className="orders-table__status-cell">
                        <div className="orders-status-wrap" onClick={(event) => event.stopPropagation()}>
                          <button
                            type="button"
                            className={`orders-status-badge orders-status-badge--${meta.className}`}
                            onClick={() => {
                              setOpenActionsId("");
                              setOpenStatusId((current) => (current === order.id ? "" : order.id));
                            }}
                          >
                            <span className="orders-status-badge__left">
                              <StatusIcon />
                              <span>{order.status}</span>
                            </span>
                            <LuChevronDown />
                          </button>

                          {openStatusId === order.id ? (
                            <div className="orders-status-menu">
                              <button
                                type="button"
                                className="orders-status-menu__header"
                                onClick={() => updateOrderStatus(order.id, "Ordered")}
                              >
                                Send To Auto Order
                              </button>

                              {orderStatusOptions.map((option) => {
                                const optionMeta = statusMeta[option];
                                const OptionIcon = optionMeta.icon;

                                return (
                                  <button
                                    type="button"
                                    className="orders-status-menu__item"
                                    key={option}
                                    onClick={() => updateOrderStatus(order.id, option)}
                                  >
                                    <OptionIcon />
                                    <span>{option}</span>
                                  </button>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      </td>

                      <td className="orders-table__details-cell">
                        <div className="orders-details">
                          <span>{order.estimatedArrival}</span>
                          <button
                            type="button"
                            className="orders-details__link"
                            onClick={() => setOpenDetailsId((current) => (current === order.id ? "" : order.id))}
                          >
                            Details
                          </button>

                          {openDetailsId === order.id ? (
                            <div className="orders-details__popover">
                              <span className="orders-details__icon">
                                <LuInbox />
                              </span>
                              <strong>No details yet</strong>
                            </div>
                          ) : null}
                        </div>
                      </td>

                      <td className="orders-table__actions-col">
                        <div className="orders-row-actions" onClick={(event) => event.stopPropagation()}>
                          <button
                            type="button"
                            className="orders-row-actions__icon"
                            onClick={() => setOpenDetailsId((current) => (current === order.id ? "" : order.id))}
                            aria-label="Open details"
                          >
                            <LuClipboardList />
                          </button>
                          <button
                            type="button"
                            className="orders-row-actions__icon"
                            onClick={() => {
                              setOpenStatusId("");
                              setOpenActionsId((current) => (current === order.id ? "" : order.id));
                            }}
                            aria-label="More options"
                          >
                            <LuEllipsisVertical />
                          </button>

                          {openActionsId === order.id ? (
                            <div className="orders-actions-menu">
                              <button type="button" onClick={() => handleOrderAction(order.id, "edit-order")}>
                                <LuClipboardList />
                                <span>Edit Order</span>
                              </button>
                              <button type="button" onClick={() => handleOrderAction(order.id, "edit-product")}>
                                <LuBox />
                                <span>Edit Product</span>
                              </button>
                              <button type="button" onClick={() => handleOrderAction(order.id, "ticket")}>
                                <LuPencil />
                                <span>Create a ticket about the order</span>
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </td>

                      <td>{order.sourcingRequest}</td>
                      <td>{order.trackingNumber}</td>

                      <td>
                        <div className="orders-paired-values">
                          <div>
                            <span className="orders-paired-values__type">BUY</span>
                            <span className="orders-paired-values__platform">ebay</span>
                            <strong>{order.itemBuy}</strong>
                          </div>
                          <div>
                            <span className="orders-paired-values__type">SELL</span>
                            <span className="orders-paired-values__platform">ebay</span>
                            <strong>{order.itemSell}</strong>
                          </div>
                        </div>
                      </td>

                      <td className="orders-table__buyer">{order.buyer}</td>

                      <td>
                        <div className="orders-paired-values">
                          <div>
                            <span className="orders-paired-values__type">BUY</span>
                            <strong>{order.price}</strong>
                          </div>
                          <div>
                            <span className="orders-paired-values__type">SELL</span>
                            <strong>{order.price}</strong>
                          </div>
                        </div>
                      </td>

                      <td className="orders-table__profit">{order.profit}</td>
                      <td>{order.feeTax}</td>

                      <td>
                        <div className="orders-paired-values">
                          <div>
                            <span className="orders-paired-values__type">BUY</span>
                            <span className="orders-paired-values__platform">ebay</span>
                            <strong>{order.orderBuyId}</strong>
                          </div>
                          <div>
                            <span className="orders-paired-values__type">SELL</span>
                            <span className="orders-paired-values__platform">ebay</span>
                            <strong>{order.orderSellId}</strong>
                          </div>
                        </div>
                      </td>

                      <td>{order.tags}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="orders-table__empty" colSpan={15}>
                    <LuInbox />
                    <span>No orders match the current filters.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="orders-table-footer">
          <div className="orders-pagination">
            <button type="button" className="orders-pagination__arrow" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>
              <LuChevronLeft />
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                type="button"
                className={page === currentPage ? "orders-pagination__page orders-pagination__page--active" : "orders-pagination__page"}
                key={page}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

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
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
              </select>
            </label>
            <span>Orders out of {orders.length}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default OrdersContent;
