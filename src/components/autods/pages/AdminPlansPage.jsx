import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  LuCalendar,
  LuCheck,
  LuCrown,
  LuLoader,
  LuPencil,
  LuPlus,
  LuSparkles,
  LuTrash2,
  LuZap,
} from "react-icons/lu";
import { selectUserRole } from "../../../store/selectors/AuthSelectors";
import { toast } from "../../../utils/toast";
import ConfirmModal from "../ConfirmModal";
import {
  createAdminPlan,
  deleteAdminPlan,
  getAdminPlans,
  updateAdminPlan,
} from "../../../services/PlanService";

const emptyPlan = {
  title: "",
  description: "",
  inclusions: [""],
  price: 0,
  currency: "USD",
  billing_type: "monthly",
  duration_days: 30,
  is_active: true,
  sort_order: 0,
};

function formatPlanInterval(plan) {
  if (plan.billing_type === "monthly") {
    return "month";
  }
  return `${plan.duration_days ?? 30} days`;
}

function AdminPlansPage() {
  const role = useSelector(selectUserRole);
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyPlan);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (role !== "super_admin") {
      navigate("/");
    }
  }, [role, navigate]);

  const loadPlans = () => {
    getAdminPlans()
      .then((res) => setPlans(res.data?.plans ?? []))
      .catch(() => toast.error("Failed to load plans."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (role === "super_admin") {
      loadPlans();
    }
  }, [role]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyPlan);
    setModalOpen(true);
  };

  const openEdit = (plan) => {
    setEditingId(plan.id);
    setForm({
      ...plan,
      inclusions: plan.inclusions?.length ? plan.inclusions : [""],
    });
    setModalOpen(true);
  };

  const savePlan = async () => {
    setSaving(true);
    const payload = {
      ...form,
      inclusions: form.inclusions.filter(Boolean),
      price: Number(form.price),
    };
    try {
      if (editingId) {
        await updateAdminPlan(editingId, payload);
        toast.success("Plan updated.");
      } else {
        await createAdminPlan(payload);
        toast.success("Plan created.");
      }
      setModalOpen(false);
      loadPlans();
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const removePlan = (plan) => {
    setDeleteConfirm(plan);
  };

  const confirmDeletePlan = async () => {
    if (!deleteConfirm) {
      return;
    }

    setDeleting(true);
    try {
      await deleteAdminPlan(deleteConfirm.id);
      toast.success("Plan deactivated.");
      setDeleteConfirm(null);
      loadPlans();
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  if (role !== "super_admin") {
    return null;
  }

  if (loading) {
    return (
      <section className="admin-page admin-plans-page">
        <div className="admin-page__loading card-wrapper">
          <LuLoader className="spin-icon" />
          <span>Loading plans…</span>
        </div>
      </section>
    );
  }

  const activeCount = plans.filter((plan) => plan.is_active).length;

  return (
    <section className="admin-page admin-plans-page">
      <header className="admin-page__hero admin-page__hero--split">
        <div>
          <span className="admin-page__eyebrow"><LuSparkles /> Subscription Plans</span>
          <h1>Manage Plans</h1>
          <p>Create pricing tiers, set billing cycles, and control which plans clients can purchase.</p>
        </div>
        <button type="button" className="admin-page__btn admin-page__btn--primary" onClick={openCreate}>
          <LuPlus />
          <span>Add Plan</span>
        </button>
      </header>

      <div className="admin-plans-page__summary card-wrapper">
        <div>
          <strong>{plans.length}</strong>
          <span>Total plans</span>
        </div>
        <div>
          <strong>{activeCount}</strong>
          <span>Active plans</span>
        </div>
        <div>
          <strong>{plans.filter((plan) => plan.billing_type === "monthly").length}</strong>
          <span>Monthly plans</span>
        </div>
      </div>

      <div className="admin-plans-page__grid">
        {plans.map((plan, index) => {
          const isFeatured = index === 1 || (/pro/i.test(plan.title) && plan.billing_type === "monthly");
          const Icon = plan.billing_type === "monthly" ? LuZap : LuCrown;

          return (
            <article
              key={plan.id}
              className={`admin-plans-page__card card-wrapper ${isFeatured ? "admin-plans-page__card--featured" : ""} ${plan.is_active ? "" : "admin-plans-page__card--inactive"}`}
            >
              {isFeatured ? <span className="admin-plans-page__ribbon">Popular</span> : null}
              {!plan.is_active ? <span className="admin-plans-page__ribbon admin-plans-page__ribbon--inactive">Inactive</span> : null}

              <div className="admin-plans-page__card-head">
                <span className="admin-plans-page__card-icon"><Icon /></span>
                <div>
                  <h2>{plan.title}</h2>
                  <p>{plan.description || "No description provided."}</p>
                </div>
              </div>

              <div className="admin-plans-page__price">
                <strong>${Number(plan.price).toFixed(2)}</strong>
                <span>{plan.currency} / {formatPlanInterval(plan)}</span>
              </div>

              <ul className="admin-plans-page__features">
                {(plan.inclusions ?? []).filter(Boolean).slice(0, 5).map((item) => (
                  <li key={item}><LuCheck /> {item}</li>
                ))}
                {!(plan.inclusions ?? []).filter(Boolean).length ? (
                  <li className="admin-plans-page__features-empty">No inclusions listed</li>
                ) : null}
              </ul>

              <div className="admin-plans-page__meta">
                <span><LuCalendar /> {plan.billing_type === "monthly" ? "Monthly billing" : `One-time · ${plan.duration_days ?? 30} days`}</span>
                <span>Sort order: {plan.sort_order ?? 0}</span>
              </div>

              <div className="admin-plans-page__actions">
                <button type="button" className="admin-page__btn admin-page__btn--ghost" onClick={() => openEdit(plan)}>
                  <LuPencil />
                  <span>Edit</span>
                </button>
                <button type="button" className="admin-page__btn admin-page__btn--danger" onClick={() => removePlan(plan)}>
                  <LuTrash2 />
                  <span>Deactivate</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {!plans.length ? (
        <div className="admin-page__empty card-wrapper">
          <p>No plans yet. Create your first subscription plan.</p>
          <button type="button" className="admin-page__btn admin-page__btn--primary" onClick={openCreate}>
            <LuPlus />
            <span>Add Plan</span>
          </button>
        </div>
      ) : null}

      {modalOpen ? (
        <div className="orders-modal">
          <div className="orders-modal__backdrop" onClick={() => setModalOpen(false)} />
          <div className="orders-modal__card admin-modal">
            <h3>{editingId ? "Edit Plan" : "Create Plan"}</h3>

            <div className="admin-modal__grid">
              <label className="marketplace-settings__field admin-modal__full">
                <span>Title</span>
                <input className="marketplace-settings__control" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </label>

              <label className="marketplace-settings__field admin-modal__full">
                <span>Description</span>
                <textarea className="marketplace-settings__control" rows={3} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </label>

              <label className="marketplace-settings__field">
                <span>Price</span>
                <input type="number" min="0" step="0.01" className="marketplace-settings__control" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </label>

              <label className="marketplace-settings__field">
                <span>Currency</span>
                <input className="marketplace-settings__control" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} />
              </label>

              <label className="marketplace-settings__field">
                <span>Billing Type</span>
                <select className="marketplace-settings__control" value={form.billing_type} onChange={(e) => setForm({ ...form, billing_type: e.target.value })}>
                  <option value="monthly">Monthly</option>
                  <option value="one_time">One Time</option>
                </select>
              </label>

              <label className="marketplace-settings__field">
                <span>Sort Order</span>
                <input type="number" min="0" className="marketplace-settings__control" value={form.sort_order ?? 0} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
              </label>

              {form.billing_type === "one_time" ? (
                <label className="marketplace-settings__field">
                  <span>Duration (days)</span>
                  <input type="number" min="1" className="marketplace-settings__control" value={form.duration_days ?? 30} onChange={(e) => setForm({ ...form, duration_days: Number(e.target.value) })} />
                </label>
              ) : null}

              <label className="marketplace-settings__field admin-modal__full">
                <span>Inclusions (one per line)</span>
                <textarea
                  className="marketplace-settings__control"
                  rows={5}
                  value={(form.inclusions ?? []).join("\n")}
                  onChange={(e) => setForm({ ...form, inclusions: e.target.value.split("\n") })}
                />
              </label>
            </div>

            <label className="marketplace-settings__field admin-modal__checkbox">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              <span>Active plan</span>
            </label>

            <div className="admin-modal__footer">
              <button type="button" className="admin-page__btn admin-page__btn--ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="button" className="admin-page__btn admin-page__btn--primary" disabled={saving} onClick={savePlan}>
                {saving ? "Saving…" : "Save Plan"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={Boolean(deleteConfirm)}
        title={`Deactivate ${deleteConfirm?.title ?? "this plan"}?`}
        confirmLabel="Deactivate"
        saving={deleting}
        onConfirm={confirmDeletePlan}
        onClose={() => setDeleteConfirm(null)}
      />
    </section>
  );
}

export default AdminPlansPage;
