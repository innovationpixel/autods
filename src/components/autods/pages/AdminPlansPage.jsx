import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  LuCheck,
  LuCheckCheck,
  LuCircleAlert,
  LuClock,
  LuLayers,
  LuLoader,
  LuLock,
  LuPlus,
  LuSearch,
  LuShoppingCart,
  LuSparkles,
  LuStore,
  LuUsers,
  LuX,
} from "react-icons/lu";
import { selectUserRole } from "../../../store/selectors/AuthSelectors";
import { getStoredUser } from "../../../services/AuthService";
import { toast } from "../../../utils/toast";
import ConfirmModal from "../ConfirmModal";
import PlanReferenceCard from "./PlanReferenceCard";
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
  annual_price: "",
  currency: "USD",
  billing_type: "monthly",
  duration_days: 30,
  has_free_trial: false,
  free_trial_days: "3",
  is_sign_free: false,
  is_active: true,
  is_custom: Boolean(isCustom),
  assigned_user_ids: [],
  assign_immediately: false,
  expires_at: "",
  sort_order: 0,
});

function formatCurrencyCompact(value) {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return "0.00";
  const rounded = Math.round(num * 100) / 100;
  return Number.isInteger(rounded) ? rounded.toLocaleString() : rounded.toFixed(2);
}

function computePlanDiscountStats(priceValue, annualValue, billingType) {
  const numericPrice = Number(priceValue);
  const validPrice = Number.isFinite(numericPrice) && numericPrice >= 0 ? numericPrice : 0;

  if (billingType === "yearly") {
    return {
      monthly12: 0,
      hasAnnual: true,
      annualPrice: validPrice,
      savings: 0,
      discountPercent: 0,
      monthlyEquivalent: Math.round((validPrice / 12) * 100) / 100,
    };
  }

  if (billingType !== "monthly") {
    return {
      monthly12: 0,
      hasAnnual: false,
      annualPrice: null,
      savings: 0,
      discountPercent: 0,
      monthlyEquivalent: null,
    };
  }

  const monthly12 = Math.round(validPrice * 12 * 100) / 100;
  const hasAnnualInput =
    annualValue !== "" &&
    annualValue !== null &&
    annualValue !== undefined &&
    !Number.isNaN(Number(annualValue)) &&
    Number(annualValue) >= 0;

  if (!hasAnnualInput) {
    return {
      monthly12,
      hasAnnual: false,
      annualPrice: null,
      savings: 0,
      discountPercent: 0,
      monthlyEquivalent: null,
    };
  }

  const annualPrice = Math.round(Number(annualValue) * 100) / 100;
  const savings =
    monthly12 > 0 && annualPrice < monthly12
      ? Math.round((monthly12 - annualPrice) * 100) / 100
      : 0;
  const discountPercent =
    monthly12 > 0 && annualPrice < monthly12
      ? Math.round(((monthly12 - annualPrice) / monthly12) * 1000) / 10
      : 0;
  const monthlyEquivalent = Math.round((annualPrice / 12) * 100) / 100;

  return {
    monthly12,
    hasAnnual: true,
    annualPrice,
    savings,
    discountPercent,
    monthlyEquivalent,
  };
}

