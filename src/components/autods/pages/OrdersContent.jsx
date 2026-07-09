import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "../../../utils/toast";
import { getOrders, syncOrders, updateOrderStatus as updateOrderStatusApi, getOrdersGoogleSheetStatus, syncOrdersGoogleSheet } from "../../../services/OrderService";
import {
  LuBadgeCheck,
  LuBolt,
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuClipboardCheck,
  LuClipboardList,
  LuClock3,
  LuExternalLink,
  LuFileSpreadsheet,
  LuInbox,
  LuMenu,
  LuPlus,
  LuPrinter,
  LuRefreshCcw,
  LuSlidersHorizontal,
  LuTruck,
  LuX,
} from "react-icons/lu";
import CompactDateRange from "../CompactDateRange";
import PageFilterPanel from "../PageFilterPanel";
import { FilterCheckbox, FilterInput, FilterSelect } from "../FilterField";
import OrderColumnManager from "../OrderColumnManager";
import {
  getVisibleTableMinWidth,
  loadVisibleColumnIds,
  orderTableColumns,
  saveVisibleColumnIds,
} from "../orderColumns";
import { formatDisplayDate } from "../helpers";
import { getApiErrorMessage } from "../../../utils/apiErrors";
import { orderRowBoltActions, orderRowPrintActions, orderStatusOptions } from "../constants";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=120&q=80";

