import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { LuBadgeCheck, LuLink, LuLoader, LuPlug, LuSettings2, LuSheet, LuUnplug } from "react-icons/lu";
import { selectUserRole } from "../../../store/selectors/AuthSelectors";
import { toast } from "../../../utils/toast";
import {
  disconnectAdminAliExpress,
  getAdminAliExpressAuthUrl,
  getAdminAliExpressStatus,
  disconnectAdminGoogle,
  getAdminGoogleAuthUrl,
  getAdminGoogleStatus,
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

  useEffect(() => {
    if (role === "super_admin") {
      loadAliExpressStatus();
      loadGoogleStatus();
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
    </section>
  );
}

export default AdminSettingsPage;
