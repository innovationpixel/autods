import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  LuCheck,
  LuCheckCheck,
  LuCrown,
  LuLayers,
  LuLoader,
  LuLock,
  LuMail,
  LuMailCheck,
  LuPackagePlus,
  LuPencil,
  LuPlus,
  LuRotateCcw,
  LuSearch,
  LuShoppingCart,
  LuSlidersHorizontal,
  LuSparkles,
  LuStore,
  LuTrash2,
  LuUsers,
  LuX,
} from "react-icons/lu";
import { selectUserRole } from "../../../store/selectors/AuthSelectors";
import { getStoredUser } from "../../../services/AuthService";
import { toast } from "../../../utils/toast";
import { getAdminPlans, getPlans } from "../../../services/PlanService";
import ConfirmModal from "../ConfirmModal";
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
  sendAdminUserExpiredInvoice,
  updateAdminUser,
  updateAdminUserPlanDetails,
} from "../../../services/AdminService";
import AdminSortableHeader from "../AdminSortableHeader";
import AdminPagination from "../AdminPagination";
import {
  ALL_FEATURE_DEFINITIONS,
  QUOTA_INCREASE_PRESETS,
} from "./planFeatureDefinitions";

const emptyClientForm = {
  name: "",
  email: "",
  password: "",
  role: "client",
  is_active: true,
  is_plan_paid: false,
  current_plan_id: "",
  plan_expires_at: "",
  wallet_balance: 0,
  wallet_currency: "USD",
};