function formatMoney(value, currency = "USD") {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return String(value);
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

function joinAddress(parts) {
  return parts.filter(Boolean).join(", ") || "—";
}

function mapApiOrder(order) {
  const raw = order.raw_data ?? {};
  const lineItems = raw.lineItems ?? [];
  const firstItem = lineItems[0] ?? {};
  const buyer = raw.buyer ?? {};
  const pricing = raw.pricingSummary ?? {};
  const payment = raw.paymentSummary?.payments?.[0] ?? {};
  const fulfillment = raw.fulfillmentStartInstructions?.[0] ?? {};
  const shipTo = fulfillment.shippingStep?.shipTo ?? buyer.buyerRegistrationAddress ?? {};
  const delivery = raw.deliveryCost ?? {};
  const variationAspects = firstItem.lineItemFulfillmentInstructions?.variations
    ?? firstItem.variationAspects
    ?? [];

  const variationText = Array.isArray(variationAspects)
    ? variationAspects
        .map((aspect) => {
          if (typeof aspect === "string") {
            return aspect;
          }
          const name = aspect.name ?? aspect.localizedName ?? "";
          const value = aspect.value ?? aspect.localizedValue ?? "";
          return [name, value].filter(Boolean).join(": ");
        })
        .filter(Boolean)
        .join(", ")
    : "";

  const totalQuantity = lineItems.reduce((sum, item) => sum + Number(item.quantity ?? 1), 0);
  const sellPrice = order.sell_price ?? pricing.total?.value ?? firstItem.lineItemCost?.value ?? 0;
  const buyPrice = order.buy_price;
  const profit = order.profit ?? (buyPrice != null ? Number(sellPrice) - Number(buyPrice) : null);
  const currency = order.currency ?? pricing.total?.currency ?? "USD";

  const paymentStatus = raw.orderPaymentStatus
    ? String(raw.orderPaymentStatus).replace(/_/g, " ")
    : "—";

  const shippingStatus = raw.orderFulfillmentStatus
    ? String(raw.orderFulfillmentStatus).replace(/_/g, " ")
    : "—";

  const refund = raw.refundSummary ?? raw.paymentSummary?.refunds?.[0] ?? {};
  const shippingStep = fulfillment.shippingStep ?? {};

  return {
    id: String(order.id),
    title: order.item_title ?? firstItem.title ?? "Order item",
    image: firstItem.image?.imageUrl ?? PLACEHOLDER_IMAGE,
    color: variationText || "—",
    pickStatus: raw.pickStatus ?? "—",
    itemId: order.item_sell_id ?? firstItem.legacyItemId ?? firstItem.lineItemId ?? "—",
    sku: firstItem.sku ?? "—",
    variationSpecifics: variationText || "—",
    bundleDetails: firstItem.bundleDetails ?? "—",
    listingsTags: firstItem.listingTags ?? "—",
    orderId: order.ebay_order_id ?? raw.orderId ?? "—",
    detailsExtended: [
      paymentStatus !== "—" ? `Payment: ${paymentStatus}` : null,
      shippingStatus !== "—" ? `Shipping: ${shippingStatus}` : null,
      delivery.shippingCost?.value ? `Shipping cost: ${formatMoney(delivery.shippingCost.value, delivery.shippingCost.currency)}` : null,
    ]
      .filter(Boolean)
      .join(" · ") || "—",
    orderDate: typeof order.order_date === "string" ? order.order_date.slice(0, 10) : order.order_date,
    status: order.status,
    paidDate: payment.paymentDate ? String(payment.paymentDate).slice(0, 10) : "—",
    total: formatMoney(sellPrice, currency),
    totalQuantity: totalQuantity || 1,
    transactionId: firstItem.lineItemId ?? raw.salesRecordReference ?? "—",
    refundDate: refund.refundDate ? String(refund.refundDate).slice(0, 10) : "—",
    refundTotal: formatMoney(refund.amount?.value ?? raw.refundAmount?.value, refund.amount?.currency ?? currency),
    cancelStatus: raw.cancelStatus?.cancelState ?? "—",
    returnStatus: raw.returnStatus ?? raw.cancelStatus?.cancelState ?? "—",
    inquiryStatus: raw.inquiryStatus ?? "—",
    tags: order.tags ?? "—",
    profit: profit != null ? formatMoney(profit, currency) : "—",
    buyerName: shipTo.fullName ?? buyer.buyerRegistrationAddress?.fullName ?? order.buyer_name ?? "—",
    username: buyer.username ?? order.buyer_name ?? "—",
    buyerNotes: raw.buyerCheckoutNotes ?? "—",
    email: order.buyer_email ?? buyer.buyerRegistrationAddress?.email ?? "—",
    buyerAdditionalInfo: buyer.taxAddress?.postalCode ?? buyer.primaryPhone?.phoneNumber ?? "—",
    shippingStatus,
    shippingService: shippingStep.shippingServiceCode ?? fulfillment.shippingStep?.shippingCarrierCode ?? "—",
    shippingPrice: formatMoney(delivery.shippingCost?.value ?? delivery.amount?.value, delivery.shippingCost?.currency ?? currency),
    trackingNumber: order.tracking_number ?? shippingStep.shipmentTrackingNumber ?? "—",
    carrier: shippingStep.shippingCarrierCode ?? "—",
    shippingAddress: joinAddress([
      shipTo.contactAddress?.addressLine1 ?? shipTo.addressLine1,
      shipTo.contactAddress?.city ?? shipTo.city,
      shipTo.contactAddress?.stateOrProvince ?? shipTo.stateOrProvince,
      shipTo.contactAddress?.postalCode ?? shipTo.postalCode,
      shipTo.contactAddress?.countryCode ?? shipTo.countryCode,
    ]),
    shipBy: raw.lineItems?.[0]?.lineItemFulfillmentInstructions?.shipByDate?.slice(0, 10) ?? "—",
    shippingDate: raw.fulfillmentHrefs?.length ? String(raw.lastModifiedDate ?? "").slice(0, 10) || "Shipped" : "—",
    estDeliveryDate: order.estimated_arrival ?? raw.maxEstimatedDeliveryDate?.slice(0, 10) ?? "—",
    notes: order.internal_notes ?? "—",
    ebaySellerNotes: order.ebay_seller_notes ?? "—",
    invoice: "Print",
    packingSlip: "Print",
    feedback: order.feedback_status ?? "—",
    record: raw.salesRecordReference ?? String(order.id ?? "—"),
    taxRef: raw.taxReference ?? "—",
    channel: order.store_name ? `${order.store_name} · eBay` : "eBay",
    teammate: order.teammate ?? "—",
    itemBuy: order.item_buy_id ?? "—",
    itemSell: order.item_sell_id ?? "—",
    buyer: buyer.username ?? order.buyer_name ?? "—",
    date: typeof order.order_date === "string" ? order.order_date.slice(0, 10) : order.order_date,
  };
}

function OrdersContent({ searchQuery }) {
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [sheetSyncing, setSheetSyncing] = useState(false);
  const [sheetStatus, setSheetStatus] = useState({
    configured: false,
    spreadsheet_url: "",
    last_synced_at: null,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [buyerFilter, setBuyerFilter] = useState("");
  const [fromDate, setFromDate] = useState("2026-04-17");
  const [toDate, setToDate] = useState("2026-04-21");
  const [sortDirection, setSortDirection] = useState("desc");
  const [ordersNotice, setOrdersNotice] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [openStatusId, setOpenStatusId] = useState("");
  const [openRowPrintId, setOpenRowPrintId] = useState("");
  const [openRowBoltId, setOpenRowBoltId] = useState("");
  const [openDetailsId, setOpenDetailsId] = useState("");
  const [openBulkMenu, setOpenBulkMenu] = useState(false);
  const [openPrintMenu, setOpenPrintMenu] = useState(false);
  const [visibleColumnIds, setVisibleColumnIds] = useState(loadVisibleColumnIds);
  const tableScrollRef = useRef(null);

  const visibleColumns = useMemo(
    () => orderTableColumns.filter((column) => visibleColumnIds.includes(column.id)),
    [visibleColumnIds],
  );

  const tableMinWidth = useMemo(() => getVisibleTableMinWidth(visibleColumnIds), [visibleColumnIds]);

  const handleVisibleColumnsChange = (nextIds) => {
    setVisibleColumnIds(nextIds);
    saveVisibleColumnIds(nextIds);
  };

  const loadSheetStatus = async () => {
    try {
      const res = await getOrdersGoogleSheetStatus();
      setSheetStatus({
        configured: Boolean(res.data?.configured),
        spreadsheet_url: res.data?.spreadsheet_url ?? "",
        last_synced_at: res.data?.last_synced_at ?? null,
      });
    } catch {
      setSheetStatus({ configured: false, spreadsheet_url: "", last_synced_at: null });
    }
  };

  useEffect(() => {
    loadSheetStatus();
  }, []);

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await getOrders({
        q: searchQuery,
        status: statusFilter,
        buyer: buyerFilter,
        from_date: fromDate,
        to_date: toDate,
        hide_canceled: showOnlyActive ? 1 : 0,
        limit: 500,
      });
      const rows = (res.data?.data ?? []).map(mapApiOrder);
      setOrders(rows);
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to load orders.");
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [searchQuery, statusFilter, buyerFilter, fromDate, toDate, showOnlyActive]);

  const handleSyncOrders = async () => {
    setSyncing(true);
    try {
      const res = await syncOrders();
      toast.success(res.data?.message ?? "Orders synced.");
      if (res.data?.sheet?.spreadsheet_url) {
        setSheetStatus((current) => ({
          ...current,
          configured: true,
          spreadsheet_url: res.data.sheet.spreadsheet_url,
          last_synced_at: res.data.sheet.last_synced_at ?? current.last_synced_at,
        }));
      }
      await loadOrders();
      await loadSheetStatus();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Order sync failed."));
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenSheet = () => {
    if (!sheetStatus.spreadsheet_url) {
      toast.warn("Your Google Sheet is not ready yet. Click Sync to Sheet first.");
      return;
    }

    window.open(sheetStatus.spreadsheet_url, "_blank", "noopener,noreferrer");
  };

  const handleSyncToSheet = async () => {
    setSheetSyncing(true);
    try {
      const res = await syncOrdersGoogleSheet();
      toast.success(res.data?.message ?? "Orders synced to Google Sheets.");
      setSheetStatus((current) => ({
        ...current,
        configured: true,
        spreadsheet_url: res.data?.sheet?.spreadsheet_url ?? current.spreadsheet_url,
        last_synced_at: res.data?.sheet?.last_synced_at ?? current.last_synced_at,
      }));
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Google Sheets sync failed."));
    } finally {
      setSheetSyncing(false);
    }
  };

  useEffect(() => {
    const handleDocumentClick = () => {
      setOpenStatusId("");
      setOpenRowPrintId("");
      setOpenRowBoltId("");
      setOpenBulkMenu(false);
      setOpenPrintMenu(false);
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
        order.orderId,
        order.sku,
        order.transactionId,
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
  const tableColumnCount = visibleColumns.length + 2;

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

  const clearOrderFilters = () => {
    setShowOnlyActive(true);
    setStatusFilter("All Statuses");
    setBuyerFilter("");
    setFromDate("2026-04-17");
    setToDate("2026-04-21");
  };

  const hasOrderFilters =
    !showOnlyActive ||
    statusFilter !== "All Statuses" ||
    buyerFilter.trim() ||
    fromDate !== "2026-04-17" ||
    toDate !== "2026-04-21";

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

  const updateOrderStatus = async (orderId, nextStatus) => {
    try {
      await updateOrderStatusApi(Number(orderId), nextStatus);
      setOrders((current) =>
        current.map((order) => (order.id === orderId ? { ...order, status: nextStatus } : order)),
      );
      setOpenStatusId("");
      setOrdersNotice(`Order #${orderId} moved to ${nextStatus}.`);
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to update status.");
    }
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

  const closeRowActionMenus = () => {
    setOpenRowPrintId("");
    setOpenRowBoltId("");
  };

  const handleOrderAction = (orderId, action, label) => {
    const orderLabel = orderId.startsWith("order-") ? orderId.replace("order-", "#") : `#${orderId}`;

    if (action === "update-pick-status") {
      toast.info("Update Pick Status — coming soon.");
    } else {
      toast.info(`${label} for order ${orderLabel} — coming soon.`);
    }

    closeRowActionMenus();
  };

  const toggleRowPrintMenu = (orderId) => {
    setOpenStatusId("");
    setOpenRowBoltId("");
    setOpenRowPrintId((current) => (current === orderId ? "" : orderId));
  };

  const toggleRowBoltMenu = (orderId) => {
    setOpenStatusId("");
    setOpenRowPrintId("");
    setOpenRowBoltId((current) => (current === orderId ? "" : orderId));
  };

  const renderRowActionMenu = (orderId, items, menuClassName = "") => (
    <div className={`orders-actions-menu orders-actions-menu--row ${menuClassName}`.trim()} role="menu">
      {items.map((item, index) => (
        <button
          type="button"
          key={`${orderId}-${item.id}-${index}`}
          className={item.disabled ? "orders-actions-menu__item orders-actions-menu__item--disabled" : "orders-actions-menu__item"}
          disabled={item.disabled}
          onClick={() => handleOrderAction(orderId, item.id, item.label)}
        >
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );

  const renderColumnHeader = (column) => {
    if (column.sortable) {
      return (
        <button
          type="button"
          className="orders-sort-btn"
          onClick={() => setSortDirection((current) => (current === "desc" ? "asc" : "desc"))}
        >
          <span>{column.label}</span>
          <LuChevronDown className={sortDirection === "asc" ? "orders-sort-btn__icon orders-sort-btn__icon--asc" : "orders-sort-btn__icon"} />
        </button>
      );
    }

    return column.label;
  };

  const renderOrderCell = (order, columnId, meta, StatusIcon) => {
    switch (columnId) {
      case "name":
        return (
          <div className="orders-product">
            <div className="orders-product__thumb">
              <img src={order.image} alt={order.title} />
            </div>
            <div className="orders-product__copy">
              <h3>{order.title}</h3>
              <p>{order.color}</p>
            </div>
          </div>
        );
      case "status":
        return (
          <div className="orders-status-wrap" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className={`orders-status-badge orders-status-badge--${meta.className}`}
              onClick={() => {
                closeRowActionMenus();
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
        );
      case "detailsExtended":
        return (
          <div className="orders-details">
            <span>{order.detailsExtended}</span>
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
                <strong>{order.detailsExtended}</strong>
              </div>
            ) : null}
          </div>
        );
      case "orderDate":
      case "paidDate":
      case "refundDate":
      case "shipBy":
      case "shippingDate":
      case "estDeliveryDate":
        return order[columnId] && order[columnId] !== "—" ? formatDisplayDate(order[columnId]) : "—";
      case "username":
        return <span className="orders-table__buyer">{order.username}</span>;
      case "itemId":
        return (
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
        );
      case "orderId":
        return <strong>{order.orderId}</strong>;
      case "profit":
        return <span className="orders-table__profit">{order.profit}</span>;
      case "invoice":
      case "packingSlip":
        return (
          <button type="button" className="orders-details__link" onClick={() => toast.info(`${columnId} printing is coming soon.`)}>
            Print
          </button>
        );
      default:
        return order[columnId] ?? "—";
    }
  };

  const hasSelection = selectedIds.length > 0;

  return (
    <section className="orders-page-content">
      <div className="orders-page-header">
        <h2 className="orders-page-header__title">All Orders</h2>
      </div>

      <div className="orders-toolbar orders-toolbar--primary">
        <div className="orders-toolbar__left">
          <button
            type="button"
            className={`orders-filter-toggle ${showFilters ? "orders-filter-toggle--active" : ""}`}
            onClick={() => setShowFilters((current) => !current)}
          >
            <LuSlidersHorizontal />
            <span>Add Filter</span>
          </button>

          <div className="orders-toolbar-dropdown" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="orders-toolbar-action"
              disabled={!hasSelection}
              onClick={() => {
                setOpenPrintMenu(false);
                setOpenBulkMenu((current) => !current);
              }}
            >
              <LuBolt />
              <span>Bulk Actions</span>
              <LuChevronDown />
            </button>
            {openBulkMenu && hasSelection ? (
              <div className="orders-toolbar-dropdown__menu">
                <button type="button" onClick={() => toast.info("Mark as shipped — coming soon.")}>Mark as shipped</button>
                <button type="button" onClick={() => toast.info("Add tracking — coming soon.")}>Add tracking</button>
              </div>
            ) : null}
          </div>

          <div className="orders-toolbar-dropdown" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="orders-toolbar-action"
              disabled={!hasSelection}
              onClick={() => {
                setOpenBulkMenu(false);
                setOpenPrintMenu((current) => !current);
              }}
            >
              <LuPrinter />
              <span>Print</span>
              <LuChevronDown />
            </button>
            {openPrintMenu && hasSelection ? (
              <div className="orders-toolbar-dropdown__menu">
                <button type="button" onClick={() => toast.info("Invoice print — coming soon.")}>Invoice</button>
                <button type="button" onClick={() => toast.info("Packing slip print — coming soon.")}>Packing Slip</button>
                <button type="button" onClick={() => toast.info("Pick list print — coming soon.")}>Pick List</button>
              </div>
            ) : null}
          </div>

          <button type="button" className="orders-toolbar-action orders-toolbar-action--primary" disabled>
            <LuPlus />
            <span>Create Manual Order</span>
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

        <div className="orders-toolbar__actions orders-toolbar__actions--search">
          <button type="button" className="orders-icon-btn" onClick={loadOrders} aria-label="Refresh orders grid">
            <LuRefreshCcw className={ordersLoading ? "spin-icon" : ""} />
          </button>
          <OrderColumnManager visibleColumnIds={visibleColumnIds} onChange={handleVisibleColumnsChange} />
        </div>
      </div>

      <div className="orders-toolbar orders-toolbar--secondary">
        <div className="orders-toolbar__actions">
          <button
            type="button"
            className="dashboard-secondary-btn dashboard-secondary-btn--orders"
            onClick={handleOpenSheet}
            disabled={!sheetStatus.spreadsheet_url}
          >
            <LuFileSpreadsheet />
            <span>Open Sheet</span>
          </button>
          <button
            type="button"
            className="dashboard-secondary-btn dashboard-secondary-btn--orders"
            onClick={handleSyncToSheet}
            disabled={sheetSyncing || !sheetStatus.configured}
          >
            <LuRefreshCcw />
            <span>{sheetSyncing ? "Syncing sheet…" : "Sync to Sheet"}</span>
          </button>
          <button type="button" className="dashboard-secondary-btn dashboard-secondary-btn--orders" onClick={handleSyncOrders} disabled={syncing}>
            <LuRefreshCcw />
            <span>{syncing ? "Syncing…" : "Sync from eBay"}</span>
          </button>
        </div>
      </div>

      {!sheetStatus.configured ? (
        <div className="orders-inline-note">
          <LuFileSpreadsheet />
          <span>Google Sheets export is not configured on the server yet.</span>
        </div>
      ) : null}

      {sheetStatus.configured && sheetStatus.last_synced_at ? (
        <div className="orders-inline-note">
          <LuFileSpreadsheet />
          <span>Google Sheet last updated: {formatDisplayDate(sheetStatus.last_synced_at.slice(0, 10))}</span>
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
        <PageFilterPanel layout="orders" onClear={hasOrderFilters ? clearOrderFilters : undefined}>
          <FilterSelect label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="All Statuses">All Statuses</option>
            {orderStatusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </FilterSelect>

          <FilterInput
            label="Buyer username"
            value={buyerFilter}
            onChange={(event) => setBuyerFilter(event.target.value)}
            placeholder="Search buyer"
          />

          <CompactDateRange
            from={fromDate}
            to={toDate}
            onFromChange={setFromDate}
            onToChange={setToDate}
          />

          <FilterCheckbox
            label="Show active orders only"
            checked={showOnlyActive}
            onChange={(event) => setShowOnlyActive(event.target.checked)}
          />
        </PageFilterPanel>
      ) : null}

      <div className="orders-summary-row">
        <label className="orders-select-all">
          <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} />
          <span>{selectedIds.length} Results Selected</span>
        </label>

        <div className="orders-summary-row__actions">
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
          <table className="orders-table" style={{ minWidth: tableMinWidth }}>
            <thead>
              <tr>
                <th className="orders-table__checkbox-col" />
                {visibleColumns.map((column) => (
                  <th
                    key={column.id}
                    className="orders-table__col"
                    data-column={column.id}
                    style={{ minWidth: column.minWidth, width: column.minWidth }}
                  >
                    {renderColumnHeader(column)}
                  </th>
                ))}
                <th className="orders-table__actions-col">Actions</th>
              </tr>
            </thead>

            <tbody>
              {ordersLoading ? (
                <tr>
                  <td className="orders-table__empty" colSpan={tableColumnCount}>
                    <LuRefreshCcw className="spin-icon" />
                    <span>Loading orders…</span>
                  </td>
                </tr>
              ) : visibleOrders.length ? (
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

                      {visibleColumns.map((column) => (
                        <td
                          key={column.id}
                          className={[
                            "orders-table__col",
                            column.id === "status" ? "orders-table__status-cell" : "",
                            column.id === "detailsExtended" ? "orders-table__details-cell" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          data-column={column.id}
                          style={{ minWidth: column.minWidth, width: column.minWidth }}
                        >
                          {renderOrderCell(order, column.id, meta, StatusIcon)}
                        </td>
                      ))}

                      <td className="orders-table__actions-col">
                        <div className="orders-row-actions" onClick={(event) => event.stopPropagation()}>
                          <div className="orders-row-actions__item">
                            <button
                              type="button"
                              className="orders-row-actions__btn"
                              aria-label="Print"
                              aria-expanded={openRowPrintId === order.id}
                              onClick={() => toggleRowPrintMenu(order.id)}
                            >
                              <LuPrinter />
                            </button>
                            {openRowPrintId === order.id ? renderRowActionMenu(order.id, orderRowPrintActions) : null}
                          </div>

                          <button
                            type="button"
                            className="orders-row-actions__btn"
                            aria-label="Update Pick Status"
                            onClick={() => handleOrderAction(order.id, "update-pick-status", "Update Pick Status")}
                          >
                            <LuClipboardCheck />
                          </button>

                          <div className="orders-row-actions__item">
                            <button
                              type="button"
                              className="orders-row-actions__btn"
                              aria-label="Order actions"
                              aria-expanded={openRowBoltId === order.id}
                              onClick={() => toggleRowBoltMenu(order.id)}
                            >
                              <LuBolt />
                            </button>
                            {openRowBoltId === order.id
                              ? renderRowActionMenu(order.id, orderRowBoltActions, "orders-actions-menu--wide")
                              : null}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="orders-table__empty" colSpan={tableColumnCount}>
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
