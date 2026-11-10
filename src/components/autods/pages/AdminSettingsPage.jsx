import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  LuBadgeCheck,
  LuBoxes,
  LuChartLine,
  LuChevronDown,
  LuDollarSign,
  LuExternalLink,
  LuEye,
  LuEyeOff,
  LuFileText,
  LuKey,
  LuLayers,
  LuLink,
  LuLoader,
  LuPackageCheck,
  LuPlug,
  LuRotateCcw,
  LuSave,
  LuSearch,
  LuSettings2,
  LuSheet,
  LuShieldCheck,
  LuShoppingCart,
  LuSparkles,
  LuTruck,
  LuUnplug,
  LuZap,
} from "react-icons/lu";
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
  getAdminAddonSettings,
  updateAdminAddonSettings,
  getAdminLegalDocuments,
  updateAdminLegalDocuments,
  resetAdminLegalDocuments,
} from "../../../services/AdminService";
import { ALIEXPRESS_OAUTH_HINT, markOAuthReturnOrigin, openOAuthTab, OAUTH_TAB_HINT, watchOAuthTab } from "../../../utils/oauthBridge";
import ConfirmModal from "../ConfirmModal";
import { formatLegalDate, renderLegalContent } from "../../../utils/legalFormat";
import { formatAiInputUsd, formatAiUsd, formatCreditConversionLabel } from "../../../utils/aiPricing";
import "../../../assets/css/legal-documents.css";

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
  const [openAiPricePerCredit, setOpenAiPricePerCredit] = useState("0.02");
  const [openAiCreditsPerImage, setOpenAiCreditsPerImage] = useState("1");
  const [openAiImageUsd, setOpenAiImageUsd] = useState("0.02");
  const [openAiCreditsPerTitle, setOpenAiCreditsPerTitle] = useState("1");
  const [openAiTitleUsd, setOpenAiTitleUsd] = useState("0.02");
  const [showKey, setShowKey] = useState(false);
  const [openAiSaving, setOpenAiSaving] = useState(false);
  const [openAiTesting, setOpenAiTesting] = useState(false);

  // Platform Add-ons Settings State
  const [addonStatus, setAddonStatus] = useState({
    loading: true,
    order_processing: {
      enabled: true,
      price_per_order: 0.30,
      monthly_unlimited_price: 29.99,
      included_free_orders: 0,
      billing_mode: "per_order",
      description: "Automated 1-click & bulk AliExpress order fulfillment, address formatting, and tracking synchronization.",
    },
    sourcing_requests: {
      enabled: true,
      price_per_request: 1.50,
      included_free_monthly: 5,
      bulk_pack_5_price: 6.00,
      bulk_pack_10_price: 10.00,
      description: "Get dedicated agent sourcing quotes from verified factory suppliers with guaranteed 24-48h turnaround.",
    },
    auto_tracking: {
      enabled: true,
      price_per_order: 0.05,
      description: "Automated tracking number retrieval and instant update to eBay buyers.",
    },
    trending_products: {
      enabled: true,
      price: 14.99,
      billing_mode: "monthly",
      description: "Unlock daily winning & trending product feeds curated by AutoDS market research analysts.",
    },
    hand_picked_products: {
      enabled: true,
      price: 19.99,
      billing_mode: "monthly",
      description: "Access hand-picked high-margin winning products with verified supplier links and profit potential.",
    },
    updated_at: null,
  });
  const [addonSaving, setAddonSaving] = useState(false);

  // Legal Agreements (Terms & Conditions & Privacy Policy) State
  const [legalState, setLegalState] = useState({
    loading: true,
    terms_and_conditions: {
      title: "Terms & Conditions",
      content: "",
      updated_at: null,
    },
    privacy_policy: {
      title: "Privacy Policy",
      content: "",
      updated_at: null,
    },
  });
  const [legalActiveTab, setLegalActiveTab] = useState("terms_and_conditions");
  const [legalPreviewMode, setLegalPreviewMode] = useState(false);
  const [legalSaving, setLegalSaving] = useState(false);
  const [legalResetting, setLegalResetting] = useState(false);
  const [legalResetModalOpen, setLegalResetModalOpen] = useState(false);

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

  const loadAddonSettings = () => {
    setAddonStatus((prev) => ({ ...prev, loading: true }));
    getAdminAddonSettings()
      .then((res) => {
        const data = res.data?.addons ?? {};
        setAddonStatus((prev) => ({
          ...prev,
          ...data,
          loading: false,
        }));
      })
      .catch(() => setAddonStatus((prev) => ({ ...prev, loading: false })));
  };

  const handleSaveAddons = async () => {
    setAddonSaving(true);
    try {
      const payload = {
        order_processing: {
          enabled: Boolean(addonStatus.order_processing?.enabled),
          price_per_order: Math.max(0, parseFloat(addonStatus.order_processing?.price_per_order) || 0),
          monthly_unlimited_price: Math.max(0, parseFloat(addonStatus.order_processing?.monthly_unlimited_price) || 0),
          included_free_orders: Math.max(0, parseInt(addonStatus.order_processing?.included_free_orders, 10) || 0),
          billing_mode: addonStatus.order_processing?.billing_mode || "per_order",
          description: addonStatus.order_processing?.description || "",
        },
        sourcing_requests: {
          enabled: Boolean(addonStatus.sourcing_requests?.enabled),
          price_per_request: Math.max(0, parseFloat(addonStatus.sourcing_requests?.price_per_request) || 0),
          included_free_monthly: Math.max(0, parseInt(addonStatus.sourcing_requests?.included_free_monthly, 10) || 0),
          bulk_pack_5_price: Math.max(0, parseFloat(addonStatus.sourcing_requests?.bulk_pack_5_price) || 0),
          bulk_pack_10_price: Math.max(0, parseFloat(addonStatus.sourcing_requests?.bulk_pack_10_price) || 0),
          description: addonStatus.sourcing_requests?.description || "",
        },
        auto_tracking: {
          enabled: Boolean(addonStatus.auto_tracking?.enabled),
          price_per_order: Math.max(0, parseFloat(addonStatus.auto_tracking?.price_per_order) || 0),
          description: addonStatus.auto_tracking?.description || "",
        },
        trending_products: {
          enabled: Boolean(addonStatus.trending_products?.enabled),
          price: Math.max(0, parseFloat(addonStatus.trending_products?.price) || 0),
          billing_mode: addonStatus.trending_products?.billing_mode === "one_time" ? "one_time" : "monthly",
          description: addonStatus.trending_products?.description || "",
        },
        hand_picked_products: {
          enabled: Boolean(addonStatus.hand_picked_products?.enabled),
          price: Math.max(0, parseFloat(addonStatus.hand_picked_products?.price) || 0),
          billing_mode: addonStatus.hand_picked_products?.billing_mode === "one_time" ? "one_time" : "monthly",
          description: addonStatus.hand_picked_products?.description || "",
        },
      };
      await updateAdminAddonSettings(payload);
      toast.success("Add-on pricing & configurations saved successfully.");
      window.dispatchEvent(new CustomEvent("autods_refresh_addons"));
      try {
        localStorage.setItem("autods_addon_updated_at", String(Date.now()));
      } catch {
        // Ignore cross-tab storage errors
      }
      loadAddonSettings();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to save add-on settings.");
    } finally {
      setAddonSaving(false);
    }
  };

  const loadOpenAiStatus = () => {
    setOpenAiStatus((prev) => ({ ...prev, loading: true }));
    getAdminOpenAiStatus()
      .then((res) => {
        const d = res.data ?? {};
        setOpenAiStatus({ ...d, loading: false });
        if (d.image_model) setOpenAiImageModel(d.image_model);
        if (d.vision_model) setOpenAiVisionModel(d.vision_model);

        const ppc = Math.max(0.0001, Number(d.price_per_credit ?? 0.02) || 0.02);
        const imgCredits = Math.max(1, parseInt(d.credits_per_image ?? 1, 10) || 1);
        const titleCredits = Math.max(1, parseInt(d.credits_per_title ?? 1, 10) || 1);

        setOpenAiPricePerCredit(formatAiInputUsd(ppc));
        setOpenAiCreditsPerImage(String(imgCredits));
        setOpenAiImageUsd(formatAiInputUsd(d.image_cost_usd ?? imgCredits * ppc));
        setOpenAiCreditsPerTitle(String(titleCredits));
        setOpenAiTitleUsd(formatAiInputUsd(d.title_cost_usd ?? titleCredits * ppc));
      })
      .catch(() => setOpenAiStatus({ loading: false, configured: false }));
  };

  const getEffectivePricePerCredit = () => {
    const parsed = parseFloat(openAiPricePerCredit);
    return Number.isFinite(parsed) && parsed >= 0.0001 ? Math.min(100, parsed) : 0.02;
  };

  const handlePricePerCreditChange = (val) => {
    setOpenAiPricePerCredit(val);
    const parsed = parseFloat(val);
    if (Number.isFinite(parsed) && parsed > 0) {
      const imgCredits = Math.max(1, parseInt(openAiCreditsPerImage, 10) || 1);
      const titleCredits = Math.max(1, parseInt(openAiCreditsPerTitle, 10) || 1);
      setOpenAiImageUsd(formatAiInputUsd(imgCredits * parsed));
      setOpenAiTitleUsd(formatAiInputUsd(titleCredits * parsed));
    }
  };

  const handleImageCreditsChange = (val) => {
    setOpenAiCreditsPerImage(val);
    const credits = parseInt(val, 10);
    if (Number.isFinite(credits) && credits >= 1) {
      setOpenAiImageUsd(formatAiInputUsd(credits * getEffectivePricePerCredit()));
    }
  };

  const handleImageUsdChange = (val) => {
    setOpenAiImageUsd(val);
    const usd = parseFloat(val);
    if (Number.isFinite(usd) && usd > 0) {
      const computedCredits = Math.max(1, Math.min(1000, Math.round(usd / getEffectivePricePerCredit())));
      setOpenAiCreditsPerImage(String(computedCredits));
    }
  };

  const handleImageUsdBlur = () => {
    const credits = Math.max(1, parseInt(openAiCreditsPerImage, 10) || 1);
    setOpenAiCreditsPerImage(String(credits));
    setOpenAiImageUsd(formatAiInputUsd(credits * getEffectivePricePerCredit()));
  };

  const handleTitleCreditsChange = (val) => {
    setOpenAiCreditsPerTitle(val);
    const credits = parseInt(val, 10);
    if (Number.isFinite(credits) && credits >= 1) {
      setOpenAiTitleUsd(formatAiInputUsd(credits * getEffectivePricePerCredit()));
    }
  };

  const handleTitleUsdChange = (val) => {
    setOpenAiTitleUsd(val);
    const usd = parseFloat(val);
    if (Number.isFinite(usd) && usd > 0) {
      const computedCredits = Math.max(1, Math.min(1000, Math.round(usd / getEffectivePricePerCredit())));
      setOpenAiCreditsPerTitle(String(computedCredits));
    }
  };

  const handleTitleUsdBlur = () => {
    const credits = Math.max(1, parseInt(openAiCreditsPerTitle, 10) || 1);
    setOpenAiCreditsPerTitle(String(credits));
    setOpenAiTitleUsd(formatAiInputUsd(credits * getEffectivePricePerCredit()));
  };

  const handleSaveOpenAi = async () => {
    const pricePerCredit = Math.round(getEffectivePricePerCredit() * 10000) / 10000;
    const creditsPerImage = Math.max(1, Math.min(1000, parseInt(openAiCreditsPerImage, 10) || 1));
    const creditsPerTitle = Math.max(1, Math.min(1000, parseInt(openAiCreditsPerTitle, 10) || 1));

    setOpenAiSaving(true);
    try {
      const payload = {
        image_model: openAiImageModel,
        vision_model: openAiVisionModel,
        price_per_credit: pricePerCredit,
        credits_per_image: creditsPerImage,
        credits_per_title: creditsPerTitle,
      };
      if (openAiKey.trim()) {
        payload.api_key = openAiKey.trim();
      }
      await updateAdminOpenAiSettings(payload);
      toast.success("OpenAI & AI credit pricing settings updated successfully.");
      setOpenAiKey("");
      window.dispatchEvent(new CustomEvent("autods_refresh_ai_config"));
      try {
        localStorage.setItem("autods_ai_config_updated_at", String(Date.now()));
      } catch {
        // Ignore storage errors
      }
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

  const loadLegalDocuments = () => {
    setLegalState((prev) => ({ ...prev, loading: true }));
    getAdminLegalDocuments()
      .then((res) => {
        setLegalState({
          loading: false,
          terms_and_conditions: res.data?.terms_and_conditions ?? {
            title: "Terms & Conditions",
            content: "",
            updated_at: null,
          },
          privacy_policy: res.data?.privacy_policy ?? {
            title: "Privacy Policy",
            content: "",
            updated_at: null,
          },
        });
      })
      .catch(() => {
        setLegalState((prev) => ({ ...prev, loading: false }));
        toast.error("Failed to load legal agreement templates.");
      });
  };

  const handleSaveLegalDocuments = async () => {
    const termsContent = (legalState.terms_and_conditions?.content || "").trim();
    const privacyContent = (legalState.privacy_policy?.content || "").trim();

    if (termsContent.length < 10) {
      setLegalActiveTab("terms_and_conditions");
      setLegalPreviewMode(false);
      toast.error("Terms & Conditions text must be at least 10 characters.");
      return;
    }

    if (privacyContent.length < 10) {
      setLegalActiveTab("privacy_policy");
      setLegalPreviewMode(false);
      toast.error("Privacy Policy text must be at least 10 characters.");
      return;
    }

    setLegalSaving(true);
    try {
      const res = await updateAdminLegalDocuments({
        terms_and_conditions: {
          title: (legalState.terms_and_conditions?.title || "Terms & Conditions").trim() || "Terms & Conditions",
          content: termsContent,
        },
        privacy_policy: {
          title: (legalState.privacy_policy?.title || "Privacy Policy").trim() || "Privacy Policy",
          content: privacyContent,
        },
      });
      setLegalState({
        loading: false,
        terms_and_conditions: res.data?.terms_and_conditions ?? legalState.terms_and_conditions,
        privacy_policy: res.data?.privacy_policy ?? legalState.privacy_policy,
      });
      toast.success(res.data?.message || "Legal agreements updated successfully.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save legal agreements.");
    } finally {
      setLegalSaving(false);
    }
  };

  const handleResetLegalDocument = async () => {
    setLegalResetting(true);
    try {
      const res = await resetAdminLegalDocuments(legalActiveTab);
      setLegalState({
        loading: false,
        terms_and_conditions: res.data?.terms_and_conditions ?? legalState.terms_and_conditions,
        privacy_policy: res.data?.privacy_policy ?? legalState.privacy_policy,
      });
      setLegalResetModalOpen(false);
      toast.success(res.data?.message || "Default legal template restored.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to restore default template.");
    } finally {
      setLegalResetting(false);
    }
  };

  useEffect(() => {
    if (role === "super_admin") {
      loadAliExpressStatus();
      loadGoogleStatus();
      loadOpenAiStatus();
      loadAddonSettings();
      loadLegalDocuments();
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
            <h2>OpenAI Studio &amp; AI Credits Pricing</h2>
            <p>
              Configure the OpenAI API key, base USD price per AI credit, and per-operation Credit &amp; USD rates
              for AI product photography and eBay SEO product title optimization.
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

            <div className="admin-settings-ai-form">
              {/* Field 1: OpenAI API Key */}
              <div className="admin-settings-ai-field">
                <div className="admin-settings-ai-label-row">
                  <label htmlFor="openai-key-input" className="admin-settings-ai-label">
                    OpenAI API Key (ChatGPT)
                  </label>
                  {openAiStatus.configured ? (
                    <span className="admin-settings-ai-badge admin-settings-ai-badge--active">
                      <LuBadgeCheck /> Current key active
                    </span>
                  ) : (
                    <span className="admin-settings-ai-badge admin-settings-ai-badge--inactive">
                      Key required
                    </span>
                  )}
                </div>
                <div className="admin-settings-ai-input-wrap">
                  <span className="admin-settings-ai-input-icon">
                    <LuKey />
                  </span>
                  <input
                    id="openai-key-input"
                    className="admin-settings-ai-input"
                    type={showKey ? "text" : "password"}
                    placeholder={openAiStatus.configured ? "Enter new key to update..." : "sk-..."}
                    value={openAiKey}
                    onChange={(e) => setOpenAiKey(e.target.value)}
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    className="admin-settings-ai-eye-btn"
                    onClick={() => setShowKey(!showKey)}
                    title={showKey ? "Hide key" : "Show key"}
                    aria-label={showKey ? "Hide key" : "Show key"}
                  >
                    {showKey ? <LuEyeOff /> : <LuEye />}
                  </button>
                </div>
                <p className="admin-settings-ai-help">
                  {openAiStatus.configured
                    ? `Current active key: ${openAiStatus.masked_key || "Stored securely"}. Enter a new key above only if you wish to change it.`
                    : "Enter your OpenAI secret API key (starts with sk-...). It will be stored securely on the server."}
                </p>
              </div>

              {/* Fields 2 & 3: Model Selectors */}
              <div className="admin-settings-ai-grid">
                <div className="admin-settings-ai-field">
                  <label htmlFor="openai-image-model" className="admin-settings-ai-label">
                    Image Model
                  </label>
                  <div className="admin-settings-ai-select-wrap">
                    <select
                      id="openai-image-model"
                      className="admin-settings-ai-select"
                      value={openAiImageModel}
                      onChange={(e) => setOpenAiImageModel(e.target.value)}
                    >
                      <option value="dall-e-2">DALL-E 2 (Standard - Normal)</option>
                      <option value="dall-e-3">DALL-E 3 (HD - High Definition)</option>
                    </select>
                    <span className="admin-settings-ai-select-arrow">
                      <LuChevronDown />
                    </span>
                  </div>
                  <p className="admin-settings-ai-help">
                    Generates output images from your product prompts.
                  </p>
                </div>

                <div className="admin-settings-ai-field">
                  <label htmlFor="openai-vision-model" className="admin-settings-ai-label">
                    Text &amp; Vision Model (Titles / Vision)
                  </label>
                  <div className="admin-settings-ai-select-wrap">
                    <select
                      id="openai-vision-model"
                      className="admin-settings-ai-select"
                      value={openAiVisionModel}
                      onChange={(e) => setOpenAiVisionModel(e.target.value)}
                    >
                      <option value="gpt-4o">GPT-4o (Recommended)</option>
                      <option value="gpt-4o-mini">GPT-4o Mini</option>
                    </select>
                    <span className="admin-settings-ai-select-arrow">
                      <LuChevronDown />
                    </span>
                  </div>
                  <p className="admin-settings-ai-help">
                    Analyzes input photos and powers AI product title optimization.
                  </p>
                </div>
              </div>

              {/* Field 4: Price Per AI Credit ($ USD) */}
              <div className="admin-settings-ai-field">
                <label htmlFor="openai-price-per-credit" className="admin-settings-ai-label">
                  Price Per AI Credit ($ USD)
                </label>
                <div className="admin-settings-ai-input-wrap">
                  <span className="admin-settings-ai-input-icon">
                    <LuDollarSign style={{ color: "#10b981" }} />
                  </span>
                  <input
                    id="openai-price-per-credit"
                    className="admin-settings-ai-input"
                    type="number"
                    min="0.0001"
                    max="100"
                    step="0.0001"
                    value={openAiPricePerCredit}
                    onChange={(e) => handlePricePerCreditChange(e.target.value)}
                    placeholder="0.02"
                    style={{ paddingRight: 112 }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      right: 12,
                      fontSize: 12,
                      fontWeight: 650,
                      color: "#065f46",
                      backgroundColor: "#ecfdf5",
                      border: "1px solid #a7f3d0",
                      padding: "4px 8px",
                      borderRadius: 6,
                    }}
                  >
                    USD / credit
                  </span>
                </div>
                <p className="admin-settings-ai-help">
                  Base USD rate charged per 1 AI credit when users purchase credits (
                  <strong>1 Credit = {formatAiUsd(getEffectivePricePerCredit())}</strong> ·{" "}
                  <strong>{formatCreditConversionLabel(getEffectivePricePerCredit())}</strong>).
                </p>
              </div>

              {/* Field 5: Per AI Image Cost (Credits & $) */}
              <div className="admin-settings-ai-grid">
                <div className="admin-settings-ai-field">
                  <label htmlFor="openai-credits-input" className="admin-settings-ai-label">
                    AI Image Cost (Credits)
                  </label>
                  <div className="admin-settings-ai-input-wrap">
                    <span className="admin-settings-ai-input-icon">
                      <LuZap style={{ color: "#f59e0b" }} />
                    </span>
                    <input
                      id="openai-credits-input"
                      className="admin-settings-ai-input"
                      type="number"
                      min="1"
                      max="1000"
                      value={openAiCreditsPerImage}
                      onChange={(e) => handleImageCreditsChange(e.target.value)}
                      placeholder="1"
                      style={{ paddingRight: 102 }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        right: 12,
                        fontSize: 12,
                        fontWeight: 650,
                        color: "#64748b",
                        backgroundColor: "#f1f5f9",
                        padding: "4px 8px",
                        borderRadius: 6,
                      }}
                    >
                      Credits / img
                    </span>
                  </div>
                  <p className="admin-settings-ai-help">
                    Credits deducted per generated image.
                  </p>
                </div>

                <div className="admin-settings-ai-field">
                  <label htmlFor="openai-image-usd-input" className="admin-settings-ai-label">
                    AI Image Cost ($ USD)
                  </label>
                  <div className="admin-settings-ai-input-wrap">
                    <span className="admin-settings-ai-input-icon">
                      <LuDollarSign style={{ color: "#4f46e5" }} />
                    </span>
                    <input
                      id="openai-image-usd-input"
                      className="admin-settings-ai-input"
                      type="number"
                      min="0.0001"
                      step="0.0001"
                      value={openAiImageUsd}
                      onChange={(e) => handleImageUsdChange(e.target.value)}
                      onBlur={handleImageUsdBlur}
                      placeholder="0.02"
                      style={{ paddingRight: 88 }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        right: 12,
                        fontSize: 12,
                        fontWeight: 650,
                        color: "#4338ca",
                        backgroundColor: "#eef2ff",
                        padding: "4px 8px",
                        borderRadius: 6,
                      }}
                    >
                      USD / img
                    </span>
                  </div>
                  <p className="admin-settings-ai-help">
                    Synced with credits × $/credit ({Math.max(1, parseInt(openAiCreditsPerImage, 10) || 1)} ×{" "}
                    {formatAiUsd(getEffectivePricePerCredit())} ={" "}
                    <strong>
                      {formatAiUsd((Math.max(1, parseInt(openAiCreditsPerImage, 10) || 1)) * getEffectivePricePerCredit())}
                    </strong>
                    ).
                  </p>
                </div>
              </div>

              {/* Field 6: Per Product Title Cost (Credits & $) */}
              <div className="admin-settings-ai-grid">
                <div className="admin-settings-ai-field">
                  <label htmlFor="openai-title-credits-input" className="admin-settings-ai-label">
                    Product Title Cost (Credits)
                  </label>
                  <div className="admin-settings-ai-input-wrap">
                    <span className="admin-settings-ai-input-icon">
                      <LuZap style={{ color: "#f59e0b" }} />
                    </span>
                    <input
                      id="openai-title-credits-input"
                      className="admin-settings-ai-input"
                      type="number"
                      min="1"
                      max="1000"
                      value={openAiCreditsPerTitle}
                      onChange={(e) => handleTitleCreditsChange(e.target.value)}
                      placeholder="1"
                      style={{ paddingRight: 108 }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        right: 12,
                        fontSize: 12,
                        fontWeight: 650,
                        color: "#64748b",
                        backgroundColor: "#f1f5f9",
                        padding: "4px 8px",
                        borderRadius: 6,
                      }}
                    >
                      Credits / title
                    </span>
                  </div>
                  <p className="admin-settings-ai-help">
                    Credits deducted per AI product title optimization.
                  </p>
                </div>

                <div className="admin-settings-ai-field">
                  <label htmlFor="openai-title-usd-input" className="admin-settings-ai-label">
                    Product Title Cost ($ USD)
                  </label>
                  <div className="admin-settings-ai-input-wrap">
                    <span className="admin-settings-ai-input-icon">
                      <LuDollarSign style={{ color: "#4f46e5" }} />
                    </span>
                    <input
                      id="openai-title-usd-input"
                      className="admin-settings-ai-input"
                      type="number"
                      min="0.0001"
                      step="0.0001"
                      value={openAiTitleUsd}
                      onChange={(e) => handleTitleUsdChange(e.target.value)}
                      onBlur={handleTitleUsdBlur}
                      placeholder="0.02"
                      style={{ paddingRight: 94 }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        right: 12,
                        fontSize: 12,
                        fontWeight: 650,
                        color: "#4338ca",
                        backgroundColor: "#eef2ff",
                        padding: "4px 8px",
                        borderRadius: 6,
                      }}
                    >
                      USD / title
                    </span>
                  </div>
                  <p className="admin-settings-ai-help">
                    Synced with credits × $/credit ({Math.max(1, parseInt(openAiCreditsPerTitle, 10) || 1)} ×{" "}
                    {formatAiUsd(getEffectivePricePerCredit())} ={" "}
                    <strong>
                      {formatAiUsd((Math.max(1, parseInt(openAiCreditsPerTitle, 10) || 1)) * getEffectivePricePerCredit())}
                    </strong>
                    ).
                  </p>
                </div>
              </div>

              {/* User Pricing Preview Banner */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                  gap: 12,
                  padding: "14px 16px",
                  borderRadius: 10,
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block" }}>
                    Rate Per AI Credit
                  </span>
                  <strong style={{ fontSize: 15, color: "#059669" }}>
                    {formatAiUsd(getEffectivePricePerCredit())} / credit
                  </strong>
                  <span style={{ fontSize: 11, color: "#64748b", display: "block" }}>
                    {formatCreditConversionLabel(getEffectivePricePerCredit())}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block" }}>
                    Cost Per AI Image
                  </span>
                  <strong style={{ fontSize: 15, color: "#0f172a" }}>
                    {Math.max(1, parseInt(openAiCreditsPerImage, 10) || 1)} credit(s)
                  </strong>
                  <span style={{ fontSize: 11, color: "#4f46e5", fontWeight: 600, display: "block" }}>
                    {formatAiUsd((Math.max(1, parseInt(openAiCreditsPerImage, 10) || 1)) * getEffectivePricePerCredit())} USD / image
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block" }}>
                    Cost Per Product Title
                  </span>
                  <strong style={{ fontSize: 15, color: "#0f172a" }}>
                    {Math.max(1, parseInt(openAiCreditsPerTitle, 10) || 1)} credit(s)
                  </strong>
                  <span style={{ fontSize: 11, color: "#4f46e5", fontWeight: 600, display: "block" }}>
                    {formatAiUsd((Math.max(1, parseInt(openAiCreditsPerTitle, 10) || 1)) * getEffectivePricePerCredit())} USD / title
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="admin-settings-ai-actions">
                <button
                  type="button"
                  className="admin-page__btn admin-page__btn--primary"
                  onClick={handleSaveOpenAi}
                  disabled={openAiSaving || openAiTesting}
                  style={{ minHeight: 42, padding: "0 20px" }}
                >
                  {openAiSaving ? <LuLoader className="spin-icon" /> : <LuSparkles />}
                  <span>{openAiSaving ? "Saving…" : "Save OpenAI Settings"}</span>
                </button>

                <button
                  type="button"
                  className="admin-page__btn admin-page__btn--ghost"
                  onClick={handleTestOpenAi}
                  disabled={openAiSaving || openAiTesting}
                  style={{ minHeight: 42, padding: "0 18px" }}
                >
                  {openAiTesting ? <LuLoader className="spin-icon" /> : <LuKey />}
                  <span>{openAiTesting ? "Testing…" : "Test Connection"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Platform Add-ons & Automation Pricing Card */}
      <div className="admin-settings-page__card card-wrapper" style={{ marginTop: "24px" }}>
        <div className="admin-settings-page__card-head">
          <div className="admin-settings-page__icon-wrap" style={{ background: "#ecfdf5", color: "#059669" }}>
            <LuBoxes />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
              <h2>Platform Add-ons &amp; Automation Pricing</h2>
              {addonStatus.updated_at && (
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Last updated: {new Date(addonStatus.updated_at).toLocaleDateString()} {new Date(addonStatus.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            <p>
              Configure client pricing and rules for Order Processing, Sourcing Requests, Auto-Tracking, Trending Products, and Hand-Picked Products.
              These rates apply immediately and display live on the client&apos;s <strong>Plans &amp; Add-ons</strong> and <strong>Usage &amp; Upgrade</strong> views.
            </p>
          </div>
        </div>

        {addonStatus.loading ? (
          <div className="admin-settings-page__loading">
            <LuLoader className="spin-icon" />
            <span>Loading add-on configurations…</span>
          </div>
        ) : (
          <div style={{ padding: "0 24px 24px 24px" }}>
            {/* 1. Order Processing Section */}
            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "20px",
                background: "#f8fafc",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "8px",
                      background: "#e0f2fe",
                      color: "#0284c7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                    }}
                  >
                    <LuShoppingCart />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>
                      Order Processing Automation
                    </h3>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      Automated 1-click &amp; bulk AliExpress placement, address format conversion, and stock check.
                    </span>
                  </div>
                </div>

                <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: 600, fontSize: "13px", color: "#334155" }}>
                  <input
                    type="checkbox"
                    checked={addonStatus.order_processing?.enabled ?? true}
                    onChange={(e) =>
                      setAddonStatus((prev) => ({
                        ...prev,
                        order_processing: {
                          ...prev.order_processing,
                          enabled: e.target.checked,
                        },
                      }))
                    }
                    style={{ width: "16px", height: "16px", accentColor: "#0284c7", cursor: "pointer" }}
                  />
                  <span>Feature Enabled for Clients</span>
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
                {/* Per-Order Fee */}
                <div className="admin-settings-ai-field">
                  <label className="admin-settings-ai-label" style={{ fontWeight: 650 }}>
                    Fee Per Automated Order ($)
                  </label>
                  <div className="admin-settings-ai-input-wrap">
                    <span className="admin-settings-ai-input-icon">
                      <LuDollarSign style={{ color: "#0284c7" }} />
                    </span>
                    <input
                      className="admin-settings-ai-input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={addonStatus.order_processing?.price_per_order ?? 0.30}
                      onChange={(e) =>
                        setAddonStatus((prev) => ({
                          ...prev,
                          order_processing: {
                            ...prev.order_processing,
                            price_per_order: e.target.value,
                          },
                        }))
                      }
                      placeholder="0.30"
                      style={{ paddingRight: 80 }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        right: 12,
                        fontSize: 12,
                        fontWeight: 650,
                        color: "#0284c7",
                        backgroundColor: "#e0f2fe",
                        padding: "4px 8px",
                        borderRadius: 6,
                      }}
                    >
                      / order
                    </span>
                  </div>
                  <p className="admin-settings-ai-help">
                    Fee deducted from user&apos;s processing wallet per placed order (default: $0.30).
                  </p>
                </div>

                {/* Monthly Unlimited Add-on Price */}
                <div className="admin-settings-ai-field">
                  <label className="admin-settings-ai-label" style={{ fontWeight: 650 }}>
                    Monthly Unlimited Plan ($)
                  </label>
                  <div className="admin-settings-ai-input-wrap">
                    <span className="admin-settings-ai-input-icon">
                      <LuDollarSign style={{ color: "#0284c7" }} />
                    </span>
                    <input
                      className="admin-settings-ai-input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={addonStatus.order_processing?.monthly_unlimited_price ?? 29.99}
                      onChange={(e) =>
                        setAddonStatus((prev) => ({
                          ...prev,
                          order_processing: {
                            ...prev.order_processing,
                            monthly_unlimited_price: e.target.value,
                          },
                        }))
                      }
                      placeholder="29.99"
                      style={{ paddingRight: 80 }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        right: 12,
                        fontSize: 12,
                        fontWeight: 650,
                        color: "#0284c7",
                        backgroundColor: "#e0f2fe",
                        padding: "4px 8px",
                        borderRadius: 6,
                      }}
                    >
                      / month
                    </span>
                  </div>
                  <p className="admin-settings-ai-help">
                    Optional monthly recurring price for unlimited auto-order fulfillment without per-order fees.
                  </p>
                </div>

                {/* Free Orders in Base Plan */}
                <div className="admin-settings-ai-field">
                  <label className="admin-settings-ai-label" style={{ fontWeight: 650 }}>
                    Free Orders Included Per Month
                  </label>
                  <div className="admin-settings-ai-input-wrap">
                    <span className="admin-settings-ai-input-icon">
                      <LuShoppingCart style={{ color: "#64748b" }} />
                    </span>
                    <input
                      className="admin-settings-ai-input"
                      type="number"
                      step="1"
                      min="0"
                      value={addonStatus.order_processing?.included_free_orders ?? 0}
                      onChange={(e) =>
                        setAddonStatus((prev) => ({
                          ...prev,
                          order_processing: {
                            ...prev.order_processing,
                            included_free_orders: e.target.value,
                          },
                        }))
                      }
                      placeholder="0"
                      style={{ paddingRight: 80 }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        right: 12,
                        fontSize: 12,
                        fontWeight: 650,
                        color: "#64748b",
                        backgroundColor: "#f1f5f9",
                        padding: "4px 8px",
                        borderRadius: 6,
                      }}
                    >
                      Orders / mo
                    </span>
                  </div>
                  <p className="admin-settings-ai-help">
                    Number of free auto-orders granted monthly before per-order fee triggers (0 = pay per order).
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Sourcing Requests Section */}
            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "20px",
                background: "#f8fafc",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "8px",
                      background: "#fdf4ff",
                      color: "#c026d3",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                    }}
                  >
                    <LuSearch />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>
                      VIP Sourcing Requests
                    </h3>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      Factory negotiation, VIP AliExpress supplier discovery, and verified quote turnaround.
                    </span>
                  </div>
                </div>

                <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: 600, fontSize: "13px", color: "#334155" }}>
                  <input
                    type="checkbox"
                    checked={addonStatus.sourcing_requests?.enabled ?? true}
                    onChange={(e) =>
                      setAddonStatus((prev) => ({
                        ...prev,
                        sourcing_requests: {
                          ...prev.sourcing_requests,
                          enabled: e.target.checked,
                        },
                      }))
                    }
                    style={{ width: "16px", height: "16px", accentColor: "#c026d3", cursor: "pointer" }}
                  />
                  <span>Feature Enabled for Clients</span>
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                {/* Per-Request Fee */}
                <div className="admin-settings-ai-field">
                  <label className="admin-settings-ai-label" style={{ fontWeight: 650 }}>
                    Fee Per Sourcing Request ($)
                  </label>
                  <div className="admin-settings-ai-input-wrap">
                    <span className="admin-settings-ai-input-icon">
                      <LuDollarSign style={{ color: "#c026d3" }} />
                    </span>
                    <input
                      className="admin-settings-ai-input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={addonStatus.sourcing_requests?.price_per_request ?? 1.50}
                      onChange={(e) =>
                        setAddonStatus((prev) => ({
                          ...prev,
                          sourcing_requests: {
                            ...prev.sourcing_requests,
                            price_per_request: e.target.value,
                          },
                        }))
                      }
                      placeholder="1.50"
                      style={{ paddingRight: 86 }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        right: 12,
                        fontSize: 12,
                        fontWeight: 650,
                        color: "#c026d3",
                        backgroundColor: "#fdf4ff",
                        padding: "4px 8px",
                        borderRadius: 6,
                      }}
                    >
                      / request
                    </span>
                  </div>
                  <p className="admin-settings-ai-help">
                    Fee per extra request after monthly free allowance has been utilized (default: $1.50).
                  </p>
                </div>

                {/* Free Monthly Requests */}
                <div className="admin-settings-ai-field">
                  <label className="admin-settings-ai-label" style={{ fontWeight: 650 }}>
                    Free Requests Included Per Month
                  </label>
                  <div className="admin-settings-ai-input-wrap">
                    <span className="admin-settings-ai-input-icon">
                      <LuPackageCheck style={{ color: "#64748b" }} />
                    </span>
                    <input
                      className="admin-settings-ai-input"
                      type="number"
                      step="1"
                      min="0"
                      value={addonStatus.sourcing_requests?.included_free_monthly ?? 5}
                      onChange={(e) =>
                        setAddonStatus((prev) => ({
                          ...prev,
                          sourcing_requests: {
                            ...prev.sourcing_requests,
                            included_free_monthly: e.target.value,
                          },
                        }))
                      }
                      placeholder="5"
                      style={{ paddingRight: 80 }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        right: 12,
                        fontSize: 12,
                        fontWeight: 650,
                        color: "#64748b",
                        backgroundColor: "#f1f5f9",
                        padding: "4px 8px",
                        borderRadius: 6,
                      }}
                    >
                      Req / mo
                    </span>
                  </div>
                  <p className="admin-settings-ai-help">
                    Complimentary monthly sourcing requests included on the merchant plan (default: 5).
                  </p>
                </div>

                {/* 5-Pack Price */}
                <div className="admin-settings-ai-field">
                  <label className="admin-settings-ai-label" style={{ fontWeight: 650 }}>
                    5-Pack Sourcing Bundle ($)
                  </label>
                  <div className="admin-settings-ai-input-wrap">
                    <span className="admin-settings-ai-input-icon">
                      <LuDollarSign style={{ color: "#c026d3" }} />
                    </span>
                    <input
                      className="admin-settings-ai-input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={addonStatus.sourcing_requests?.bulk_pack_5_price ?? 6.00}
                      onChange={(e) =>
                        setAddonStatus((prev) => ({
                          ...prev,
                          sourcing_requests: {
                            ...prev.sourcing_requests,
                            bulk_pack_5_price: e.target.value,
                          },
                        }))
                      }
                      placeholder="6.00"
                      style={{ paddingRight: 86 }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        right: 12,
                        fontSize: 12,
                        fontWeight: 650,
                        color: "#c026d3",
                        backgroundColor: "#fdf4ff",
                        padding: "4px 8px",
                        borderRadius: 6,
                      }}
                    >
                      / 5-pack
                    </span>
                  </div>
                  <p className="admin-settings-ai-help">
                    Bundle discount for 5 sourcing requests (e.g. $6.00 instead of $7.50).
                  </p>
                </div>

                {/* 10-Pack Price */}
                <div className="admin-settings-ai-field">
                  <label className="admin-settings-ai-label" style={{ fontWeight: 650 }}>
                    10-Pack Sourcing Bundle ($)
                  </label>
                  <div className="admin-settings-ai-input-wrap">
                    <span className="admin-settings-ai-input-icon">
                      <LuDollarSign style={{ color: "#c026d3" }} />
                    </span>
                    <input
                      className="admin-settings-ai-input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={addonStatus.sourcing_requests?.bulk_pack_10_price ?? 10.00}
                      onChange={(e) =>
                        setAddonStatus((prev) => ({
                          ...prev,
                          sourcing_requests: {
                            ...prev.sourcing_requests,
                            bulk_pack_10_price: e.target.value,
                          },
                        }))
                      }
                      placeholder="10.00"
                      style={{ paddingRight: 86 }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        right: 12,
                        fontSize: 12,
                        fontWeight: 650,
                        color: "#c026d3",
                        backgroundColor: "#fdf4ff",
                        padding: "4px 8px",
                        borderRadius: 6,
                      }}
                    >
                      / 10-pack
                    </span>
                  </div>
                  <p className="admin-settings-ai-help">
                    Bundle discount for 10 sourcing requests (e.g. $10.00 instead of $15.00).
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Auto-Tracking & Carrier Updates */}
            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "24px",
                background: "#f8fafc",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "8px",
                      background: "#f0fdf4",
                      color: "#16a34a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                    }}
                  >
                    <LuTruck />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>
                      Auto-Tracking Synchronization
                    </h3>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      Automatic AliExpress tracking retrieval, carrier recognition (USPS, Cainiao, FedEx), and eBay sync.
                    </span>
                  </div>
                </div>

                <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: 600, fontSize: "13px", color: "#334155" }}>
                  <input
                    type="checkbox"
                    checked={addonStatus.auto_tracking?.enabled ?? true}
                    onChange={(e) =>
                      setAddonStatus((prev) => ({
                        ...prev,
                        auto_tracking: {
                          ...prev.auto_tracking,
                          enabled: e.target.checked,
                        },
                      }))
                    }
                    style={{ width: "16px", height: "16px", accentColor: "#16a34a", cursor: "pointer" }}
                  />
                  <span>Feature Enabled for Clients</span>
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
                <div className="admin-settings-ai-field">
                  <label className="admin-settings-ai-label" style={{ fontWeight: 650 }}>
                    Fee Per Tracking Number Sync ($)
                  </label>
                  <div className="admin-settings-ai-input-wrap">
                    <span className="admin-settings-ai-input-icon">
                      <LuDollarSign style={{ color: "#16a34a" }} />
                    </span>
                    <input
                      className="admin-settings-ai-input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={addonStatus.auto_tracking?.price_per_order ?? 0.05}
                      onChange={(e) =>
                        setAddonStatus((prev) => ({
                          ...prev,
                          auto_tracking: {
                            ...prev.auto_tracking,
                            price_per_order: e.target.value,
                          },
                        }))
                      }
                      placeholder="0.05"
                      style={{ paddingRight: 80 }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        right: 12,
                        fontSize: 12,
                        fontWeight: 650,
                        color: "#16a34a",
                        backgroundColor: "#f0fdf4",
                        padding: "4px 8px",
                        borderRadius: 6,
                      }}
                    >
                      / order
                    </span>
                  </div>
                  <p className="admin-settings-ai-help">
                    Fee per uploaded tracking number (set $0.00 to provide 100% free tracking sync with plans).
                  </p>
                </div>
              </div>
            </div>

            {/* 4. Trending Products Add-on */}
            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "20px",
                background: "#f8fafc",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "8px",
                      background: "#fff7ed",
                      color: "#ea580c",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                    }}
                  >
                    <LuChartLine />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>
                      Trending Products Add-on
                    </h3>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      Paid add-on gating client access to the curated Trending Products feed.
                    </span>
                  </div>
                </div>

                <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: 600, fontSize: "13px", color: "#334155" }}>
                  <input
                    type="checkbox"
                    checked={addonStatus.trending_products?.enabled ?? true}
                    onChange={(e) =>
                      setAddonStatus((prev) => ({
                        ...prev,
                        trending_products: {
                          ...prev.trending_products,
                          enabled: e.target.checked,
                        },
                      }))
                    }
                    style={{ width: "16px", height: "16px", accentColor: "#ea580c", cursor: "pointer" }}
                  />
                  <span>Feature Enabled for Clients</span>
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                <div className="admin-settings-ai-field">
                  <label className="admin-settings-ai-label" style={{ fontWeight: 650 }}>
                    Add-on Price ($)
                  </label>
                  <div className="admin-settings-ai-input-wrap">
                    <span className="admin-settings-ai-input-icon">
                      <LuDollarSign style={{ color: "#ea580c" }} />
                    </span>
                    <input
                      className="admin-settings-ai-input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={addonStatus.trending_products?.price ?? 14.99}
                      onChange={(e) =>
                        setAddonStatus((prev) => ({
                          ...prev,
                          trending_products: {
                            ...prev.trending_products,
                            price: e.target.value,
                          },
                        }))
                      }
                      placeholder="14.99"
                      style={{ paddingRight: 88 }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        right: 12,
                        fontSize: 12,
                        fontWeight: 650,
                        color: "#ea580c",
                        backgroundColor: "#ffedd5",
                        padding: "4px 8px",
                        borderRadius: 6,
                      }}
                    >
                      {addonStatus.trending_products?.billing_mode === "one_time" ? "one-time" : "/ month"}
                    </span>
                  </div>
                  <p className="admin-settings-ai-help">
                    Client unlock price (set $0.00 to include free for all merchants).
                  </p>
                </div>

                <div className="admin-settings-ai-field">
                  <label className="admin-settings-ai-label" style={{ fontWeight: 650 }}>
                    Billing Frequency
                  </label>
                  <div className="admin-settings-ai-select-wrap">
                    <select
                      className="admin-settings-ai-select"
                      value={addonStatus.trending_products?.billing_mode || "monthly"}
                      onChange={(e) =>
                        setAddonStatus((prev) => ({
                          ...prev,
                          trending_products: {
                            ...prev.trending_products,
                            billing_mode: e.target.value,
                          },
                        }))
                      }
                    >
                      <option value="monthly">Monthly Recurring</option>
                      <option value="one_time">One-Time Unlock</option>
                    </select>
                    <span className="admin-settings-ai-select-arrow">
                      <LuChevronDown />
                    </span>
                  </div>
                  <p className="admin-settings-ai-help">
                    Monthly renews every 30 days; One-Time unlocks permanently.
                  </p>
                </div>

                <div className="admin-settings-ai-field">
                  <label className="admin-settings-ai-label" style={{ fontWeight: 650 }}>
                    Client Card Description
                  </label>
                  <input
                    className="admin-settings-ai-input"
                    type="text"
                    maxLength={500}
                    style={{ paddingLeft: 14 }}
                    value={addonStatus.trending_products?.description ?? ""}
                    onChange={(e) =>
                      setAddonStatus((prev) => ({
                        ...prev,
                        trending_products: {
                          ...prev.trending_products,
                          description: e.target.value,
                        },
                      }))
                    }
                    placeholder="Unlock daily winning & trending product feeds..."
                  />
                  <p className="admin-settings-ai-help">
                    Shown on the Plans &amp; Add-ons card and lock prompt.
                  </p>
                </div>
              </div>
            </div>

            {/* 5. Hand-Picked Products Add-on */}
            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "24px",
                background: "#f8fafc",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "8px",
                      background: "#eef2ff",
                      color: "#4f46e5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                    }}
                  >
                    <LuBadgeCheck />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>
                      Hand-Picked Products Add-on
                    </h3>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      Paid add-on gating client access to the curated Hand-Picked Products vault.
                    </span>
                  </div>
                </div>

                <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: 600, fontSize: "13px", color: "#334155" }}>
                  <input
                    type="checkbox"
                    checked={addonStatus.hand_picked_products?.enabled ?? true}
                    onChange={(e) =>
                      setAddonStatus((prev) => ({
                        ...prev,
                        hand_picked_products: {
                          ...prev.hand_picked_products,
                          enabled: e.target.checked,
                        },
                      }))
                    }
                    style={{ width: "16px", height: "16px", accentColor: "#4f46e5", cursor: "pointer" }}
                  />
                  <span>Feature Enabled for Clients</span>
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                <div className="admin-settings-ai-field">
                  <label className="admin-settings-ai-label" style={{ fontWeight: 650 }}>
                    Add-on Price ($)
                  </label>
                  <div className="admin-settings-ai-input-wrap">
                    <span className="admin-settings-ai-input-icon">
                      <LuDollarSign style={{ color: "#4f46e5" }} />
                    </span>
                    <input
                      className="admin-settings-ai-input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={addonStatus.hand_picked_products?.price ?? 19.99}
                      onChange={(e) =>
                        setAddonStatus((prev) => ({
                          ...prev,
                          hand_picked_products: {
                            ...prev.hand_picked_products,
                            price: e.target.value,
                          },
                        }))
                      }
                      placeholder="19.99"
                      style={{ paddingRight: 88 }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        right: 12,
                        fontSize: 12,
                        fontWeight: 650,
                        color: "#4f46e5",
                        backgroundColor: "#e0e7ff",
                        padding: "4px 8px",
                        borderRadius: 6,
                      }}
                    >
                      {addonStatus.hand_picked_products?.billing_mode === "one_time" ? "one-time" : "/ month"}
                    </span>
                  </div>
                  <p className="admin-settings-ai-help">
                    Client unlock price (set $0.00 to include free for all merchants).
                  </p>
                </div>

                <div className="admin-settings-ai-field">
                  <label className="admin-settings-ai-label" style={{ fontWeight: 650 }}>
                    Billing Frequency
                  </label>
                  <div className="admin-settings-ai-select-wrap">
                    <select
                      className="admin-settings-ai-select"
                      value={addonStatus.hand_picked_products?.billing_mode || "monthly"}
                      onChange={(e) =>
                        setAddonStatus((prev) => ({
                          ...prev,
                          hand_picked_products: {
                            ...prev.hand_picked_products,
                            billing_mode: e.target.value,
                          },
                        }))
                      }
                    >
                      <option value="monthly">Monthly Recurring</option>
                      <option value="one_time">One-Time Unlock</option>
                    </select>
                    <span className="admin-settings-ai-select-arrow">
                      <LuChevronDown />
                    </span>
                  </div>
                  <p className="admin-settings-ai-help">
                    Monthly renews every 30 days; One-Time unlocks permanently.
                  </p>
                </div>

                <div className="admin-settings-ai-field">
                  <label className="admin-settings-ai-label" style={{ fontWeight: 650 }}>
                    Client Card Description
                  </label>
                  <input
                    className="admin-settings-ai-input"
                    type="text"
                    maxLength={500}
                    style={{ paddingLeft: 14 }}
                    value={addonStatus.hand_picked_products?.description ?? ""}
                    onChange={(e) =>
                      setAddonStatus((prev) => ({
                        ...prev,
                        hand_picked_products: {
                          ...prev.hand_picked_products,
                          description: e.target.value,
                        },
                      }))
                    }
                    placeholder="Access hand-picked high-margin winning products..."
                  />
                  <p className="admin-settings-ai-help">
                    Shown on the Plans &amp; Add-ons card and lock prompt.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="admin-settings-ai-actions">
              <button
                type="button"
                className="admin-page__btn admin-page__btn--primary"
                onClick={handleSaveAddons}
                disabled={addonSaving}
                style={{ minHeight: 42, padding: "0 22px" }}
              >
                {addonSaving ? <LuLoader className="spin-icon" /> : <LuSave />}
                <span>{addonSaving ? "Saving Add-ons…" : "Save Add-on Pricing"}</span>
              </button>

              <button
                type="button"
                className="admin-page__btn admin-page__btn--ghost"
                onClick={loadAddonSettings}
                disabled={addonSaving}
                style={{ minHeight: 42, padding: "0 18px" }}
              >
                <span>Reload from Server</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Legal Agreements (Terms & Conditions & Privacy Policy) Card */}
      <div className="admin-settings-page__card card-wrapper" style={{ marginTop: "24px" }}>
        <div className="admin-settings-page__card-head">
          <div className="admin-settings-page__icon-wrap" style={{ background: "#ede9fe", color: "#5b21b6" }}>
            <LuFileText />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
              <h2>Terms &amp; Conditions and Privacy Policy</h2>
              {legalState[legalActiveTab]?.updated_at ? (
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Last updated: {formatLegalDate(legalState[legalActiveTab].updated_at)}
                </span>
              ) : null}
            </div>
            <p>
              Manage the platform&apos;s Terms &amp; Conditions and Privacy Policy templates. Both documents are seeded with
              a general template and must be agreed to by new merchants during signup before payment.
            </p>
          </div>
        </div>

        {legalState.loading ? (
          <div className="admin-settings-page__loading">
            <LuLoader className="spin-icon" />
            <span>Loading legal templates…</span>
          </div>
        ) : (
          <div style={{ padding: "0 24px 24px 24px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "18px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className={`admin-page__btn ${
                    legalActiveTab === "terms_and_conditions"
                      ? "admin-page__btn--primary"
                      : "admin-page__btn--ghost"
                  }`}
                  onClick={() => setLegalActiveTab("terms_and_conditions")}
                  style={{ minHeight: 38, padding: "0 16px" }}
                >
                  <LuFileText />
                  <span>Terms &amp; Conditions</span>
                </button>

                <button
                  type="button"
                  className={`admin-page__btn ${
                    legalActiveTab === "privacy_policy"
                      ? "admin-page__btn--primary"
                      : "admin-page__btn--ghost"
                  }`}
                  onClick={() => setLegalActiveTab("privacy_policy")}
                  style={{ minHeight: 38, padding: "0 16px" }}
                >
                  <LuShieldCheck />
                  <span>Privacy Policy</span>
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="admin-page__btn admin-page__btn--ghost"
                  onClick={() => setLegalPreviewMode((v) => !v)}
                  style={{ minHeight: 38, padding: "0 14px" }}
                >
                  {legalPreviewMode ? <LuFileText /> : <LuEye />}
                  <span>{legalPreviewMode ? "Back to Editor" : "Preview Formatting"}</span>
                </button>

                <Link
                  to={
                    legalActiveTab === "privacy_policy"
                      ? "/privacy-policy"
                      : "/terms-and-conditions"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-page__btn admin-page__btn--ghost"
                  style={{ minHeight: 38, padding: "0 14px", textDecoration: "none" }}
                >
                  <span>View Live Page</span>
                  <LuExternalLink />
                </Link>
              </div>
            </div>

            {legalPreviewMode ? (
              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "24px",
                  background: "#ffffff",
                  maxHeight: "480px",
                  overflowY: "auto",
                  marginBottom: "20px",
                }}
              >
                <h3 style={{ margin: "0 0 14px", fontSize: "20px", fontWeight: 750, color: "#171426" }}>
                  {legalState[legalActiveTab]?.title ||
                    (legalActiveTab === "privacy_policy" ? "Privacy Policy" : "Terms & Conditions")}
                </h3>
                {renderLegalContent(legalState[legalActiveTab]?.content)}
              </div>
            ) : (
              <div className="admin-settings-ai-form" style={{ marginBottom: "20px" }}>
                <div className="admin-settings-ai-field">
                  <label htmlFor="legal-doc-title" className="admin-settings-ai-label" style={{ fontWeight: 650 }}>
                    Document Heading
                  </label>
                  <input
                    id="legal-doc-title"
                    type="text"
                    className="admin-settings-ai-input"
                    style={{ paddingLeft: "14px" }}
                    value={legalState[legalActiveTab]?.title || ""}
                    onChange={(e) => {
                      const nextTitle = e.target.value;
                      setLegalState((prev) => ({
                        ...prev,
                        [legalActiveTab]: {
                          ...prev[legalActiveTab],
                          title: nextTitle,
                        },
                      }));
                    }}
                    placeholder={
                      legalActiveTab === "privacy_policy" ? "Privacy Policy" : "Terms & Conditions"
                    }
                  />
                </div>

                <div className="admin-settings-ai-field">
                  <div className="admin-settings-ai-label-row">
                    <label htmlFor="legal-doc-content" className="admin-settings-ai-label" style={{ fontWeight: 650 }}>
                      {legalActiveTab === "privacy_policy"
                        ? "Privacy Policy Content"
                        : "Terms & Conditions Content"}
                    </label>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      {(legalState[legalActiveTab]?.content || "").length} characters
                    </span>
                  </div>
                  <textarea
                    id="legal-doc-content"
                    value={legalState[legalActiveTab]?.content || ""}
                    onChange={(e) => {
                      const nextContent = e.target.value;
                      setLegalState((prev) => ({
                        ...prev,
                        [legalActiveTab]: {
                          ...prev[legalActiveTab],
                          content: nextContent,
                        },
                      }));
                    }}
                    placeholder="Enter document text. Numbered section titles (e.g. '1. Acceptance of Terms') and '- ' bullet lines format automatically."
                    style={{
                      width: "100%",
                      minHeight: "360px",
                      resize: "vertical",
                      padding: "14px 16px",
                      borderRadius: "10px",
                      border: "1px solid #d8d6e2",
                      fontSize: "13.5px",
                      lineHeight: 1.65,
                    }}
                  />
                  <p className="admin-settings-ai-help">
                    Supports blank-line paragraphs, numbered section headings (e.g. <code>1. Acceptance of Terms</code>), and bullet points starting with <code>- </code>.
                  </p>
                </div>
              </div>
            )}

            <div className="admin-settings-ai-actions" style={{ flexWrap: "wrap" }}>
              <button
                type="button"
                className="admin-page__btn admin-page__btn--primary"
                onClick={handleSaveLegalDocuments}
                disabled={legalSaving || legalResetting}
                style={{ minHeight: 42, padding: "0 22px" }}
              >
                {legalSaving ? <LuLoader className="spin-icon" /> : <LuSave />}
                <span>{legalSaving ? "Saving Agreements…" : "Save Legal Agreements"}</span>
              </button>

              <button
                type="button"
                className="admin-page__btn admin-page__btn--ghost"
                onClick={() => setLegalResetModalOpen(true)}
                disabled={legalSaving || legalResetting}
                style={{ minHeight: 42, padding: "0 18px" }}
              >
                <LuRotateCcw />
                <span>
                  Restore Default{" "}
                  {legalActiveTab === "privacy_policy" ? "Privacy Policy" : "Terms"}
                </span>
              </button>

              <button
                type="button"
                className="admin-page__btn admin-page__btn--ghost"
                onClick={loadLegalDocuments}
                disabled={legalSaving || legalResetting}
                style={{ minHeight: 42, padding: "0 18px" }}
              >
                <span>Reload from Server</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={legalResetModalOpen}
        title={`Restore Default ${
          legalActiveTab === "privacy_policy" ? "Privacy Policy" : "Terms & Conditions"
        }?`}
        description="This will replace the current text of this agreement with the initial default template. You can edit it again afterwards."
        confirmLabel="Restore Default Template"
        danger={true}
        saving={legalResetting}
        onConfirm={handleResetLegalDocument}
        onClose={() => {
          if (!legalResetting) setLegalResetModalOpen(false);
        }}
      />
    </section>

  );
}

export default AdminSettingsPage;