function toLocalDateInput(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getTomorrowDateInput() {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  return toLocalDateInput(next);
}

function isStrictFutureDateInput(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return value > toLocalDateInput(new Date());
}

function computeFutureExpiryInput(planObj) {
  const next = new Date();
  if (planObj?.billing_type === "yearly") {
    next.setFullYear(next.getFullYear() + 1);
  } else if (planObj?.billing_type === "one_time" && Number(planObj?.duration_days) > 0) {
    next.setDate(next.getDate() + Number(planObj.duration_days));
  } else {
    next.setMonth(next.getMonth() + 1);
  }
  return toLocalDateInput(next);
}

function isExpiredIsoDate(value) {
  if (!value) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.getTime() < Date.now();
}

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

function resolveBaseLimits(planObj) {
  if (!planObj) {
    return {
      products_limit: 100,
      orders_limit: 100,
      stores_limit: 1,
      features: {},
    };
  }
  const features = planObj.features && typeof planObj.features === "object" ? { ...planObj.features } : {};
  const storesDefault =
    planObj.stores_limit !== null && planObj.stores_limit !== undefined
      ? Number(planObj.stores_limit)
      : features.unlimited_stores_integration
      ? 999
      : 1;

  return {
    products_limit:
      planObj.products_limit !== null && planObj.products_limit !== undefined
        ? Number(planObj.products_limit)
        : 200,
    orders_limit:
      planObj.orders_limit !== null && planObj.orders_limit !== undefined
        ? Number(planObj.orders_limit)
        : 100,
    stores_limit: storesDefault,
    features,
  };
}

function AdminClientsPage() {
  const role = useSelector(selectUserRole) ?? getStoredUser()?.role;
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [plans, setPlans] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [sort, setSort] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyClientForm);
  const [expiryTouched, setExpiryTouched] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [togglingRowKey, setTogglingRowKey] = useState(null);
  const [sendingInvoiceUserId, setSendingInvoiceUserId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Update Plan Details Popup State
  const [planModalClient, setPlanModalClient] = useState(null);
  const [planForm, setPlanForm] = useState(null);
  const [planFeatureSearch, setPlanFeatureSearch] = useState("");
  const [savingPlanDetails, setSavingPlanDetails] = useState(false);

  const tomorrowDateInput = useMemo(() => getTomorrowDateInput(), []);

  useEffect(() => {
    if (role !== "super_admin") {
      navigate("/");
    }
  }, [role, navigate]);

  const loadPlans = useCallback(() => {
    getAdminPlans()
      .then((res) => setPlans(res.data?.plans ?? []))
      .catch(() =>
        getPlans({ scope: "public" })
          .then((res) => setPlans(res.data?.plans ?? []))
          .catch(() => {})
      );
  }, []);

  const loadClients = useCallback(() => {
    setLoading(true);
    getAdminUsers({
      page,
      per_page: perPage,
      search: search.trim() || undefined,
      role: "client",
      is_active: statusFilter || undefined,
      payment_status: paymentFilter || undefined,
      plan_id: planFilter || undefined,
      sort,
      sort_dir: sortDir,
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
  }, [page, perPage, search, statusFilter, paymentFilter, planFilter, sort, sortDir]);

  const handleSort = (key, dir) => {
    setSort(key);
    setSortDir(dir);
    setPage(1);
  };

  useEffect(() => {
    if (role === "super_admin") {
      loadPlans();
      loadClients();
    }
  }, [role, loadPlans, loadClients]);

  const openCreate = () => {
    setEditingId(null);
    setExpiryTouched(false);
    setForm(emptyClientForm);
    setModalOpen(true);
  };

  const openEdit = (client) => {
    setEditingId(client.id);
    setExpiryTouched(Boolean(client.plan_expires_at));
    setForm({
      name: client.name ?? "",
      email: client.email ?? "",
      password: "",
      role: "client",
      is_active: client.is_active ?? true,
      is_plan_paid: Boolean(client.is_plan_paid),
      current_plan_id: client.current_plan_id ? String(client.current_plan_id) : "",
      plan_expires_at: client.plan_expires_at ? client.plan_expires_at.slice(0, 10) : "",
      wallet_balance: client.wallet_balance ?? 0,
      wallet_currency: client.wallet_currency ?? "USD",
    });
    setModalOpen(true);
  };

  const handleClientFormPaidToggle = (nextPaid) => {
    setForm((prev) => {
      const selectedPlan = plans.find((p) => Number(p.id) === Number(prev.current_plan_id)) || null;
      let nextExpiry = prev.plan_expires_at;
      if (nextPaid && !isStrictFutureDateInput(nextExpiry)) {
        nextExpiry = computeFutureExpiryInput(selectedPlan);
        setExpiryTouched(false);
      }
      return {
        ...prev,
        is_plan_paid: nextPaid,
        plan_expires_at: nextExpiry,
      };
    });
  };

  const handleClientFormPlanChange = (nextPlanId) => {
    setForm((prev) => {
      const selectedPlan = plans.find((p) => Number(p.id) === Number(nextPlanId)) || null;
      let nextExpiry = prev.plan_expires_at;
      if (prev.is_plan_paid && (!expiryTouched || !isStrictFutureDateInput(nextExpiry))) {
        nextExpiry = computeFutureExpiryInput(selectedPlan);
      }
      return {
        ...prev,
        current_plan_id: nextPlanId,
        plan_expires_at: nextExpiry,
      };
    });
  };

  const handleQuickToggleStatus = async (client) => {
    const key = `active-${client.id}`;
    setTogglingRowKey(key);
    const nextActive = !client.is_active;
    try {
      const res = await updateAdminUser(client.id, { is_active: nextActive });
      const updatedUser = res.data?.user;
      if (updatedUser) {
        setClients((prev) => prev.map((c) => (c.id === client.id ? updatedUser : c)));
      } else {
        loadClients();
      }
      toast.success(nextActive ? `${client.name} marked Active.` : `${client.name} marked Inactive.`);
    } catch (err) {
      toast.error(err.response?.data?.message ?? err.response?.data?.error ?? "Status update failed.");
    } finally {
      setTogglingRowKey(null);
    }
  };

  const handleQuickTogglePaid = async (client) => {
    const key = `paid-${client.id}`;
    setTogglingRowKey(key);
    const nextPaid = !client.is_plan_paid;
    try {
      const res = await updateAdminUser(client.id, { is_plan_paid: nextPaid });
      const updatedUser = res.data?.user;
      if (updatedUser) {
        setClients((prev) => prev.map((c) => (c.id === client.id ? updatedUser : c)));
      } else {
        loadClients();
      }
      toast.success(
        nextPaid
          ? `${client.name} marked Paid with future expiry.`
          : `${client.name} marked Unpaid.`
      );
    } catch (err) {
      toast.error(err.response?.data?.message ?? err.response?.data?.error ?? "Payment status update failed.");
    } finally {
      setTogglingRowKey(null);
    }
  };

  const handleSendExpiredInvoice = async (client) => {
    if (!client?.id || sendingInvoiceUserId) return;
    setSendingInvoiceUserId(client.id);
    try {
      const res = await sendAdminUserExpiredInvoice(client.id);
      const updatedUser = res.data?.user;
      if (updatedUser) {
        setClients((prev) => prev.map((c) => (c.id === client.id ? updatedUser : c)));
      } else {
        loadClients();
      }
      toast.success(res.data?.message ?? `Invoice sent to ${client.email}.`);
    } catch (err) {
      const message =
        err.response?.data?.error ??
        err.response?.data?.message ??
        "Failed to send invoice.";
      toast.error(message);
      if (err.response?.status === 422) {
        loadClients();
      }
    } finally {
      setSendingInvoiceUserId(null);
    }
  };

  const openPlanDetailsModal = (client) => {
    const matchedPlan =
      plans.find((p) => Number(p.id) === Number(client.current_plan_id)) ||
      client.current_plan ||
      null;
    const base = resolveBaseLimits(matchedPlan);

    const effFeatures =
      client.effective_features && typeof client.effective_features === "object"
        ? { ...client.effective_features }
        : { ...base.features };

    setPlanModalClient(client);
    setPlanFeatureSearch("");
    setPlanForm({
      current_plan_id: client.current_plan_id ? String(client.current_plan_id) : "",
      is_plan_paid: Boolean(client.is_plan_paid),
      plan_expires_at: client.plan_expires_at ? client.plan_expires_at.slice(0, 10) : "",
      products_limit:
        client.effective_products_limit !== null && client.effective_products_limit !== undefined
          ? Number(client.effective_products_limit)
          : client.custom_products_limit !== null && client.custom_products_limit !== undefined
          ? Number(client.custom_products_limit)
          : base.products_limit,
      orders_limit:
        client.effective_orders_limit !== null && client.effective_orders_limit !== undefined
          ? Number(client.effective_orders_limit)
          : client.custom_orders_limit !== null && client.custom_orders_limit !== undefined
          ? Number(client.custom_orders_limit)
          : base.orders_limit,
      stores_limit:
        client.effective_stores_limit !== null && client.effective_stores_limit !== undefined
          ? Number(client.effective_stores_limit)
          : client.custom_stores_limit !== null && client.custom_stores_limit !== undefined
          ? Number(client.custom_stores_limit)
          : base.stores_limit,
      features: effFeatures,
      customInclusions: Array.isArray(client.custom_inclusions) ? client.custom_inclusions : [],
      bonus_ai_credits: 0,
      save_as_custom_plan: false,
      custom_plan_title: `${client.name || "Customer"} Custom Package`,
      custom_plan_description: "",
      custom_plan_price: matchedPlan?.price ?? 0,
      custom_plan_annual_price:
        matchedPlan?.billing_type === "monthly" &&
        matchedPlan?.annual_price !== null &&
        matchedPlan?.annual_price !== undefined
          ? String(matchedPlan.annual_price)
          : "",
      custom_plan_currency: matchedPlan?.currency ?? client.wallet_currency ?? "USD",
      custom_plan_billing_type: matchedPlan?.billing_type ?? "monthly",
      custom_plan_duration_days: matchedPlan?.duration_days ?? 30,
      activate_custom_plan: true,
    });
  };

  const selectedBasePlan = useMemo(() => {
    if (!planForm?.current_plan_id) return null;
    const idNum = Number(planForm.current_plan_id);
    return (
      plans.find((p) => Number(p.id) === idNum) ||
      (Number(planModalClient?.current_plan?.id) === idNum ? planModalClient.current_plan : null)
    );
  }, [plans, planForm?.current_plan_id, planModalClient]);

  const baseDefaults = useMemo(() => resolveBaseLimits(selectedBasePlan), [selectedBasePlan]);

  const handleModalBasePlanChange = (newPlanId) => {
    const newPlan = plans.find((p) => Number(p.id) === Number(newPlanId)) || null;
    const defaults = resolveBaseLimits(newPlan);
    setPlanForm((prev) => {
      let nextExpiry = prev.plan_expires_at;
      if (prev.is_plan_paid && !isStrictFutureDateInput(nextExpiry)) {
        nextExpiry = computeFutureExpiryInput(newPlan);
      }
      return {
        ...prev,
        current_plan_id: newPlanId,
        plan_expires_at: nextExpiry,
        products_limit: defaults.products_limit,
        orders_limit: defaults.orders_limit,
        stores_limit: defaults.stores_limit,
        features: { ...defaults.features },
      };
    });
  };

  const handlePlanModalPaidToggle = (nextPaid) => {
    setPlanForm((prev) => {
      const matched = plans.find((p) => Number(p.id) === Number(prev.current_plan_id)) || null;
      let nextExpiry = prev.plan_expires_at;
      if (nextPaid && !isStrictFutureDateInput(nextExpiry)) {
        nextExpiry = computeFutureExpiryInput(matched);
      }
      return {
        ...prev,
        is_plan_paid: nextPaid,
        plan_expires_at: nextExpiry,
      };
    });
  };

  const resetAllOverridesToBase = () => {
    setPlanForm((prev) => ({
      ...prev,
      products_limit: baseDefaults.products_limit,
      orders_limit: baseDefaults.orders_limit,
      stores_limit: baseDefaults.stores_limit,
      features: { ...baseDefaults.features },
      customInclusions: [],
    }));
  };

  const incrementQuotaField = (field, delta) => {
    setPlanForm((prev) => ({
      ...prev,
      [field]: Math.max(0, (Number(prev[field]) || 0) + delta),
    }));
  };

  const togglePlanFeature = (key) => {
    setPlanForm((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [key]: !prev.features?.[key],
      },
    }));
  };

  const selectAllPlanFeatures = () => {
    const next = { ...(planForm?.features ?? {}) };
    ALL_FEATURE_DEFINITIONS.forEach((f) => {
      next[f.key] = true;
    });
    setPlanForm((prev) => ({ ...prev, features: next }));
  };

  const resetFeaturesToBase = () => {
    setPlanForm((prev) => ({
      ...prev,
      features: { ...baseDefaults.features },
    }));
  };

  const filteredPlanFeatures = useMemo(() => {
    const q = (planFeatureSearch || "").toLowerCase().trim();
    if (!q) return ALL_FEATURE_DEFINITIONS;
    return ALL_FEATURE_DEFINITIONS.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q)
    );
  }, [planFeatureSearch]);

  const enabledPlanFeaturesCount = useMemo(() => {
    if (!planForm?.features) return 0;
    return ALL_FEATURE_DEFINITIONS.filter((f) => Boolean(planForm.features[f.key])).length;
  }, [planForm?.features]);

  const savePlanDetails = async () => {
    if (!planModalClient || !planForm) return;

    if (planForm.save_as_custom_plan && !planForm.custom_plan_title.trim()) {
      toast.error("Please enter a Custom Package Title.");
      return;
    }

    setSavingPlanDetails(true);
    const targetProducts = Math.max(0, parseInt(planForm.products_limit, 10) || 0);
    const targetOrders = Math.max(0, parseInt(planForm.orders_limit, 10) || 0);
    const targetStores = Math.max(0, parseInt(planForm.stores_limit, 10) || 0);

    const cleanedInclusions = (planForm.customInclusions ?? [])
      .map((line) => (line || "").trim())
      .filter(Boolean);

    const selectedPlanObj = plans.find((p) => Number(p.id) === Number(planForm.current_plan_id)) || null;
    const effectivePaid = Boolean(planForm.is_plan_paid);

    let resolvedExpiry = planForm.plan_expires_at || null;
    if (effectivePaid && !isStrictFutureDateInput(resolvedExpiry)) {
      resolvedExpiry = computeFutureExpiryInput(
        planForm.save_as_custom_plan
          ? {
              billing_type: planForm.custom_plan_billing_type || "monthly",
              duration_days: Number(planForm.custom_plan_duration_days) || 30,
            }
          : selectedPlanObj
      );
    }

    const payload = {
      current_plan_id: planForm.current_plan_id ? Number(planForm.current_plan_id) : null,
      is_plan_paid: effectivePaid,
      plan_expires_at: resolvedExpiry,
      bonus_ai_credits: Math.max(0, parseInt(planForm.bonus_ai_credits, 10) || 0),
      custom_inclusions: cleanedInclusions,
    };

    if (planForm.save_as_custom_plan) {
      const fullFeatures = {};
      ALL_FEATURE_DEFINITIONS.forEach((f) => {
        if (planForm.features?.[f.key]) {
          fullFeatures[f.key] = true;
        }
      });

      payload.save_as_custom_plan = true;
      payload.activate_custom_plan = Boolean(planForm.activate_custom_plan);
      payload.custom_plan_title = planForm.custom_plan_title.trim();
      payload.custom_plan_description = planForm.custom_plan_description?.trim() || null;
      const customBillingType = planForm.custom_plan_billing_type || "monthly";
      const customPrice = Math.max(0, Number(planForm.custom_plan_price) || 0);
      payload.custom_plan_price = customPrice;
      payload.custom_plan_annual_price =
        customBillingType === "monthly"
          ? planForm.custom_plan_annual_price !== "" &&
            planForm.custom_plan_annual_price !== null &&
            planForm.custom_plan_annual_price !== undefined &&
            !isNaN(Number(planForm.custom_plan_annual_price)) &&
            Number(planForm.custom_plan_annual_price) >= 0
            ? Number(planForm.custom_plan_annual_price)
            : null
          : customBillingType === "yearly"
          ? customPrice
          : null;
      payload.custom_plan_currency = (planForm.custom_plan_currency || "USD").toUpperCase().slice(0, 3);
      payload.custom_plan_billing_type = customBillingType;
      payload.custom_plan_duration_days =
        customBillingType === "one_time"
          ? Math.max(1, parseInt(planForm.custom_plan_duration_days, 10) || 30)
          : null;
      payload.custom_products_limit = targetProducts;
      payload.custom_orders_limit = targetOrders;
      payload.custom_stores_limit = targetStores;
      payload.custom_plan_features = fullFeatures;
    } else {
      payload.custom_products_limit =
        targetProducts !== baseDefaults.products_limit ? targetProducts : null;
      payload.custom_orders_limit =
        targetOrders !== baseDefaults.orders_limit ? targetOrders : null;
      payload.custom_stores_limit =
        targetStores !== baseDefaults.stores_limit ? targetStores : null;

      const diffFeatures = {};
      const allKeys = new Set([
        ...ALL_FEATURE_DEFINITIONS.map((f) => f.key),
        ...Object.keys(baseDefaults.features || {}),
        ...Object.keys(planForm.features || {}),
      ]);

      allKeys.forEach((key) => {
        const nextVal = Boolean(planForm.features?.[key]);
        const baseVal = Boolean(baseDefaults.features?.[key]);
        if (nextVal !== baseVal) {
          diffFeatures[key] = nextVal;
        }
      });

      payload.custom_plan_features =
        Object.keys(diffFeatures).length > 0 ? diffFeatures : null;
    }

    try {
      const res = await updateAdminUserPlanDetails(planModalClient.id, payload);
      toast.success(res.data?.message ?? "User plan details updated.");
      setPlanModalClient(null);
      setPlanForm(null);
      loadClients();
      loadPlans();
    } catch (err) {
      const message =
        err.response?.data?.message ??
        Object.values(err.response?.data?.errors ?? {})[0]?.[0] ??
        err.response?.data?.error ??
        "Failed to update plan details.";
      toast.error(message);
    } finally {
      setSavingPlanDetails(false);
    }
  };

  const saveClient = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required.");
      return;
    }

    const selectedPlan = plans.find((p) => Number(p.id) === Number(form.current_plan_id)) || null;
    let resolvedExpiry = form.plan_expires_at || null;
    if (form.is_plan_paid && !isStrictFutureDateInput(resolvedExpiry)) {
      resolvedExpiry = computeFutureExpiryInput(selectedPlan);
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: "client",
      is_active: Boolean(form.is_active),
      is_plan_paid: Boolean(form.is_plan_paid),
      wallet_balance: Number(form.wallet_balance) || 0,
      wallet_currency: form.wallet_currency || "USD",
      current_plan_id: form.current_plan_id ? Number(form.current_plan_id) : null,
      plan_expires_at: resolvedExpiry,
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

  const removeClient = (client) => {
    setDeleteConfirm(client);
  };

  const confirmDeleteClient = async () => {
    if (!deleteConfirm) {
      return;
    }

    setDeleting(true);
    try {
      await deleteAdminUser(deleteConfirm.id);
      toast.success("Client deleted.");
      setDeleteConfirm(null);
      loadClients();
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
          <span className="admin-page__eyebrow"><LuUsers /> Users &amp; Clients</span>
          <h1>Manage Users &amp; Clients</h1>
          <p>Add users, toggle Active / Inactive and Paid / Unpaid flags, manage expiry dates, or assign custom packages.</p>
        </div>
        <button type="button" className="admin-page__btn admin-page__btn--primary" onClick={openCreate}>
          <LuPlus />
          <span>Add User / Client</span>
        </button>
      </header>

      <div className="admin-clients-page__toolbar card-wrapper admin-filters-bar">
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

        <label className="admin-filters-bar__field">
          <span>Status</span>
          <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </label>

        <label className="admin-filters-bar__field">
          <span>Payment</span>
          <select value={paymentFilter} onChange={(event) => { setPaymentFilter(event.target.value); setPage(1); }}>
            <option value="">All payments</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </label>

        <label className="admin-filters-bar__field">
          <span>Plan</span>
          <select value={planFilter} onChange={(event) => { setPlanFilter(event.target.value); setPage(1); }}>
            <option value="">All plans</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.is_custom ? `[Custom] ${plan.title}` : plan.title}
              </option>
            ))}
          </select>
        </label>

        <span className="admin-clients-page__count" style={{ marginLeft: "auto" }}>{meta.total} users</span>
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
                <AdminSortableHeader label="Client" sortKey="name" sort={sort} sortDir={sortDir} onSort={handleSort} />
                <AdminSortableHeader label="Plan & Quota" sortKey="plan" sort={sort} sortDir={sortDir} onSort={handleSort} />
                <AdminSortableHeader label="Wallet" sortKey="wallet_balance" sort={sort} sortDir={sortDir} onSort={handleSort} />
                <AdminSortableHeader label="Total Revenue" sortKey="total_paid" sort={sort} sortDir={sortDir} onSort={handleSort} />
                <AdminSortableHeader label="Activity" sortKey="orders_count" sort={sort} sortDir={sortDir} onSort={handleSort} />
                <AdminSortableHeader label="Payment" sortKey="is_plan_paid" sort={sort} sortDir={sortDir} onSort={handleSort} />
                <AdminSortableHeader label="Status" sortKey="status" sort={sort} sortDir={sortDir} onSort={handleSort} />
                <AdminSortableHeader label="Joined" sortKey="created_at" sort={sort} sortDir={sortDir} onSort={handleSort} />
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {clients.length ? clients.map((client) => {
                const effProducts = client.effective_products_limit ?? client.current_plan?.products_limit ?? 100;
                const effOrders = client.effective_orders_limit ?? client.current_plan?.orders_limit ?? 100;
                const effStores = client.effective_stores_limit ?? client.current_plan?.stores_limit ?? 1;
                const usedProducts = client.products_quota_used ?? 0;
                const isPaid = Boolean(client.is_plan_paid);
                const isExpired = Boolean(client.is_plan_expired ?? isExpiredIsoDate(client.plan_expires_at));
                const invoiceAutoSent = Boolean(client.invoice_auto_sent);
                const canSendExpiredInvoice =
                  typeof client.can_send_expired_invoice === "boolean"
                    ? client.can_send_expired_invoice
                    : Boolean(isExpired && !invoiceAutoSent && (client.has_invoiceable_plan ?? client.current_plan));
                const isSendingInvoice = sendingInvoiceUserId === client.id;
                const isTogglingPaid = togglingRowKey === `paid-${client.id}`;
                const isTogglingActive = togglingRowKey === `active-${client.id}`;

                return (
                  <tr key={client.id}>
                    <td>
                      <div className="admin-clients-page__identity">
                        <strong>{client.name}</strong>
                        <span>{client.email}</span>
                      </div>
                    </td>
                    <td>
                      <div className="admin-clients-page__plan">
                        <div className="admin-clients-page__plan-title-row">
                          <strong>{client.current_plan?.title ?? "No plan"}</strong>
                          {client.is_on_free_trial ? (
                            <span className="admin-clients-page__pill admin-clients-page__pill--trial">
                              Free Trail{client.trial_ends_at ? ` · Ends ${formatDate(client.trial_ends_at)}` : ""}
                            </span>
                          ) : null}
                          {client.current_plan?.is_sign_free ? (
                            <span className="admin-clients-page__pill admin-clients-page__pill--free">
                              Sign Free
                            </span>
                          ) : null}
                          {client.current_plan?.is_custom ? (
                            <span className="admin-clients-page__pill admin-clients-page__pill--custom">
                              Custom Pkg
                            </span>
                          ) : null}
                          {client.has_custom_overrides ? (
                            <span className="admin-clients-page__pill admin-clients-page__pill--override">
                              Custom Quotas/Features
                            </span>
                          ) : null}
                        </div>
                        <span className="admin-clients-page__quota-line">
                          {Number(usedProducts).toLocaleString()} / {Number(effProducts).toLocaleString()} products ·{" "}
                          {Number(effOrders).toLocaleString()} orders · {Number(effStores).toLocaleString()} stores
                        </span>
                        {client.is_on_free_trial && (client.trial_ends_at || client.plan_expires_at) ? (
                          <span className="admin-clients-page__expiry-note">
                            Trial ends {formatDate(client.trial_ends_at || client.plan_expires_at)}
                          </span>
                        ) : client.plan_expires_at ? (
                          <span
                            className={`admin-clients-page__expiry-note ${
                              isExpired ? "admin-clients-page__expiry-note--expired" : ""
                            }`}
                          >
                            {isExpired ? "Expired" : "Expires"} {formatDate(client.plan_expires_at)}
                          </span>
                        ) : null}
                        {isExpired && invoiceAutoSent ? (
                          <span
                            className="admin-clients-page__invoice-sent"
                            title={
                              client.invoice_sent_at
                                ? `Invoice sent on ${formatDate(client.invoice_sent_at)}`
                                : "Invoice already sent automatically"
                            }
                          >
                            <LuMailCheck />
                            <span>
                              Invoice sent{client.invoice_sent_at ? ` ${formatDate(client.invoice_sent_at)}` : ""}
                            </span>
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td>{formatMoney(client.wallet_balance, client.wallet_currency)}</td>
                    <td>
                      <div
                        className="admin-clients-page__revenue"
                        title={`Subscriptions: ${formatMoney(client.subscription_paid, client.wallet_currency)} • Deposits: ${formatMoney(client.wallet_deposited, client.wallet_currency)}`}
                      >
                        <strong style={{ color: "#10b981", fontWeight: 700, fontSize: "13px" }}>
                          {formatMoney(client.total_paid, client.wallet_currency)}
                        </strong>
                        <span style={{ fontSize: "11px", color: "var(--muted-color, #64748b)", display: "block", marginTop: "2px" }}>
                          Sub: {formatMoney(client.subscription_paid, client.wallet_currency)} · Dep: {formatMoney(client.wallet_deposited, client.wallet_currency)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="admin-clients-page__activity">
                        {client.orders_count ?? 0} orders · {client.ebay_listings_count ?? 0} listings
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`admin-toggle-pill ${
                          isPaid ? "admin-toggle-pill--paid" : "admin-toggle-pill--unpaid"
                        }`}
                        disabled={isTogglingPaid}
                        onClick={() => handleQuickTogglePaid(client)}
                        title={
                          isPaid
                            ? "Click to mark Unpaid"
                            : "Click to mark Paid and set a future plan expiry date"
                        }
                      >
                        <span className="admin-toggle-pill__dot" />
                        <span>{isTogglingPaid ? "Updating…" : isPaid ? "Paid" : "Unpaid"}</span>
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`admin-toggle-pill ${
                          client.is_active ? "admin-toggle-pill--active" : "admin-toggle-pill--inactive"
                        }`}
                        disabled={isTogglingActive}
                        onClick={() => handleQuickToggleStatus(client)}
                        title={client.is_active ? "Click to mark Inactive" : "Click to mark Active"}
                      >
                        <span className="admin-toggle-pill__dot" />
                        <span>{isTogglingActive ? "Updating…" : client.is_active ? "Active" : "Inactive"}</span>
                      </button>
                    </td>
                    <td>{formatDate(client.created_at)}</td>
                    <td>
                      <div className="admin-clients-page__actions">
                        {canSendExpiredInvoice ? (
                          <button
                            type="button"
                            className="admin-clients-page__invoice-btn"
                            disabled={isSendingInvoice}
                            onClick={() => handleSendExpiredInvoice(client)}
                            title="Send billing invoice email for this expired plan"
                          >
                            {isSendingInvoice ? <LuLoader className="spin-icon" /> : <LuMail />}
                            <span>{isSendingInvoice ? "Sending…" : "Send Invoice"}</span>
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="admin-page__btn admin-page__btn--ghost admin-clients-page__plan-btn"
                          onClick={() => openPlanDetailsModal(client)}
                          title="Increase quotas, assign features, or create a custom package"
                        >
                          <LuSlidersHorizontal />
                          <span>Update Plan Details</span>
                        </button>
                        <button type="button" className="orders-icon-btn" onClick={() => openEdit(client)} aria-label="Edit client">
                          <LuPencil />
                        </button>
                        <button type="button" className="orders-icon-btn" onClick={() => removeClient(client)} aria-label="Delete client">
                          <LuTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={9} className="admin-table__empty">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <AdminPagination
        currentPage={meta.current_page || page}
        lastPage={meta.last_page || 1}
        total={meta.total}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
        entityName="clients"
      />

      {/* Edit / Add User (Client) Modal */}
      {modalOpen ? (
        <div className="orders-modal">
          <div className="orders-modal__backdrop" onClick={() => setModalOpen(false)} />
          <div className="orders-modal__card admin-modal">
            <h3>{editingId ? "Edit User / Client" : "Add User / Client"}</h3>

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

              <div className="marketplace-settings__field">
                <span>Account Status</span>
                <div className="admin-segmented-toggle" role="group" aria-label="Account Status">
                  <button
                    type="button"
                    className={`admin-segmented-toggle__btn ${form.is_active ? "is-selected is-active" : ""}`}
                    onClick={() => setForm({ ...form, is_active: true })}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    className={`admin-segmented-toggle__btn ${!form.is_active ? "is-selected is-inactive" : ""}`}
                    onClick={() => setForm({ ...form, is_active: false })}
                  >
                    Inactive
                  </button>
                </div>
              </div>

              <div className="marketplace-settings__field">
                <span>Plan Payment Status</span>
                <div className="admin-segmented-toggle" role="group" aria-label="Plan Payment Status">
                  <button
                    type="button"
                    className={`admin-segmented-toggle__btn ${form.is_plan_paid ? "is-selected is-paid" : ""}`}
                    onClick={() => handleClientFormPaidToggle(true)}
                  >
                    Paid
                  </button>
                  <button
                    type="button"
                    className={`admin-segmented-toggle__btn ${!form.is_plan_paid ? "is-selected is-unpaid" : ""}`}
                    onClick={() => handleClientFormPaidToggle(false)}
                  >
                    Unpaid
                  </button>
                </div>
              </div>

              <label className="marketplace-settings__field">
                <span>Plan</span>
                <select className="marketplace-settings__control" value={form.current_plan_id} onChange={(event) => handleClientFormPlanChange(event.target.value)}>
                  <option value="">No plan</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.is_custom ? `[Custom] ${plan.title}` : plan.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="marketplace-settings__field">
                <span>Plan Expires</span>
                <input
                  type="date"
                  min={form.is_plan_paid ? tomorrowDateInput : undefined}
                  className="marketplace-settings__control"
                  value={form.plan_expires_at}
                  onChange={(event) => {
                    setExpiryTouched(true);
                    setForm({ ...form, plan_expires_at: event.target.value });
                  }}
                />
                {form.is_plan_paid ? (
                  <small className="admin-modal__field-hint">
                    Future expiry date auto-populated for Paid users.
                  </small>
                ) : null}
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

            {editingId ? (
              <div className="admin-clients-modal__plan-shortcut">
                <button
                  type="button"
                  className="admin-page__btn admin-page__btn--ghost"
                  onClick={() => {
                    const target = clients.find((c) => Number(c.id) === Number(editingId));
                    if (target) {
                      setModalOpen(false);
                      openPlanDetailsModal(target);
                    }
                  }}
                >
                  <LuSlidersHorizontal />
                  <span>Open Update Plan Details (Quotas, Features &amp; Custom Package)</span>
                </button>
              </div>
            ) : null}

            <div className="admin-modal__footer">
              <button type="button" className="admin-page__btn admin-page__btn--ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="button" className="admin-page__btn admin-page__btn--primary" disabled={saving} onClick={saveClient}>
                {saving ? "Saving…" : editingId ? "Update User" : "Create User"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Update Plan Details Popup Modal */}
      {planModalClient && planForm ? (
        <div className="orders-modal">
          <div
            className="orders-modal__backdrop"
            onClick={() => !savingPlanDetails && setPlanModalClient(null)}
          />
          <div className="orders-modal__card admin-modal admin-modal--wide">
            <div className="admin-plan-details-modal__header">
              <div>
                <span className="admin-page__eyebrow">
                  <LuCrown /> Plan Quotas, Features &amp; Custom Package
                </span>
                <h3>Update Plan Details — {planModalClient.name}</h3>
                <p className="admin-plans-modal__section-subtitle">
                  {planModalClient.email} · Used: <strong>{Number(planModalClient.products_quota_used ?? 0).toLocaleString()} products</strong> · AI Credits: <strong>{Number(planModalClient.ai_credits ?? 50).toLocaleString()}</strong>
                </p>
              </div>
              <button
                type="button"
                className="admin-plans-modal__btn-sm"
                onClick={resetAllOverridesToBase}
                title="Reset quotas and features back to the selected Base Plan"
              >
                <LuRotateCcw />
                <span>Reset to Base Plan</span>
              </button>
            </div>

            <div className="admin-modal__grid">
              {/* Base Plan & Expiry */}
              <label className="marketplace-settings__field">
                <span>Base Plan</span>
                <select
                  className="marketplace-settings__control"
                  value={planForm.current_plan_id}
                  onChange={(e) => handleModalBasePlanChange(e.target.value)}
                >
                  <option value="">No plan (Custom overrides only)</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.is_custom
                        ? `[Custom] ${plan.title} (${(plan.products_limit ?? 200).toLocaleString()} products)`
                        : `${plan.title} (${(plan.products_limit ?? 200).toLocaleString()} products)`}
                    </option>
                  ))}
                </select>
              </label>

              <label className="marketplace-settings__field">
                <span>Plan Expiry Date</span>
                <input
                  type="date"
                  min={planForm.is_plan_paid ? tomorrowDateInput : undefined}
                  className="marketplace-settings__control"
                  value={planForm.plan_expires_at}
                  onChange={(e) => setPlanForm({ ...planForm, plan_expires_at: e.target.value })}
                />
                {planForm.is_plan_paid ? (
                  <small className="admin-modal__field-hint">
                    Future date auto-applied while Paid is selected.
                  </small>
                ) : null}
              </label>

              <div className="marketplace-settings__field admin-modal__full">
                <span>Plan Payment Status</span>
                <div className="admin-segmented-toggle" role="group" aria-label="Plan Details Payment Status">
                  <button
                    type="button"
                    className={`admin-segmented-toggle__btn ${planForm.is_plan_paid ? "is-selected is-paid" : ""}`}
                    onClick={() => handlePlanModalPaidToggle(true)}
                  >
                    Paid (Active / Future Expiry)
                  </button>
                  <button
                    type="button"
                    className={`admin-segmented-toggle__btn ${!planForm.is_plan_paid ? "is-selected is-unpaid" : ""}`}
                    onClick={() => handlePlanModalPaidToggle(false)}
                  >
                    Unpaid
                  </button>
                </div>
              </div>

              {/* Quotas Management */}
              <div className="admin-plans-modal__section">
                <div className="admin-plans-modal__section-header">
                  <div>
                    <span className="admin-plans-modal__section-title">
                      <LuLayers /> Quotas &amp; Allowance Overrides
                    </span>
                    <p className="admin-plans-modal__section-subtitle">
                      Set an exact quota or use quick increment buttons to increase this user&apos;s limits immediately.
                    </p>
                  </div>
                </div>

                <div className="admin-plan-details-modal__quotas">
                  {/* Products & Variations Quota */}
                  <div className="admin-plan-details-modal__quota-card">
                    <div className="admin-plan-details-modal__quota-head">
                      <span><LuLayers /> Products &amp; Variations</span>
                      <span className="admin-plan-details-modal__quota-base">
                        Base: {baseDefaults.products_limit.toLocaleString()}
                        {Number(planForm.products_limit) !== baseDefaults.products_limit ? (
                          <strong>
                            {" "}
                            ({Number(planForm.products_limit) > baseDefaults.products_limit ? "+" : ""}
                            {(Number(planForm.products_limit) - baseDefaults.products_limit).toLocaleString()})
                          </strong>
                        ) : null}
                      </span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="marketplace-settings__control"
                      value={planForm.products_limit}
                      onChange={(e) =>
                        setPlanForm({
                          ...planForm,
                          products_limit:
                            e.target.value === "" ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0),
                        })
                      }
                    />
                    <div className="admin-plans-modal__chip-row">
                      {QUOTA_INCREASE_PRESETS.map((delta) => (
                        <button
                          key={delta}
                          type="button"
                          className="admin-plans-modal__chip"
                          onClick={() => incrementQuotaField("products_limit", delta)}
                        >
                          +{delta.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Auto-Orders Quota */}
                  <div className="admin-plan-details-modal__quota-card">
                    <div className="admin-plan-details-modal__quota-head">
                      <span><LuShoppingCart /> Auto-Orders Quota</span>
                      <span className="admin-plan-details-modal__quota-base">
                        Base: {baseDefaults.orders_limit.toLocaleString()}
                      </span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="marketplace-settings__control"
                      value={planForm.orders_limit}
                      onChange={(e) =>
                        setPlanForm({
                          ...planForm,
                          orders_limit:
                            e.target.value === "" ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0),
                        })
                      }
                    />
                    <div className="admin-plans-modal__chip-row">
                      {[100, 250, 500, 1000].map((delta) => (
                        <button
                          key={delta}
                          type="button"
                          className="admin-plans-modal__chip"
                          onClick={() => incrementQuotaField("orders_limit", delta)}
                        >
                          +{delta.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Connected Stores Limit */}
                  <div className="admin-plan-details-modal__quota-card">
                    <div className="admin-plan-details-modal__quota-head">
                      <span><LuStore /> Connected Stores</span>
                      <span className="admin-plan-details-modal__quota-base">
                        Base: {baseDefaults.stores_limit.toLocaleString()}
                      </span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="marketplace-settings__control"
                      value={planForm.stores_limit}
                      onChange={(e) =>
                        setPlanForm({
                          ...planForm,
                          stores_limit:
                            e.target.value === "" ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0),
                        })
                      }
                    />
                    <div className="admin-plans-modal__chip-row">
                      {[1, 3, 5, 10].map((delta) => (
                        <button
                          key={delta}
                          type="button"
                          className="admin-plans-modal__chip"
                          onClick={() => incrementQuotaField("stores_limit", delta)}
                        >
                          +{delta}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Optional Bonus AI Credits */}
                  <div className="admin-plan-details-modal__quota-card">
                    <div className="admin-plan-details-modal__quota-head">
                      <span><LuSparkles /> Grant Bonus AI Credits</span>
                      <span className="admin-plan-details-modal__quota-base">
                        Current: {Number(planModalClient.ai_credits ?? 50).toLocaleString()}
                      </span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="marketplace-settings__control"
                      value={planForm.bonus_ai_credits}
                      onChange={(e) =>
                        setPlanForm({
                          ...planForm,
                          bonus_ai_credits:
                            e.target.value === "" ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0),
                        })
                      }
                    />
                    <div className="admin-plans-modal__chip-row">
                      {[50, 100, 250, 500].map((delta) => (
                        <button
                          key={delta}
                          type="button"
                          className="admin-plans-modal__chip"
                          onClick={() => incrementQuotaField("bonus_ai_credits", delta)}
                        >
                          +{delta} ⚡
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Assign / Toggle Features */}
              <div className="admin-plans-modal__section">
                <div className="admin-plans-modal__section-header">
                  <div>
                    <span className="admin-plans-modal__section-title">
                      <LuCheck /> Assign Any Feature &amp; Add-on Access
                    </span>
                    <p className="admin-plans-modal__section-subtitle">
                      Toggle individual features or curated add-ons on/off for {planModalClient.name}.
                    </p>
                  </div>
                  <span className="admin-plans-modal__badge">
                    {enabledPlanFeaturesCount} / {ALL_FEATURE_DEFINITIONS.length} Active
                  </span>
                </div>

                <div className="admin-plans-modal__features-bar">
                  <div className="admin-plans-modal__search-wrap">
                    <LuSearch className="admin-plans-modal__search-icon" />
                    <input
                      type="text"
                      className="admin-plans-modal__search-input"
                      placeholder="Search features (e.g. Trending, Hand-Picked, Bulk, AI, VIP)..."
                      value={planFeatureSearch}
                      onChange={(e) => setPlanFeatureSearch(e.target.value)}
                    />
                  </div>
                  <div className="admin-plans-modal__actions-wrap">
                    <button
                      type="button"
                      className="admin-plans-modal__btn-sm"
                      onClick={selectAllPlanFeatures}
                    >
                      <LuCheckCheck />
                      <span>Enable All</span>
                    </button>
                    <button
                      type="button"
                      className="admin-plans-modal__btn-sm"
                      onClick={resetFeaturesToBase}
                    >
                      <LuX />
                      <span>Reset to Plan</span>
                    </button>
                  </div>
                </div>

                <div className="admin-plans-modal__features-grid">
                  {filteredPlanFeatures.map((feat) => {
                    const isChecked = Boolean(planForm.features?.[feat.key]);
                    const isInBase = Boolean(baseDefaults.features?.[feat.key]);
                    const isExtraAssigned = isChecked && !isInBase;
                    const isRemovedFromBase = !isChecked && isInBase;

                    return (
                      <label
                        key={feat.key}
                        className={`admin-plans-modal__feature-card ${
                          isChecked ? "is-selected" : ""
                        } ${isExtraAssigned ? "is-extra-assigned" : ""}`}
                      >
                        <input
                          type="checkbox"
                          className="admin-plans-modal__feature-checkbox"
                          checked={isChecked}
                          onChange={() => togglePlanFeature(feat.key)}
                        />
                        <div className="admin-plans-modal__feature-info">
                          <span className="admin-plans-modal__feature-title">
                            {feat.title}
                            {feat.isAddon ? (
                              <span className="admin-plans-modal__addon-tag">Add-on</span>
                            ) : null}
                            {isExtraAssigned ? (
                              <span className="admin-plans-modal__status-tag admin-plans-modal__status-tag--extra">
                                + Assigned
                              </span>
                            ) : isRemovedFromBase ? (
                              <span className="admin-plans-modal__status-tag admin-plans-modal__status-tag--removed">
                                Removed
                              </span>
                            ) : isInBase ? (
                              <span className="admin-plans-modal__status-tag admin-plans-modal__status-tag--plan">
                                Plan
                              </span>
                            ) : null}
                          </span>
                          <span className="admin-plans-modal__feature-desc">
                            {feat.description}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Custom Inclusion Notes */}
              <div className="admin-plans-modal__section">
                <label className="marketplace-settings__field admin-modal__full">
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>
                    Additional Custom Inclusions (Optional, one per line)
                  </span>
                  <textarea
                    className="marketplace-settings__control"
                    rows={2}
                    placeholder="e.g. Dedicated Slack Channel Support"
                    value={(planForm.customInclusions ?? []).join("\n")}
                    onChange={(e) =>
                      setPlanForm({
                        ...planForm,
                        customInclusions: e.target.value.split("\n"),
                      })
                    }
                  />
                </label>
              </div>

              {/* Save as Dedicated Custom Package Option */}
              <div className="admin-plans-modal__section admin-plan-details-modal__custom-pkg-box">
                <label className="marketplace-settings__field admin-modal__checkbox">
                  <input
                    type="checkbox"
                    checked={Boolean(planForm.save_as_custom_plan)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setPlanForm((prev) => {
                        const shouldAutoPaid = checked && prev.activate_custom_plan;
                        let nextExpiry = prev.plan_expires_at;
                        if (shouldAutoPaid && !isStrictFutureDateInput(nextExpiry)) {
                          nextExpiry = computeFutureExpiryInput({
                            billing_type: prev.custom_plan_billing_type || "monthly",
                            duration_days: Number(prev.custom_plan_duration_days) || 30,
                          });
                        }
                        return {
                          ...prev,
                          save_as_custom_plan: checked,
                          is_plan_paid: shouldAutoPaid ? true : prev.is_plan_paid,
                          plan_expires_at: nextExpiry,
                        };
                      });
                    }}
                  />
                  <span>
                    <LuPackagePlus style={{ verticalAlign: "-2px", marginRight: 6 }} />
                    <strong>Save as a Dedicated Custom Package</strong> for {planModalClient.name} (also appears in Admin Plans)
                  </span>
                </label>

                {planForm.save_as_custom_plan ? (
                  <div className="admin-modal__grid" style={{ marginTop: 10 }}>
                    <label className="marketplace-settings__field admin-modal__full">
                      <span>Custom Package Title *</span>
                      <input
                        className="marketplace-settings__control"
                        value={planForm.custom_plan_title}
                        onChange={(e) =>
                          setPlanForm({ ...planForm, custom_plan_title: e.target.value })
                        }
                      />
                    </label>
                    <label className="marketplace-settings__field admin-modal__full">
                      <span>Description</span>
                      <input
                        className="marketplace-settings__control"
                        placeholder="Private custom tier tailored for this customer"
                        value={planForm.custom_plan_description}
                        onChange={(e) =>
                          setPlanForm({ ...planForm, custom_plan_description: e.target.value })
                        }
                      />
                    </label>
                    <label className="marketplace-settings__field">
                      <span>
                        {planForm.custom_plan_billing_type === "yearly"
                          ? "Annual Price (12-Month Total)"
                          : planForm.custom_plan_billing_type === "monthly"
                          ? "Monthly Price"
                          : "Price"}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="marketplace-settings__control"
                        value={planForm.custom_plan_price}
                        onChange={(e) =>
                          setPlanForm({ ...planForm, custom_plan_price: e.target.value })
                        }
                      />
                    </label>
                    {planForm.custom_plan_billing_type === "monthly" ? (
                      <label className="marketplace-settings__field">
                        <span>Annual Price (Optional · 12-Month Total)</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Leave blank for monthly-only"
                          className="marketplace-settings__control"
                          value={planForm.custom_plan_annual_price ?? ""}
                          onChange={(e) =>
                            setPlanForm({ ...planForm, custom_plan_annual_price: e.target.value })
                          }
                        />
                      </label>
                    ) : null}
                    <label className="marketplace-settings__field">
                      <span>Currency</span>
                      <input
                        className="marketplace-settings__control"
                        maxLength={3}
                        value={planForm.custom_plan_currency}
                        onChange={(e) =>
                          setPlanForm({
                            ...planForm,
                            custom_plan_currency: e.target.value.toUpperCase(),
                          })
                        }
                      />
                    </label>
                    <label className="marketplace-settings__field">
                      <span>Billing Type</span>
                      <select
                        className="marketplace-settings__control"
                        value={planForm.custom_plan_billing_type}
                        onChange={(e) =>
                          setPlanForm((prev) => {
                            const nextType = e.target.value;
                            let nextExpiry = prev.plan_expires_at;
                            if (prev.activate_custom_plan && prev.is_plan_paid) {
                              nextExpiry = computeFutureExpiryInput({
                                billing_type: nextType,
                                duration_days: Number(prev.custom_plan_duration_days) || 30,
                              });
                            }
                            return {
                              ...prev,
                              custom_plan_billing_type: nextType,
                              plan_expires_at: nextExpiry,
                            };
                          })
                        }
                      >
                        <option value="monthly">Monthly (+ Optional Annual)</option>
                        <option value="yearly">Yearly (Annual Only)</option>
                        <option value="one_time">One Time</option>
                      </select>
                    </label>
                    {planForm.custom_plan_billing_type === "monthly" ? (() => {
                      const mPrice = Math.max(0, Number(planForm.custom_plan_price) || 0);
                      const m12 = Math.round(mPrice * 12 * 100) / 100;
                      const rawAnnual = planForm.custom_plan_annual_price;
                      const hasAnnual =
                        rawAnnual !== "" &&
                        rawAnnual !== null &&
                        rawAnnual !== undefined &&
                        !isNaN(Number(rawAnnual)) &&
                        Number(rawAnnual) >= 0;
                      const aPrice = hasAnnual ? Math.round(Number(rawAnnual) * 100) / 100 : null;
                      const pct =
                        hasAnnual && m12 > 0 && aPrice < m12
                          ? Math.round(((m12 - aPrice) / m12) * 1000) / 10
                          : 0;
                      const cur = planForm.custom_plan_currency || "USD";
                      return (
                        <div className="admin-plans-modal__discount-preview admin-modal__full">
                          <div className="admin-plans-modal__discount-info">
                            <span>
                              12 months: <strong>{cur} {m12.toFixed(2)}</strong>
                              {hasAnnual
                                ? ` vs Annual ${cur} ${aPrice.toFixed(2)} (${(aPrice / 12).toFixed(2)}/mo)`
                                : " · Optional annual price"}
                            </span>
                            {hasAnnual ? (
                              <span className={`admin-plans-modal__discount-pill ${pct > 0 ? "is-saving" : ""}`}>
                                {pct > 0 ? `Save ${pct}%` : "0% Discount"}
                              </span>
                            ) : null}
                          </div>
                          {mPrice > 0 ? (
                            <div className="admin-plans-modal__discount-presets">
                              <span>Presets:</span>
                              {[15, 20, 25].map((p) => {
                                const suggested = (mPrice * 12 * (1 - p / 100)).toFixed(2);
                                return (
                                  <button
                                    key={p}
                                    type="button"
                                    className={`admin-plans-modal__chip ${
                                      Number(planForm.custom_plan_annual_price) === Number(suggested)
                                        ? "admin-plans-modal__chip--active"
                                        : ""
                                    }`}
                                    onClick={() =>
                                      setPlanForm({ ...planForm, custom_plan_annual_price: suggested })
                                    }
                                  >
                                    -{p}% (${suggested}/yr)
                                  </button>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      );
                    })() : null}
                    {planForm.custom_plan_billing_type === "one_time" ? (
                      <label className="marketplace-settings__field">
                        <span>Duration (days)</span>
                        <input
                          type="number"
                          min="1"
                          className="marketplace-settings__control"
                          value={planForm.custom_plan_duration_days}
                          onChange={(e) =>
                            setPlanForm({
                              ...planForm,
                              custom_plan_duration_days: e.target.value,
                            })
                          }
                        />
                      </label>
                    ) : null}
                    <label className="marketplace-settings__field admin-modal__checkbox admin-modal__full">
                      <input
                        type="checkbox"
                        checked={Boolean(planForm.activate_custom_plan)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setPlanForm((prev) => {
                            let nextExpiry = prev.plan_expires_at;
                            if (checked && !isStrictFutureDateInput(nextExpiry)) {
                              nextExpiry = computeFutureExpiryInput({
                                billing_type: prev.custom_plan_billing_type || "monthly",
                                duration_days: Number(prev.custom_plan_duration_days) || 30,
                              });
                            }
                            return {
                              ...prev,
                              activate_custom_plan: checked,
                              is_plan_paid: checked ? true : prev.is_plan_paid,
                              plan_expires_at: nextExpiry,
                            };
                          });
                        }}
                      />
                      <span>
                        <LuLock style={{ verticalAlign: "-2px", marginRight: 5 }} />
                        Activate immediately on {planModalClient.name} (uncheck to send as a payable Custom Offer on their Plans page)
                      </span>
                    </label>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="admin-modal__footer">
              <button
                type="button"
                className="admin-page__btn admin-page__btn--ghost"
                disabled={savingPlanDetails}
                onClick={() => setPlanModalClient(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-page__btn admin-page__btn--primary"
                disabled={savingPlanDetails}
                onClick={savePlanDetails}
              >
                {savingPlanDetails
                  ? "Saving…"
                  : planForm.save_as_custom_plan
                  ? planForm.activate_custom_plan
                    ? "Create & Activate Custom Package"
                    : "Create Custom Package Offer"
                  : "Save Plan Details"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={Boolean(deleteConfirm)}
        title={`Delete ${deleteConfirm?.name ?? "this client"}?`}
        description="This cannot be undone."
        confirmLabel="Delete"
        saving={deleting}
        onConfirm={confirmDeleteClient}
        onClose={() => setDeleteConfirm(null)}
      />
    </section>
  );
}

export default AdminClientsPage;
