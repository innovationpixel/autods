import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "../../../utils/toast";
import { getOrders, getOrdersGoogleSheetStatus, inviteOrdersGoogleSheetMembers, syncOrdersGoogleSheet } from "../../../services/OrderService";
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
  LuRefreshCcw,
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
      const res = await getOrders({ limit: 500, sort: "desc" });
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
  }, []);

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

  const handleInviteMembers = async (emails) => {
    setSheetInviting(true);
    try {
      const res = await inviteOrdersGoogleSheetMembers({ emails });
      toast.success(res.data?.message ?? "Team members invited.");
      setInviteModalOpen(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not invite team members."));
    } finally {
      setSheetInviting(false);
    }
  };

  const calculationRows = useMemo(
    () => orders.map((order) => mapApiOrderToCalculationRow(order)),
    [orders],
  );

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return calculationRows;
    }

    return calculationRows.filter((row) =>
      [row.orderId, row.title, row.description, row.ebayStatus, row.date]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [calculationRows, searchQuery]);

  const totals = useMemo(() => summarizeCalculations(filteredRows), [filteredRows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const visibleRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginationItems = buildPaginationItems(currentPage, totalPages);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredRows.length, pageSize, searchQuery]);

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
                <tr>
                  <th>Order Id</th>
                  <th>Name</th>
                  <th>Date</th>
                  <th>eBay Status</th>
                  <th>Cost</th>
                  <th>Shipping</th>
                  <th>Earn</th>
                  <th>Profit</th>
                  <th>ROI</th>
                </tr>
              </thead>

              <tbody>
                {ordersLoading ? (
                  <tr>
                    <td className="orders-table__empty" colSpan={9}>
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

                        <td className="calculations-table__money">{formatCalculationAmount(row.cost)}</td>
                        <td className="calculations-table__money">{formatCalculationAmount(row.shipping)}</td>
                        <td className="calculations-table__money">{formatCalculationAmount(row.earn)}</td>
                        <td className="calculations-table__money calculations-table__money--profit">
                          {formatCalculationAmount(row.profit)}
                        </td>
                        <td className="calculations-table__money calculations-table__money--roi">
                          {formatCalculationRoi(row.roi)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="orders-table__empty" colSpan={9}>
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
