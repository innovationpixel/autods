import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { LuLoader, LuPencil, LuPlus, LuTrash2 } from "react-icons/lu";
import { selectUserRole } from "../../../store/selectors/AuthSelectors";
import { toast } from "../../../utils/toast";
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

function AdminPlansPage() {
  const role = useSelector(selectUserRole);
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyPlan);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (role !== "super_admin") {
      navigate("/plans");
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

  const removePlan = async (id) => {
    if (!window.confirm("Deactivate this plan?")) return;
    try {
      await deleteAdminPlan(id);
      toast.success("Plan deactivated.");
      loadPlans();
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Delete failed.");
    }
  };

  if (role !== "super_admin") {
    return null;
  }

  if (loading) {
    return (
      <section className="plans-page card-wrapper" style={{ padding: 40, textAlign: "center" }}>
        <LuLoader style={{ animation: "spin 1s linear infinite" }} />
      </section>
    );
  }

  return (
    <section className="plans-page admin-plans-page">
      <div className="admin-plans-page__head">
        <h2>Manage Plans</h2>
        <button type="button" className="marketplace-settings__plan-btn" onClick={openCreate}>
          <LuPlus /> Add Plan
        </button>
      </div>

      <div className="admin-plans-table card-wrapper">
        <table className="products-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Price</th>
              <th>Billing</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id}>
                <td>{plan.title}</td>
                <td>${Number(plan.price).toFixed(2)} {plan.currency}</td>
                <td>{plan.billing_type}</td>
                <td>{plan.is_active ? "Yes" : "No"}</td>
                <td>
                  <button type="button" className="orders-icon-btn" onClick={() => openEdit(plan)} aria-label="Edit">
                    <LuPencil />
                  </button>
                  <button type="button" className="orders-icon-btn" onClick={() => removePlan(plan.id)} aria-label="Delete">
                    <LuTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen ? (
        <div className="orders-modal">
          <div className="orders-modal__backdrop" onClick={() => setModalOpen(false)} />
          <div className="orders-modal__card admin-plans-modal">
            <h3>{editingId ? "Edit Plan" : "Create Plan"}</h3>
            <label className="marketplace-settings__field">
              <span>Title</span>
              <input className="marketplace-settings__control" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
            <label className="marketplace-settings__field">
              <span>Description</span>
              <textarea className="marketplace-settings__control" value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
            <label className="marketplace-settings__field">
              <span>Price</span>
              <input type="number" className="marketplace-settings__control" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
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
            {form.billing_type === "one_time" ? (
              <label className="marketplace-settings__field">
                <span>Duration (days)</span>
                <input type="number" className="marketplace-settings__control" value={form.duration_days ?? 30} onChange={(e) => setForm({ ...form, duration_days: Number(e.target.value) })} />
              </label>
            ) : null}
            <label className="marketplace-settings__field">
              <span>Inclusions (one per line)</span>
              <textarea
                className="marketplace-settings__control"
                value={(form.inclusions ?? []).join("\n")}
                onChange={(e) => setForm({ ...form, inclusions: e.target.value.split("\n") })}
              />
            </label>
            <label className="marketplace-settings__field">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              <span>Active</span>
            </label>
            <button type="button" className="orders-modal__primary" disabled={saving} onClick={savePlan}>
              {saving ? "Saving…" : "Save Plan"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default AdminPlansPage;
