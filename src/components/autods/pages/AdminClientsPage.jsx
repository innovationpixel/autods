import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { LuLoader, LuPencil, LuPlus, LuSearch, LuTrash2, LuUsers } from "react-icons/lu";
import { selectUserRole } from "../../../store/selectors/AuthSelectors";
import { toast } from "../../../utils/toast";
import { getAdminPlans } from "../../../services/PlanService";
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
  updateAdminUser,
} from "../../../services/AdminService";

const emptyClientForm = {
  name: "",
  email: "",
  password: "",
  role: "client",
  is_active: true,
  current_plan_id: "",
  plan_expires_at: "",
  wallet_balance: 0,
  wallet_currency: "USD",
};

function formatMoney(value, currency = "USD") {
  const amount = Number(value ?? 0);
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

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function AdminClientsPage() {
  const role = useSelector(selectUserRole);
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [plans, setPlans] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyClientForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (role !== "super_admin") {
      navigate("/");
    }
  }, [role, navigate]);

  const loadClients = useCallback(() => {
    setLoading(true);
    getAdminUsers({
      page,
      per_page: 15,
      search: search.trim() || undefined,
      role: "client",
    })
      .then((res) => {
        setClients(res.data?.data ?? []);
        setMeta({
          current_page: res.data?.current_page ?? 1,
          last_page: res.data?.last_page ?? 1,
          total: res.data?.total ?? 0,
        });
      })
      .catch(() => toast.error("Failed to load clients."))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => {
    if (role === "super_admin") {
      getAdminPlans()
        .then((res) => setPlans(res.data?.plans ?? []))
        .catch(() => {});
      loadClients();
    }
  }, [role, loadClients]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyClientForm);
    setModalOpen(true);
  };

  const openEdit = (client) => {
    setEditingId(client.id);
    setForm({
      name: client.name ?? "",
      email: client.email ?? "",
      password: "",
      role: "client",
      is_active: client.is_active ?? true,
      current_plan_id: client.current_plan_id ? String(client.current_plan_id) : "",
      plan_expires_at: client.plan_expires_at ? client.plan_expires_at.slice(0, 10) : "",
      wallet_balance: client.wallet_balance ?? 0,
      wallet_currency: client.wallet_currency ?? "USD",
    });
    setModalOpen(true);
  };

  const saveClient = async () => {
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: "client",
      is_active: form.is_active,
      wallet_balance: Number(form.wallet_balance) || 0,
      wallet_currency: form.wallet_currency || "USD",
      current_plan_id: form.current_plan_id ? Number(form.current_plan_id) : null,
      plan_expires_at: form.plan_expires_at || null,
    };

    if (form.password.trim()) {
      payload.password = form.password;
    }

    try {
      if (editingId) {
        await updateAdminUser(editingId, payload);
        toast.success("Client updated.");
      } else {
        if (!form.password.trim()) {
          toast.error("Password is required for new clients.");
          setSaving(false);
          return;
        }
        payload.password = form.password;
        await createAdminUser(payload);
        toast.success("Client created.");
      }
      setModalOpen(false);
      loadClients();
    } catch (err) {
      const message = err.response?.data?.message
        ?? Object.values(err.response?.data?.errors ?? {})[0]?.[0]
        ?? err.response?.data?.error
        ?? "Save failed.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const removeClient = async (client) => {
    if (!window.confirm(`Delete ${client.name}? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteAdminUser(client.id);
      toast.success("Client deleted.");
      loadClients();
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Delete failed.");
    }
  };

  if (role !== "super_admin") {
    return null;
  }

  return (
    <section className="admin-page admin-clients-page">
      <header className="admin-page__hero admin-page__hero--split">
        <div>
          <span className="admin-page__eyebrow"><LuUsers /> Clients</span>
          <h1>Manage Clients</h1>
          <p>Create, edit, and deactivate client accounts on the platform.</p>
        </div>
        <button type="button" className="admin-page__btn admin-page__btn--primary" onClick={openCreate}>
          <LuPlus />
          <span>Add Client</span>
        </button>
      </header>

      <div className="admin-clients-page__toolbar card-wrapper">
        <label className="admin-clients-page__search">
          <LuSearch />
          <input
            type="search"
            className="marketplace-settings__control"
            placeholder="Search by name or email..."
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
          />
        </label>
        <span className="admin-clients-page__count">{meta.total} clients</span>
      </div>

      {loading ? (
        <div className="admin-page__loading card-wrapper">
          <LuLoader className="spin-icon" />
          <span>Loading clients…</span>
        </div>
      ) : (
        <div className="admin-clients-page__table card-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Plan</th>
                <th>Wallet</th>
                <th>Activity</th>
                <th>Status</th>
                <th>Joined</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {clients.length ? clients.map((client) => (
                <tr key={client.id}>
                  <td>
                    <div className="admin-clients-page__identity">
                      <strong>{client.name}</strong>
                      <span>{client.email}</span>
                    </div>
                  </td>
                  <td>
                    <div className="admin-clients-page__plan">
                      <strong>{client.current_plan?.title ?? "No plan"}</strong>
                      {client.plan_expires_at ? (
                        <span>Expires {formatDate(client.plan_expires_at)}</span>
                      ) : null}
                    </div>
                  </td>
                  <td>{formatMoney(client.wallet_balance, client.wallet_currency)}</td>
                  <td>
                    <span className="admin-clients-page__activity">
                      {client.orders_count ?? 0} orders · {client.ebay_listings_count ?? 0} listings
                    </span>
                  </td>
                  <td>
                    <span className={client.is_active ? "admin-badge admin-badge--success" : "admin-badge admin-badge--muted"}>
                      {client.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td>{formatDate(client.created_at)}</td>
                  <td>
                    <div className="admin-clients-page__actions">
                      <button type="button" className="orders-icon-btn" onClick={() => openEdit(client)} aria-label="Edit client">
                        <LuPencil />
                      </button>
                      <button type="button" className="orders-icon-btn" onClick={() => removeClient(client)} aria-label="Delete client">
                        <LuTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="admin-table__empty">No clients found.</td>
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

      {modalOpen ? (
        <div className="orders-modal">
          <div className="orders-modal__backdrop" onClick={() => setModalOpen(false)} />
          <div className="orders-modal__card admin-modal">
            <h3>{editingId ? "Edit Client" : "Create Client"}</h3>

            <div className="admin-modal__grid">
              <label className="marketplace-settings__field">
                <span>Name</span>
                <input className="marketplace-settings__control" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </label>

              <label className="marketplace-settings__field">
                <span>Email</span>
                <input type="email" className="marketplace-settings__control" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              </label>

              <label className="marketplace-settings__field admin-modal__full">
                <span>{editingId ? "New Password (optional)" : "Password"}</span>
                <input type="password" className="marketplace-settings__control" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
              </label>

              <label className="marketplace-settings__field">
                <span>Plan</span>
                <select className="marketplace-settings__control" value={form.current_plan_id} onChange={(event) => setForm({ ...form, current_plan_id: event.target.value })}>
                  <option value="">No plan</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>{plan.title}</option>
                  ))}
                </select>
              </label>

              <label className="marketplace-settings__field">
                <span>Plan Expires</span>
                <input type="date" className="marketplace-settings__control" value={form.plan_expires_at} onChange={(event) => setForm({ ...form, plan_expires_at: event.target.value })} />
              </label>

              <label className="marketplace-settings__field">
                <span>Wallet Balance</span>
                <input type="number" min="0" step="0.01" className="marketplace-settings__control" value={form.wallet_balance} onChange={(event) => setForm({ ...form, wallet_balance: event.target.value })} />
              </label>

              <label className="marketplace-settings__field">
                <span>Currency</span>
                <input className="marketplace-settings__control" value={form.wallet_currency} onChange={(event) => setForm({ ...form, wallet_currency: event.target.value.toUpperCase() })} />
              </label>
            </div>

            <label className="marketplace-settings__field admin-modal__checkbox">
              <input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} />
              <span>Active account</span>
            </label>

            <div className="admin-modal__footer">
              <button type="button" className="admin-page__btn admin-page__btn--ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="button" className="admin-page__btn admin-page__btn--primary" disabled={saving} onClick={saveClient}>
                {saving ? "Saving…" : editingId ? "Update Client" : "Create Client"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default AdminClientsPage;
