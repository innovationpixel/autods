import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { LuLoader, LuLayers, LuPencil, LuPlus, LuTrash2 } from "react-icons/lu";
import { selectUserRole } from "../../../store/selectors/AuthSelectors";
import { toast } from "../../../utils/toast";
import ConfirmModal from "../ConfirmModal";
import {
  createAdminCategory,
  deleteAdminCategory,
  getAdminCategories,
  updateAdminCategory,
} from "../../../services/CategoryService";

const emptyCategory = {
  name: "",
  slug: "",
  is_active: true,
  sort_order: 0,
};

function AdminCategoriesPage() {
  const role = useSelector(selectUserRole);
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyCategory);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (role !== "super_admin") {
      navigate("/");
    }
  }, [role, navigate]);

  const loadCategories = () => {
    getAdminCategories()
      .then((res) => setCategories(res.data?.categories ?? []))
      .catch(() => toast.error("Failed to load categories."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (role === "super_admin") {
      loadCategories();
    }
  }, [role]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyCategory);
    setModalOpen(true);
  };

  const openEdit = (category) => {
    setEditingId(category.id);
    setForm({
      name: category.name ?? "",
      slug: category.slug ?? "",
      is_active: category.is_active ?? true,
      sort_order: category.sort_order ?? 0,
    });
    setModalOpen(true);
  };

  const saveCategory = async () => {
    if (!form.name.trim()) {
      toast.warn("Enter a category name.");
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      is_active: form.is_active,
      sort_order: Number(form.sort_order) || 0,
    };

    try {
      if (editingId) {
        await updateAdminCategory(editingId, payload);
        toast.success("Category updated.");
      } else {
        await createAdminCategory(payload);
        toast.success("Category created.");
      }
      setModalOpen(false);
      loadCategories();
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

  const confirmDeleteCategory = async () => {
    if (!deleteConfirm) {
      return;
    }

    setDeleting(true);
    try {
      await deleteAdminCategory(deleteConfirm.id);
      toast.success("Category deleted.");
      setDeleteConfirm(null);
      loadCategories();
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
    <section className="admin-page admin-categories-page">
      <header className="admin-page__hero admin-page__hero--split">
        <div>
          <span className="admin-page__eyebrow"><LuLayers /> Categories</span>
          <h1>Manage Categories</h1>
          <p>Categories are used to group Trending and Hand-Picked products for users to filter by.</p>
        </div>
        <button type="button" className="admin-page__btn admin-page__btn--primary" onClick={openCreate}>
          <LuPlus />
          <span>Add Category</span>
        </button>
      </header>

      {loading ? (
        <div className="admin-page__loading card-wrapper">
          <LuLoader className="spin-icon" />
          <span>Loading categories…</span>
        </div>
      ) : (
        <div className="admin-clients-page__table card-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Sort Order</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {categories.length ? categories.map((category) => (
                <tr key={category.id}>
                  <td><strong>{category.name}</strong></td>
                  <td>{category.slug}</td>
                  <td>{category.sort_order ?? 0}</td>
                  <td>
                    <span className={category.is_active ? "admin-badge admin-badge--success" : "admin-badge admin-badge--muted"}>
                      {category.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td>
                    <div className="admin-clients-page__actions">
                      <button type="button" className="orders-icon-btn" onClick={() => openEdit(category)} aria-label="Edit category">
                        <LuPencil />
                      </button>
                      <button type="button" className="orders-icon-btn" onClick={() => setDeleteConfirm(category)} aria-label="Delete category">
                        <LuTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="admin-table__empty">No categories yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen ? (
        <div className="orders-modal">
          <div className="orders-modal__backdrop" onClick={() => setModalOpen(false)} />
          <div className="orders-modal__card admin-modal">
            <h3>{editingId ? "Edit Category" : "Create Category"}</h3>

            <div className="admin-modal__grid">
              <label className="marketplace-settings__field admin-modal__full">
                <span>Name</span>
                <input className="marketplace-settings__control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>

              <label className="marketplace-settings__field admin-modal__full">
                <span>Slug (optional — auto-generated from name if blank)</span>
                <input className="marketplace-settings__control" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </label>

              <label className="marketplace-settings__field">
                <span>Sort Order</span>
                <input type="number" min="0" className="marketplace-settings__control" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
              </label>
            </div>

            <label className="marketplace-settings__field admin-modal__checkbox">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              <span>Active category</span>
            </label>

            <div className="admin-modal__footer">
              <button type="button" className="admin-page__btn admin-page__btn--ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="button" className="admin-page__btn admin-page__btn--primary" disabled={saving} onClick={saveCategory}>
                {saving ? "Saving…" : "Save Category"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={Boolean(deleteConfirm)}
        title={`Delete ${deleteConfirm?.name ?? "this category"}?`}
        description="Products using this category will keep their data but lose the category link."
        confirmLabel="Delete"
        saving={deleting}
        onConfirm={confirmDeleteCategory}
        onClose={() => setDeleteConfirm(null)}
      />
    </section>
  );
}

export default AdminCategoriesPage;