function AdminPlansPage() {
  const role = useSelector(selectUserRole) ?? getStoredUser()?.role;
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [billingCyclePreview, setBillingCyclePreview] = useState("monthly");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(() => createEmptyPlan(false));
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [activatingId, setActivatingId] = useState(null);
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
      annual_price:
        plan.billing_type === "monthly" &&
        plan.annual_price !== null &&
        plan.annual_price !== undefined
          ? String(plan.annual_price)
          : "",
      currency: plan.currency ?? "USD",
      billing_type: plan.billing_type ?? "monthly",
      duration_days: plan.duration_days ?? 30,
      has_free_trial: Boolean(plan.has_free_trial),
      free_trial_days:
        plan.free_trial_days !== null && plan.free_trial_days !== undefined
          ? String(plan.free_trial_days)
          : plan.has_free_trial
          ? "3"
          : "",
      is_sign_free: !plan.is_custom && Boolean(plan.is_sign_free),
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

  const formDiscountStats = useMemo(
    () => computePlanDiscountStats(form.price, form.annual_price, form.billing_type),
    [form.price, form.annual_price, form.billing_type]
  );

  const displayedPlans = useMemo(() => {
    if (typeFilter === "custom") {
      return plans.filter((p) => Boolean(p.is_custom));
    }
    if (typeFilter === "standard") {
      return plans.filter((p) => !p.is_custom);
    }
    return plans;
  }, [plans, typeFilter]);

  const hasAnyAnnualOption = useMemo(
    () =>
      displayedPlans.some(
        (p) =>
          Boolean(p.has_annual_plan) ||
          p.billing_type === "yearly" ||
          (p.billing_type === "monthly" &&
            p.annual_price !== null &&
            p.annual_price !== undefined &&
            p.annual_price !== "")
      ),
    [displayedPlans]
  );

  const displayedMaxDiscount = useMemo(() => {
    let best = 0;
    displayedPlans.forEach((p) => {
      let pct = Number(p.annual_discount_percent ?? 0);
      if (!pct && p.billing_type === "monthly" && p.annual_price !== null && p.annual_price !== undefined) {
        const m12 = Number(p.price ?? 0) * 12;
        const a = Number(p.annual_price);
        if (m12 > 0 && a < m12) {
          pct = Math.round(((m12 - a) / m12) * 1000) / 10;
        }
      }
      if (pct > best) best = pct;
    });
    return best;
  }, [displayedPlans]);

  const featuredPlanId = useMemo(() => {
    const publicPlans = displayedPlans.filter((p) => !p.is_custom);
    if (!publicPlans.length) return null;
    const pro =
      publicPlans.find(
        (p) =>
          /\bpro\b|professional/i.test(p.title || "") &&
          (p.base_billing_type || p.billing_type) === "monthly"
      ) ??
      publicPlans.find(
        (p) =>
          /pro/i.test(p.title || "") &&
          (p.base_billing_type || p.billing_type) === "monthly"
      );
    if (pro) return pro.id;
    const monthly = publicPlans.filter(
      (p) => (p.base_billing_type || p.billing_type) === "monthly"
    );
    if (monthly.length >= 2) return monthly[1]?.id;
    return publicPlans[1]?.id ?? publicPlans[0]?.id;
  }, [displayedPlans]);

  const savePlan = async () => {
    if (!form.title.trim()) {
      toast.error("Plan title is required.");
      return;
    }

    if (form.is_custom && (!form.assigned_user_ids || form.assigned_user_ids.length === 0)) {
      toast.error("Please select at least one customer for a Custom Package.");
      return;
    }

    const parsedTrialDays = Number(form.free_trial_days);
    if (
      form.has_free_trial &&
      (!Number.isInteger(parsedTrialDays) || parsedTrialDays < 1 || parsedTrialDays > 365)
    ) {
      toast.error("Free Trail days must be a whole number between 1 and 365.");
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
      annual_price:
        form.billing_type === "monthly"
          ? form.annual_price !== "" &&
            form.annual_price !== null &&
            form.annual_price !== undefined &&
            !isNaN(Number(form.annual_price)) &&
            Number(form.annual_price) >= 0
            ? Number(form.annual_price)
            : null
          : form.billing_type === "yearly"
          ? Number(form.price) >= 0
            ? Number(form.price)
            : 0
          : null,
      currency: (form.currency || "USD").toUpperCase().slice(0, 3),
      billing_type: form.billing_type || "monthly",
      duration_days:
        form.billing_type === "one_time" ? Number(form.duration_days) || 30 : null,
      has_free_trial: Boolean(form.has_free_trial),
      free_trial_days: form.has_free_trial ? parseInt(form.free_trial_days, 10) : null,
      is_sign_free: !form.is_custom && Boolean(form.is_sign_free),
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

  const reactivatePlan = async (plan) => {
    if (!plan?.id) {
      return;
    }

    setActivatingId(plan.id);
    const billingType = plan.billing_type || "monthly";
    const parsed = parseFeaturesAndExtras(plan);
    const payload = {
      title: plan.title,
      description: plan.description ?? null,
      products_limit:
        plan.products_limit !== null && plan.products_limit !== undefined
          ? Number(plan.products_limit)
          : parsed.products_limit,
      orders_limit:
        plan.orders_limit !== null && plan.orders_limit !== undefined
          ? Number(plan.orders_limit)
          : null,
      stores_limit:
        plan.stores_limit !== null && plan.stores_limit !== undefined
          ? Number(plan.stores_limit)
          : null,
      features: plan.features && Object.keys(plan.features).length > 0 ? plan.features : parsed.features,
      inclusions: Array.isArray(plan.inclusions) ? plan.inclusions : [],
      price: Number(plan.price ?? 0),
      annual_price:
        billingType === "monthly"
          ? plan.annual_price !== null && plan.annual_price !== undefined && plan.annual_price !== ""
            ? Number(plan.annual_price)
            : null
          : billingType === "yearly"
          ? Number(plan.price ?? 0)
          : null,
      currency: (plan.currency || "USD").toUpperCase().slice(0, 3),
      billing_type: billingType,
      duration_days: billingType === "one_time" ? Number(plan.duration_days) || 30 : null,
      has_free_trial: Boolean(plan.has_free_trial),
      free_trial_days:
        plan.has_free_trial && plan.free_trial_days ? Number(plan.free_trial_days) : null,
      is_sign_free: !plan.is_custom && Boolean(plan.is_sign_free),
      is_active: true,
      is_custom: Boolean(plan.is_custom),
      sort_order: Number(plan.sort_order ?? 0),
    };

    try {
      await updateAdminPlan(plan.id, payload);
      toast.success("Plan activated.");
      loadPlans();
    } catch (err) {
      toast.error(
        err.response?.data?.error ?? err.response?.data?.message ?? "Failed to activate plan."
      );
    } finally {
      setActivatingId(null);
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
  const activeSignFreePlan = plans.find(
    (plan) => !plan.is_custom && Boolean(plan.is_sign_free) && plan.is_active !== false
  );
  const otherSignFreePlan = plans.find(
    (plan) => !plan.is_custom && Boolean(plan.is_sign_free) && Number(plan.id) !== Number(editingId)
  );
  const otherActiveSignFreePlan = plans.find(
    (plan) =>
      !plan.is_custom &&
      Boolean(plan.is_sign_free) &&
      plan.is_active !== false &&
      Number(plan.id) !== Number(editingId)
  );

  return (
    <section className="admin-page admin-plans-page admin-plans-page--ref">
      <div className="admin-plans-page__ref-shell card-wrapper">
        <header className="admin-plans-page__ref-head">
          <div>
            <span className="admin-page__eyebrow">
              <LuSparkles /> Subscription Plans
            </span>
            <h1>Manage Plans &amp; Custom Packages</h1>
            <p>
              Powerful automation tools to help you import, list, manage and grow your dropshipping business.
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

        <div className="admin-plans-page__ref-toolbar">
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

          <div className="admin-plans-page__toolbar-right">
            <div className="admin-plans-page__ref-stats">
              <span><strong>{activeCount}</strong> Active</span>
              <span><strong>{standardPlansCount}</strong> Public</span>
              <span><strong>{customPlansCount}</strong> Custom</span>
              <span
                className={`admin-plans-page__signfree-note ${
                  activeSignFreePlan ? "is-configured" : "is-missing"
                }`}
              >
                {activeSignFreePlan
                  ? `Sign Free: ${activeSignFreePlan.title}`
                  : "No Sign Free (Auto-Deactivate)"}
              </span>
            </div>
          </div>
        </div>

        {displayedPlans.length && hasAnyAnnualOption ? (
          <div className="plans-billing-bar admin-plans-page__billing-bar">
            <div className="plans-billing-toggle" role="group" aria-label="Preview Billing Cycle">
              <button
                type="button"
                className={`plans-billing-toggle__btn ${billingCyclePreview === "monthly" ? "is-active" : ""}`}
                onClick={() => setBillingCyclePreview("monthly")}
              >
                <span>Monthly</span>
              </button>
              <button
                type="button"
                className={`plans-billing-toggle__btn ${billingCyclePreview === "annual" ? "is-active" : ""}`}
                onClick={() => setBillingCyclePreview("annual")}
              >
                <span>Annual</span>
                {displayedMaxDiscount > 0 ? (
                  <span className="plans-billing-toggle__save-badge">
                    Save up to {displayedMaxDiscount}%
                  </span>
                ) : null}
              </button>
            </div>
            {billingCyclePreview === "annual" && displayedMaxDiscount > 0 ? (
              <span className="plans-billing-bar__hint">
                Discount calculated against 12 months of monthly billing.
              </span>
            ) : null}
          </div>
        ) : null}

        {displayedPlans.length ? (
          <div
            className={`pricing-grid ${
              displayedPlans.length >= 5 ? "pricing-grid--dense" : ""
            }`}
          >
            {displayedPlans.map((plan, index) => {
              const isCustom = Boolean(plan.is_custom);
              const isFeatured = !isCustom && plan.id === featuredPlanId;

              return (
                <PlanReferenceCard
                  key={plan.id}
                  plan={plan}
                  index={index}
                  isFeatured={isFeatured}
                  mode="admin"
                  billingCycle={billingCyclePreview}
                  activatingId={activatingId}
                  onEdit={openEdit}
                  onDeactivate={removePlan}
                  onActivate={reactivatePlan}
                />
              );
            })}
          </div>
        ) : null}

        {!displayedPlans.length ? (
          <div className="admin-page__empty">
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
      </div>

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
                onClick={() => setForm({ ...form, is_custom: true, is_sign_free: false })}
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
                <span>
                  {form.billing_type === "yearly"
                    ? "Annual Price (12-Month Total) *"
                    : form.billing_type === "monthly"
                    ? "Monthly Price *"
                    : "Price *"}
                </span>
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

              {form.billing_type === "monthly" ? (
                <label className="marketplace-settings__field">
                  <span>Annual Price (Optional · 12-Month Total)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 190.00 (leave blank for monthly-only)"
                    className="marketplace-settings__control"
                    value={form.annual_price}
                    onChange={(e) =>
                      setForm({ ...form, annual_price: e.target.value })
                    }
                  />
                </label>
              ) : (
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
              )}

              <label className="marketplace-settings__field">
                <span>Billing Type</span>
                <select
                  className="marketplace-settings__control"
                  value={form.billing_type}
                  onChange={(e) =>
                    setForm({ ...form, billing_type: e.target.value })
                  }
                >
                  <option value="monthly">Monthly (+ Optional Annual)</option>
                  <option value="yearly">Yearly (Annual Only)</option>
                  <option value="one_time">One Time</option>
                </select>
              </label>

              {form.billing_type === "monthly" ? (
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
              ) : null}

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

              {form.billing_type === "monthly" ? (
                <div className="admin-plans-modal__discount-preview admin-modal__full">
                  <div className="admin-plans-modal__discount-info">
                    <div>
                      <strong>
                        12-Month Rate: {form.currency || "USD"} {formatCurrencyCompact(formDiscountStats.monthly12)}
                      </strong>
                      {formDiscountStats.hasAnnual ? (
                        <span className="admin-plans-modal__discount-summary">
                          {" "}
                          vs Annual Price <strong>{form.currency || "USD"} {formatCurrencyCompact(formDiscountStats.annualPrice)}</strong>{" "}
                          ({formatCurrencyCompact(formDiscountStats.monthlyEquivalent)}/mo effective)
                        </span>
                      ) : (
                        <span className="admin-plans-modal__discount-summary">
                          {" "}
                          · Enter an annual price or pick a preset to calculate the annual discount.
                        </span>
                      )}
                    </div>
                    {formDiscountStats.hasAnnual ? (
                      <span
                        className={`admin-plans-modal__discount-pill ${
                          formDiscountStats.discountPercent > 0 ? "is-saving" : ""
                        }`}
                      >
                        {formDiscountStats.discountPercent > 0
                          ? `Save ${formDiscountStats.discountPercent}% (${form.currency || "USD"} ${formatCurrencyCompact(formDiscountStats.savings)}/yr)`
                          : "0% Discount"}
                      </span>
                    ) : null}
                  </div>
                  {Number(form.price) > 0 ? (
                    <div className="admin-plans-modal__discount-presets">
                      <span>Quick annual discount:</span>
                      {[15, 20, 25].map((pct) => {
                        const suggested = (Number(form.price) * 12 * (1 - pct / 100)).toFixed(2);
                        return (
                          <button
                            key={pct}
                            type="button"
                            className={`admin-plans-modal__chip ${
                              Number(form.annual_price) === Number(suggested)
                                ? "admin-plans-modal__chip--active"
                                : ""
                            }`}
                            onClick={() => setForm({ ...form, annual_price: suggested })}
                          >
                            -{pct}% (${suggested}/yr)
                          </button>
                        );
                      })}
                      {form.annual_price !== "" ? (
                        <button
                          type="button"
                          className="admin-plans-modal__chip"
                          onClick={() => setForm({ ...form, annual_price: "" })}
                        >
                          Clear Annual
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : form.billing_type === "yearly" ? (
                <div className="admin-plans-modal__discount-preview admin-modal__full">
                  <div className="admin-plans-modal__discount-info">
                    <span>
                      Customers pay <strong>{form.currency || "USD"} {formatCurrencyCompact(formDiscountStats.annualPrice)}</strong> once per year ({" "}
                      <strong>{form.currency || "USD"} {formatCurrencyCompact(formDiscountStats.monthlyEquivalent)}/mo</strong> effective).
                    </span>
                    <span className="admin-plans-modal__discount-pill">Annual Only</span>
                  </div>
                </div>
              ) : null}

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

            <div className="admin-plans-modal__trial-box">
              <div className="admin-plans-modal__section-header">
                <div>
                  <span className="admin-plans-modal__section-title">
                    <LuClock /> Free Trail &amp; Sign Free Lifecycle
                  </span>
                  <p className="admin-plans-modal__section-subtitle">
                    Configure free trial access days and the automatic fallback Free plan behavior when trials end.
                  </p>
                </div>
              </div>

              <label className="marketplace-settings__field admin-modal__checkbox">
                <input
                  type="checkbox"
                  checked={Boolean(form.has_free_trial)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setForm({
                      ...form,
                      has_free_trial: checked,
                      free_trial_days:
                        checked && (!form.free_trial_days || Number(form.free_trial_days) < 1)
                          ? "3"
                          : form.free_trial_days,
                    });
                  }}
                />
                <span>
                  <strong>Free Trail</strong> — Give users free access to this plan&apos;s resources for N days before upgrading or switching
                </span>
              </label>

              {form.has_free_trial ? (
                <div className="admin-plans-modal__trial-days-row">
                  <label className="marketplace-settings__field">
                    <span>Trial Days *</span>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      step="1"
                      placeholder="e.g. 2, 3"
                      className="marketplace-settings__control"
                      value={form.free_trial_days}
                      onChange={(e) =>
                        setForm({ ...form, free_trial_days: e.target.value })
                      }
                    />
                  </label>
                  <div className="admin-plans-modal__discount-presets">
                    <span>Quick presets:</span>
                    {[2, 3, 7, 14].map((days) => (
                      <button
                        key={days}
                        type="button"
                        className={`admin-plans-modal__chip ${
                          Number(form.free_trial_days) === days
                            ? "admin-plans-modal__chip--active"
                            : ""
                        }`}
                        onClick={() =>
                          setForm({ ...form, free_trial_days: String(days) })
                        }
                      >
                        {days} Days
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {!form.is_custom ? (
                <div className="admin-plans-modal__signfree-block">
                  <label className="marketplace-settings__field admin-modal__checkbox">
                    <input
                      type="checkbox"
                      checked={Boolean(form.is_sign_free)}
                      onChange={(e) =>
                        setForm({ ...form, is_sign_free: e.target.checked })
                      }
                    />
                    <span>
                      <strong>Sign Free</strong> — Marks this plan as the automatic Free fallback when users&apos; Free Trail ends (only one plan can be Sign Free)
                    </span>
                  </label>

                  {form.is_sign_free && otherSignFreePlan ? (
                    <div className="admin-plans-modal__trial-warning is-info">
                      <LuCircleAlert />
                      <span>
                        Enabling <strong>Sign Free</strong> here will automatically uncheck Sign Free on{" "}
                        <strong>{otherSignFreePlan.title}</strong>.
                      </span>
                    </div>
                  ) : null}

                  {!form.is_sign_free && !otherActiveSignFreePlan ? (
                    <div className="admin-plans-modal__trial-warning">
                      <LuCircleAlert />
                      <span>
                        No <strong>Sign Free</strong> plan is configured yet — users whose Free Trail expires will automatically be marked <strong>Inactive</strong> and cannot log in to the portal.
                      </span>
                    </div>
                  ) : null}

                  {form.is_sign_free && Number(form.price) > 0 ? (
                    <div className="admin-plans-modal__trial-warning">
                      <LuCircleAlert />
                      <span>
                        Sign Free fallback plans are normally priced at <strong>$0</strong> so users can activate or switch cleanly without payment.
                      </span>
                      <button
                        type="button"
                        className="admin-plans-modal__chip"
                        onClick={() => setForm({ ...form, price: 0, annual_price: "" })}
                      >
                        Set $0 Price
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
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
