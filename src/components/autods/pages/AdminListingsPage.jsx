import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { LuLoader, LuPackage2, LuSearch } from "react-icons/lu";
import { selectUserRole } from "../../../store/selectors/AuthSelectors";
import { toast } from "../../../utils/toast";
import { getAdminListings } from "../../../services/AdminService";
import { EBAY_MARKETPLACES } from "../ConnectEbayModal";
import { importSuppliers } from "../constants";
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

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
];

function AdminListingsPage() {
  const role = useSelector(selectUserRole);
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");

  const [q, setQ] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [marketplace, setMarketplace] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [supplier, setSupplier] = useState("");

  useEffect(() => {
    if (role !== "super_admin") {
      navigate("/");
    }
  }, [role, navigate]);

  const loadListings = useCallback(() => {
    setLoading(true);
    getAdminListings({
      page,
      per_page: 20,
      sort,
      sort_dir: sortDir,
      q: q.trim() || undefined,
      user_search: userSearch.trim() || undefined,
      marketplace: marketplace || undefined,
      category: category.trim() || undefined,
      status: status || undefined,
      supplier: supplier || undefined,
    })
      .then((res) => {
        setListings(res.data?.data ?? []);
        setMeta({
          current_page: res.data?.current_page ?? 1,
          last_page: res.data?.last_page ?? 1,
          total: res.data?.total ?? 0,
        });
      })
      .catch(() => toast.error("Failed to load listings."))
      .finally(() => setLoading(false));
  }, [page, sort, sortDir, q, userSearch, marketplace, category, status, supplier]);

  useEffect(() => {
    if (role === "super_admin") {
      loadListings();
    }
  }, [role, loadListings]);

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
          <span className="admin-page__eyebrow"><LuPackage2 /> All Listings</span>
          <h1>All Listings</h1>
          <p>Every eBay listing across every user, in one place.</p>
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
              placeholder="Title, SKU, item ID"
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
          <span>Category</span>
          <input type="search" placeholder="Category name" value={category} onChange={handleFilterChange(setCategory)} />
        </label>

        <label className="admin-filters-bar__field">
          <span>Status</span>
          <select value={status} onChange={handleFilterChange(setStatus)}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="admin-filters-bar__field">
          <span>Supplier</span>
          <select value={supplier} onChange={handleFilterChange(setSupplier)}>
            <option value="">All suppliers</option>
            {importSuppliers.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </label>

        <span className="admin-clients-page__count" style={{ marginLeft: "auto" }}>{meta.total} listings</span>
      </div>

      {loading ? (
        <div className="admin-page__loading card-wrapper">
          <LuLoader className="spin-icon" />
          <span>Loading listings…</span>
        </div>
      ) : (
        <div className="admin-clients-page__table card-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <AdminSortableHeader label="Title" sortKey="title" sort={sort} sortDir={sortDir} onSort={handleSort} />
                <th>User</th>
                <th>Marketplace</th>
                <AdminSortableHeader label="Category" sortKey="category_name" sort={sort} sortDir={sortDir} onSort={handleSort} />
                <AdminSortableHeader label="Price" sortKey="price" sort={sort} sortDir={sortDir} onSort={handleSort} />
                <AdminSortableHeader label="Profit" sortKey="profit" sort={sort} sortDir={sortDir} onSort={handleSort} />
                <AdminSortableHeader label="Qty" sortKey="quantity" sort={sort} sortDir={sortDir} onSort={handleSort} />
                <AdminSortableHeader label="Status" sortKey="status" sort={sort} sortDir={sortDir} onSort={handleSort} />
                <AdminSortableHeader label="Synced" sortKey="synced_at" sort={sort} sortDir={sortDir} onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {listings.length ? listings.map((listing) => (
                <tr key={listing.id}>
                  <td>
                    <div className="admin-clients-page__identity">
                      {listing.listing_url ? (
                        <a href={listing.listing_url} target="_blank" rel="noopener noreferrer">
                          <strong>{listing.title}</strong>
                        </a>
                      ) : (
                        <strong>{listing.title}</strong>
                      )}
                      <span>{listing.sku ?? "—"} · {listing.source_platform ?? "—"}</span>
                    </div>
                  </td>
                  <td>
                    <div className="admin-clients-page__identity">
                      <strong>{listing.user?.name ?? "—"}</strong>
                      <span>{listing.user?.email ?? "—"}</span>
                    </div>
                  </td>
                  <td>{listing.marketplace ?? "—"}</td>
                  <td>{listing.category_name ?? "—"}</td>
                  <td>{formatMoney(listing.price, listing.currency)}</td>
                  <td>{formatMoney(listing.profit, listing.currency)}</td>
                  <td>{listing.quantity ?? 0}</td>
                  <td>
                    <span className={listing.status === "active" ? "admin-badge admin-badge--success" : "admin-badge admin-badge--muted"}>
                      {listing.status ?? "—"}
                    </span>
                  </td>
                  <td>{formatDate(listing.synced_at ?? listing.created_at)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={9} className="admin-table__empty">No listings found.</td>
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

export default AdminListingsPage;
