import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  LuCalendar,
  LuCheck,
  LuCheckCheck,
  LuCrown,
  LuLayers,
  LuLoader,
  LuPencil,
  LuPlus,
  LuSearch,
  LuSparkles,
  LuTrash2,
  LuX,
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
import {
  PLAN_FEATURE_DEFINITIONS,
  PRODUCT_LIMIT_PRESETS,
  buildPlanInclusions,
  parseFeaturesAndExtras,
} from "./planFeatureDefinitions";

const emptyPlan = {
  title: "",
  description: "",
  products_limit: 200,
  features: {},
  customInclusions: [],
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
  const [featureSearch, setFeatureSearch] = useState("");

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
    setFeatureSearch("");
    setModalOpen(true);
  };

  const openEdit = (plan) => {
    setEditingId(plan.id);
    const parsed = parseFeaturesAndExtras(plan);
    setForm({
      title: plan.title ?? "",
      description: plan.description ?? "",
      products_limit:
        plan.products_limit !== null && plan.products_limit !== undefined
          ? Number(plan.products_limit)
          : parsed.products_limit,
      features:
        plan.features && Object.keys(plan.features).length > 0
          ? plan.features
          : parsed.features,
      customInclusions: parsed.customInclusions,
      price: plan.price ?? 0,
      currency: plan.currency ?? "USD",
      billing_type: plan.billing_type ?? "monthly",
      duration_days: plan.duration_days ?? 30,
      is_active: Boolean(plan.is_active),
      sort_order: plan.sort_order ?? 0,
    });
    setFeatureSearch("");
    setModalOpen(true);
  };

  const toggleFeature = (key) => {
    setForm((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [key]: !prev.features?.[key],
      },
    }));
  };

  const selectAllFeatures = () => {
    const all = {};
    PLAN_FEATURE_DEFINITIONS.forEach((f) => {
      all[f.key] = true;
    });
    setForm((prev) => ({ ...prev, features: all }));
  };

  const clearAllFeatures = () => {
    setForm((prev) => ({ ...prev, features: {} }));
  };

  const filteredFeatures = useMemo(() => {
    const query = (featureSearch || "").toLowerCase().trim();
    if (!query) {
      return PLAN_FEATURE_DEFINITIONS;
    }
    return PLAN_FEATURE_DEFINITIONS.filter(
      (f) =>
        f.title.toLowerCase().includes(query) ||
        f.description.toLowerCase().includes(query)
    );
  }, [featureSearch]);

  const selectedFeaturesCount = useMemo(() => {
    if (!form.features) return 0;
    return Object.values(form.features).filter(Boolean).length;
  }, [form.features]);

  const savePlan = async () => {
    if (!form.title.trim()) {
      toast.error("Plan title is required.");
      return;
    }

    setSaving(true);
    const finalInclusions = buildPlanInclusions(
      form.products_limit,
      form.features,
      form.customInclusions
    );

    const payload = {
      title: form.title.trim(),
      description: form.description || null,
      products_limit:
        form.products_limit !== "" && !isNaN(Number(form.products_limit))
          ? Math.max(0, parseInt(form.products_limit, 10))
          : 200,
      features: form.features || {},
      inclusions: finalInclusions,
      price: Number(form.price) >= 0 ? Number(form.price) : 0,
      currency: (form.currency || "USD").toUpperCase().slice(0, 3),
      billing_type: form.billing_type || "monthly",
      duration_days:
        form.billing_type === "one_time" ? Number(form.duration_days) || 30 : null,
      is_active: Boolean(form.is_active),
      sort_order: Number(form.sort_order) || 0,
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
      toast.error(
        err.response?.data?.error ??
          err.response?.data?.message ??
          "Save failed."
      );
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
          <span className="admin-page__eyebrow">
            <LuSparkles /> Subscription Plans
          </span>
          <h1>Manage Plans</h1>
          <p>
            Create pricing tiers, configure products allowance, and toggle included features.
          </p>
        </div>
        <button
          type="button"
          className="admin-page__btn admin-page__btn--primary"
          onClick={openCreate}
        >
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
          <strong>
            {plans.filter((plan) => plan.billing_type === "monthly").length}
          </strong>
          <span>Monthly plans</span>
        </div>
      </div>

      <div className="admin-plans-page__grid">
        {plans.map((plan, index) => {
          const isFeatured =
            index === 1 || (/pro/i.test(plan.title) && plan.billing_type === "monthly");
          const Icon = plan.billing_type === "monthly" ? LuZap : LuCrown;
          const featCount =
            plan.features && Object.keys(plan.features).length > 0
              ? Object.values(plan.features).filter(Boolean).length
              : (plan.inclusions ?? []).filter(Boolean).length;

          return (
            <article
              key={plan.id}
              className={`admin-plans-page__card card-wrapper ${
                isFeatured ? "admin-plans-page__card--featured" : ""
              } ${plan.is_active ? "" : "admin-plans-page__card--inactive"}`}
            >
              {isFeatured ? (
                <span className="admin-plans-page__ribbon">Popular</span>
              ) : null}
              {!plan.is_active ? (
                <span className="admin-plans-page__ribbon admin-plans-page__ribbon--inactive">
                  Inactive
                </span>
              ) : null}

              <div className="admin-plans-page__card-head">
                <span className="admin-plans-page__card-icon">
                  <Icon />
                </span>
                <div>
                  <h2>{plan.title}</h2>
                  <p>{plan.description || "No description provided."}</p>
                </div>
              </div>

              <div className="admin-plans-page__products-badge">
                <LuLayers />
                <span>
                  {(plan.products_limit ?? 200).toLocaleString()} Products
                </span>
              </div>

              <div className="admin-plans-page__price">
                <strong>${Number(plan.price).toFixed(2)}</strong>
                <span>
                  {plan.currency} / {formatPlanInterval(plan)}
                </span>
              </div>

              <span className="admin-plans-page__features-count">
                {featCount} {featCount === 1 ? "feature" : "features"} included
              </span>

              <ul className="admin-plans-page__features">
                {(plan.inclusions ?? []).filter(Boolean).slice(0, 5).map((item) => (
                  <li key={item}>
                    <LuCheck /> {item}
                  </li>
                ))}
                {(plan.inclusions ?? []).filter(Boolean).length > 5 ? (
                  <li className="admin-plans-page__features-empty">
                    + {(plan.inclusions ?? []).filter(Boolean).length - 5} more features
                  </li>
                ) : null}
                {!(plan.inclusions ?? []).filter(Boolean).length ? (
                  <li className="admin-plans-page__features-empty">
                    No inclusions listed
                  </li>
                ) : null}
              </ul>

              <div className="admin-plans-page__meta">
                <span>
                  <LuCalendar />{" "}
                  {plan.billing_type === "monthly"
                    ? "Monthly billing"
                    : `One-time · ${plan.duration_days ?? 30} days`}
                </span>
                <span>Sort order: {plan.sort_order ?? 0}</span>
              </div>

              <div className="admin-plans-page__actions">
                <button
                  type="button"
                  className="admin-page__btn admin-page__btn--ghost"
                  onClick={() => openEdit(plan)}
                >
                  <LuPencil />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  className="admin-page__btn admin-page__btn--danger"
                  onClick={() => removePlan(plan)}
                >
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
          <button
            type="button"
            className="admin-page__btn admin-page__btn--primary"
            onClick={openCreate}
          >
            <LuPlus />
            <span>Add Plan</span>
          </button>
        </div>
      ) : null}

      {modalOpen ? (
        <div className="orders-modal">
          <div
            className="orders-modal__backdrop"
            onClick={() => setModalOpen(false)}
          />
          <div className="orders-modal__card admin-modal admin-modal--wide">
            <h3>{editingId ? "Edit Plan" : "Create Plan"}</h3>

            <div className="admin-modal__grid">
              <label className="marketplace-settings__field admin-modal__full">
                <span>Plan Title *</span>
                <input
                  className="marketplace-settings__control"
                  placeholder="e.g. Starter, Advanced, Pro"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </label>

              <label className="marketplace-settings__field admin-modal__full">
                <span>Description</span>
                <textarea
                  className="marketplace-settings__control"
                  rows={2}
                  placeholder="Brief summary of the plan's target audience or key benefits"
                  value={form.description ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </label>

              <label className="marketplace-settings__field">
                <span>Price</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="marketplace-settings__control"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: e.target.value })
                  }
                />
              </label>

              <label className="marketplace-settings__field">
                <span>Currency</span>
                <input
                  className="marketplace-settings__control"
                  value={form.currency}
                  maxLength={3}
                  onChange={(e) =>
                    setForm({ ...form, currency: e.target.value.toUpperCase() })
                  }
                />
              </label>

              <label className="marketplace-settings__field">
                <span>Billing Type</span>
                <select
                  className="marketplace-settings__control"
                  value={form.billing_type}
                  onChange={(e) =>
                    setForm({ ...form, billing_type: e.target.value })
                  }
                >
                  <option value="monthly">Monthly</option>
                  <option value="one_time">One Time</option>
                </select>
              </label>

              <label className="marketplace-settings__field">
                <span>Sort Order</span>
                <input
                  type="number"
                  min="0"
                  className="marketplace-settings__control"
                  value={form.sort_order ?? 0}
                  onChange={(e) =>
                    setForm({ ...form, sort_order: Number(e.target.value) })
                  }
                />
              </label>

              {form.billing_type === "one_time" ? (
                <label className="marketplace-settings__field admin-modal__full">
                  <span>Duration (days)</span>
                  <input
                    type="number"
                    min="1"
                    className="marketplace-settings__control"
                    value={form.duration_days ?? 30}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        duration_days: Number(e.target.value),
                      })
                    }
                  />
                </label>
              ) : null}

              {/* Products Limit Integer Field */}
              <div className="admin-plans-modal__section">
                <div className="admin-plans-modal__section-header">
                  <div>
                    <span className="admin-plans-modal__section-title">
                      <LuLayers /> Products Limit (Integer)
                    </span>
                    <p className="admin-plans-modal__section-subtitle">
                      Import products from over 25 worldwide suppliers with a click of a button.
                    </p>
                  </div>
                  <span className="admin-plans-modal__badge">
                    {(Number(form.products_limit) || 0).toLocaleString()} Products
                  </span>
                </div>

                <input
                  type="number"
                  min="0"
                  step="1"
                  className="marketplace-settings__control"
                  placeholder="e.g. 200, 400, 800"
                  value={form.products_limit}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      products_limit:
                        e.target.value === ""
                          ? ""
                          : Math.max(0, parseInt(e.target.value, 10) || 0),
                    })
                  }
                />

                <div className="admin-plans-modal__chip-row">
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#64748b",
                      fontWeight: 600,
                    }}
                  >
                    Quick presets:
                  </span>
                  {PRODUCT_LIMIT_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={`admin-plans-modal__chip ${
                        Number(form.products_limit) === preset
                          ? "admin-plans-modal__chip--active"
                          : ""
                      }`}
                      onClick={() =>
                        setForm({ ...form, products_limit: preset })
                      }
                    >
                      {preset.toLocaleString()} Products
                    </button>
                  ))}
                </div>
              </div>

              {/* Features Checklist */}
              <div className="admin-plans-modal__section">
                <div className="admin-plans-modal__section-header">
                  <div>
                    <span className="admin-plans-modal__section-title">
                      <LuCheck /> Plan Features & Capabilities ({PLAN_FEATURE_DEFINITIONS.length})
                    </span>
                    <p className="admin-plans-modal__section-subtitle">
                      Check each feature included with this subscription plan.
                    </p>
                  </div>
                  <span className="admin-plans-modal__badge">
                    {selectedFeaturesCount} / {PLAN_FEATURE_DEFINITIONS.length} Included
                  </span>
                </div>

                <div className="admin-plans-modal__features-bar">
                  <div className="admin-plans-modal__search-wrap">
                    <LuSearch className="admin-plans-modal__search-icon" />
                    <input
                      type="text"
                      className="admin-plans-modal__search-input"
                      placeholder="Search features (e.g. tracking, VIP, monitor, store)..."
                      value={featureSearch}
                      onChange={(e) => setFeatureSearch(e.target.value)}
                    />
                  </div>
                  <div className="admin-plans-modal__actions-wrap">
                    <button
                      type="button"
                      className="admin-plans-modal__btn-sm"
                      onClick={selectAllFeatures}
                    >
                      <LuCheckCheck />
                      <span>Select All</span>
                    </button>
                    <button
                      type="button"
                      className="admin-plans-modal__btn-sm"
                      onClick={clearAllFeatures}
                    >
                      <LuX />
                      <span>Clear All</span>
                    </button>
                  </div>
                </div>

                <div className="admin-plans-modal__features-grid">
                  {filteredFeatures.map((feat) => {
                    const isChecked = Boolean(form.features?.[feat.key]);
                    return (
                      <label
                        key={feat.key}
                        className={`admin-plans-modal__feature-card ${
                          isChecked ? "is-selected" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="admin-plans-modal__feature-checkbox"
                          checked={isChecked}
                          onChange={() => toggleFeature(feat.key)}
                        />
                        <div className="admin-plans-modal__feature-info">
                          <span className="admin-plans-modal__feature-title">
                            {feat.title}
                          </span>
                          <span className="admin-plans-modal__feature-desc">
                            {feat.description}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                  {filteredFeatures.length === 0 ? (
                    <div
                      style={{
                        padding: "24px 16px",
                        textAlign: "center",
                        color: "#64748b",
                        gridColumn: "1 / -1",
                      }}
                    >
                      No features match &quot;{featureSearch}&quot;
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Extra Custom Inclusions */}
              <div className="admin-plans-modal__section">
                <label className="marketplace-settings__field admin-modal__full">
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>
                    Additional Custom Inclusions (Optional, one per line)
                  </span>
                  <textarea
                    className="marketplace-settings__control"
                    rows={2}
                    placeholder="Any custom bullet points not covered in the standard features list..."
                    value={(form.customInclusions ?? []).join("\n")}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        customInclusions: e.target.value.split("\n"),
                      })
                    }
                  />
                </label>
              </div>
            </div>

            <label className="marketplace-settings__field admin-modal__checkbox">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm({ ...form, is_active: e.target.checked })
                }
              />
              <span>Active plan (available to users for checkout)</span>
            </label>

            <div className="admin-modal__footer">
              <button
                type="button"
                className="admin-page__btn admin-page__btn--ghost"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-page__btn admin-page__btn--primary"
                disabled={saving}
                onClick={savePlan}
              >
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
