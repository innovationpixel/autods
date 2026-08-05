import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { LuLoader, LuPencil, LuPlus, LuSearch, LuShieldCheck, LuTrash2 } from "react-icons/lu";
import { selectUser, selectUserRole } from "../../../store/selectors/AuthSelectors";
import { toast } from "../../../utils/toast";
import { ADMIN_MODULES } from "../constants";
import ConfirmModal from "../ConfirmModal";
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
  updateAdminUser,
} from "../../../services/AdminService";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  is_active: true,
  fullAccess: true,
  admin_modules: [],
};

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function AdminUsersPage() {
  const role = useSelector(selectUserRole);
  const currentUser = useSelector(selectUser);
  const navigate = useNavigate();

  const [admins, setAdmins] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (role !== "super_admin") {
      navigate("/");
    }
  }, [role, navigate]);

  const loadAdmins = useCallback(() => {
    setLoading(true);
    getAdminUsers({
      page,
      per_page: 15,
      search: search.trim() || undefined,
      role: "super_admin",
    })
      .then((res) => {
        setAdmins(res.data?.data ?? []);
        setMeta({
          current_page: res.data?.current_page ?? 1,
          last_page: res.data?.last_page ?? 1,
          total: res.data?.total ?? 0,
        });
      })
      .catch(() => toast.error("Failed to load admin users."))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => {
    if (role === "super_admin") {
      loadAdmins();
    }
  }, [role, loadAdmins]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (admin) => {
    setEditingId(admin.id);
    setForm({
      name: admin.name ?? "",
      email: admin.email ?? "",
      password: "",
      is_active: admin.is_active ?? true,
      fullAccess: admin.admin_modules === null || admin.admin_modules === undefined,
      admin_modules: admin.admin_modules ?? [],
    });
    setModalOpen(true);
  };

  const toggleModule = (key) => {
    setForm((current) => ({
      ...current,
      admin_modules: current.admin_modules.includes(key)
        ? current.admin_modules.filter((item) => item !== key)
        : [...current.admin_modules, key],
    }));
  };

  const saveAdmin = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.warn("Name and email are required.");
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: "super_admin",
      is_active: form.is_active,
      admin_modules: form.fullAccess ? null : form.admin_modules,
    };

    if (form.password.trim()) {
      payload.password = form.password;
    }

    try {
      if (editingId) {
        await updateAdminUser(editingId, payload);
        toast.success("Admin user updated.");
      } else {
        if (!form.password.trim()) {
          toast.error("Password is required for new admin users.");
          setSaving(false);
          return;
        }
        payload.password = form.password;
        await createAdminUser(payload);
        toast.success("Admin user created.");
      }
      setModalOpen(false);
      loadAdmins();
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

  const confirmDeleteAdmin = async () => {
    if (!deleteConfirm) {
      return;
    }

    setDeleting(true);
    try {
      await deleteAdminUser(deleteConfirm.id);
      toast.success("Admin user deleted.");
      setDeleteConfirm(null);
      loadAdmins();
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  if (role !== "super_admin") {
    return null;
  }

  return (
    <section className="admin-page admin-clients-page">
      <header className="admin-page__hero admin-page__hero--split">
        <div>
          <span className="admin-page__eyebrow"><LuShieldCheck /> Admin Users</span>
          <h1>Manage Admin Users</h1>
          <p>Create super admin accounts and control which admin modules each one can access.</p>
        </div>
        <button type="button" className="admin-page__btn admin-page__btn--primary" onClick={openCreate}>
          <LuPlus />
          <span>Add Admin User</span>
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
        <span className="admin-clients-page__count">{meta.total} admin users</span>
      </div>

      {loading ? (
        <div className="admin-page__loading card-wrapper">
          <LuLoader className="spin-icon" />
          <span>Loading admin users…</span>
        </div>
      ) : (
        <div className="admin-clients-page__table card-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Admin</th>
                <th>Modules</th>
                <th>Status</th>
                <th>Joined</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {admins.length ? admins.map((admin) => (
                <tr key={admin.id}>
                  <td>
                    <div className="admin-clients-page__identity">
                      <strong>{admin.name}</strong>
                      <span>{admin.email}</span>
                    </div>
                  </td>
                  <td>
                    {admin.admin_modules === null || admin.admin_modules === undefined ? (
                      <span className="admin-badge admin-badge--success">Full access</span>
                    ) : (
                      <span>{admin.admin_modules.length} module{admin.admin_modules.length === 1 ? "" : "s"}</span>
                    )}
                  </td>
                  <td>
                    <span className={admin.is_active ? "admin-badge admin-badge--success" : "admin-badge admin-badge--muted"}>
                      {admin.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td>{formatDate(admin.created_at)}</td>
                  <td>
                    <div className="admin-clients-page__actions">
                      <button type="button" className="orders-icon-btn" onClick={() => openEdit(admin)} aria-label="Edit admin user">
                        <LuPencil />
                      </button>
                      <button
                        type="button"
                        className="orders-icon-btn"
                        onClick={() => setDeleteConfirm(admin)}
                        aria-label="Delete admin user"
                        disabled={admin.id === currentUser?.id}
                      >
                        <LuTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="admin-table__empty">No admin users found.</td>
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
            <h3>{editingId ? "Edit Admin User" : "Create Admin User"}</h3>

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
            </div>

            <label className="marketplace-settings__field admin-modal__checkbox">
              <input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} />
              <span>Active account</span>
            </label>

            <label className="marketplace-settings__field admin-modal__checkbox">
              <input
                type="checkbox"
                checked={form.fullAccess}
                onChange={(event) => setForm({ ...form, fullAccess: event.target.checked })}
              />
              <span>Full access (all admin modules)</span>
            </label>

            {!form.fullAccess ? (
              <div className="admin-modal__module-grid">
                {ADMIN_MODULES.map((module) => (
                  <label key={module.key} className="admin-modal__module-toggle">
                    <input
                      type="checkbox"
                      checked={form.admin_modules.includes(module.key)}
                      onChange={() => toggleModule(module.key)}
                    />
                    <span>{module.label}</span>
                  </label>
                ))}
              </div>
            ) : null}

            <div className="admin-modal__footer">
              <button type="button" className="admin-page__btn admin-page__btn--ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="button" className="admin-page__btn admin-page__btn--primary" disabled={saving} onClick={saveAdmin}>
                {saving ? "Saving…" : editingId ? "Update Admin User" : "Create Admin User"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={Boolean(deleteConfirm)}
        title={`Delete ${deleteConfirm?.name ?? "this admin user"}?`}
        description="This cannot be undone."
        confirmLabel="Delete"
        saving={deleting}
        onConfirm={confirmDeleteAdmin}
        onClose={() => setDeleteConfirm(null)}
      />
    </section>
  );
}

export default AdminUsersPage;
