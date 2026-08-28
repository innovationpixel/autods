import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { LuClipboardList, LuLoader, LuSearch } from "react-icons/lu";
import { selectUserRole } from "../../../store/selectors/AuthSelectors";
import { toast } from "../../../utils/toast";
import { getAdminOrders } from "../../../services/AdminService";
import { EBAY_MARKETPLACES } from "../ConnectEbayModal";
import { orderStatusOptions } from "../constants";
import AdminSortableHeader from "../AdminSortableHeader";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatMoney(value, currency = "USD") {
  if (value === null || value === undefined) return "—";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "USD" }).format(Number(value));
  } catch {
    return `$${Number(value).toFixed(2)}`;
  }
}

const PROCESSING_STATUS_OPTIONS = [
  { value: "", label: "All processing statuses" },
  { value: "new", label: "New" },
  { value: "pending", label: "Pending" },
  { value: "processed", label: "Processed" },
  { value: "shipped", label: "Shipped" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function AdminOrdersPage() {
  const role = useSelector(selectUserRole);
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("order_date");
  const [sortDir, setSortDir] = useState("desc");

  const [q, setQ] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [marketplace, setMarketplace] = useState("");
  const [status, setStatus] = useState("");
  const [processingStatus, setProcessingStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    if (role !== "super_admin") {
      navigate("/");
    }
  }, [role, navigate]);

  const loadOrders = useCallback(() => {
    setLoading(true);
    getAdminOrders({
      page,
      per_page: 20,
      sort,
      sort_dir: sortDir,
      q: q.trim() || undefined,
      user_search: userSearch.trim() || undefined,
      marketplace: marketplace || undefined,
      status: status || undefined,
      processing_status: processingStatus || undefined,
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
    })
      .then((res) => {
        setOrders(res.data?.data ?? []);
        setMeta({
          current_page: res.data?.current_page ?? 1,
          last_page: res.data?.last_page ?? 1,
          total: res.data?.total ?? 0,
        });
      })
      .catch(() => toast.error("Failed to load orders."))
      .finally(() => setLoading(false));
  }, [page, sort, sortDir, q, userSearch, marketplace, status, processingStatus, fromDate, toDate]);

  useEffect(() => {
    if (role === "super_admin") {
      loadOrders();
    }
  }, [role, loadOrders]);

  const handleSort = (key, dir) => {
    setSort(key);
    setSortDir(dir);
    setPage(1);
  };

  const handleFilterChange = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  if (role !== "super_admin") {
    return null;
  }

  return (
    <section className="admin-page admin-clients-page">
      <header className="admin-page__hero admin-page__hero--split">
        <div>
          <span className="admin-page__eyebrow"><LuClipboardList /> All Orders</span>
          <h1>All Orders</h1>
          <p>Every order across every user, in one place.</p>
        </div>
      </header>

      <div className="admin-clients-page__toolbar card-wrapper admin-filters-bar">
        <label className="admin-filters-bar__field">
          <span>Search</span>
          <div style={{ position: "relative" }}>
            <LuSearch style={{ position: "absolute", left: 8, top: 9, color: "#9ca3af", fontSize: 14 }} />
            <input
              type="search"
              style={{ paddingLeft: 26 }}
              placeholder="Item, buyer, order ID"
              value={q}
              onChange={handleFilterChange(setQ)}
            />
          </div>
        </label>

        <label className="admin-filters-bar__field">
          <span>User</span>
          <input type="search" placeholder="Name or email" value={userSearch} onChange={handleFilterChange(setUserSearch)} />
        </label>

        <label className="admin-filters-bar__field">
          <span>Marketplace</span>
          <select value={marketplace} onChange={handleFilterChange(setMarketplace)}>
            <option value="">All marketplaces</option>
            {EBAY_MARKETPLACES.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="admin-filters-bar__field">
          <span>Status</span>
          <select value={status} onChange={handleFilterChange(setStatus)}>
            <option value="">All statuses</option>
            {orderStatusOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>

        <label className="admin-filters-bar__field">
          <span>Processing</span>
          <select value={processingStatus} onChange={handleFilterChange(setProcessingStatus)}>
            {PROCESSING_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="admin-filters-bar__field">
          <span>From date</span>
          <input type="date" value={fromDate} onChange={handleFilterChange(setFromDate)} />
        </label>

        <label className="admin-filters-bar__field">
          <span>To date</span>
          <input type="date" value={toDate} onChange={handleFilterChange(setToDate)} />
        </label>

        <span className="admin-clients-page__count" style={{ marginLeft: "auto" }}>{meta.total} orders</span>
      </div>

      {loading ? (
        <div className="admin-page__loading card-wrapper">
          <LuLoader className="spin-icon" />
          <span>Loading orders…</span>
        </div>
      ) : (
        <div className="admin-clients-page__table card-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>User</th>
                <th>Marketplace</th>
                <AdminSortableHeader label="Buyer" sortKey="buyer_name" sort={sort} sortDir={sortDir} onSort={handleSort} />
                <AdminSortableHeader label="Date" sortKey="order_date" sort={sort} sortDir={sortDir} onSort={handleSort} />
                <AdminSortableHeader label="Sell Price" sortKey="sell_price" sort={sort} sortDir={sortDir} onSort={handleSort} />
                <AdminSortableHeader label="Profit" sortKey="profit" sort={sort} sortDir={sortDir} onSort={handleSort} />
                <AdminSortableHeader label="Status" sortKey="status" sort={sort} sortDir={sortDir} onSort={handleSort} />
                <AdminSortableHeader label="Processing" sortKey="processing_status" sort={sort} sortDir={sortDir} onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {orders.length ? orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <div className="admin-clients-page__identity">
                      <strong>{order.ebay_order_id ?? order.id}</strong>
                      <span>{order.item_title ?? "—"}</span>
                    </div>
                  </td>
                  <td>
                    <div className="admin-clients-page__identity">
                      <strong>{order.user?.name ?? "—"}</strong>
                      <span>{order.user?.email ?? "—"}</span>
                    </div>
                  </td>
                  <td>{order.marketplace ?? "—"}</td>
                  <td>{order.buyer_name ?? "—"}</td>
                  <td>{formatDate(order.order_date)}</td>
                  <td>{formatMoney(order.sell_price, order.currency)}</td>
                  <td>{formatMoney(order.profit, order.currency)}</td>
                  <td><span className="admin-badge admin-badge--muted">{order.status ?? "—"}</span></td>
                  <td><span className="admin-badge admin-badge--muted">{order.processing_status ?? "—"}</span></td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={9} className="admin-table__empty">No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {meta.last_page > 1 ? (
        <div className="admin-page__pagination">
          <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button>
          <span>Page {meta.current_page} of {meta.last_page}</span>
          <button type="button" disabled={page >= meta.last_page} onClick={() => setPage((current) => current + 1)}>Next</button>
        </div>
      ) : null}
    </section>
  );
}

export default AdminOrdersPage;
