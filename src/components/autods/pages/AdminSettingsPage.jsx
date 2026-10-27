import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { LuBadgeCheck, LuEye, LuEyeOff, LuKey, LuLink, LuLoader, LuPlug, LuSettings2, LuSheet, LuSparkles, LuUnplug } from "react-icons/lu";
import { selectUserRole } from "../../../store/selectors/AuthSelectors";
import { toast } from "../../../utils/toast";
import {
  disconnectAdminAliExpress,
  getAdminAliExpressAuthUrl,
  getAdminAliExpressStatus,
  disconnectAdminGoogle,
  getAdminGoogleAuthUrl,
  getAdminGoogleStatus,
  getAdminOpenAiStatus,
  updateAdminOpenAiSettings,
  testAdminOpenAiConnection,
} from "../../../services/AdminService";
import { ALIEXPRESS_OAUTH_HINT, markOAuthReturnOrigin, openOAuthTab, OAUTH_TAB_HINT, watchOAuthTab } from "../../../utils/oauthBridge";

function AdminSettingsPage() {
  const role = useSelector(selectUserRole);
  const navigate = useNavigate();
  const { search } = useLocation();
  const [aliStatus, setAliStatus] = useState({ loading: true, connected: false });
  const [aliConnecting, setAliConnecting] = useState(false);
  const [googleStatus, setGoogleStatus] = useState({ loading: true, connected: false });
  const [googleConnecting, setGoogleConnecting] = useState(false);
  const [openAiStatus, setOpenAiStatus] = useState({ loading: true, configured: false });
  const [openAiKey, setOpenAiKey] = useState("");
  const [openAiImageModel, setOpenAiImageModel] = useState("dall-e-2");
  const [openAiVisionModel, setOpenAiVisionModel] = useState("gpt-4o");
  const [openAiCreditsPerImage, setOpenAiCreditsPerImage] = useState(1);
  const [showKey, setShowKey] = useState(false);
  const [openAiSaving, setOpenAiSaving] = useState(false);
  const [openAiTesting, setOpenAiTesting] = useState(false);

  useEffect(() => {
    if (role !== "super_admin") {
      navigate("/");
    }
  }, [role, navigate]);

  const loadAliExpressStatus = () => {
    setAliStatus((prev) => ({ ...prev, loading: true }));
    getAdminAliExpressStatus()
      .then((res) => setAliStatus({ ...res.data, loading: false }))
      .catch(() => setAliStatus({ loading: false, connected: false }));
  };

  const loadGoogleStatus = () => {
    setGoogleStatus((prev) => ({ ...prev, loading: true }));
    getAdminGoogleStatus()
      .then((res) => setGoogleStatus({ ...res.data, loading: false }))
      .catch(() => setGoogleStatus({ loading: false, connected: false }));
  };

  const loadOpenAiStatus = () => {
    setOpenAiStatus((prev) => ({ ...prev, loading: true }));
    getAdminOpenAiStatus()
      .then((res) => {
        setOpenAiStatus({ ...res.data, loading: false });
        if (res.data?.image_model) setOpenAiImageModel(res.data.image_model);
        if (res.data?.vision_model) setOpenAiVisionModel(res.data.vision_model);
        if (res.data?.credits_per_image !== undefined) setOpenAiCreditsPerImage(res.data.credits_per_image);
      })
      .catch(() => setOpenAiStatus({ loading: false, configured: false }));
  };

  const handleSaveOpenAi = async () => {
    setOpenAiSaving(true);
    try {
      const payload = {
        image_model: openAiImageModel,
        vision_model: openAiVisionModel,
        credits_per_image: Math.max(1, parseInt(openAiCreditsPerImage, 10) || 1),
      };
      if (openAiKey.trim()) {
        payload.api_key = openAiKey.trim();
      }
      await updateAdminOpenAiSettings(payload);
      toast.success("OpenAI settings updated successfully.");
      setOpenAiKey("");
      loadOpenAiStatus();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to save OpenAI settings.");
    } finally {
      setOpenAiSaving(false);
    }
  };

  const handleTestOpenAi = async () => {
    setOpenAiTesting(true);
    try {
      const payload = openAiKey.trim() ? { api_key: openAiKey.trim() } : {};
      const res = await testAdminOpenAiConnection(payload);
      toast.success(res.data?.message ?? "OpenAI API connection verified!");
      loadOpenAiStatus();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "OpenAI connection test failed.");
    } finally {
      setOpenAiTesting(false);
    }
  };

  useEffect(() => {
    if (role === "super_admin") {
      loadAliExpressStatus();
      loadGoogleStatus();
      loadOpenAiStatus();
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

    if (params.get("google") === "connected") {
      toast.success("Google account connected for Sheets export.");
      loadGoogleStatus();
    } else if (params.get("google") === "error") {
      toast.error(`Google connection failed: ${params.get("reason") ?? "Unknown error"}`);
    }
  }, [search]);

  const connectPlatformAliExpress = async () => {
    try {
      setAliConnecting(true);
      markOAuthReturnOrigin();
      const res = await getAdminAliExpressAuthUrl("/admin/settings");
      const tab = openOAuthTab(res.data?.url);

      if (!tab) {
        setAliConnecting(false);
        toast.error(OAUTH_TAB_HINT);
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
    if (!window.confirm("Disconnect the platform AliExpress account for all clients?")) {
      return;
    }

    try {
      await disconnectAdminAliExpress();
      toast.success("Platform AliExpress disconnected.");
      loadAliExpressStatus();
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to disconnect AliExpress.");
    }
  };

  const connectGoogle = async () => {
    try {
      setGoogleConnecting(true);
      markOAuthReturnOrigin();
      const res = await getAdminGoogleAuthUrl("/admin/settings");
      const tab = openOAuthTab(res.data?.url);

      if (!tab) {
        setGoogleConnecting(false);
        toast.error(OAUTH_TAB_HINT);
        return;
      }

      toast.info(`Sign in with the Google account that should own all client order sheets. ${OAUTH_TAB_HINT}`, { autoClose: 10000 });
      watchOAuthTab(tab, () => {
        setGoogleConnecting(false);
        loadGoogleStatus();
      });
    } catch (err) {
      setGoogleConnecting(false);
      toast.error(err.response?.data?.error ?? "Failed to start Google authorization.");
    }
  };

  const disconnectGoogle = async () => {
    if (!window.confirm("Disconnect the Google account? Order exports will stop until reconnected.")) {
      return;
    }

    try {
      await disconnectAdminGoogle();
      toast.success("Google account disconnected.");
      loadGoogleStatus();
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to disconnect Google.");
    }
  };

  if (role !== "super_admin") {
    return null;
  }

  return (
    <section className="admin-page admin-settings-page">
      <header className="admin-page__hero">
        <span className="admin-page__eyebrow"><LuSettings2 /> Settings</span>
        <h1>Platform Settings</h1>
        <p>Configure integrations used across all client accounts.</p>
      </header>

      <div className="admin-settings-page__card card-wrapper">
        <div className="admin-settings-page__card-head">
          <div className="admin-settings-page__icon-wrap">
            <LuPlug />
          </div>
          <div>
            <h2>AliExpress Dropshipping</h2>
            <p>
              Connect the shared AliExpress account used for product browse and import.
              Tokens are stored securely on the server and refreshed automatically.
            </p>
          </div>
        </div>

        {aliStatus.credentials_configured === false ? (
          <div className="admin-settings-page__alert admin-settings-page__alert--error">
            Set <code>ALIEXPRESS_APP_KEY</code> and <code>ALIEXPRESS_APP_SECRET</code> in the backend <code>.env</code> file first.
          </div>
        ) : null}

        {aliStatus.loading ? (
          <div className="admin-settings-page__loading">
            <LuLoader className="spin-icon" />
            <span>Checking connection…</span>
          </div>
        ) : aliStatus.connected ? (
          <div className="admin-settings-page__status admin-settings-page__status--connected">
            <div className="admin-settings-page__status-row">
              <LuBadgeCheck />
              <div>
                <strong>Connected</strong>
                <span>
                  Signed in as {aliStatus.ae_user_nick ?? aliStatus.ae_account ?? "AliExpress Seller"}
                </span>
              </div>
            </div>
            {aliStatus.token_expires_at ? (
              <p className="admin-settings-page__meta">
                Access token expires {new Date(aliStatus.token_expires_at).toLocaleString()}
              </p>
            ) : null}
            {aliStatus.needs_reconnect ? (
              <p className="admin-settings-page__meta admin-settings-page__meta--warn">
                Refresh token expired — reconnect AliExpress.
              </p>
            ) : null}
            <button
              type="button"
              className="admin-page__btn admin-page__btn--danger"
              onClick={disconnectPlatformAliExpress}
            >
              <LuUnplug />
              <span>Disconnect</span>
            </button>
          </div>
        ) : (
          <div className="admin-settings-page__status">
            <p className="admin-settings-page__meta">
              Not connected. Clients cannot browse or import AliExpress products until you connect here.
            </p>
            <button
              type="button"
              className="admin-page__btn admin-page__btn--primary"
              onClick={connectPlatformAliExpress}
              disabled={aliConnecting || aliStatus.credentials_configured === false}
            >
              {aliConnecting ? <LuLoader className="spin-icon" /> : <LuLink />}
              <span>{aliConnecting ? "Opening AliExpress…" : "Connect AliExpress"}</span>
            </button>
          </div>
        )}
      </div>

      <div className="admin-settings-page__card card-wrapper">
        <div className="admin-settings-page__card-head">
          <div className="admin-settings-page__icon-wrap">
            <LuSheet />
          </div>
          <div>
            <h2>Google Sheets Export</h2>
            <p>
              Connect one Google account that will own every client&apos;s order spreadsheet.
              Each client gets their own sheet created in this account and shared with them.
            </p>
          </div>
        </div>

        {googleStatus.credentials_configured === false ? (
          <div className="admin-settings-page__alert admin-settings-page__alert--error">
            Set <code>GOOGLE_OAUTH_CLIENT_ID</code> and <code>GOOGLE_OAUTH_CLIENT_SECRET</code> in the backend <code>.env</code> file first.
          </div>
        ) : null}

        {googleStatus.loading ? (
          <div className="admin-settings-page__loading">
            <LuLoader className="spin-icon" />
            <span>Checking connection…</span>
          </div>
        ) : googleStatus.connected ? (
          <div className="admin-settings-page__status admin-settings-page__status--connected">
            <div className="admin-settings-page__status-row">
              <LuBadgeCheck />
              <div>
                <strong>Connected</strong>
                <span>Signed in as {googleStatus.email ?? "Google account"}</span>
              </div>
            </div>
            <p className="admin-settings-page__meta">
              All client order sheets are created in and owned by this account.
            </p>
            <button
              type="button"
              className="admin-page__btn admin-page__btn--danger"
              onClick={disconnectGoogle}
            >
              <LuUnplug />
              <span>Disconnect</span>
            </button>
          </div>
        ) : (
          <div className="admin-settings-page__status">
            <p className="admin-settings-page__meta">
              Not connected. Clients cannot export orders to Google Sheets until you connect an account here.
            </p>
            <button
              type="button"
              className="admin-page__btn admin-page__btn--primary"
              onClick={connectGoogle}
              disabled={googleConnecting || googleStatus.credentials_configured === false}
            >
              {googleConnecting ? <LuLoader className="spin-icon" /> : <LuLink />}
              <span>{googleConnecting ? "Opening Google…" : "Connect Google"}</span>
            </button>
          </div>
        )}
      </div>

      <div className="admin-settings-page__card card-wrapper">
        <div className="admin-settings-page__card-head">
          <div className="admin-settings-page__icon-wrap">
            <LuSparkles />
          </div>
          <div>
            <h2>OpenAI / ChatGPT Image Generation</h2>
            <p>
              Configure the OpenAI API key used for generating high-resolution product photography
              and e-commerce template images with DALL-E 3 &amp; GPT-4o Vision.
            </p>
          </div>
        </div>

        {openAiStatus.loading ? (
          <div className="admin-settings-page__loading">
            <LuLoader className="spin-icon" />
            <span>Checking OpenAI configuration…</span>
          </div>
        ) : (
          <div className="admin-settings-page__status">
            <div className="admin-settings-page__status-row mb-3">
              <LuBadgeCheck style={{ color: openAiStatus.configured ? "#10b981" : "#94a3b8" }} />
              <div>
                <strong>{openAiStatus.configured ? "Configured & Active" : "Not Configured"}</strong>
                <span>
                  {openAiStatus.configured
                    ? `API Key: ${openAiStatus.masked_key || "Stored securely"}`
                    : "Enter your OpenAI API key below or set OPENAI_API_KEY in backend .env."}
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gap: 16, marginTop: 12, maxWidth: 640 }}>
              <label className="ai-gen-hub__field" style={{ margin: 0 }}>
                <span className="ai-gen-hub__field-label" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>OpenAI API Key (ChatGPT)</span>
                  {openAiStatus.configured && (
                    <small style={{ color: "#10b981" }}>Current key active</small>
                  )}
                </span>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    type={showKey ? "text" : "password"}
                    placeholder={openAiStatus.configured ? "Enter new key to update..." : "sk-..."}
                    value={openAiKey}
                    onChange={(e) => setOpenAiKey(e.target.value)}
                    style={{ paddingRight: 40, width: "100%" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    style={{
                      position: "absolute",
                      right: 10,
                      background: "none",
                      border: "none",
                      color: "#64748b",
                      cursor: "pointer",
                      padding: 4,
                    }}
                    title={showKey ? "Hide key" : "Show key"}
                  >
                    {showKey ? <LuEyeOff /> : <LuEye />}
                  </button>
                </div>
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <label className="ai-gen-hub__field" style={{ margin: 0 }}>
                  <span className="ai-gen-hub__field-label">Image Model</span>
                  <select value={openAiImageModel} onChange={(e) => setOpenAiImageModel(e.target.value)}>
                    <option value="dall-e-2">DALL-E 2 (Standard - Normal)</option>
                    <option value="dall-e-3">DALL-E 3 (HD)</option>
                  </select>
                </label>

                <label className="ai-gen-hub__field" style={{ margin: 0 }}>
                  <span className="ai-gen-hub__field-label">Vision Enhancement Model</span>
                  <select value={openAiVisionModel} onChange={(e) => setOpenAiVisionModel(e.target.value)}>
                    <option value="gpt-4o">GPT-4o (Recommended)</option>
                    <option value="gpt-4o-mini">GPT-4o Mini</option>
                  </select>
                </label>
              </div>

              <label className="ai-gen-hub__field" style={{ margin: 0 }}>
                <span className="ai-gen-hub__field-label">AI Credits Cost Per Image</span>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={openAiCreditsPerImage}
                  onChange={(e) => setOpenAiCreditsPerImage(e.target.value)}
                  placeholder="1"
                  style={{ width: "100%" }}
                />
                <small style={{ color: "#64748b", marginTop: 4, display: "block" }}>
                  Number of AI credits deducted from a user's balance for each generated image (e.g. 1 credit = 1 image).
                </small>
              </label>

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  className="admin-page__btn admin-page__btn--primary"
                  onClick={handleSaveOpenAi}
                  disabled={openAiSaving || openAiTesting}
                >
                  {openAiSaving ? <LuLoader className="spin-icon" /> : <LuSparkles />}
                  <span>{openAiSaving ? "Saving…" : "Save OpenAI Settings"}</span>
                </button>

                <button
                  type="button"
                  className="admin-page__btn admin-page__btn--ghost"
                  onClick={handleTestOpenAi}
                  disabled={openAiSaving || openAiTesting}
                >
                  {openAiTesting ? <LuLoader className="spin-icon" /> : <LuKey />}
                  <span>{openAiTesting ? "Testing…" : "Test Connection"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default AdminSettingsPage;
