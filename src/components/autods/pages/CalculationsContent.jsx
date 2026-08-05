import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "../../../utils/toast";
import { getOrders, getOrdersGoogleSheetStatus, inviteOrdersGoogleSheetMembers, syncOrdersGoogleSheet, updateOrderCost } from "../../../services/OrderService";
import {
  LuBadgeCheck,
  LuChartLine,
  LuChevronLeft,
  LuChevronRight,
  LuClipboardList,
  LuClock3,
  LuExternalLink,
  LuFileSpreadsheet,
  LuMenu,
  LuPencil,
  LuRefreshCcw,
  LuSlidersHorizontal,
  LuTruck,
  LuUserPlus,
  LuWalletCards,
  LuX,
} from "react-icons/lu";
import {
  buildPaginationItems,
  formatCalculationAmount,
  formatCalculationRoi,
  formatDisplayDate,
  mapApiOrderToCalculationRow,
  summarizeCalculations,
} from "../helpers";
import { getApiErrorMessage } from "../../../utils/apiErrors";
import InviteSheetMembersModal from "../InviteSheetMembersModal";
import QuickEditModal from "../QuickEditModal";
import PageFilterPanel from "../PageFilterPanel";
import { FilterCheckbox, FilterInput, FilterSelect } from "../FilterField";
import { orderStatusOptions } from "../constants";
import {
  DEFAULT_DATE_PRESET,
  ORDER_DATE_PRESETS,
  ORDER_SORT_OPTIONS,
  getDateRangeForPreset,
  getDefaultOrderFilters,
} from "../orderFilters";

const ebayStatusIcons = {
  pending: LuClock3,
  ordered: LuClipboardList,
  shipped: LuTruck,
  delivered: LuBadgeCheck,
  canceled: LuX,
};

const summaryCards = [
  { key: "cost", label: "Total Cost", tone: "peach", icon: LuWalletCards },
  { key: "shipping", label: "Total Shipping", tone: "amber", icon: LuTruck },
  { key: "earn", label: "Total Earn", tone: "mint", icon: LuChartLine },
  { key: "profit", label: "Total Profit", tone: "green", icon: LuBadgeCheck },
  { key: "roi", label: "Total ROI", tone: "amber", icon: LuChartLine },
];

