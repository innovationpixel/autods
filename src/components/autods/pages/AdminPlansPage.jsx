import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { LuBadgeCheck, LuLink, LuLoader, LuPencil, LuPlus, LuTrash2, LuUnplug } from "react-icons/lu";
import { selectUserRole } from "../../../store/selectors/AuthSelectors";
import { toast } from "../../../utils/toast";
import {
  createAdminPlan,
  deleteAdminPlan,
  getAdminPlans,
  updateAdminPlan,
} from "../../../services/PlanService";
import {
  disconnectAdminAliExpress,
  getAdminAliExpressAuthUrl,
  getAdminAliExpressStatus,
} from "../../../services/AdminService";
import { ALIEXPRESS_OAUTH_HINT, markOAuthReturnOrigin, openOAuthTab, OAUTH_TAB_HINT, watchOAuthTab } from "../../../utils/oauthBridge";

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
  const { search } = useLocation();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyPlan);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [aliStatus, setAliStatus] = useState({ loading: true, connected: false });
  const [aliConnecting, setAliConnecting] = useState(false);

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

  const loadAliExpressStatus = () => {
    setAliStatus((prev) => ({ ...prev, loading: true }));
    getAdminAliExpressStatus()
      .then((res) => setAliStatus({ ...res.data, loading: false }))
      .catch(() => setAliStatus({ loading: false, connected: false }));
  };

  useEffect(() => {
    if (role === "super_admin") {
      loadPlans();
      loadAliExpressStatus();
    }
  }, [role]);

  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get("aliexpress") === "connected") {
      toast.success("Platform AliExpress account connected.");
      loadAliExpressStatus();
    } else if (params.get("aliexpress") === "error") {
      toast.error(`AliExpress connection failed: ${params.get("reason") ?? "Unknown error"}`);
    }
  }, [search]);

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

  const connectPlatformAliExpress = async () => {
    try {
      setAliConnecting(true);
      markOAuthReturnOrigin();
      const res = await getAdminAliExpressAuthUrl("/admin/plans");
      const tab = openOAuthTab(res.data.url);

      if (!tab) {
        setAliConnecting(false);
        toast.error("Your browser blocked the new tab. Allow popups for this site and try again.");
        return;
      }

      toast.info(`${ALIEXPRESS_OAUTH_HINT} ${OAUTH_TAB_HINT}`, { autoClose: 10000 });

      watchOAuthTab(tab, () => {
        setAliConnecting(false);
        loadAliExpressStatus();
      });
    } catch (err) {
      setAliConnecting(false);
      toast.error(err.response?.data?.error ?? "Failed to start AliExpress authorization.");
    }
  };

  const disconnectPlatformAliExpress = async () => {
    if (!window.confirm("Disconnect the platform AliExpress account for all users?")) return;
    try {
      await disconnectAdminAliExpress();
      toast.success("Platform AliExpress disconnected.");
      loadAliExpressStatus();
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to disconnect AliExpress.");
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
      <div className="admin-plans-page__ali card-wrapper" style={{ marginBottom: 20, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: "0 0 6px", fontSize: 20 }}>Platform AliExpress</h2>
            <p style={{ margin: 0, color: "#6b7280", fontSize: 14, maxWidth: 640 }}>
              Connect the shared AliExpress Dropshipping account used for product browse and import across all clients.
              Tokens are saved securely on the server and refreshed automatically.
            </p>
          </div>
          {!aliStatus.loading && !aliStatus.connected ? (
            <button
              type="button"
              className="marketplace-settings__plan-btn"
              onClick={connectPlatformAliExpress}
              disabled={aliConnecting || aliStatus.credentials_configured === false}
            >
              {aliConnecting ? <LuLoader className="spin-icon" /> : <LuLink />}
              <span>{aliConnecting ? "Opening AliExpress…" : "Connect AliExpress"}</span>
            </button>
          ) : null}
        </div>

        {aliStatus.credentials_configured === false ? (
          <p style={{ margin: "14px 0 0", color: "#991b1b", fontSize: 13 }}>
            Set ALIEXPRESS_APP_KEY and ALIEXPRESS_APP_SECRET in the backend .env file first.
          </p>
        ) : null}

        {aliStatus.loading ? (
          <p style={{ margin: "14px 0 0", color: "#6b7280" }}>Checking platform connection…</p>
        ) : aliStatus.connected ? (
          <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#166534" }}>
              <LuBadgeCheck />
              <span>
                Connected as <strong>{aliStatus.ae_user_nick ?? aliStatus.ae_account ?? "AliExpress Seller"}</strong>
              </span>
            </div>
            {aliStatus.token_expires_at ? (
              <span style={{ color: "#6b7280", fontSize: 13 }}>
                Access token expires: {new Date(aliStatus.token_expires_at).toLocaleString()}
              </span>
            ) : null}
            {aliStatus.needs_reconnect ? (
              <span style={{ color: "#b45309", fontSize: 13 }}>Refresh token expired — reconnect AliExpress.</span>
            ) : null}
            <button
              type="button"
              className="marketplace-settings__ebay-btn marketplace-settings__ebay-btn--disconnect"
              onClick={disconnectPlatformAliExpress}
              style={{ width: "fit-content", marginTop: 4 }}
            >
              <LuUnplug />
              <span>Disconnect platform account</span>
            </button>
          </div>
        ) : (
          <p style={{ margin: "14px 0 0", color: "#6b7280", fontSize: 13 }}>
            Not connected. Clients cannot browse or import AliExpress products until you connect here.
          </p>
        )}
      </div>

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
