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
import { toast } from "../../../utils/toast";
import { getAdminPlans } from "../../../services/PlanService";
import ConfirmModal from "../ConfirmModal";
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
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
  const role = useSelector(selectUserRole);
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [plans, setPlans] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [sort, setSort] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyClientForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Update Plan Details Popup State
  const [planModalClient, setPlanModalClient] = useState(null);
  const [planForm, setPlanForm] = useState(null);
  const [planFeatureSearch, setPlanFeatureSearch] = useState("");
  const [savingPlanDetails, setSavingPlanDetails] = useState(false);

  useEffect(() => {
    if (role !== "super_admin") {
      navigate("/");
    }
  }, [role, navigate]);

  const loadPlans = useCallback(() => {
    getAdminPlans()
      .then((res) => setPlans(res.data?.plans ?? []))
      .catch(() => {});
  }, []);

  const loadClients = useCallback(() => {
    setLoading(true);
    getAdminUsers({
      page,
      per_page: perPage,
      search: search.trim() || undefined,
      role: "client",
      is_active: statusFilter || undefined,
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
  }, [page, perPage, search, statusFilter, planFilter, sort, sortDir]);

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
    setPlanForm((prev) => ({
      ...prev,
      current_plan_id: newPlanId,
      products_limit: defaults.products_limit,
      orders_limit: defaults.orders_limit,
      stores_limit: defaults.stores_limit,
      features: { ...defaults.features },
    }));
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

    const payload = {
      current_plan_id: planForm.current_plan_id ? Number(planForm.current_plan_id) : null,
      plan_expires_at: planForm.plan_expires_at || null,
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
      payload.custom_plan_price = Math.max(0, Number(planForm.custom_plan_price) || 0);
      payload.custom_plan_currency = (planForm.custom_plan_currency || "USD").toUpperCase().slice(0, 3);
      payload.custom_plan_billing_type = planForm.custom_plan_billing_type || "monthly";
      payload.custom_plan_duration_days =
        planForm.custom_plan_billing_type === "one_time"
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
          <span className="admin-page__eyebrow"><LuUsers /> Clients</span>
          <h1>Manage Clients</h1>
          <p>Create, edit, update plan quotas &amp; features, or assign custom packages for clients.</p>
        </div>
        <button type="button" className="admin-page__btn admin-page__btn--primary" onClick={openCreate}>
          <LuPlus />
          <span>Add Client</span>
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
            <option value="0">Disabled</option>
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

        <span className="admin-clients-page__count" style={{ marginLeft: "auto" }}>{meta.total} clients</span>
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
                        {client.plan_expires_at ? (
                          <span>Expires {formatDate(client.plan_expires_at)}</span>
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
                      <span className={client.is_active ? "admin-badge admin-badge--success" : "admin-badge admin-badge--muted"}>
                        {client.is_active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td>{formatDate(client.created_at)}</td>
                    <td>
                      <div className="admin-clients-page__actions">
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
                  <td colSpan={8} className="admin-table__empty">No clients found.</td>
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

      {/* Edit / Create Client Modal */}
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
                    <option key={plan.id} value={plan.id}>
                      {plan.is_custom ? `[Custom] ${plan.title}` : plan.title}
                    </option>
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
                  className="marketplace-settings__control"
                  value={planForm.plan_expires_at}
                  onChange={(e) => setPlanForm({ ...planForm, plan_expires_at: e.target.value })}
                />
              </label>

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
                    onChange={(e) =>
                      setPlanForm({ ...planForm, save_as_custom_plan: e.target.checked })
                    }
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
                      <span>Price</span>
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
                          setPlanForm({ ...planForm, custom_plan_billing_type: e.target.value })
                        }
                      >
                        <option value="monthly">Monthly</option>
                        <option value="one_time">One Time</option>
                      </select>
                    </label>
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
                        onChange={(e) =>
                          setPlanForm({ ...planForm, activate_custom_plan: e.target.checked })
                        }
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
