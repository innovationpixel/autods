import { useEffect, useRef, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import {
  LuBadgeCheck,
  LuChevronDown,
  LuCopy,
  LuLink,
  LuUnplug,
  LuLoader,
  LuMapPin,
  LuPencil,
  LuPlus,
  LuRefreshCcw,
  LuX,
} from "react-icons/lu";
import { fetchEbayStatus, disconnectEbayAction, syncEbayListingsAction, setEbayPrimaryAction } from "../../store/actions/EbayActions";
import { fetchAliExpressStatus, disconnectAliExpressAction } from "../../store/actions/AliExpressActions";
import { updateProfileAction } from "../../store/actions/AuthActions";
import { getEbayAuthUrl, completeEbayOAuth } from "../../services/EbayService";
import { parseEbayOAuthUrl } from "../../utils/ebayOAuth";
import { getAliExpressAuthUrl } from "../../services/AliExpressService";
import { selectEbayConnections, selectEbayConnectionsLoading, selectEbaySyncingIds } from "../../store/selectors/EbaySelectors";
import { selectAliConnection } from "../../store/selectors/AliExpressSelectors";
import { selectUser } from "../../store/selectors/AuthSelectors";
import { toast } from "../../utils/toast";
import { openOAuthPopup, openAliExpressOAuth, watchOAuthPopup, markOAuthReturnOrigin, ALIEXPRESS_OAUTH_HINT } from "../../utils/oauthBridge";

const settingsPrimaryTabs = [
  "Store Settings",
  "Supplier Settings",
  "Automations",
  "Templates",
  "Keywords",
  "Plans & Add-ons",
  "Account & Billing",
  "Users",
  "Buyer Accounts",
  "Notifications",
];

const settingsInnerTabs = ["Lister", "Pricing", "Orders", "General"];


const staticPlanCards = [
  {
    id: "shopify-plan",
    name: "Shopify",
    logo: "shop",
    copy: "Save time and leave your work behind using the most advanced Shopify all-in-one dropshipping app.",
    primaryAction: "Buy plan",
  },
  {
    id: "amazon-plan",
    name: "Amazon",
    logo: "a",
    copy: "AutoDS automates your product listings, prices, customer orders, price/stock monitoring, and more.",
    primaryAction: "Buy plan",
  },
  {
    id: "facebook-plan",
    name: "Facebook",
    logo: "f",
    copy: "Helping Facebook Marketplace dropshippers save time working on their stores with eCommerce automation.",
    primaryAction: "Buy plan",
  },
  {
    id: "wix-plan",
    name: "Wix",
    logo: "wix",
    copy: "This AutoDS all-in-one dropshipping app will save you hours of work as your profits increase.",
    primaryAction: "Buy plan",
  },
  {
    id: "woocommerce-plan",
    name: "WooCommerce",
    logo: "woo",
    copy: "AutoDS automates your product listings, product editing, image optimization, customer orders, pricing, and stock monitoring.",
    primaryAction: "Buy plan",
  },
];

const settingsAddOns = [
  {
    id: "finding-hub",
    title: "Product Finding Hub",
    copy: "Find best-sellers from our catalog of proven products along with their analytics.",
    linkLabel: "More Info",
    actionLabel: "Enable",
    footerLink: "See how it works",
  },
  {
    id: "ai-ugc",
    title: "AI UGC Video Ads Creator",
    copy: "Launch TikTok, Facebook & Instagram ads in less than a minute.",
    linkLabel: "More Info",
    actionLabel: "Enable",
    tag: "AI NEW",
  },
  {
    id: "orders-processor",
    title: "Orders Processor",
    copy: "Automate the entire order process and save time.",
    linkLabel: "More Info",
    actionLabel: "Cancel",
    footerLink: "See how it works",
    price: "$9.90/mo",
    startedOn: "Started On: April 15, 2026",
    tag: "Save your time",
    active: true,
  },
];


const supplierTemplates = [
  { id: "ebay-au", label: "eBay AU", badge: "ebay" },
  { id: "amazon-au", label: "Amazon AU", badge: "amz" },
  { id: "walmart-us", label: "Walmart US", badge: "wm" },
  { id: "etsy-uk", label: "Etsy UK", badge: "ets" },
];

const zipRotations = [
  { zipcode: "2042", city: "Newtown", country: "Australia" },
  { zipcode: "2000", city: "Sydney", country: "Australia" },
  { zipcode: "3000", city: "Melbourne", country: "Australia" },
  { zipcode: "4000", city: "Brisbane", country: "Australia" },
];

const countryOptions = ["Australia", "United States", "United Kingdom", "Canada"];
const shippingMethodOptions = [
  "Cheapest with tracking",
  "Fastest delivery",
  "Economy shipping",
  "Express courier",
];
const templateOptions = [
  "Select default template",
  "Aussie Essentials",
  "Marketplace Growth",
  "High Margin Template",
];
const policyOptions = [
  "Enter Payment Policy",
  "Standard Policy",
  "Fast Payout Policy",
  "Free Returns Policy",
];
const shippingPolicyOptions = [
  "Enter Shipping Policy",
  "Free Standard Shipping",
  "Tracked Saver Shipping",
  "Express Shipping",
];
const returnPolicyOptions = [
  "Enter Return Policy",
  "30 Days Free Returns",
  "Buyer Pays Return Shipping",
  "No Returns Accepted",
];
const shippedStatusOptions = [
  "Shipped Status",
  "Marked as shipped",
  "Tracking uploaded",
  "Completed",
];
const pricingAutomationOptions = [
  "No automation",
  "Low margin safeguard",
  "Fixed markup automation",
  "Category based automation",
];
const weightUnitOptions = ["Lb", "Kg", "Oz", "G"];

const advancedListerColumns = [
  [
    { key: "allowDuplicates", label: "Allow Duplicates" },
    { key: "uploadVariations", label: "Upload Variations" },
    { key: "applyWatermark", label: "Apply Watermark" },
    { key: "duplicateMainImage", label: "Duplicate Main Image up to 12" },
    { key: "allowBlockedKeywords", label: "Allow Vero/Blocked Keywords" },
  ],
  [
    { key: "allowOosVariations", label: "Allow OOS Variations" },
    { key: "capitalizeTitle", label: "Capitalize Title" },
    { key: "autofillBrand", label: "Autofill Brand" },
    { key: "splitVariants", label: "Split Variants into Products" },
    { key: "privateListing", label: "Private Listing" },
  ],
];

const monitoringToggleOptions = [
  { key: "stockMonitoring", label: "Stock Monitoring" },
  { key: "priceMonitoring", label: "Price Monitoring" },
];

function formatAud(value) {
  const numericValue = Number.isFinite(value) ? value : 0;
  const precision = Number.isInteger(numericValue) ? 0 : 2;
  return `A$${numericValue.toFixed(precision)}`;
}

function parseNumericValue(value) {
  const numericValue = Number.parseFloat(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function createInitialOrdersMessages() {
  return [
    {
      id: "gift-message",
      title: "Gift Message",
      message: "Thank you for buying from us!",
      enabled: true,
    },
    {
      id: "feedback",
      title: "Feedback",
      message: "An exceptionally first-rate buyer. We can't wait to do business with you again!",
      enabled: false,
    },
    {
      id: "order-placed",
      title: "Order was placed",
      message:
        "Dear {{ buyer_first_name }}, Your order is being processed and will be shipped soon. We will add a Tracking Number for your order as soon as it gets shipped, so you can track the delivery progress. Once your item arrives in satisfactory condition, please leave positive feedback and five stars for us.",
      enabled: false,
    },
    {
      id: "tracking-available",
      title: "Tracking number available",
      message:
        "Dear {{ buyer_first_name }}, Your package is on its way! The tracking number is updated on your order details. The tracking carrier is {{ shipping_carrier }}, and the tracking number is {{ tracking_number }}. It will arrive soon. Thank you for your patience!",
      enabled: false,
    },
    {
      id: "order-delivered",
      title: "Order was delivered",
      message:
        "Dear {{ buyer_first_name }}, Thank you for buying from us. We hope your package was delivered successfully and in satisfactory condition. If there are any issues with your order, please let us know and we will be happy to help. Thank you once again and have a great day!",
      enabled: false,
    },
  ];
}

function createInitialSupplierSettings() {
  return {
    lister: {
      defaultQuantity: "5",
      itemCountry: "Australia",
      zipcode: "2042",
      city: "Newtown",
      shippingMethod: "Cheapest with tracking",
      defaultTemplate: "Select default template",
      useDynamicPolicies: false,
      paymentPolicy: "Enter Payment Policy",
      shippingPolicy: "Enter Shipping Policy",
      returnPolicy: "Enter Return Policy",
      advanced: {
        allowDuplicates: false,
        uploadVariations: true,
        applyWatermark: false,
        duplicateMainImage: true,
        allowBlockedKeywords: true,
        allowOosVariations: true,
        capitalizeTitle: true,
        autofillBrand: false,
        splitVariants: false,
        privateListing: false,
      },
      monitoring: {
        stockMonitoring: true,
        priceMonitoring: true,
      },
      aiOptimization: {
        aiTitle: false,
        aiDescription: false,
      },
      itemSpecifics: [],
    },
    pricing: {
      productCost: "",
      feesPercent: "0",
      fixedFeeAmount: "0",
      additionalProfitPercent: "0",
      additionalProfitAmount: "0",
      defaultAutomation: "No automation",
      minimumProfit: "0",
      dynamicProfit: false,
      setPriceCentsValue: false,
      includeShippingPrice: true,
    },
    orders: {
      overridePhoneNumber: false,
      autoDeliver: false,
      shippedStatus: "Shipped Status",
      maximumPurchasePrice: "500",
      maximumLoss: "5",
      messages: createInitialOrdersMessages(),
    },
    general: {
      defaultWeightUnit: "Lb",
      automaticSkuFilling: false,
      minimumProductQuantity: "1",
      maximumShippingDays: "40",
    },
  };
}

function createSupplier(template) {
  return {
    ...template,
    settings: createInitialSupplierSettings(),
  };
}

function createInitialSuppliers() {
  return [createSupplier(supplierTemplates[0])];
}

function SettingsHelpBadge() {
  return (
    <span className="marketplace-settings__help-badge" aria-hidden="true">
      ?
    </span>
  );
}

function SettingsField({ label, required = false, help = false, className = "", children }) {
  return (
    <label className={`marketplace-settings__field ${className}`}>
      <span className="marketplace-settings__field-label">
        {required ? <span className="marketplace-settings__required">*</span> : null}
        <span>{label}</span>
        {help ? <SettingsHelpBadge /> : null}
      </span>
      {children}
    </label>
  );
}

function SettingsSelect({ value, options, onChange }) {
  return (
    <span className="marketplace-settings__select-wrap">
      <select className="marketplace-settings__control" value={value} onChange={onChange}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <LuChevronDown />
    </span>
  );
}

function SettingsInput({ type = "text", value, onChange, placeholder = "" }) {
  return (
    <input
      className="marketplace-settings__control"
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  );
}

function SettingsSwitch({ checked, onChange, children, compact = false }) {
  return (
    <label className={`marketplace-settings__switch-row ${compact ? "marketplace-settings__switch-row--compact" : ""}`}>
      <span className={`marketplace-settings__switch ${checked ? "marketplace-settings__switch--checked" : ""}`}>
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
        <span className="marketplace-settings__switch-track">
          <span className="marketplace-settings__switch-thumb" />
        </span>
      </span>
      {children ? <span className="marketplace-settings__switch-copy">{children}</span> : null}
    </label>
  );
}

function SettingsCheckbox({ checked, onChange, children }) {
  return (
    <label className="marketplace-settings__checkbox">
      <span className={`marketplace-settings__checkbox-box ${checked ? "marketplace-settings__checkbox-box--checked" : ""}`}>
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
        <span>✓</span>
      </span>
      <span className="marketplace-settings__checkbox-label">
        <span>{children}</span>
        <SettingsHelpBadge />
      </span>
    </label>
  );
}

function SettingsPlaceholder({ title }) {
  return (
    <div className="marketplace-settings__placeholder card-wrapper">
      <h2>{title}</h2>
      <p>This workspace is ready for the next reference set. The current implementation mirrors the Supplier Settings screens you shared.</p>
    </div>
  );
}

function buildPricingSummary(pricing) {
  const productCost = parseNumericValue(pricing.productCost);
  const percentFee = (productCost * parseNumericValue(pricing.feesPercent)) / 100;
  const fixedFee = parseNumericValue(pricing.fixedFeeAmount);
  const percentProfit = (productCost * parseNumericValue(pricing.additionalProfitPercent)) / 100;
  const directProfit = parseNumericValue(pricing.additionalProfitAmount);
  let profit = percentProfit + directProfit;

  if (pricing.dynamicProfit) {
    profit = Math.max(profit, parseNumericValue(pricing.minimumProfit));
  }

  const totalFees = percentFee + fixedFee;
  const totalPrice = productCost + totalFees + profit;
  const safeTotal = totalPrice > 0 ? totalPrice : 1;
  const productWidth = `${Math.max((productCost / safeTotal) * 100, productCost ? 12 : 0)}%`;
  const profitWidth = `${Math.max((profit / safeTotal) * 100, profit ? 10 : 0)}%`;

  return {
    productCost,
    percentFee,
    fixedFee,
    profit,
    totalPrice,
    productWidth,
    profitWidth,
  };
}

export default function MarketplaceSettingsPage() {
  const dispatch = useDispatch();
  const { search } = useLocation();
  const ebayConnections        = useSelector(selectEbayConnections);
  const ebayConnectionsLoading = useSelector(selectEbayConnectionsLoading);
  const ebaySyncingIds         = useSelector(selectEbaySyncingIds);
  const aliConnection          = useSelector(selectAliConnection);
  const user                   = useSelector(selectUser);

  const initialTab = useMemo(() => {
    const tab = new URLSearchParams(search).get("tab");
    if (tab === "store") return "Store Settings";
    if (tab === "supplier") return "Supplier Settings";
    return "Store Settings";
  }, [search]);

  const [activePrimaryTab, setActivePrimaryTab] = useState(initialTab);

  useEffect(() => {
    const tab = new URLSearchParams(search).get("tab");
    if (tab === "store") {
      setActivePrimaryTab("Store Settings");
    }
  }, [search]);
  const [activeInnerTab, setActiveInnerTab] = useState("Lister");
  const primaryEbayConnection = ebayConnections.find((c) => c.is_primary) ?? ebayConnections[0] ?? null;
  const [suppliers, setSuppliers] = useState(createInitialSuppliers);
  const [activeSupplierId, setActiveSupplierId] = useState(supplierTemplates[0].id);
  const [itemSpecificDraft, setItemSpecificDraft] = useState({ name: "", description: "" });
  const [editAllItemSpecifics, setEditAllItemSpecifics] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState("");
  const [messageDraft, setMessageDraft] = useState("");
  const [saveNotice, setSaveNotice] = useState("");
  const [ebayConnecting, setEbayConnecting] = useState(false);
  const [ebayCompleting, setEbayCompleting] = useState(false);
  const [ebayPasteUrl, setEbayPasteUrl] = useState("");
  const [aliConnecting, setAliConnecting] = useState(false);
  const popupRef = useRef(null);

  useEffect(() => {
    if (!saveNotice) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setSaveNotice("");
    }, 2400);

    return () => window.clearTimeout(timeoutId);
  }, [saveNotice]);

  useEffect(() => {
    setEditingMessageId("");
    setMessageDraft("");
    setItemSpecificDraft({ name: "", description: "" });
    setEditAllItemSpecifics(false);
  }, [activeInnerTab, activePrimaryTab, activeSupplierId]);

  // ─── eBay + AliExpress connection status ─────────────────────────────────────
  useEffect(() => {
    dispatch(fetchEbayStatus());
    dispatch(fetchAliExpressStatus());
  }, [dispatch]);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const ebay = params.get("ebay");
    const aliexpress = params.get("aliexpress");
    const reason = params.get("reason");

    if (ebay === "connected") {
      dispatch(fetchEbayStatus());
    } else if (ebay === "error") {
      toast.error(`eBay connection failed: ${reason ?? "Unknown error"}`);
    }

    if (aliexpress === "connected") {
      dispatch(fetchAliExpressStatus());
    } else if (aliexpress === "error") {
      toast.error(`AliExpress connection failed: ${reason ?? "Unknown error"}`);
    }
  }, [search, dispatch]);

  const connectEbay = async () => {
    try {
      setEbayConnecting(true);
      markOAuthReturnOrigin();
      const res = await getEbayAuthUrl();
      const popup = openOAuthPopup(res.data.url, "ebay_oauth");
      popupRef.current = popup;

      toast.info(
        "After eBay login, you should return to Auto DS automatically. If you only see eBay’s “Authorization successfully completed” page, copy that page’s URL and use the box below.",
        { autoClose: 10000 },
      );

      watchOAuthPopup(popup, () => {
        setEbayConnecting(false);
        dispatch(fetchEbayStatus());
      });
    } catch (err) {
      setEbayConnecting(false);
      toast.error(err.response?.data?.error ?? "Failed to start eBay authorization.");
    }
  };

  const finishEbayFromPastedUrl = async () => {
    const parsed = parseEbayOAuthUrl(ebayPasteUrl);
    if (!parsed || parsed.error) {
      toast.error(
        parsed?.error
          ?? "Paste the full URL from the eBay success tab (https://auth2.ebay.com/oauth2/ThirdPartyAuthSucessFailure?...).",
      );
      return;
    }

    setEbayCompleting(true);
    try {
      await completeEbayOAuth({ callback_url: ebayPasteUrl.trim() });
      setEbayPasteUrl("");
      toast.success("eBay account connected successfully!");
      dispatch(fetchEbayStatus());
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to complete eBay connection.");
    } finally {
      setEbayCompleting(false);
    }
  };

  const disconnectEbay = (id) => {
    if (!window.confirm('Disconnect this eBay account? Synced listings from it will remain in the database.')) return;
    dispatch(disconnectEbayAction(id));
  };

  const setPrimaryEbay = (id) => dispatch(setEbayPrimaryAction(id));

  const connectAliExpress = async () => {
    try {
      setAliConnecting(true);
      markOAuthReturnOrigin();
      const res = await getAliExpressAuthUrl();
      const popup = openAliExpressOAuth(res.data.url);
      popupRef.current = popup;

      if (!popup) {
        setAliConnecting(false);
        toast.error("Your browser blocked the AliExpress window. Allow popups for this site and try again.");
        return;
      }

      toast.info(ALIEXPRESS_OAUTH_HINT, { autoClose: 8000 });

      watchOAuthPopup(popup, () => {
        setAliConnecting(false);
        dispatch(fetchAliExpressStatus());
      });
    } catch (err) {
      setAliConnecting(false);
      toast.error(err.response?.data?.error ?? "Failed to start AliExpress authorization.");
    }
  };

  const disconnectAliExpress = () => {
    if (!window.confirm('Disconnect your AliExpress account?')) return;
    dispatch(disconnectAliExpressAction());
  };

  const syncNow = (connectionId) => dispatch(syncEbayListingsAction(connectionId));

  const renderStoreSettingsTab = () => (
    <div className="marketplace-settings__store-settings card-wrapper">

      {/* ── eBay section ─────────────────────────────────────────────────────── */}
      <div className="marketplace-settings__store-settings-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h3 style={{ margin: 0 }}>
              <span style={{ fontWeight: 900, letterSpacing: -1, marginRight: 8 }}>
                <span style={{ color: "#E53238" }}>e</span>
                <span style={{ color: "#0064D2" }}>B</span>
                <span style={{ color: "#F5AF02" }}>a</span>
                <span style={{ color: "#86B817" }}>y</span>
              </span>
              Accounts
            </h3>
            <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
              Connect multiple eBay seller accounts. Use the <em>Primary</em> badge to set which account is used by default.
            </p>
          </div>
          <button
            type="button"
            className="marketplace-settings__ebay-btn marketplace-settings__ebay-btn--connect"
            onClick={connectEbay}
            disabled={ebayConnecting}
            style={{ flexShrink: 0 }}
          >
            {ebayConnecting ? <LuLoader className="spin-icon" /> : <LuLink />}
            <span>{ebayConnecting ? "Opening eBay…" : "Add eBay Account"}</span>
          </button>
        </div>
      </div>

      {/* Connected eBay accounts list */}
      {ebayConnectionsLoading ? (
        <div className="marketplace-settings__ebay-status marketplace-settings__ebay-status--loading" style={{ padding: "16px 0" }}>
          <LuLoader className="spin-icon" />
          <span>Checking connection status…</span>
        </div>
      ) : ebayConnections.length === 0 ? (
        <div style={{ padding: "20px 0" }}>
          <div className="marketplace-settings__ebay-status marketplace-settings__ebay-status--disconnected">
            <LuUnplug />
            <span>No eBay accounts connected. Click <em>Add eBay Account</em> to get started.</span>
          </div>

          <details
            style={{
              marginTop: 16,
              padding: "14px 16px",
              borderRadius: 8,
              border: "1px solid #fde68a",
              background: "#fffbeb",
              fontSize: 13,
              color: "#78350f",
            }}
          >
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>
              Stuck on eBay “Authorization successfully completed”?
            </summary>
            <p style={{ margin: "10px 0 8px", lineHeight: 1.5 }}>
              eBay did not redirect to Auto DS. Copy the <strong>full address bar URL</strong> from that eBay tab and paste it here, then click Complete connection.
            </p>
            <input
              className="marketplace-settings__control"
              type="text"
              value={ebayPasteUrl}
              onChange={(e) => setEbayPasteUrl(e.target.value)}
              placeholder="https://auth2.ebay.com/oauth2/ThirdPartyAuthSucessFailure?..."
              style={{ width: "100%", marginBottom: 8 }}
            />
            <button
              type="button"
              className="marketplace-settings__ebay-btn marketplace-settings__ebay-btn--connect"
              onClick={finishEbayFromPastedUrl}
              disabled={ebayCompleting || !ebayPasteUrl.trim()}
            >
              {ebayCompleting ? <LuLoader className="spin-icon" /> : <LuLink />}
              <span>{ebayCompleting ? "Connecting…" : "Complete connection"}</span>
            </button>
          </details>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
          {ebayConnections.map((conn) => {
            const isSyncing = ebaySyncingIds.includes(conn.id);
            return (
              <div key={conn.id} className="marketplace-settings__ebay-card" style={{ background: conn.is_primary ? "#f0fdf4" : undefined, border: conn.is_primary ? "1px solid #bbf7d0" : undefined }}>
                <div className="marketplace-settings__ebay-info">
                  <div className="marketplace-settings__ebay-status marketplace-settings__ebay-status--connected">
                    <LuBadgeCheck />
                    <span>
                      <strong>{conn.ebay_username ?? "eBay Seller"}</strong>
                      {conn.is_primary && (
                        <span style={{ marginLeft: 8, fontSize: 11, background: "#065f46", color: "#fff", borderRadius: 4, padding: "1px 6px", fontWeight: 600 }}>
                          PRIMARY
                        </span>
                      )}
                    </span>
                  </div>
                  <p className="marketplace-settings__ebay-sub">
                    Site: {conn.site_id ?? "EBAY_US"}&nbsp;·&nbsp;
                    Connected: {conn.connected_at ? new Date(conn.connected_at).toLocaleDateString() : "—"}
                  </p>
                </div>

                <div className="marketplace-settings__ebay-actions">
                  {!conn.is_primary && (
                    <button
                      type="button"
                      className="marketplace-settings__ebay-btn"
                      style={{ background: "#f3f4f6", color: "#374151" }}
                      onClick={() => setPrimaryEbay(conn.id)}
                    >
                      Set Primary
                    </button>
                  )}
                  <button
                    type="button"
                    className="marketplace-settings__ebay-btn marketplace-settings__ebay-btn--sync"
                    onClick={() => syncNow(conn.id)}
                    disabled={isSyncing}
                  >
                    {isSyncing ? <LuLoader className="spin-icon" /> : <LuRefreshCcw />}
                    <span>{isSyncing ? "Syncing…" : "Sync"}</span>
                  </button>
                  <button
                    type="button"
                    className="marketplace-settings__ebay-btn marketplace-settings__ebay-btn--disconnect"
                    onClick={() => disconnectEbay(conn.id)}
                  >
                    <LuUnplug />
                    <span>Disconnect</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── AliExpress section ───────────────────────────────────────────────── */}
      {!aliConnection.credentials_configured && !aliConnection.loading && (
        <div
          className="marketplace-settings__ebay-status marketplace-settings__ebay-status--disconnected"
          style={{ marginTop: 28, padding: "14px 16px", borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca" }}
        >
          <span style={{ color: "#991b1b" }}>
            Server AliExpress API keys are missing. Set ALIEXPRESS_APP_KEY and ALIEXPRESS_APP_SECRET in autods-backend/.env, then restart Laravel.
          </span>
        </div>
      )}

      <div className="marketplace-settings__store-settings-header" style={{ marginTop: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontWeight: 900, fontSize: 20, color: "#e43226" }}>
              Ali<span style={{ color: "#ff6a00" }}>Express</span>
            </h3>
            <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
              Authorize your AliExpress DS account to browse and import supplier products.
            </p>
          </div>
          {!aliConnection.connected && (
            <button
              type="button"
              className="marketplace-settings__ebay-btn marketplace-settings__ebay-btn--connect"
              onClick={connectAliExpress}
              disabled={aliConnecting}
              style={{ flexShrink: 0 }}
            >
              {aliConnecting ? <LuLoader className="spin-icon" /> : <LuLink />}
              <span>{aliConnecting ? "Opening AliExpress…" : "Connect AliExpress"}</span>
            </button>
          )}
        </div>
      </div>

      {aliConnection.loading ? (
        <div className="marketplace-settings__ebay-status marketplace-settings__ebay-status--loading" style={{ padding: "16px 0" }}>
          <LuLoader className="spin-icon" />
          <span>Checking connection status…</span>
        </div>
      ) : aliConnection.connected ? (
        <div className="marketplace-settings__ebay-card" style={{ marginTop: 12, background: "#fff7f0", border: "1px solid #fed7aa" }}>
          <div className="marketplace-settings__ebay-info">
            <div className="marketplace-settings__ebay-status marketplace-settings__ebay-status--connected">
              <LuBadgeCheck style={{ color: "#c2410c" }} />
              <span>
                Connected as <strong>{aliConnection.ae_user_nick ?? aliConnection.ae_account ?? "AliExpress Seller"}</strong>
              </span>
            </div>
            {aliConnection.ae_account && (
              <p className="marketplace-settings__ebay-sub">
                Account: {aliConnection.ae_account}&nbsp;·&nbsp;
                Connected: {aliConnection.connected_at ? new Date(aliConnection.connected_at).toLocaleDateString() : "—"}
              </p>
            )}
          </div>
          <div className="marketplace-settings__ebay-actions">
            <button
              type="button"
              className="marketplace-settings__ebay-btn marketplace-settings__ebay-btn--disconnect"
              onClick={disconnectAliExpress}
            >
              <LuUnplug />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="marketplace-settings__ebay-status marketplace-settings__ebay-status--disconnected" style={{ padding: "20px 0" }}>
          <LuUnplug />
          <span>
            {aliConnection.needs_reconnect
              ? "Authorization expired — click Connect AliExpress to sign in again."
              : (
                <>
                  Not connected — join the{" "}
                  <a href="https://ds.aliexpress.com" target="_blank" rel="noreferrer">Dropshipping Center</a>
                  , then click <em>Connect AliExpress</em>.
                </>
              )}
          </span>
          <p style={{ margin: "10px 0 0", fontSize: 12, color: "#6b7280", maxWidth: 520 }}>
            {ALIEXPRESS_OAUTH_HINT} Authorization opens in a new browser tab.
          </p>
        </div>
      )}
    </div>
  );

  const activeSupplier = suppliers.find((supplier) => supplier.id === activeSupplierId) || suppliers[0];
  const currentSettings = activeSupplier?.settings || createInitialSupplierSettings();
  const pricingSummary = buildPricingSummary(currentSettings.pricing);
  const editingMessage = currentSettings.orders.messages.find((message) => message.id === editingMessageId) || null;

  const updateActiveSupplierSettings = (transformer) => {
    setSuppliers((currentSuppliers) =>
      currentSuppliers.map((supplier) =>
        supplier.id === activeSupplierId
          ? {
              ...supplier,
              settings: transformer(supplier.settings),
            }
          : supplier,
      ),
    );
  };

  const patchSection = (section, patch) => {
    updateActiveSupplierSettings((settings) => ({
      ...settings,
      [section]: {
        ...settings[section],
        ...patch,
      },
    }));
  };

  const patchNestedSection = (section, nestedSection, key, value) => {
    updateActiveSupplierSettings((settings) => ({
      ...settings,
      [section]: {
        ...settings[section],
        [nestedSection]: {
          ...settings[section][nestedSection],
          [key]: value,
        },
      },
    }));
  };

  const rotateZipcode = () => {
    const currentIndex = zipRotations.findIndex(
      (location) =>
        location.zipcode === currentSettings.lister.zipcode && location.city === currentSettings.lister.city,
    );
    const nextLocation = zipRotations[(currentIndex + 1 + zipRotations.length) % zipRotations.length];

    patchSection("lister", {
      zipcode: nextLocation.zipcode,
      city: nextLocation.city,
      itemCountry: nextLocation.country,
    });
  };

  const addItemSpecific = () => {
    if (!itemSpecificDraft.name.trim() || !itemSpecificDraft.description.trim()) {
      return;
    }

    updateActiveSupplierSettings((settings) => ({
      ...settings,
      lister: {
        ...settings.lister,
        itemSpecifics: [
          ...settings.lister.itemSpecifics,
          {
            id: `item-specific-${Date.now()}`,
            name: itemSpecificDraft.name.trim(),
            description: itemSpecificDraft.description.trim(),
          },
        ],
      },
    }));

    setItemSpecificDraft({ name: "", description: "" });
  };

  const copyItemSpecificsFromUrl = () => {
    updateActiveSupplierSettings((settings) => ({
      ...settings,
      lister: {
        ...settings.lister,
        itemSpecifics: [
          { id: "brand", name: "Brand", description: "AutoDS Essentials" },
          { id: "condition", name: "Condition", description: "New" },
          { id: "material", name: "Material", description: "Premium Blend" },
        ],
      },
    }));
    setEditAllItemSpecifics(true);
  };

  const updateItemSpecific = (itemId, key, value) => {
    updateActiveSupplierSettings((settings) => ({
      ...settings,
      lister: {
        ...settings.lister,
        itemSpecifics: settings.lister.itemSpecifics.map((item) =>
          item.id === itemId
            ? {
                ...item,
                [key]: value,
              }
            : item,
        ),
      },
    }));
  };

  const removeItemSpecific = (itemId) => {
    updateActiveSupplierSettings((settings) => ({
      ...settings,
      lister: {
        ...settings.lister,
        itemSpecifics: settings.lister.itemSpecifics.filter((item) => item.id !== itemId),
      },
    }));
  };

  const openMessageEditor = (messageId) => {
    const message = currentSettings.orders.messages.find((item) => item.id === messageId);
    setEditingMessageId(messageId);
    setMessageDraft(message?.message || "");
  };

  const saveMessageDraft = () => {
    if (!editingMessageId) {
      return;
    }

    updateActiveSupplierSettings((settings) => ({
      ...settings,
      orders: {
        ...settings.orders,
        messages: settings.orders.messages.map((message) =>
          message.id === editingMessageId
            ? {
                ...message,
                message: messageDraft.trim() || message.message,
              }
            : message,
        ),
      },
    }));

    setEditingMessageId("");
    setMessageDraft("");
  };

  const toggleMessageEnabled = (messageId, value) => {
    updateActiveSupplierSettings((settings) => ({
      ...settings,
      orders: {
        ...settings.orders,
        messages: settings.orders.messages.map((message) =>
          message.id === messageId
            ? {
                ...message,
                enabled: value,
              }
            : message,
        ),
      },
    }));
  };

  const saveCurrentTab = () => {
    setSaveNotice(`${activeInnerTab} settings saved for ${activeSupplier.label}.`);
  };


  const renderListerTab = () => (
    <div className="marketplace-settings__tab-panel">
      <section className="marketplace-settings__section">
        <h3 className="marketplace-settings__section-title">Lister Settings</h3>
        <div className="marketplace-settings__grid marketplace-settings__grid--2">
          <SettingsField label="Default Product Quantity" help className="marketplace-settings__field--full">
            <SettingsInput
              type="number"
              value={currentSettings.lister.defaultQuantity}
              onChange={(event) => patchSection("lister", { defaultQuantity: event.target.value })}
            />
          </SettingsField>

          <SettingsField label="Default Item Country" required help>
            <SettingsSelect
              value={currentSettings.lister.itemCountry}
              options={countryOptions}
              onChange={(event) => patchSection("lister", { itemCountry: event.target.value })}
            />
          </SettingsField>

          <SettingsField label="Default Zipcode" required help>
            <div className="marketplace-settings__zipcode-row">
              <SettingsInput
                value={currentSettings.lister.zipcode}
                onChange={(event) => patchSection("lister", { zipcode: event.target.value })}
              />
              <button
                type="button"
                className="marketplace-settings__icon-btn"
                onClick={rotateZipcode}
                aria-label="Rotate zipcode"
              >
                <LuRefreshCcw />
              </button>
              <span className="marketplace-settings__location-chip">
                <LuMapPin />
                <span>{currentSettings.lister.city}</span>
              </span>
            </div>
          </SettingsField>

          <SettingsField label="Shipping Methods" help>
            <SettingsSelect
              value={currentSettings.lister.shippingMethod}
              options={shippingMethodOptions}
              onChange={(event) => patchSection("lister", { shippingMethod: event.target.value })}
            />
          </SettingsField>

          <SettingsField label="Default Template" help>
            <SettingsSelect
              value={currentSettings.lister.defaultTemplate}
              options={templateOptions}
              onChange={(event) => patchSection("lister", { defaultTemplate: event.target.value })}
            />
          </SettingsField>
        </div>
      </section>

      <section className="marketplace-settings__section">
        <h3 className="marketplace-settings__section-title">Selling Platform Policies</h3>
        <SettingsSwitch
          checked={currentSettings.lister.useDynamicPolicies}
          onChange={(value) => patchSection("lister", { useDynamicPolicies: value })}
        >
          <span>
            Use Dynamic Policies (Shipping, Payment, Returns) <SettingsHelpBadge />
          </span>
        </SettingsSwitch>

        <div className="marketplace-settings__grid marketplace-settings__grid--2">
          <SettingsField label="Payment Policy" help>
            <SettingsSelect
              value={currentSettings.lister.paymentPolicy}
              options={policyOptions}
              onChange={(event) => patchSection("lister", { paymentPolicy: event.target.value })}
            />
          </SettingsField>

          <SettingsField label="Shipping Policy" help>
            <SettingsSelect
              value={currentSettings.lister.shippingPolicy}
              options={shippingPolicyOptions}
              onChange={(event) => patchSection("lister", { shippingPolicy: event.target.value })}
            />
          </SettingsField>

          <SettingsField label="Return Policy" help>
            <SettingsSelect
              value={currentSettings.lister.returnPolicy}
              options={returnPolicyOptions}
              onChange={(event) => patchSection("lister", { returnPolicy: event.target.value })}
            />
          </SettingsField>
        </div>
      </section>

      <section className="marketplace-settings__section marketplace-settings__section--dual">
        <div>
          <h3 className="marketplace-settings__section-title">Advanced Lister Settings</h3>
          <div className="marketplace-settings__advanced-grid">
            {advancedListerColumns.map((column, columnIndex) => (
              <div className="marketplace-settings__checkbox-column" key={`advanced-column-${columnIndex}`}>
                {column.map((item) => (
                  <SettingsCheckbox
                    checked={currentSettings.lister.advanced[item.key]}
                    key={item.key}
                    onChange={(value) => patchNestedSection("lister", "advanced", item.key, value)}
                  >
                    {item.label}
                  </SettingsCheckbox>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="marketplace-settings__section-title">Price &amp; Stock Monitoring Settings</h3>
          <div className="marketplace-settings__monitoring-box">
            {monitoringToggleOptions.map((item) => (
              <SettingsSwitch
                checked={currentSettings.lister.monitoring[item.key]}
                key={item.key}
                onChange={(value) => patchNestedSection("lister", "monitoring", item.key, value)}
              >
                <span>
                  {item.label} <SettingsHelpBadge />
                </span>
              </SettingsSwitch>
            ))}
          </div>
        </div>
      </section>

      <section className="marketplace-settings__section">
        <div className="marketplace-settings__section-head">
          <h3 className="marketplace-settings__section-title">Ai Optimization Settings</h3>
          <div className="marketplace-settings__balance-pill">
            <span>AI Balance: 30 credits.</span>
            <button type="button">Buy More</button>
          </div>
        </div>

        <div className="marketplace-settings__ai-toggles">
          <SettingsSwitch
            checked={currentSettings.lister.aiOptimization.aiTitle}
            onChange={(value) => patchNestedSection("lister", "aiOptimization", "aiTitle", value)}
          >
            <span>
              Ai Title <SettingsHelpBadge />
            </span>
          </SettingsSwitch>

          <SettingsSwitch
            checked={currentSettings.lister.aiOptimization.aiDescription}
            onChange={(value) => patchNestedSection("lister", "aiOptimization", "aiDescription", value)}
          >
            <span>
              Ai Description <SettingsHelpBadge />
            </span>
          </SettingsSwitch>
        </div>
      </section>

      <section className="marketplace-settings__section">
        <h3 className="marketplace-settings__section-title">Default Item Specifics</h3>

        <div className="marketplace-settings__spec-actions">
          <button
            type="button"
            className="marketplace-settings__ghost-action"
            onClick={() => setItemSpecificDraft({ name: "", description: "" })}
          >
            <LuPlus />
            <span>Add Item Specification</span>
          </button>

          <button
            type="button"
            className="marketplace-settings__ghost-action"
            onClick={() => setEditAllItemSpecifics((current) => !current)}
          >
            <LuPencil />
            <span>{editAllItemSpecifics ? "Done Editing" : "Edit All Item Specifications"}</span>
          </button>

          <button type="button" className="marketplace-settings__ghost-action marketplace-settings__ghost-action--active" onClick={copyItemSpecificsFromUrl}>
            <LuCopy />
            <span>Copy from URL</span>
          </button>
        </div>

        <div className="marketplace-settings__spec-entry">
          <SettingsInput
            value={itemSpecificDraft.name}
            onChange={(event) =>
              setItemSpecificDraft((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
            placeholder="Enter name"
          />
          <SettingsInput
            value={itemSpecificDraft.description}
            onChange={(event) =>
              setItemSpecificDraft((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            placeholder="Enter description"
          />
          <button type="button" className="marketplace-settings__small-save" onClick={addItemSpecific}>
            Add
          </button>
        </div>

        {currentSettings.lister.itemSpecifics.length ? (
          <div className="marketplace-settings__spec-list">
            {currentSettings.lister.itemSpecifics.map((item) => (
              <div className="marketplace-settings__spec-item" key={item.id}>
                {editAllItemSpecifics ? (
                  <>
                    <input
                      className="marketplace-settings__inline-input"
                      value={item.name}
                      onChange={(event) => updateItemSpecific(item.id, "name", event.target.value)}
                    />
                    <input
                      className="marketplace-settings__inline-input"
                      value={item.description}
                      onChange={(event) => updateItemSpecific(item.id, "description", event.target.value)}
                    />
                  </>
                ) : (
                  <>
                    <span className="marketplace-settings__spec-name">{item.name}</span>
                    <span className="marketplace-settings__spec-description">{item.description}</span>
                  </>
                )}

                <button
                  type="button"
                  className="marketplace-settings__spec-remove"
                  onClick={() => removeItemSpecific(item.id)}
                  aria-label={`Remove ${item.name}`}
                >
                  <LuX />
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );

  const renderPricingTab = () => (
    <div className="marketplace-settings__tab-panel">
      <section className="marketplace-settings__section">
        <div className="marketplace-settings__section-head marketplace-settings__section-head--spread">
          <h3 className="marketplace-settings__section-title">Profit settings</h3>
          <p className="marketplace-settings__pricing-help">
            Need Help?
            <button type="button">See how to set up your settings</button>
          </p>
        </div>

        <div className="marketplace-settings__pricing-summary">
          <div className="marketplace-settings__pricing-bar-copy">
            <span>Product cost</span>
            <span>Profits</span>
          </div>

          <div className="marketplace-settings__pricing-visual">
            <div className="marketplace-settings__pricing-rail">
              <span className="marketplace-settings__pricing-segment marketplace-settings__pricing-segment--cost" style={{ width: pricingSummary.productWidth }} />
              <span className="marketplace-settings__pricing-segment marketplace-settings__pricing-segment--profit" style={{ width: pricingSummary.profitWidth }} />
            </div>

            <div className="marketplace-settings__pricing-totals">
              <div>
                <strong>Profits</strong>
                <span>{formatAud(pricingSummary.profit)}</span>
              </div>
              <div>
                <strong>+ {parseNumericValue(currentSettings.pricing.feesPercent).toFixed(2)}% Fees</strong>
                <span>{formatAud(pricingSummary.percentFee)}</span>
              </div>
              <div>
                <strong>+ A$ Fee</strong>
                <span>{formatAud(pricingSummary.fixedFee)}</span>
              </div>
              <div>
                <strong>= Total Price</strong>
                <span>{formatAud(pricingSummary.totalPrice)}</span>
              </div>
            </div>
          </div>

          <div className="marketplace-settings__pricing-example">
            <span>{currentSettings.pricing.productCost ? formatAud(pricingSummary.productCost) : "e.g: A$100"}</span>
            <span>{formatAud(pricingSummary.profit)}</span>
            <span>{formatAud(pricingSummary.percentFee)}</span>
            <span>{formatAud(pricingSummary.fixedFee)}</span>
            <span>{formatAud(pricingSummary.totalPrice)}</span>
          </div>
        </div>

        <div className="marketplace-settings__grid marketplace-settings__grid--4 marketplace-settings__grid--tight">
          <SettingsField label="Fees">
            <SettingsInput
              value={currentSettings.pricing.feesPercent}
              onChange={(event) => patchSection("pricing", { feesPercent: event.target.value })}
              placeholder="0%"
            />
          </SettingsField>

          <SettingsField label="A$ Fee Amount">
            <SettingsInput
              value={currentSettings.pricing.fixedFeeAmount}
              onChange={(event) => patchSection("pricing", { fixedFeeAmount: event.target.value })}
              placeholder="A$0"
            />
          </SettingsField>

          <SettingsField label="Additional Profit in %">
            <SettingsInput
              value={currentSettings.pricing.additionalProfitPercent}
              onChange={(event) => patchSection("pricing", { additionalProfitPercent: event.target.value })}
              placeholder="0%"
            />
          </SettingsField>

          <SettingsField label="Additional Profit in A$">
            <SettingsInput
              value={currentSettings.pricing.additionalProfitAmount}
              onChange={(event) => patchSection("pricing", { additionalProfitAmount: event.target.value })}
              placeholder="A$0"
            />
          </SettingsField>

          <SettingsField label="Default automation" className="marketplace-settings__field--wide">
            <SettingsSelect
              value={currentSettings.pricing.defaultAutomation}
              options={pricingAutomationOptions}
              onChange={(event) => patchSection("pricing", { defaultAutomation: event.target.value })}
            />
          </SettingsField>

          <SettingsField label="Minimum profit per product" className="marketplace-settings__field--wide">
            <SettingsInput
              value={currentSettings.pricing.minimumProfit}
              onChange={(event) => patchSection("pricing", { minimumProfit: event.target.value })}
              placeholder="A$0"
            />
          </SettingsField>
        </div>

        <SettingsSwitch
          checked={currentSettings.pricing.dynamicProfit}
          onChange={(value) => patchSection("pricing", { dynamicProfit: value })}
        >
          <span>
            Dynamic profit <SettingsHelpBadge />
          </span>
        </SettingsSwitch>
      </section>

      <section className="marketplace-settings__section">
        <h3 className="marketplace-settings__section-title">Additional Pricing Settings</h3>
        <div className="marketplace-settings__pricing-extra">
          <SettingsSwitch
            checked={currentSettings.pricing.setPriceCentsValue}
            onChange={(value) => patchSection("pricing", { setPriceCentsValue: value })}
          >
            <span>
              Set Price Cents Value <SettingsHelpBadge />
            </span>
          </SettingsSwitch>

          <SettingsCheckbox
            checked={currentSettings.pricing.includeShippingPrice}
            onChange={(value) => patchSection("pricing", { includeShippingPrice: value })}
          >
            Include shipping price
          </SettingsCheckbox>
        </div>
      </section>
    </div>
  );

  const renderOrdersTab = () => (
    <div className="marketplace-settings__tab-panel">
      <section className="marketplace-settings__section">
        <h3 className="marketplace-settings__section-title">Orders Settings</h3>

        <div className="marketplace-settings__orders-switches">
          <SettingsSwitch
            checked={currentSettings.orders.overridePhoneNumber}
            onChange={(value) => patchSection("orders", { overridePhoneNumber: value })}
          >
            Override customer's phone number
          </SettingsSwitch>

          <SettingsSwitch
            checked={currentSettings.orders.autoDeliver}
            onChange={(value) => patchSection("orders", { autoDeliver: value })}
          >
            Mark order as Delivered automatically
          </SettingsSwitch>
        </div>

        <div className="marketplace-settings__grid marketplace-settings__grid--2">
          <SettingsField label="Set order as shipped" help className="marketplace-settings__field--full">
            <SettingsSelect
              value={currentSettings.orders.shippedStatus}
              options={shippedStatusOptions}
              onChange={(event) => patchSection("orders", { shippedStatus: event.target.value })}
            />
          </SettingsField>

          <SettingsField label="Maximum Purchase Order Price" help>
            <SettingsInput
              value={currentSettings.orders.maximumPurchasePrice}
              onChange={(event) => patchSection("orders", { maximumPurchasePrice: event.target.value })}
            />
          </SettingsField>

          <SettingsField label="Maximum Loss" help>
            <SettingsInput
              value={currentSettings.orders.maximumLoss}
              onChange={(event) => patchSection("orders", { maximumLoss: event.target.value })}
            />
          </SettingsField>
        </div>
      </section>

      <section className="marketplace-settings__section">
        <h3 className="marketplace-settings__section-title">Automatic Messages Sent to Customers</h3>
        <div className="marketplace-settings__message-table">
          {currentSettings.orders.messages.map((message) => (
            <div className="marketplace-settings__message-row" key={message.id}>
              <div className="marketplace-settings__message-title">{message.title}</div>
              <div className="marketplace-settings__message-copy">{message.message}</div>
              <button
                type="button"
                className="marketplace-settings__message-edit"
                onClick={() => openMessageEditor(message.id)}
                aria-label={`Edit ${message.title}`}
              >
                <LuPencil />
              </button>
              <SettingsSwitch
                checked={message.enabled}
                compact
                onChange={(value) => toggleMessageEnabled(message.id, value)}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const renderGeneralTab = () => (
    <div className="marketplace-settings__tab-panel marketplace-settings__tab-panel--compact">
      <section className="marketplace-settings__section">
        <h3 className="marketplace-settings__section-title">General</h3>
        <div className="marketplace-settings__grid marketplace-settings__grid--2">
          <SettingsField label="Default Weight Unit" className="marketplace-settings__field--full">
            <SettingsSelect
              value={currentSettings.general.defaultWeightUnit}
              options={weightUnitOptions}
              onChange={(event) => patchSection("general", { defaultWeightUnit: event.target.value })}
            />
          </SettingsField>
        </div>

        <SettingsSwitch
          checked={currentSettings.general.automaticSkuFilling}
          onChange={(value) => patchSection("general", { automaticSkuFilling: value })}
        >
          <span>
            Automatic SKU Filling <SettingsHelpBadge />
          </span>
        </SettingsSwitch>
      </section>

      <section className="marketplace-settings__section">
        <h3 className="marketplace-settings__section-title">Monitoring</h3>
        <div className="marketplace-settings__grid marketplace-settings__grid--2">
          <SettingsField label="Minimum Product Quantity" help>
            <SettingsInput
              value={currentSettings.general.minimumProductQuantity}
              onChange={(event) => patchSection("general", { minimumProductQuantity: event.target.value })}
            />
          </SettingsField>

          <SettingsField label="Maximum Shipping Days" help>
            <SettingsInput
              value={currentSettings.general.maximumShippingDays}
              onChange={(event) => patchSection("general", { maximumShippingDays: event.target.value })}
            />
          </SettingsField>
        </div>
      </section>
    </div>
  );

  const renderPlansAddOnsTab = () => {
    const ebayConnected = ebayConnections.length > 0;
    const ebayCard = ebayConnected
      ? {
          id: "ebay-plan",
          name: "eBay",
          logo: "ebay",
          current: true,
          summary: ebayConnections.length === 1
            ? (primaryEbayConnection?.ebay_username ? `Connected as ${primaryEbayConnection.ebay_username}` : "Connected")
            : `${ebayConnections.length} accounts connected`,
          metrics: [
            { label: "Accounts:", value: String(ebayConnections.length) },
            { label: "Primary:", value: primaryEbayConnection?.ebay_username ?? "—" },
            { label: "Site:", value: primaryEbayConnection?.site_id ?? "—" },
          ],
          secondaryAction: "Manage Accounts",
          primaryAction: "Add Account",
        }
      : {
          id: "ebay-plan",
          name: "eBay",
          logo: "ebay",
          current: false,
          copy: "Connect your eBay seller account to sync listings, manage products, and track performance.",
          primaryAction: "Connect eBay",
        };

    const allPlans = [ebayCard, ...staticPlanCards];

    return (
    <section className="marketplace-settings__full-panel card-wrapper">
      <div className="marketplace-settings__plans-layout">
        <div className="marketplace-settings__plans-main">
          <div className="marketplace-settings__plans-heading">My Plans</div>
          <div className="marketplace-settings__plans-grid">
            {allPlans.map((plan) => (
              <article
                className={`marketplace-settings__plan-card ${plan.current ? "marketplace-settings__plan-card--current" : ""}`}
                key={plan.id}
              >
                <div className="marketplace-settings__plan-card-top">
                  <div>
                    <h3>{plan.name}</h3>
                    {plan.summary ? <span>{plan.summary}</span> : null}
                  </div>
                  <span className={`marketplace-settings__plan-logo marketplace-settings__plan-logo--${plan.logo}`}>{plan.logo}</span>
                </div>

                {plan.metrics ? (
                  <div className="marketplace-settings__plan-metrics">
                    {plan.metrics.map((metric) => (
                      <div className="marketplace-settings__plan-metric" key={`${plan.id}-${metric.label}`}>
                        <span>{metric.label}</span>
                        <strong>{metric.value}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="marketplace-settings__plan-copy">{plan.copy}</p>
                )}

                <div className="marketplace-settings__plan-actions">
                  {plan.secondaryAction ? (
                    <button
                      type="button"
                      className="marketplace-settings__plan-link"
                      onClick={plan.id === "ebay-plan" && plan.secondaryAction === "Manage Accounts"
                        ? () => setActivePrimaryTab("Store Settings")
                        : undefined}
                    >
                      {plan.secondaryAction}
                    </button>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    className={plan.current ? "marketplace-settings__plan-btn marketplace-settings__plan-btn--outline" : "marketplace-settings__plan-btn"}
                    onClick={plan.id === "ebay-plan" ? connectEbay : undefined}
                    disabled={plan.id === "ebay-plan" && ebayConnecting}
                  >
                    {plan.id === "ebay-plan" && ebayConnecting ? "Opening eBay…" : plan.primaryAction}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="marketplace-settings__addons-panel">
          <div className="marketplace-settings__plans-heading">Add-ons</div>
          <div className="marketplace-settings__addons-list">
            {settingsAddOns.map((addOn) => (
              <article
                className={`marketplace-settings__addon-card ${addOn.active ? "marketplace-settings__addon-card--active" : ""}`}
                key={addOn.id}
              >
                <div className="marketplace-settings__addon-head">
                  <span className="marketplace-settings__addon-icon" />
                  {addOn.tag ? <span className="marketplace-settings__addon-tag">{addOn.tag}</span> : null}
                </div>
                <h3>{addOn.title}</h3>
                <p>
                  {addOn.copy} <button type="button">{addOn.linkLabel}</button>
                </p>
                {addOn.startedOn ? <span className="marketplace-settings__addon-meta">{addOn.startedOn}</span> : null}
                {addOn.price ? <strong className="marketplace-settings__addon-price">{addOn.price}</strong> : null}
                <div className="marketplace-settings__addon-actions">
                  {addOn.footerLink ? (
                    <button type="button" className="marketplace-settings__addon-link">
                      {addOn.footerLink}
                    </button>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    className={addOn.active ? "marketplace-settings__addon-btn marketplace-settings__addon-btn--muted" : "marketplace-settings__addon-btn"}
                  >
                    {addOn.actionLabel}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </aside>
      </div>
    </section>
    );
  };

  const [profileName, setProfileName] = useState(user?.name ?? "");
  const [profileEmail, setProfileEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  const saveProfile = async () => {
    if (newPassword && newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword && newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setProfileSaving(true);
    try {
      const payload = {};
      if (profileName !== user?.name)   payload.name  = profileName;
      if (profileEmail !== user?.email) payload.email = profileEmail;
      if (newPassword) {
        payload.current_password  = currentPassword;
        payload.password          = newPassword;
        payload.password_confirmation = confirmPassword;
      }
      if (!Object.keys(payload).length) {
        toast.info("No changes to save.");
        return;
      }
      await dispatch(updateProfileAction(payload));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setProfileSaving(false);
    }
  };

  const renderAccountBillingTab = () => (
    <section className="marketplace-settings__full-panel marketplace-settings__billing-page card-wrapper">
      <div className="marketplace-settings__billing-section">
        <h3>Account Details</h3>
        <div className="marketplace-settings__grid marketplace-settings__grid--2" style={{ marginTop: 12 }}>
          <div>
            <label className="marketplace-settings__field-label" style={{ display: "block", marginBottom: 4, fontSize: 13 }}>
              Full Name
            </label>
            <input
              className="marketplace-settings__control"
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="marketplace-settings__field-label" style={{ display: "block", marginBottom: 4, fontSize: 13 }}>
              Email Address
            </label>
            <input
              className="marketplace-settings__control"
              type="email"
              value={profileEmail}
              onChange={(e) => setProfileEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>
        </div>
      </div>

      <div className="marketplace-settings__billing-section">
        <h3>Change Password</h3>
        <div className="marketplace-settings__grid marketplace-settings__grid--2" style={{ marginTop: 12 }}>
          <div>
            <label className="marketplace-settings__field-label" style={{ display: "block", marginBottom: 4, fontSize: 13 }}>
              Current Password
            </label>
            <input
              className="marketplace-settings__control"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="marketplace-settings__field-label" style={{ display: "block", marginBottom: 4, fontSize: 13 }}>
              New Password
            </label>
            <input
              className="marketplace-settings__control"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="marketplace-settings__field-label" style={{ display: "block", marginBottom: 4, fontSize: 13 }}>
              Confirm New Password
            </label>
            <input
              className="marketplace-settings__control"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              autoComplete="new-password"
            />
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <button
            type="button"
            className="marketplace-settings__save-btn"
            onClick={saveProfile}
            disabled={profileSaving}
          >
            {profileSaving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="marketplace-settings__billing-section">
        <h3>Payment Method</h3>
        <div className="marketplace-settings__billing-card">
          <div>
            <strong>No Payment Method Found</strong>
            <span>Start adding cards for all stores.</span>
          </div>
          <button type="button" className="marketplace-settings__billing-card-btn">
            Add
          </button>
        </div>
      </div>

      <div className="marketplace-settings__billing-section">
        <div className="marketplace-settings__billing-head">
          <h3>Payment History</h3>
        </div>
        <div className="marketplace-settings__billing-history">
          <div className="marketplace-settings__billing-history-head">
            <span>Date</span>
            <span>ID</span>
            <span>Type</span>
            <span>Total</span>
          </div>
          <div style={{ padding: "20px 0", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
            No payment history yet.
          </div>
        </div>
      </div>
    </section>
  );

  const renderInnerTab = () => {
    if (activeInnerTab === "Pricing") {
      return renderPricingTab();
    }

    if (activeInnerTab === "Orders") {
      return renderOrdersTab();
    }

    if (activeInnerTab === "General") {
      return renderGeneralTab();
    }

    return renderListerTab();
  };

  return (
    <section className="marketplace-settings-page">
      <nav className="marketplace-settings__primary-tabs" aria-label="Settings sections">
        {settingsPrimaryTabs.map((tab) => (
          <button
            type="button"
            key={tab}
            className={`marketplace-settings__primary-tab ${activePrimaryTab === tab ? "marketplace-settings__primary-tab--active" : ""}`}
            onClick={() => setActivePrimaryTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      {activePrimaryTab === "Supplier Settings" ? (
        <div className="marketplace-settings__workspace marketplace-settings__workspace--no-sidebar">
          <div className="marketplace-settings__panel card-wrapper">
            <div className="marketplace-settings__inner-tabs" role="tablist" aria-label="Supplier settings tabs">
              {settingsInnerTabs.map((tab) => (
                <button
                  type="button"
                  key={tab}
                  className={`marketplace-settings__inner-tab ${activeInnerTab === tab ? "marketplace-settings__inner-tab--active" : ""}`}
                  onClick={() => setActiveInnerTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="marketplace-settings__panel-body">{renderInnerTab()}</div>

            <div className="marketplace-settings__footer">
              <span className={`marketplace-settings__footer-copy ${saveNotice ? "marketplace-settings__footer-copy--saved" : ""}`}>
                {saveNotice || "Changes will be applied only for the new products"}
              </span>

              <button type="button" className="marketplace-settings__save-btn" onClick={saveCurrentTab}>
                Save
              </button>
            </div>
          </div>
        </div>
      ) : activePrimaryTab === "Plans & Add-ons" ? (
        renderPlansAddOnsTab()
      ) : activePrimaryTab === "Account & Billing" ? (
        renderAccountBillingTab()
      ) : activePrimaryTab === "Store Settings" ? (
        renderStoreSettingsTab()
      ) : (
        <SettingsPlaceholder title={activePrimaryTab} />
      )}

      {editingMessage ? (
        <div className="marketplace-settings__modal">
          <button
            type="button"
            className="marketplace-settings__modal-backdrop"
            onClick={() => {
              setEditingMessageId("");
              setMessageDraft("");
            }}
            aria-label="Close message editor"
          />

          <div className="marketplace-settings__modal-card">
            <button
              type="button"
              className="marketplace-settings__modal-close"
              onClick={() => {
                setEditingMessageId("");
                setMessageDraft("");
              }}
              aria-label="Close"
            >
              <LuX />
            </button>

            <h3>Edit {editingMessage.title}</h3>
            <p>Customize the automatic message before it is sent to your customers.</p>
            <textarea
              className="marketplace-settings__textarea"
              rows="8"
              value={messageDraft}
              onChange={(event) => setMessageDraft(event.target.value)}
            />

            <div className="marketplace-settings__modal-actions">
              <button
                type="button"
                className="marketplace-settings__modal-btn marketplace-settings__modal-btn--secondary"
                onClick={() => {
                  setEditingMessageId("");
                  setMessageDraft("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="marketplace-settings__modal-btn marketplace-settings__modal-btn--primary"
                onClick={saveMessageDraft}
              >
                Save message
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