function CalculationsContent({ searchQuery = "" }) {
  const defaultFilters = useMemo(() => getDefaultOrderFilters(), []);
  const tableScrollRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [sheetSyncing, setSheetSyncing] = useState(false);
  const [sheetInviting, setSheetInviting] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [sheetStatus, setSheetStatus] = useState({
    configured: false,
    spreadsheet_url: "",
    last_synced_at: null,
  });
  const [editingCostId, setEditingCostId] = useState("");
  const [costDraft, setCostDraft] = useState("");
  const [savingCostId, setSavingCostId] = useState("");

  const [showFilters, setShowFilters] = useState(false);
  const [showOnlyActive, setShowOnlyActive] = useState(defaultFilters.showOnlyActive);
  const [statusFilter, setStatusFilter] = useState(defaultFilters.statusFilter);
  const [buyerFilter, setBuyerFilter] = useState(defaultFilters.buyerFilter);
  const [orderIdFilter, setOrderIdFilter] = useState(defaultFilters.orderIdFilter);
  const [storeFilter, setStoreFilter] = useState(defaultFilters.storeFilter);
  const [dateRangePreset, setDateRangePreset] = useState(defaultFilters.dateRangePreset);
  const [fromDate, setFromDate] = useState(defaultFilters.fromDate);
  const [toDate, setToDate] = useState(defaultFilters.toDate);
  const [sortBy, setSortBy] = useState(defaultFilters.sortBy);
  const [sortDirection, setSortDirection] = useState(defaultFilters.sortDirection);

  const applyDatePreset = (preset) => {
    setDateRangePreset(preset);
    const range = getDateRangeForPreset(preset);
    if (range) {
      setFromDate(range.from);
      setToDate(range.to);
    }
  };

  const handleFromDateChange = (value) => {
    setFromDate(value);
    setDateRangePreset("custom");
  };

  const handleToDateChange = (value) => {
    setToDate(value);
    setDateRangePreset("custom");
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
      const params = {
        status: statusFilter,
        buyer: buyerFilter,
        hide_canceled: showOnlyActive ? 1 : 0,
        sort: sortDirection,
        limit: 500,
      };

      if (fromDate) {
        params.from_date = fromDate;
      }

      if (toDate) {
        params.to_date = toDate;
      }

      const res = await getOrders(params);
      setOrders(res.data?.data ?? []);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to load orders."));
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, buyerFilter, fromDate, toDate, showOnlyActive, sortDirection]);

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

  const handleInviteMembers = async (emails, role) => {
    setSheetInviting(true);
    try {
      const res = await inviteOrdersGoogleSheetMembers({ emails, role });
      toast.success(res.data?.message ?? "Team members invited.");
      setInviteModalOpen(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not invite team members."));
    } finally {
      setSheetInviting(false);
    }
  };

  const handleStartCostEdit = (row) => {
    setEditingCostId(row.id);
    setCostDraft(row.cost ? String(row.cost) : "");
  };

  const handleCancelCostEdit = () => {
    setEditingCostId("");
    setCostDraft("");
  };

  const handleSaveCost = async (row) => {
    const parsed = Number.parseFloat(costDraft);

    if (costDraft.trim() !== "" && (!Number.isFinite(parsed) || parsed < 0)) {
      toast.warn("Enter a valid cost amount.");
      return;
    }

    const cost = costDraft.trim() === "" ? null : Number(parsed.toFixed(2));

    setSavingCostId(row.id);
    try {
      const res = await updateOrderCost(row.id, { cost });
      const updatedBuyPrice = res.data?.order?.buy_price ?? cost;

      setOrders((current) =>
        current.map((order) =>
          String(order.id) === row.id ? { ...order, buy_price: updatedBuyPrice, profit: null } : order,
        ),
      );
      toast.success("Cost updated.");
      setEditingCostId("");
      setCostDraft("");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update cost."));
    } finally {
      setSavingCostId("");
    }
  };

  const calculationRows = useMemo(
    () => orders.map((order) => mapApiOrderToCalculationRow(order)),
    [orders],
  );

  const storeOptions = useMemo(() => {
    const stores = new Set(
      calculationRows.map((row) => row.storeName).filter((name) => name && name !== "—"),
    );

    return ["All Stores", ...Array.from(stores).sort((left, right) => left.localeCompare(right))];
  }, [calculationRows]);

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const nextRows = calculationRows.filter((row) => {
      if (statusFilter !== "All Statuses" && row.status !== statusFilter) {
        return false;
      }

      if (buyerFilter.trim() && !row.buyer.toLowerCase().includes(buyerFilter.trim().toLowerCase())) {
        return false;
      }

      if (orderIdFilter.trim() && !row.orderId.toLowerCase().includes(orderIdFilter.trim().toLowerCase())) {
        return false;
      }

      if (storeFilter !== "All Stores" && row.storeName !== storeFilter) {
        return false;
      }

      if (fromDate && row.date < fromDate) {
        return false;
      }

      if (toDate && row.date > toDate) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [row.orderId, row.title, row.description, row.ebayStatus, row.date]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });

    return nextRows.sort((left, right) => {
      let comparison = 0;

      if (sortBy === "total") {
        comparison = left.earn - right.earn;
      } else if (sortBy === "profit") {
        comparison = left.profit - right.profit;
      } else {
        comparison = left.date.localeCompare(right.date);
      }

      return sortDirection === "desc" ? -comparison : comparison;
    });
  }, [
    buyerFilter,
    calculationRows,
    fromDate,
    orderIdFilter,
    searchQuery,
    sortBy,
    sortDirection,
    statusFilter,
    storeFilter,
    toDate,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const visibleRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginationItems = buildPaginationItems(currentPage, totalPages);
  const totals = useMemo(() => summarizeCalculations(filteredRows), [filteredRows]);
  const pageTotals = useMemo(() => summarizeCalculations(visibleRows), [visibleRows]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredRows.length, pageSize, searchQuery]);

  const activeFilterChips = [
    dateRangePreset !== DEFAULT_DATE_PRESET && dateRangePreset !== "custom"
      ? {
          key: "date-preset",
          label: ORDER_DATE_PRESETS.find((preset) => preset.id === dateRangePreset)?.label ?? "Date range",
          onRemove: () => applyDatePreset(DEFAULT_DATE_PRESET),
        }
      : null,
    dateRangePreset === "custom" && (fromDate || toDate)
      ? {
          key: "date-custom",
          label: fromDate && toDate ? `${fromDate} – ${toDate}` : fromDate || toDate,
          onRemove: () => applyDatePreset(DEFAULT_DATE_PRESET),
        }
      : null,
    sortBy !== defaultFilters.sortBy || sortDirection !== defaultFilters.sortDirection
      ? {
          key: "sort",
          label: `${ORDER_SORT_OPTIONS.find((option) => option.id === sortBy)?.label ?? "Sort"} · ${sortDirection === "desc" ? "Desc" : "Asc"}`,
          onRemove: () => {
            setSortBy(defaultFilters.sortBy);
            setSortDirection(defaultFilters.sortDirection);
          },
        }
      : null,
    showOnlyActive
      ? null
      : {
          key: "active",
          label: "Including canceled",
          onRemove: () => setShowOnlyActive(true),
        },
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
    orderIdFilter.trim()
      ? {
          key: "order-id",
          label: `Order ${orderIdFilter.trim()}`,
          onRemove: () => setOrderIdFilter(""),
        }
      : null,
    storeFilter !== "All Stores"
      ? {
          key: "store",
          label: storeFilter,
          onRemove: () => setStoreFilter("All Stores"),
        }
      : null,
  ].filter(Boolean);

  const clearCalculationFilters = () => {
    setShowOnlyActive(defaultFilters.showOnlyActive);
    setStatusFilter(defaultFilters.statusFilter);
    setBuyerFilter(defaultFilters.buyerFilter);
    setOrderIdFilter(defaultFilters.orderIdFilter);
    setStoreFilter(defaultFilters.storeFilter);
    setSortBy(defaultFilters.sortBy);
    setSortDirection(defaultFilters.sortDirection);
    applyDatePreset(defaultFilters.dateRangePreset);
  };

  const hasCalculationFilters =
    dateRangePreset !== DEFAULT_DATE_PRESET ||
    sortBy !== defaultFilters.sortBy ||
    sortDirection !== defaultFilters.sortDirection ||
    !showOnlyActive ||
    statusFilter !== defaultFilters.statusFilter ||
    buyerFilter.trim() !== "" ||
    orderIdFilter.trim() !== "" ||
    storeFilter !== defaultFilters.storeFilter;

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

  const formatSummaryValue = (key) => {
    if (key === "roi") {
      return formatCalculationRoi(totals.roi);
    }

    return formatCalculationAmount(totals[key]);
  };

  return (
    <section className="calculations-page-content">
      <section className="calculations-summary card-wrapper">
        <div className="calculations-summary__stats">
          {summaryCards.map((item) => {
            const Icon = item.icon;

            return (
              <article className="calculations-stat" key={item.key}>
                <span className={`calculations-stat__icon calculations-stat__icon--${item.tone}`}>
                  <Icon />
                </span>

                <div className="calculations-stat__copy">
                  <div className="calculations-stat__value">{formatSummaryValue(item.key)}</div>
                  <div className="calculations-stat__label">
                    <span>{item.label}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

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
      </div>

      <div className="orders-quick-filters">
        <div className="orders-quick-filters__group">
          <span className="orders-quick-filters__label">Date</span>
          <div className="orders-quick-filters__pills">
            {ORDER_DATE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`orders-quick-filters__pill ${dateRangePreset === preset.id ? "orders-quick-filters__pill--active" : ""}`}
                onClick={() => applyDatePreset(preset.id)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="orders-quick-filters__group">
          <span className="orders-quick-filters__label">Sort</span>
          <div className="orders-quick-filters__controls">
            <select
              className="orders-quick-filters__select"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              aria-label="Sort orders by"
            >
              {ORDER_SORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={`orders-quick-filters__pill ${sortDirection === "desc" ? "orders-quick-filters__pill--active" : ""}`}
              onClick={() => setSortDirection("desc")}
            >
              Desc
            </button>
            <button
              type="button"
              className={`orders-quick-filters__pill ${sortDirection === "asc" ? "orders-quick-filters__pill--active" : ""}`}
              onClick={() => setSortDirection("asc")}
            >
              Asc
            </button>
          </div>
        </div>
      </div>

      {showFilters ? (
        <PageFilterPanel layout="orders" onClear={hasCalculationFilters ? clearCalculationFilters : undefined}>
          <FilterSelect label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="All Statuses">All Statuses</option>
            {orderStatusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect label="Store" value={storeFilter} onChange={(event) => setStoreFilter(event.target.value)}>
            {storeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect label="Sort by" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            {ORDER_SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Sort direction"
            value={sortDirection}
            onChange={(event) => setSortDirection(event.target.value)}
          >
            <option value="desc">Descending (newest / highest first)</option>
            <option value="asc">Ascending (oldest / lowest first)</option>
          </FilterSelect>

          <FilterInput
            label="Buyer username"
            value={buyerFilter}
            onChange={(event) => setBuyerFilter(event.target.value)}
            placeholder="Search buyer"
          />

          <FilterInput
            label="Order ID"
            value={orderIdFilter}
            onChange={(event) => setOrderIdFilter(event.target.value)}
            placeholder="eBay order ID"
          />

          <FilterInput
            label="From date"
            type="date"
            value={fromDate}
            onChange={(event) => handleFromDateChange(event.target.value)}
          />

          <FilterInput
            label="To date"
            type="date"
            value={toDate}
            onChange={(event) => handleToDateChange(event.target.value)}
          />

          <FilterCheckbox
            label="Hide canceled orders"
            checked={showOnlyActive}
            onChange={(event) => setShowOnlyActive(event.target.checked)}
          />
        </PageFilterPanel>
      ) : null}

      <div className="orders-toolbar orders-toolbar--secondary calculations-sheet-toolbar">
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
            onClick={() => setInviteModalOpen(true)}
            disabled={!sheetStatus.spreadsheet_url || sheetInviting}
          >
            <LuUserPlus />
            <span>Invite Members</span>
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
          <span>
            Google Sheet last updated: {formatDisplayDate(sheetStatus.last_synced_at.slice(0, 10))}. Sheets are view-only and public by default.
          </span>
        </div>
      ) : null}

      <InviteSheetMembersModal
        open={inviteModalOpen}
        saving={sheetInviting}
        onClose={() => {
          if (!sheetInviting) {
            setInviteModalOpen(false);
          }
        }}
        onInvite={handleInviteMembers}
      />

      <QuickEditModal
        open={Boolean(editingCostId)}
        title="Edit Cost"
        description="The AliExpress (or other supplier) cost for this order."
        label="Cost"
        type="number"
        min="0"
        step="0.01"
        value={costDraft}
        onChange={setCostDraft}
        onSave={() => handleSaveCost(calculationRows.find((row) => row.id === editingCostId))}
        onClose={handleCancelCostEdit}
        saving={savingCostId === editingCostId}
        placeholder="0.00"
      />

      <section className="calculations-table-panel card-wrapper">
        <div className="calculations-table-toolbar">
          <strong>{filteredRows.length} orders</strong>

          <div className="calculations-table-toolbar__actions">
            <button type="button" className="orders-icon-btn" onClick={() => scrollTable("end")} aria-label="Show more columns">
              <LuMenu />
            </button>
            <button type="button" className="orders-icon-btn" onClick={() => scrollTable("start")} aria-label="Return to start">
              <LuExternalLink />
            </button>
          </div>
        </div>

        <div className="orders-table-shell">
          <div className="orders-table-scroll calculations-table-scroll" ref={tableScrollRef}>
            <table className="orders-table calculations-table">
              <thead>
                <tr className="calculations-table__totals-row">
                  <td>Totals (page)</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td className="calculations-table__money">{pageTotals.qty}</td>
                  <td></td>
                  <td className="calculations-table__money">{formatCalculationAmount(pageTotals.cost)}</td>
                  <td className="calculations-table__money">{formatCalculationAmount(pageTotals.tax)}</td>
                  <td className="calculations-table__money">{formatCalculationAmount(pageTotals.afterTaxEbay)}</td>
                  <td className="calculations-table__money">{formatCalculationAmount(pageTotals.prep)}</td>
                  <td className="calculations-table__money">{formatCalculationAmount(pageTotals.shipping)}</td>
                  <td className="calculations-table__money">{formatCalculationAmount(pageTotals.earn)}</td>
                  <td className="calculations-table__money">{formatCalculationAmount(pageTotals.profit)}</td>
                  <td className="calculations-table__money">{formatCalculationRoi(pageTotals.roi)}</td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <th>Order Id</th>
                  <th>eBay Item / Tracking</th>
                  <th>Name</th>
                  <th>Date</th>
                  <th>eBay Status</th>
                  <th>QTY</th>
                  <th>Address</th>
                  <th>Cost</th>
                  <th>Tax</th>
                  <th>After Tax eBay</th>
                  <th>Prep</th>
                  <th>Shipping</th>
                  <th>Earn</th>
                  <th>Profit</th>
                  <th>ROI</th>
                  <th>AliExpress Order ID</th>
                  <th>AliExpress Status</th>
                </tr>
              </thead>

              <tbody>
                {ordersLoading ? (
                  <tr>
                    <td className="orders-table__empty" colSpan={17}>
                      <LuRefreshCcw className="spin-icon" />
                      <span>Loading orders…</span>
                    </td>
                  </tr>
                ) : visibleRows.length ? (
                  visibleRows.map((row) => {
                    const StatusIcon = ebayStatusIcons[row.ebayStatusClass] ?? LuClock3;

                    return (
                      <tr className="orders-table__row" key={row.id}>
                        <td className="calculations-table__order-id">{row.orderId}</td>

                        <td>
                          <div className="calculations-item-tracking">
                            <div className="calculations-item-tracking__row">
                              <span className="calculations-item-tracking__label">Item</span>
                              {row.itemSellUrl ? (
                                <a
                                  href={row.itemSellUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="products-item-id-link"
                                >
                                  <strong>{row.itemSell}</strong>
                                </a>
                              ) : (
                                <strong>{row.itemSell}</strong>
                              )}
                            </div>
                            <div className="calculations-item-tracking__row">
                              <span className="calculations-item-tracking__label">Tracking</span>
                              <strong>{row.trackingNumber}</strong>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="orders-product calculations-product">
                            <div className="orders-product__thumb">
                              <img src={row.image} alt={row.title} />
                            </div>
                            <div className="orders-product__copy calculations-product__copy">
                              <h3>{row.title}</h3>
                              <p className="calculations-product__description">{row.description}</p>
                            </div>
                          </div>
                        </td>

                        <td className="orders-table__date">{formatDisplayDate(row.date)}</td>

                        <td className="orders-table__status-cell">
                          <span
                            className={`orders-status-badge orders-status-badge--${row.ebayStatusClass} calculations-status-badge`}
                          >
                            <span className="orders-status-badge__left">
                              <StatusIcon />
                              <span>{row.ebayStatus}</span>
                            </span>
                          </span>
                        </td>

                        <td className="calculations-table__money">{row.qty}</td>

                        <td className="calculations-table__address">{row.address}</td>

                        <td className="calculations-table__money calculations-table__money--cost">
                          <button
                            type="button"
                            className="products-tracking-btn"
                            onClick={() => handleStartCostEdit(row)}
                            title="Edit cost"
                          >
                            <span>{formatCalculationAmount(row.cost)}</span>
                            <LuPencil className="products-tracking-btn__icon" />
                          </button>
                        </td>
                        <td className="calculations-table__money">{formatCalculationAmount(row.tax)}</td>
                        <td className="calculations-table__money">{formatCalculationAmount(row.afterTaxEbay)}</td>
                        <td className="calculations-table__money">{formatCalculationAmount(row.prep)}</td>
                        <td className="calculations-table__money">{formatCalculationAmount(row.shipping)}</td>
                        <td className="calculations-table__money">{formatCalculationAmount(row.earn)}</td>
                        <td className="calculations-table__money calculations-table__money--profit">
                          {formatCalculationAmount(row.profit)}
                        </td>
                        <td className="calculations-table__money calculations-table__money--roi">
                          {formatCalculationRoi(row.roi)}
                        </td>

                        <td className="calculations-table__mono">{row.aliexpressOrderId}</td>
                        <td>{row.aliexpressStatus}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="orders-table__empty" colSpan={17}>
                      No calculation rows match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="orders-table-footer calculations-table-footer">
            <div className="orders-pagination">
              <button
                type="button"
                className="orders-pagination__arrow"
                disabled={currentPage <= 1}
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
                    className={
                      page === currentPage
                        ? "orders-pagination__page orders-pagination__page--active"
                        : "orders-pagination__page"
                    }
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
                disabled={currentPage >= totalPages}
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
              <span>
                Orders {filteredRows.length ? (currentPage - 1) * pageSize + 1 : 0}–
                {Math.min(currentPage * pageSize, filteredRows.length)} out of {filteredRows.length}
              </span>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}

export default CalculationsContent;
