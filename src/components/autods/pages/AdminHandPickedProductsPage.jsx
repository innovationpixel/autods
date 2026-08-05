import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { LuBadgeCheck, LuLoader, LuPencil, LuPlus, LuRefreshCcw, LuTrash2 } from "react-icons/lu";
import { selectUserRole } from "../../../store/selectors/AuthSelectors";
import { toast } from "../../../utils/toast";
import { MARKETPLACE_COUNTRIES } from "../constants";
import ConfirmModal from "../ConfirmModal";
import { getAdminCategories } from "../../../services/CategoryService";
import {
  createAdminHandPickedProduct,
  deleteAdminHandPickedProduct,
  getAdminHandPickedProducts,
  resolveAliExpressProduct,
  updateAdminHandPickedProduct,
} from "../../../services/CuratedProductService";

const emptyForm = {
  url_or_id: "",
  category_id: "",
  country: "US",
  sort_order: 0,
  is_active: true,
};

function AdminHandPickedProductsPage() {
  const role = useSelector(selectUserRole);
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [preview, setPreview] = useState(null);
  const [resolving, setResolving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (role !== "super_admin") {
      navigate("/");
    }
  }, [role, navigate]);

  const loadProducts = () => {
    getAdminHandPickedProducts()
      .then((res) => setProducts(res.data?.hand_picked_products ?? []))
      .catch(() => toast.error("Failed to load hand-picked products."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (role === "super_admin") {
      getAdminCategories()
        .then((res) => setCategories(res.data?.categories ?? []))
        .catch(() => {});
      loadProducts();
    }
  }, [role]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setPreview(null);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditingId(product.id);
    setForm({
      url_or_id: product.aliexpress_url ?? "",
      category_id: product.category_id ? String(product.category_id) : "",
      country: product.country ?? "US",
      sort_order: product.sort_order ?? 0,
      is_active: product.is_active ?? true,
    });
    setPreview({
      title: product.title,
      image_url: product.image_url,
      price: product.price,
      currency: product.currency,
      seller: product.seller,
      listing_url: product.listing_url,
      aliexpress_product_id: product.aliexpress_product_id,
      aliexpress_url: product.aliexpress_url,
    });
    setModalOpen(true);
  };

  const fetchPreview = async () => {
    if (!form.url_or_id.trim()) {
      toast.warn("Paste an AliExpress product link or ID first.");
      return;
    }

    setResolving(true);
    try {
      const res = await resolveAliExpressProduct(form.url_or_id.trim(), form.country);
      setPreview(res.data?.product ?? null);
      toast.success("Product fetched from AliExpress.");
    } catch (err) {
      setPreview(null);
      toast.error(err.response?.data?.error ?? "Could not fetch that product.");
    } finally {
      setResolving(false);
    }
  };

  const saveProduct = async () => {
    if (!preview) {
      toast.warn("Fetch the AliExpress product before saving.");
      return;
    }
    if (!form.country) {
      toast.warn("Select a target country.");
      return;
    }

    setSaving(true);
    const payload = {
      ...preview,
      category_id: form.category_id ? Number(form.category_id) : null,
      country: form.country,
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
    };

    try {
      if (editingId) {
        await updateAdminHandPickedProduct(editingId, payload);
        toast.success("Hand-picked product updated.");
      } else {
        await createAdminHandPickedProduct(payload);
        toast.success("Hand-picked product added.");
      }
      setModalOpen(false);
      loadProducts();
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

  const confirmDeleteProduct = async () => {
    if (!deleteConfirm) {
      return;
    }

    setDeleting(true);
    try {
      await deleteAdminHandPickedProduct(deleteConfirm.id);
      toast.success("Hand-picked product deleted.");
      setDeleteConfirm(null);
      loadProducts();
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
    <section className="admin-page admin-curated-page">
      <header className="admin-page__hero admin-page__hero--split">
        <div>
          <span className="admin-page__eyebrow"><LuBadgeCheck /> Hand-Picked Products</span>
          <h1>Manage Hand-Picked Products</h1>
          <p>Paste an AliExpress product link, target a category and country, and it will show up in users' Hand-Picked Products feed for that marketplace.</p>
        </div>
        <button type="button" className="admin-page__btn admin-page__btn--primary" onClick={openCreate}>
          <LuPlus />
          <span>Add Product</span>
        </button>
      </header>

      {loading ? (
        <div className="admin-page__loading card-wrapper">
          <LuLoader className="spin-icon" />
          <span>Loading hand-picked products…</span>
        </div>
      ) : (
        <div className="admin-clients-page__table card-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Country</th>
                <th>Price</th>
                <th>Sort</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {products.length ? products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="admin-curated-page__product">
                      {product.image_url ? <img src={product.image_url} alt={product.title} referrerPolicy="no-referrer" /> : null}
                      <span>{product.title}</span>
                    </div>
                  </td>
                  <td>{product.category?.name ?? "—"}</td>
                  <td>{product.country}</td>
                  <td>{product.currency} {Number(product.price).toFixed(2)}</td>
                  <td>{product.sort_order ?? 0}</td>
                  <td>
                    <span className={product.is_active ? "admin-badge admin-badge--success" : "admin-badge admin-badge--muted"}>
                      {product.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td>
                    <div className="admin-clients-page__actions">
                      <button type="button" className="orders-icon-btn" onClick={() => openEdit(product)} aria-label="Edit product">
                        <LuPencil />
                      </button>
                      <button type="button" className="orders-icon-btn" onClick={() => setDeleteConfirm(product)} aria-label="Delete product">
                        <LuTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="admin-table__empty">No hand-picked products yet.</td>
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
            <h3>{editingId ? "Edit Hand-Picked Product" : "Add Hand-Picked Product"}</h3>

            <div className="admin-modal__grid">
              <label className="marketplace-settings__field admin-modal__full">
                <span>AliExpress product link or ID</span>
                <div className="admin-curated-page__resolve-row">
                  <input
                    className="marketplace-settings__control"
                    value={form.url_or_id}
                    onChange={(e) => setForm({ ...form, url_or_id: e.target.value })}
                    placeholder="https://www.aliexpress.com/item/1005001234567890.html"
                  />
                  <button type="button" className="admin-page__btn admin-page__btn--ghost" disabled={resolving} onClick={fetchPreview}>
                    {resolving ? <LuLoader className="spin-icon" /> : <LuRefreshCcw />}
                    <span>Fetch</span>
                  </button>
                </div>
              </label>

              {preview ? (
                <div className="admin-curated-page__preview admin-modal__full">
                  {preview.image_url ? <img src={preview.image_url} alt={preview.title} referrerPolicy="no-referrer" /> : null}
                  <div>
                    <strong>{preview.title}</strong>
                    <span>{preview.currency} {Number(preview.price).toFixed(2)}{preview.seller ? ` · ${preview.seller}` : ""}</span>
                  </div>
                </div>
              ) : null}

              <label className="marketplace-settings__field">
                <span>Category</span>
                <select className="marketplace-settings__control" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">No category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </label>

              <label className="marketplace-settings__field">
                <span>Country</span>
                <select className="marketplace-settings__control" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
                  {MARKETPLACE_COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>{country.label}</option>
                  ))}
                </select>
              </label>

              <label className="marketplace-settings__field">
                <span>Sort Order</span>
                <input type="number" min="0" className="marketplace-settings__control" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
              </label>
            </div>

            <label className="marketplace-settings__field admin-modal__checkbox">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              <span>Active (visible to users)</span>
            </label>

            <div className="admin-modal__footer">
              <button type="button" className="admin-page__btn admin-page__btn--ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="button" className="admin-page__btn admin-page__btn--primary" disabled={saving || !preview} onClick={saveProduct}>
                {saving ? "Saving…" : "Save Product"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={Boolean(deleteConfirm)}
        title={`Delete ${deleteConfirm?.title ?? "this product"}?`}
        confirmLabel="Delete"
        saving={deleting}
        onConfirm={confirmDeleteProduct}
        onClose={() => setDeleteConfirm(null)}
      />
    </section>
  );
}

export default AdminHandPickedProductsPage;
