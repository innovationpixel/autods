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
  LuLock,
  LuPencil,
  LuPlus,
  LuSearch,
  LuShoppingCart,
  LuSparkles,
  LuStore,
  LuTrash2,
  LuUsers,
  LuX,
  LuZap,
} from "react-icons/lu";
import { selectUserRole } from "../../../store/selectors/AuthSelectors";
import { toast } from "../../../utils/toast";
import ConfirmModal from "../ConfirmModal";
import {
  createAdminPlan,
  deleteAdminPlan,
  getAdminPlanCustomers,
  getAdminPlans,
  updateAdminPlan,
} from "../../../services/PlanService";
import {
  ALL_FEATURE_DEFINITIONS,
  PRODUCT_LIMIT_PRESETS,
  buildPlanInclusions,
  parseFeaturesAndExtras,
} from "./planFeatureDefinitions";

const createEmptyPlan = (isCustom = false) => ({
  title: "",
  description: "",
  products_limit: 200,
  orders_limit: 100,
  stores_limit: 1,
  features: {},
  customInclusions: [],
  price: 0,
  currency: "USD",
  billing_type: "monthly",
  duration_days: 30,
  is_active: true,
  is_custom: Boolean(isCustom),
  assigned_user_ids: [],
  assign_immediately: false,
  expires_at: "",
  sort_order: 0,
});

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
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(() => createEmptyPlan(false));
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [featureSearch, setFeatureSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");

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

  const loadCustomers = () => {
    getAdminPlanCustomers({ limit: 500 })
      .then((res) => setCustomers(res.data?.customers ?? []))
      .catch(() => {});
  };

  useEffect(() => {
    if (role === "super_admin") {
      loadPlans();
      loadCustomers();
    }
  }, [role]);

  const openCreate = (isCustom = false) => {
    setEditingId(null);
    setForm(createEmptyPlan(isCustom));
    setFeatureSearch("");
    setCustomerSearch("");
    setModalOpen(true);
  };

  const openEdit = (plan) => {
    setEditingId(plan.id);
    const parsed = parseFeaturesAndExtras(plan);
    const assignedIds = Array.isArray(plan.assigned_users)
      ? plan.assigned_users.map((u) => Number(u.id))
      : [];

    setForm({
      title: plan.title ?? "",
      description: plan.description ?? "",
      products_limit:
        plan.products_limit !== null && plan.products_limit !== undefined
          ? Number(plan.products_limit)
          : parsed.products_limit,
      orders_limit:
        plan.orders_limit !== null && plan.orders_limit !== undefined
          ? Number(plan.orders_limit)
          : 100,
      stores_limit:
        plan.stores_limit !== null && plan.stores_limit !== undefined
          ? Number(plan.stores_limit)
          : 1,
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
      is_custom: Boolean(plan.is_custom),
      assigned_user_ids: assignedIds,
      assign_immediately: false,
      expires_at: "",
      sort_order: plan.sort_order ?? 0,
    });
    setFeatureSearch("");
    setCustomerSearch("");
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

  const toggleCustomer = (userId) => {
    const id = Number(userId);
    setForm((prev) => {
      const current = prev.assigned_user_ids ?? [];
      const exists = current.includes(id);
      return {
        ...prev,
        assigned_user_ids: exists
          ? current.filter((x) => x !== id)
          : [...current, id],
      };
    });
  };

  const selectAllFeatures = () => {
    const all = {};
    ALL_FEATURE_DEFINITIONS.forEach((f) => {
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
      return ALL_FEATURE_DEFINITIONS;
    }
    return ALL_FEATURE_DEFINITIONS.filter(
      (f) =>
        f.title.toLowerCase().includes(query) ||
        f.description.toLowerCase().includes(query)
    );
  }, [featureSearch]);

  const filteredCustomers = useMemo(() => {
    const query = (customerSearch || "").toLowerCase().trim();
    if (!query) {
      return customers;
    }
    return customers.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(query) ||
        (c.email || "").toLowerCase().includes(query)
    );
  }, [customers, customerSearch]);

  const customerMap = useMemo(() => {
    const map = new Map();
    customers.forEach((c) => map.set(Number(c.id), c));
    return map;
  }, [customers]);

  const selectedFeaturesCount = useMemo(() => {
    if (!form.features) return 0;
    return Object.values(form.features).filter(Boolean).length;
  }, [form.features]);

  const displayedPlans = useMemo(() => {
    if (typeFilter === "custom") {
      return plans.filter((p) => Boolean(p.is_custom));
    }
    if (typeFilter === "standard") {
      return plans.filter((p) => !p.is_custom);
    }
    return plans;
  }, [plans, typeFilter]);

  const savePlan = async () => {
    if (!form.title.trim()) {
      toast.error("Plan title is required.");
      return;
    }

    if (form.is_custom && (!form.assigned_user_ids || form.assigned_user_ids.length === 0)) {
      toast.error("Please select at least one customer for a Custom Package.");
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
      orders_limit:
        form.orders_limit !== "" && !isNaN(Number(form.orders_limit))
          ? Math.max(0, parseInt(form.orders_limit, 10))
          : null,
      stores_limit:
        form.stores_limit !== "" && !isNaN(Number(form.stores_limit))
          ? Math.max(0, parseInt(form.stores_limit, 10))
          : null,
      features: form.features || {},
      inclusions: finalInclusions,
      price: Number(form.price) >= 0 ? Number(form.price) : 0,
      currency: (form.currency || "USD").toUpperCase().slice(0, 3),
      billing_type: form.billing_type || "monthly",
      duration_days:
        form.billing_type === "one_time" ? Number(form.duration_days) || 30 : null,
      is_active: Boolean(form.is_active),
      is_custom: Boolean(form.is_custom),
      assigned_user_ids: form.is_custom ? (form.assigned_user_ids ?? []) : [],
      assign_immediately: Boolean(form.is_custom && form.assign_immediately),
      expires_at: form.is_custom && form.assign_immediately && form.expires_at ? form.expires_at : null,
      sort_order: Number(form.sort_order) || 0,
    };

    try {
      if (editingId) {
        await updateAdminPlan(editingId, payload);
        toast.success(form.is_custom ? "Custom package updated." : "Plan updated.");
      } else {
        await createAdminPlan(payload);
        toast.success(form.is_custom ? "Custom package created." : "Plan created.");
      }
      setModalOpen(false);
      loadPlans();
      loadCustomers();
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
  const customPlansCount = plans.filter((plan) => Boolean(plan.is_custom)).length;
  const standardPlansCount = plans.length - customPlansCount;

  return (
    <section className="admin-page admin-plans-page">
      <header className="admin-page__hero admin-page__hero--split">
        <div>
          <span className="admin-page__eyebrow">
            <LuSparkles /> Subscription Plans
          </span>
          <h1>Manage Plans &amp; Custom Packages</h1>
          <p>
            Create public pricing tiers or private custom packages tailored for specific customers.
          </p>
        </div>
        <div className="admin-plans-page__header-actions">
          <button
            type="button"
            className="admin-page__btn admin-page__btn--ghost"
            onClick={() => openCreate(true)}
          >
            <LuUsers />
            <span>Create Custom Package</span>
          </button>
          <button
            type="button"
            className="admin-page__btn admin-page__btn--primary"
            onClick={() => openCreate(false)}
          >
            <LuPlus />
            <span>Add Plan</span>
          </button>
        </div>
      </header>

      <div className="admin-plans-page__summary admin-plans-page__summary--4 card-wrapper">
        <div>
          <strong>{plans.length}</strong>
          <span>Total plans</span>
        </div>
        <div>
          <strong>{activeCount}</strong>
          <span>Active plans</span>
        </div>
        <div>
          <strong>{standardPlansCount}</strong>
          <span>Standard public plans</span>
        </div>
        <div>
          <strong>{customPlansCount}</strong>
          <span>Custom customer packages</span>
        </div>
      </div>

      <div className="admin-plans-page__tabs">
        <button
          type="button"
          className={`admin-plans-page__tab ${typeFilter === "all" ? "is-active" : ""}`}
          onClick={() => setTypeFilter("all")}
        >
          All ({plans.length})
        </button>
        <button
          type="button"
          className={`admin-plans-page__tab ${typeFilter === "standard" ? "is-active" : ""}`}
          onClick={() => setTypeFilter("standard")}
        >
          Standard Public Plans ({standardPlansCount})
        </button>
        <button
          type="button"
          className={`admin-plans-page__tab ${typeFilter === "custom" ? "is-active" : ""}`}
          onClick={() => setTypeFilter("custom")}
        >
          <LuLock />
          <span>Custom Packages ({customPlansCount})</span>
        </button>
      </div>

      <div className="admin-plans-page__grid">
        {displayedPlans.map((plan, index) => {
          const isCustom = Boolean(plan.is_custom);
          const isFeatured =
            !isCustom &&
            (index === 1 || (/pro/i.test(plan.title) && plan.billing_type === "monthly"));
          const Icon = isCustom ? LuLock : plan.billing_type === "monthly" ? LuZap : LuCrown;
          const featCount =
            plan.features && Object.keys(plan.features).length > 0
              ? Object.values(plan.features).filter(Boolean).length
              : (plan.inclusions ?? []).filter(Boolean).length;
          const assignedUsers = Array.isArray(plan.assigned_users) ? plan.assigned_users : [];

          return (
            <article
              key={plan.id}
              className={`admin-plans-page__card card-wrapper ${
                isFeatured ? "admin-plans-page__card--featured" : ""
              } ${isCustom ? "admin-plans-page__card--custom" : ""} ${
                plan.is_active ? "" : "admin-plans-page__card--inactive"
              }`}
            >
              {!plan.is_active ? (
                <span className="admin-plans-page__ribbon admin-plans-page__ribbon--inactive">
                  Inactive
                </span>
              ) : isCustom ? (
                <span className="admin-plans-page__ribbon admin-plans-page__ribbon--custom">
                  Custom
                </span>
              ) : isFeatured ? (
                <span className="admin-plans-page__ribbon">Popular</span>
              ) : null}

              <div className="admin-plans-page__card-head">
                <span className="admin-plans-page__card-icon">
                  <Icon />
                </span>
                <div>
                  <h2>{plan.title}</h2>
                  <p>{plan.description || (isCustom ? "Private customer package." : "No description provided.")}</p>
                </div>
              </div>

              <div className="admin-plans-page__quota-badges">
                <div className="admin-plans-page__products-badge">
                  <LuLayers />
                  <span>{(plan.products_limit ?? 200).toLocaleString()} Products</span>
                </div>
                {plan.orders_limit !== null && plan.orders_limit !== undefined ? (
                  <div className="admin-plans-page__mini-badge">
                    <LuShoppingCart />
                    <span>{Number(plan.orders_limit).toLocaleString()} Orders</span>
                  </div>
                ) : null}
                {plan.stores_limit !== null && plan.stores_limit !== undefined ? (
                  <div className="admin-plans-page__mini-badge">
                    <LuStore />
                    <span>{Number(plan.stores_limit).toLocaleString()} Stores</span>
                  </div>
                ) : null}
              </div>

              {isCustom ? (
                <div className="admin-plans-page__assigned-box">
                  <div className="admin-plans-page__assigned-head">
                    <LuUsers />
                    <span>
                      Assigned Customers ({assignedUsers.length})
                    </span>
                  </div>
                  {assignedUsers.length ? (
                    <div className="admin-plans-page__assigned-chips">
                      {assignedUsers.slice(0, 3).map((u) => (
                        <span key={u.id} className="admin-plans-page__assigned-chip" title={u.email}>
                          {u.name}
                        </span>
                      ))}
                      {assignedUsers.length > 3 ? (
                        <span className="admin-plans-page__assigned-chip admin-plans-page__assigned-chip--more">
                          +{assignedUsers.length - 3} more
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <span className="admin-plans-page__assigned-empty">
                      No customers assigned yet
                    </span>
                  )}
                </div>
              ) : null}

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

      {!displayedPlans.length ? (
        <div className="admin-page__empty card-wrapper">
          <p>
            {typeFilter === "custom"
              ? "No custom packages created yet. Create one specifically for select customers."
              : "No plans match this filter."}
          </p>
          <button
            type="button"
            className="admin-page__btn admin-page__btn--primary"
            onClick={() => openCreate(typeFilter === "custom")}
          >
            <LuPlus />
            <span>{typeFilter === "custom" ? "Create Custom Package" : "Add Plan"}</span>
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
            <h3>
              {editingId
                ? form.is_custom
                  ? "Edit Custom Package"
                  : "Edit Plan"
                : form.is_custom
                ? "Create Custom Package for Customer(s)"
                : "Create Plan"}
            </h3>

            {/* Package Visibility Mode */}
            <div className="admin-plans-modal__mode-switch">
              <button
                type="button"
                className={`admin-plans-modal__mode-btn ${!form.is_custom ? "is-active" : ""}`}
                onClick={() => setForm({ ...form, is_custom: false })}
              >
                <LuSparkles />
                <div>
                  <strong>Standard Public Plan</strong>
                  <span>Visible to all visitors and merchants on Plans page</span>
                </div>
              </button>
              <button
                type="button"
                className={`admin-plans-modal__mode-btn ${form.is_custom ? "is-active" : ""}`}
                onClick={() => setForm({ ...form, is_custom: true })}
              >
                <LuLock />
                <div>
                  <strong>Custom Customer Package</strong>
                  <span>Private package visible only to assigned customer(s)</span>
                </div>
              </button>
            </div>

            <div className="admin-modal__grid">
              <label className="marketplace-settings__field admin-modal__full">
                <span>{form.is_custom ? "Custom Package Title *" : "Plan Title *"}</span>
                <input
                  className="marketplace-settings__control"
                  placeholder={form.is_custom ? "e.g. VIP Scale Package - Acme Store" : "e.g. Starter, Advanced, Pro"}
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

              {/* Customer Multi-Select Assignment when Custom Package */}
              {form.is_custom ? (
                <div className="admin-plans-modal__section admin-plans-modal__customer-box">
                  <div className="admin-plans-modal__section-header">
                    <div>
                      <span className="admin-plans-modal__section-title">
                        <LuUsers /> Assign to Customer(s) *
                      </span>
                      <p className="admin-plans-modal__section-subtitle">
                        Only the customers selected below will see and be able to activate this package.
                      </p>
                    </div>
                    <span className="admin-plans-modal__badge">
                      {(form.assigned_user_ids ?? []).length} Selected
                    </span>
                  </div>

                  {(form.assigned_user_ids ?? []).length > 0 ? (
                    <div className="admin-plans-modal__selected-customers">
                      {form.assigned_user_ids.map((id) => {
                        const cust = customerMap.get(Number(id));
                        return (
                          <button
                            key={id}
                            type="button"
                            className="admin-plans-modal__chip admin-plans-modal__chip--active"
                            onClick={() => toggleCustomer(id)}
                            title="Click to remove"
                          >
                            <span>{cust ? `${cust.name} (${cust.email})` : `Customer #${id}`}</span>
                            <LuX />
                          </button>
                        );
                      })}
                    </div>
                  ) : null}

                  <div className="admin-plans-modal__search-wrap">
                    <LuSearch className="admin-plans-modal__search-icon" />
                    <input
                      type="text"
                      className="admin-plans-modal__search-input"
                      placeholder="Search customers by name or email..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                    />
                  </div>

                  <div className="admin-plans-modal__customer-list">
                    {filteredCustomers.map((customer) => {
                      const checked = (form.assigned_user_ids ?? []).includes(Number(customer.id));
                      return (
                        <label
                          key={customer.id}
                          className={`admin-plans-modal__customer-row ${checked ? "is-selected" : ""}`}
                        >
                          <input
                            type="checkbox"
                            className="admin-plans-modal__feature-checkbox"
                            checked={checked}
                            onChange={() => toggleCustomer(customer.id)}
                          />
                          <div className="admin-plans-modal__customer-info">
                            <strong>{customer.name}</strong>
                            <span>{customer.email}</span>
                          </div>
                          {customer.current_plan ? (
                            <span className="admin-plans-modal__customer-plan">
                              {customer.current_plan}
                            </span>
                          ) : null}
                        </label>
                      );
                    })}
                    {filteredCustomers.length === 0 ? (
                      <div className="admin-plans-modal__empty-inline">
                        No matching customers found.
                      </div>
                    ) : null}
                  </div>

                  <div className="admin-plans-modal__activate-row">
                    <label className="marketplace-settings__field admin-modal__checkbox">
                      <input
                        type="checkbox"
                        checked={Boolean(form.assign_immediately)}
                        onChange={(e) =>
                          setForm({ ...form, assign_immediately: e.target.checked })
                        }
                      />
                      <span>Activate immediately on selected customer(s) (skip checkout)</span>
                    </label>

                    {form.assign_immediately ? (
                      <label className="marketplace-settings__field">
                        <span>Optional Expiry Date</span>
                        <input
                          type="date"
                          className="marketplace-settings__control"
                          value={form.expires_at ?? ""}
                          onChange={(e) =>
                            setForm({ ...form, expires_at: e.target.value })
                          }
                        />
                      </label>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {/* Quotas Section */}
              <div className="admin-plans-modal__section">
                <div className="admin-plans-modal__section-header">
                  <div>
                    <span className="admin-plans-modal__section-title">
                      <LuLayers /> Quotas &amp; Limits
                    </span>
                    <p className="admin-plans-modal__section-subtitle">
                      Set product imports, monthly orders, and store connection limits.
                    </p>
                  </div>
                  <span className="admin-plans-modal__badge">
                    {(Number(form.products_limit) || 0).toLocaleString()} Products
                  </span>
                </div>

                <div className="admin-plans-modal__quota-grid">
                  <label className="marketplace-settings__field">
                    <span>Products &amp; Variations Limit</span>
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
                  </label>

                  <label className="marketplace-settings__field">
                    <span>Auto-Orders Limit</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="marketplace-settings__control"
                      placeholder="e.g. 100"
                      value={form.orders_limit}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          orders_limit:
                            e.target.value === ""
                              ? ""
                              : Math.max(0, parseInt(e.target.value, 10) || 0),
                        })
                      }
                    />
                  </label>

                  <label className="marketplace-settings__field">
                    <span>Connected Stores Limit</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="marketplace-settings__control"
                      placeholder="e.g. 1"
                      value={form.stores_limit}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          stores_limit:
                            e.target.value === ""
                              ? ""
                              : Math.max(0, parseInt(e.target.value, 10) || 0),
                        })
                      }
                    />
                  </label>
                </div>

                <div className="admin-plans-modal__chip-row">
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#64748b",
                      fontWeight: 600,
                    }}
                  >
                    Quick product presets:
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
                      <LuCheck /> Plan Features &amp; Add-on Access ({ALL_FEATURE_DEFINITIONS.length})
                    </span>
                    <p className="admin-plans-modal__section-subtitle">
                      Check every platform capability and add-on included with this package.
                    </p>
                  </div>
                  <span className="admin-plans-modal__badge">
                    {selectedFeaturesCount} / {ALL_FEATURE_DEFINITIONS.length} Included
                  </span>
                </div>

                <div className="admin-plans-modal__features-bar">
                  <div className="admin-plans-modal__search-wrap">
                    <LuSearch className="admin-plans-modal__search-icon" />
                    <input
                      type="text"
                      className="admin-plans-modal__search-input"
                      placeholder="Search features (e.g. trending, tracking, VIP, monitor, store)..."
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
                            {feat.title}{" "}
                            {feat.isAddon ? (
                              <span className="admin-plans-modal__addon-tag">Add-on</span>
                            ) : null}
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
              <span>Active plan (available to assigned users)</span>
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
                {saving
                  ? "Saving…"
                  : form.is_custom
                  ? "Save Custom Package"
                  : "Save Plan"}
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
