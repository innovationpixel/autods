import { useEffect, useRef, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
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
  LuCreditCard,
  LuShield,
  LuUser,
  LuReceipt,
  LuTrash2,
  LuCrown,
  LuCalendar,
  LuArrowUpRight,
  LuWallet,
  LuCheck,
  LuMail,
  LuSparkles,
  LuStore,
  LuPackageSearch,
  LuZap,
  LuExternalLink,
  LuClock,
  LuPackage,
  LuShoppingCart,
  LuChevronRight,
} from "react-icons/lu";
import { FaAmazon, FaShopify, FaWix, FaWordpress } from "react-icons/fa6";
import { fetchEbayStatus, disconnectEbayAction, syncEbayListingsAction, setEbayPrimaryAction } from "../../store/actions/EbayActions";
import ConnectEbayModal, { EBAY_MARKETPLACES } from "../autods/ConnectEbayModal";
import { updateProfileAction } from "../../store/actions/AuthActions";
import { getEbayAuthUrl, completeEbayOAuth } from "../../services/EbayService";
import { parseEbayOAuthUrl } from "../../utils/ebayOAuth";
import EbayOAuthSetupBanner from "../autods/EbayOAuthSetupBanner";
import ShipFromSetupNotice from "../autods/ShipFromSetupNotice";
import ConfirmModal from "../autods/ConfirmModal";
import {
  buildSupplierProfile,
  normalizeSuppliersFromApi,
} from "../../utils/supplierProfiles";
import { selectEbayConnections, selectEbayConnectionsLoading, selectEbaySyncingIds } from "../../store/selectors/EbaySelectors";
import { selectUser } from "../../store/selectors/AuthSelectors";
import { toast } from "../../utils/toast";
import { openOAuthTab, watchOAuthTab, markOAuthReturnOrigin, OAUTH_TAB_HINT } from "../../utils/oauthBridge";
import { getAccountSettings, updateAccountSettings } from "../../services/SettingsService";
import { getEbayPolicies } from "../../services/ProductService";
import {
  createStripeSetupIntent,
  deletePaymentMethod,
  getPaymentHistory,
  getPaymentMethods,
  savePayPalPaymentMethod,
  saveStripePaymentMethod,
} from "../../services/BillingService";
import { getCurrentPlan } from "../../services/PlanService";
import {
  getBuyerAccounts,
  getBuyerAccountAuthUrl,
  updateBuyerAccount,
  disconnectBuyerAccount,
} from "../../services/BuyerAccountService";
import SettingsTemplatesPanel from "../autods/settings/SettingsTemplatesPanel";
import { allTemplates } from "../autods/settings/settingsTemplates";
import BuyAiCreditsModal from "../autods/pages/BuyAiCreditsModal";

const settingsPrimaryTabs = [
  "Store Settings",
  "Supplier Settings",
  "Buyer Accounts",
  "Automations",
  "Templates",
  "Keywords",
  "Plans & Add-ons",
  "Account & Billing",
  "Users",
  "Notifications",
];

const settingsInnerTabs = ["Lister", "Pricing", "Orders", "General"];

function getUserInitials(name, email) {
  const source = (name || email || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function formatCardBrand(brand) {
  if (!brand) return "Card";
  return brand.charAt(0).toUpperCase() + brand.slice(1).replace(/_/g, " ");
}

function formatBillingDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatBillingDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function PlanEbayLogoMark() {
  return (
    <span className="plans-settings__ebay-mark" aria-hidden="true">
      <span className="plans-settings__ebay-mark-e">e</span>
      <span className="plans-settings__ebay-mark-b">b</span>
      <span className="plans-settings__ebay-mark-a">a</span>
      <span className="plans-settings__ebay-mark-y">y</span>
    </span>
  );
}

function PlanPlatformLogo({ logo, name }) {
  const icon = (() => {
    switch (logo) {
      case "ebay":
        return <PlanEbayLogoMark />;
      case "shop":
        return <FaShopify aria-hidden="true" />;
      case "a":
        return <FaAmazon aria-hidden="true" />;
      case "f":
        return <span className="plans-settings__facebook-mark" aria-hidden="true">f</span>;
      case "wix":
        return <FaWix aria-hidden="true" />;
      case "woo":
        return <FaWordpress aria-hidden="true" />;
      case "hub":
        return <LuPackageSearch aria-hidden="true" />;
      default:
        return name?.slice(0, 2)?.toUpperCase() ?? "?";
    }
  })();

  return (
    <span
      className={`plans-settings__brand plans-settings__brand--${logo}`}
      aria-label={`${name} logo`}
      title={name}
    >
      {icon}
    </span>
  );
}

const staticPlanCards = [
  {
    id: "shopify-plan",
    name: "Shopify",
    logo: "shop",
    copy: "All-in-one dropshipping automation for Shopify stores — listings, pricing, and orders.",
    primaryAction: "Browse Plans",
    features: ["Bulk import", "Smart pricing", "Order sync"],
  },
  {
    id: "amazon-plan",
    name: "Amazon",
    logo: "a",
    copy: "Automate listings, stock monitoring, and fulfillment workflows on Amazon.",
    primaryAction: "Browse Plans",
    features: ["Listing automation", "Stock alerts", "FBA ready"],
  },
  {
    id: "facebook-plan",
    name: "Facebook",
    logo: "f",
    copy: "Scale Facebook Marketplace sales with automated product and order management.",
    primaryAction: "Browse Plans",
    features: ["Fast listing", "Auto messages", "Insights"],
  },
  {
    id: "wix-plan",
    name: "Wix",
    logo: "wix",
    copy: "Grow your Wix store with automated imports, pricing rules, and order handling.",
    primaryAction: "Browse Plans",
    features: ["One-click import", "Templates", "Analytics"],
  },
  {
    id: "woocommerce-plan",
    name: "WooCommerce",
    logo: "woo",
    copy: "Optimize WooCommerce listings, images, pricing, and inventory from one hub.",
    primaryAction: "Browse Plans",
    features: ["Image tools", "Bulk edit", "Monitoring"],
  },
];

const addOnIconMap = {
  "finding-hub": LuPackageSearch,
  "orders-processor": LuZap,
  "ai-credits": LuSparkles,
};

const settingsAddOns = [
  {
    id: "finding-hub",
    title: "Product Finding Hub",
    copy: "Discover proven best-sellers with sales analytics and import-ready product data.",
    linkLabel: "Learn more",
    actionLabel: "Enable",
    footerLink: "See how it works",
    accent: "amber",
  },
  {
    id: "orders-processor",
    title: "Orders Processor",
    copy: "Automate fulfillment steps and reduce manual work on every customer order.",
    linkLabel: "Learn more",
    actionLabel: "Cancel",
    footerLink: "See how it works",
    price: "$9.90/mo",
    startedOn: "Started Apr 15, 2026",
    tag: "Active",
    active: true,
    accent: "green",
  },
  {
    id: "ai-credits",
    title: "AI Credits",
    copy: "Generate studio-grade product photos, lifestyle images, and marketing content powered by OpenAI.",
    linkLabel: "Open AI Studio",
    actionLabel: "Buy Credits",
    footerLink: "View packages",
    accent: "purple",
    isAiCredits: true,
  },
];


const zipRotations = [
  { zipcode: "10001", city: "New York", state: "NY", country: "US" },
  { zipcode: "90210", city: "Beverly Hills", state: "CA", country: "US" },
  { zipcode: "19801", city: "Wilmington", state: "DE", country: "US" },
  { zipcode: "2042", city: "Newtown", state: "NSW", country: "AU" },
  { zipcode: "2000", city: "Sydney", state: "NSW", country: "AU" },
];

const countryOptions = [
  { value: "US", label: "United States" },
  { value: "AU", label: "Australia" },
  { value: "GB", label: "United Kingdom" },
  { value: "CA", label: "Canada" },
];

function mapStoredCountry(country) {
  if (!country) return "US";
  if (country.length === 2) return country.toUpperCase();
  const names = {
    Australia: "AU",
    "United States": "US",
    "United Kingdom": "GB",
    Canada: "CA",
  };
  return names[country] ?? "US";
}
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
const policyPlaceholderOption = { value: "", label: "Select a policy" };

function countryToEbaySiteId(country) {
  const normalized = String(country ?? "US").trim().toUpperCase();
  const map = {
    US: "EBAY_US",
    AU: "EBAY_AU",
    UK: "EBAY_GB",
    GB: "EBAY_GB",
    DE: "EBAY_DE",
    CA: "EBAY_CA",
    FR: "EBAY_FR",
    IT: "EBAY_IT",
    ES: "EBAY_ES",
  };

  return map[normalized] ?? `EBAY_${normalized}`;
}

function mapPolicyOptions(options = []) {
  if (!Array.isArray(options) || !options.length) {
    return [policyPlaceholderOption];
  }

  return [
    policyPlaceholderOption,
    ...options.map((option) => ({
      value: option.id,
      label: option.name,
    })),
  ];
}
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
  return `$${numericValue.toFixed(precision)}`;
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
      itemCountry: "US",
      zipcode: "",
      city: "",
      state: "",
      shippingMethod: "Cheapest with tracking",
      defaultTemplate: "Select default template",
      blockedKeywords: "",
      useDynamicPolicies: false,
      paymentPolicyId: "",
      shippingPolicyId: "",
      returnPolicyId: "",
      paymentPolicy: "",
      shippingPolicy: "",
      returnPolicy: "",
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

function createSupplierFromOption(option) {
  return buildSupplierProfile(option.platform, option.country, createInitialSupplierSettings);
}

function createSupplier(template) {
  if (template?.platform && template?.country) {
    return createSupplierFromOption(template);
  }

  return {
    ...template,
    settings: createInitialSupplierSettings(),
  };
}

function createInitialSuppliers() {
  return [];
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

function SettingsSelect({ value, options, onChange, disabled = false }) {
  return (
    <span className="marketplace-settings__select-wrap">
      <select
        className="marketplace-settings__control"
        value={value}
        onChange={onChange}
        disabled={disabled}
      >
        {options.map((option) => {
          const optionValue = typeof option === "object" ? option.value : option;
          const optionLabel = typeof option === "object" ? option.label : option;
          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
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
      <p>Coming soon — we&apos;re working on something like this.</p>
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
  const navigate = useNavigate();
  const { search } = useLocation();
  const ebayConnections        = useSelector(selectEbayConnections);
  const ebayConnectionsLoading = useSelector(selectEbayConnectionsLoading);
  const ebaySyncingIds         = useSelector(selectEbaySyncingIds);
  const user                   = useSelector(selectUser);

  const initialTab = useMemo(() => {
    const tab = new URLSearchParams(search).get("tab");
    if (tab === "store") return "Store Settings";
    if (tab === "supplier") return "Supplier Settings";
    if (tab === "buyer-accounts" || tab === "buyer" || tab === "buyer_accounts") return "Buyer Accounts";
    if (tab === "billing") return "Account & Billing";
    if (tab === "templates") return "Templates";
    if (tab === "plans") return "Plans & Add-ons";
    return "Store Settings";
  }, [search]);

  const [activePrimaryTab, setActivePrimaryTab] = useState(initialTab);
  const [activeInnerTab, setActiveInnerTab] = useState("Lister");

  useEffect(() => {
    const tab = new URLSearchParams(search).get("tab");
    const inner = new URLSearchParams(search).get("inner");
    if (tab === "store") {
      setActivePrimaryTab("Store Settings");
    } else if (tab === "supplier") {
      setActivePrimaryTab("Supplier Settings");
    } else if (tab === "buyer-accounts" || tab === "buyer" || tab === "buyer_accounts") {
      setActivePrimaryTab("Buyer Accounts");
    } else if (tab === "billing") {
      setActivePrimaryTab("Account & Billing");
    } else if (tab === "templates") {
      setActivePrimaryTab("Templates");
    } else if (tab === "plans") {
      setActivePrimaryTab("Plans & Add-ons");
    }
    if (inner === "lister") {
      setActivePrimaryTab("Supplier Settings");
      setActiveInnerTab("Lister");
    }
  }, [search]);
  const primaryEbayConnection = ebayConnections.find((c) => c.is_primary) ?? ebayConnections[0] ?? null;
  const [suppliers, setSuppliers] = useState(createInitialSuppliers);
  const [activeSupplierId, setActiveSupplierId] = useState("");
  const [switchingSupplierId, setSwitchingSupplierId] = useState("");
  const [itemSpecificDraft, setItemSpecificDraft] = useState({ name: "", description: "" });
  const [editAllItemSpecifics, setEditAllItemSpecifics] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState("");
  const [messageDraft, setMessageDraft] = useState("");
  const [saveNotice, setSaveNotice] = useState("");
  const [connectEbayModalOpen, setConnectEbayModalOpen] = useState(false);
  const [ebaySiteId, setEbaySiteId] = useState("EBAY_US");
  const [ebayConnecting, setEbayConnecting] = useState(false);
  const [ebayCompleting, setEbayCompleting] = useState(false);
  const [ebayPasteUrl, setEbayPasteUrl] = useState("");
  const [buyerAccounts, setBuyerAccounts] = useState([]);
  const [buyerAccountsLoading, setBuyerAccountsLoading] = useState(true);
  const [buyerAccountConnecting, setBuyerAccountConnecting] = useState(false);
  const [editingBuyerAccountId, setEditingBuyerAccountId] = useState("");
  const [buyerAccountNicknameDraft, setBuyerAccountNicknameDraft] = useState("");
  const [savingBuyerAccountId, setSavingBuyerAccountId] = useState("");
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [addOns, setAddOns] = useState(settingsAddOns);
  const [addOnTermsTarget, setAddOnTermsTarget] = useState(null);
  const [aiCreditsModalOpen, setAiCreditsModalOpen] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState("");
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [addingPayment, setAddingPayment] = useState(false);
  const [accountSettings, setAccountSettings] = useState(null);
  const [ebayPolicyOptions, setEbayPolicyOptions] = useState({
    payment: [policyPlaceholderOption],
    shipping: [policyPlaceholderOption],
    return: [policyPlaceholderOption],
  });
  const [ebayPoliciesLoading, setEbayPoliciesLoading] = useState(false);
  const [templateCatalog, setTemplateCatalog] = useState({ custom: [], default_id: "" });
  const oauthTabRef = useRef(null);

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

  // ─── eBay connection status ───────────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchEbayStatus());

    getAccountSettings()
      .then((res) => {
        const remote = res.data?.settings ?? {};
        setAccountSettings(remote);
        if (remote.suppliers?.length) {
          const normalized = normalizeSuppliersFromApi(remote.suppliers, createInitialSupplierSettings).map(
            (supplier) =>
              remote.ebay
                ? {
                    ...supplier,
                    settings: {
                      ...supplier.settings,
                      lister: {
                        ...supplier.settings.lister,
                        paymentPolicyId:
                          remote.ebay.payment_policy_id ?? supplier.settings.lister.paymentPolicyId ?? "",
                        shippingPolicyId:
                          remote.ebay.fulfillment_policy_id ?? supplier.settings.lister.shippingPolicyId ?? "",
                        returnPolicyId:
                          remote.ebay.return_policy_id ?? supplier.settings.lister.returnPolicyId ?? "",
                      },
                    },
                  }
                : supplier,
          );
          setSuppliers(normalized);
          setActiveSupplierId((current) => current || normalized[0]?.id || "");
        }
        if (remote.lister) {
          setSuppliers((prev) =>
            prev.map((supplier) => ({
              ...supplier,
              settings: {
                ...supplier.settings,
                lister: {
                  ...supplier.settings.lister,
                  defaultQuantity: String(remote.lister.default_quantity ?? supplier.settings.lister.defaultQuantity),
                  itemCountry: mapStoredCountry(remote.lister.country),
                  zipcode: remote.lister.zipcode ?? supplier.settings.lister.zipcode,
                  city: remote.lister.city ?? supplier.settings.lister.city,
                  state: remote.lister.state ?? supplier.settings.lister.state ?? "",
                  shippingMethod: remote.lister.shipping_method ?? supplier.settings.lister.shippingMethod,
                  defaultTemplate: remote.lister.template ?? supplier.settings.lister.defaultTemplate,
                  blockedKeywords: remote.lister.blocked_keywords ?? remote.lister.blockedKeywords ?? supplier.settings.lister.blockedKeywords ?? "",
                },
              },
            })),
          );
        }
        if (remote.pricing) {
          setSuppliers((prev) =>
            prev.map((supplier) => ({
              ...supplier,
              settings: {
                ...supplier.settings,
                pricing: {
                  ...supplier.settings.pricing,
                  feesPercent: String(remote.pricing.fees_percent ?? supplier.settings.pricing.feesPercent),
                  fixedFeeAmount: String(remote.pricing.fixed_fees ?? supplier.settings.pricing.fixedFeeAmount),
                  additionalProfitPercent: String(
                    remote.pricing.profit_percent ?? supplier.settings.pricing.additionalProfitPercent,
                  ),
                  additionalProfitAmount: String(
                    remote.pricing.profit_amount ?? supplier.settings.pricing.additionalProfitAmount,
                  ),
                  minimumProfit: String(remote.pricing.minimum_profit ?? supplier.settings.pricing.minimumProfit),
                  dynamicProfit: remote.pricing.dynamic_profit ?? supplier.settings.pricing.dynamicProfit,
                  setPriceCentsValue: remote.pricing.round_price_cents ?? supplier.settings.pricing.setPriceCentsValue,
                  includeShippingPrice:
                    remote.pricing.include_shipping_price ?? supplier.settings.pricing.includeShippingPrice,
                  defaultAutomation:
                    remote.pricing.default_automation ?? supplier.settings.pricing.defaultAutomation,
                },
              },
            })),
          );
        }
        if (remote.orders) {
          setSuppliers((prev) =>
            prev.map((supplier) => ({
              ...supplier,
              settings: {
                ...supplier.settings,
                orders: {
                  ...supplier.settings.orders,
                  autoDeliver: remote.orders.auto_deliver ?? supplier.settings.orders.autoDeliver,
                  shippedStatus: remote.orders.shipped_status ?? supplier.settings.orders.shippedStatus,
                  maximumPurchasePrice: String(
                    remote.orders.maximum_purchase_price ?? supplier.settings.orders.maximumPurchasePrice,
                  ),
                  maximumLoss: String(
                    remote.orders.maximum_loss ?? supplier.settings.orders.maximumLoss,
                  ),
                  messages: Array.isArray(remote.orders.messages) && remote.orders.messages.length > 0
                    ? remote.orders.messages
                    : supplier.settings.orders.messages,
                },
              },
            })),
          );
        }
        if (remote.templates) {
          setTemplateCatalog({
            custom: remote.templates.custom ?? [],
            default_id: remote.templates.default_id ?? "",
          });
        }
      })
      .catch(() => {});

    getPaymentMethods().then((res) => setPaymentMethods(res.data?.payment_methods ?? [])).catch(() => {});
    getPaymentHistory().then((res) => setPaymentHistory(res.data?.data ?? [])).catch(() => {});
    getCurrentPlan().then((res) => setCurrentSubscription(res.data)).catch(() => {});
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
      loadBuyerAccounts();
      toast.success("AliExpress account connected successfully!");
    } else if (aliexpress === "error") {
      toast.error(`AliExpress connection failed: ${reason ?? "Unknown error"}`);
    }
  }, [search, dispatch]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === "OAUTH_CALLBACK" && event.data?.platform === "aliexpress") {
        setBuyerAccountConnecting(false);
        loadBuyerAccounts();
      }
    };
    const handleStorage = (event) => {
      if (event.key === "autods_oauth_result") {
        setBuyerAccountConnecting(false);
        loadBuyerAccounts();
      }
    };
    window.addEventListener("message", handleMessage);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const startEbayOAuthFlow = async (chosenSiteId = ebaySiteId) => {
    try {
      setEbayConnecting(true);
      markOAuthReturnOrigin();

      const res = await getEbayAuthUrl(chosenSiteId);
      const tab = openOAuthTab(res.data.url);
      oauthTabRef.current = tab;

      if (!tab) {
        setEbayConnecting(false);
        toast.error("Your browser blocked the new tab. Allow popups for this site and try again.");
        return;
      }

      toast.info(
        `${OAUTH_TAB_HINT} If eBay only shows “Authorization successfully completed”, copy that page’s URL and use the box below.`,
        { autoClose: 10000 },
      );

      watchOAuthTab(tab, () => {
        setEbayConnecting(false);
        setConnectEbayModalOpen(false);
        dispatch(fetchEbayStatus());
      });
    } catch (err) {
      setEbayConnecting(false);
      const details = err.response?.data?.details;
      const message = err.response?.data?.error ?? "Failed to start eBay authorization.";
      toast.error(details?.length ? `${message} ${details.join(" ")}` : message);
    }
  };

  const connectEbay = () => setConnectEbayModalOpen(true);

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
      await completeEbayOAuth({ callback_url: ebayPasteUrl.trim(), site_id: ebaySiteId });
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

  const syncNow = (connectionId) => dispatch(syncEbayListingsAction(connectionId));

  const loadBuyerAccounts = () => {
    setBuyerAccountsLoading(true);
    return getBuyerAccounts()
      .then((res) => setBuyerAccounts(res.data?.accounts ?? []))
      .catch(() => setBuyerAccounts([]))
      .finally(() => setBuyerAccountsLoading(false));
  };

  useEffect(() => {
    loadBuyerAccounts();
  }, []);

  const connectBuyerAccount = async () => {
    try {
      setBuyerAccountConnecting(true);
      markOAuthReturnOrigin();

      const res = await getBuyerAccountAuthUrl();
      const tab = openOAuthTab(res.data.url);

      if (!tab) {
        setBuyerAccountConnecting(false);
        toast.error("Your browser blocked the new tab. Allow popups for this site and try again.");
        return;
      }

      toast.info(OAUTH_TAB_HINT, { autoClose: 8000 });

      watchOAuthTab(tab, () => {
        setBuyerAccountConnecting(false);
        loadBuyerAccounts();
      });
    } catch (err) {
      setBuyerAccountConnecting(false);
      toast.error(err.response?.data?.error ?? "Failed to start AliExpress authorization.");
    }
  };

  const startEditBuyerAccountNickname = (account) => {
    setEditingBuyerAccountId(account.id);
    setBuyerAccountNicknameDraft(account.nickname ?? "");
  };

  const saveBuyerAccountNickname = async (account) => {
    setSavingBuyerAccountId(account.id);
    try {
      await updateBuyerAccount(account.id, { nickname: buyerAccountNicknameDraft.trim() || null });
      toast.success("Buyer account updated.");
      setEditingBuyerAccountId("");
      setBuyerAccountNicknameDraft("");
      loadBuyerAccounts();
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Could not update buyer account.");
    } finally {
      setSavingBuyerAccountId("");
    }
  };

  const toggleBuyerAccountMarketplace = async (account, siteId) => {
    const current = account.site_ids ?? [];
    const next = current.includes(siteId)
      ? current.filter((id) => id !== siteId)
      : [...current, siteId];

    setSavingBuyerAccountId(account.id);
    try {
      await updateBuyerAccount(account.id, { site_ids: next });
      loadBuyerAccounts();
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Could not update marketplaces.");
    } finally {
      setSavingBuyerAccountId("");
    }
  };

  const removeBuyerAccount = (id) => {
    if (!window.confirm("Disconnect this buyer account? Orders already processed through it keep their history.")) return;

    disconnectBuyerAccount(id)
      .then(() => {
        toast.success("Buyer account disconnected.");
        loadBuyerAccounts();
      })
      .catch((err) => toast.error(err.response?.data?.error ?? "Could not disconnect buyer account."));
  };

  const templateSelectOptions = useMemo(() => {
    const names = allTemplates(templateCatalog.custom).map((template) => template.name);
    return ["Select default template", ...names];
  }, [templateCatalog.custom]);

  const handleSwitchSupplier = (supplierId) => {
    if (supplierId === activeSupplierId || switchingSupplierId) {
      return;
    }

    setSwitchingSupplierId(supplierId);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setActiveSupplierId(supplierId);
        setSwitchingSupplierId("");
      });
    });
  };

  const renderSupplierSidebar = () => (
    <aside className="marketplace-settings__sidebar">
      <div className="marketplace-settings__sidebar-field">
        <div className="marketplace-settings__supplier-label">Supplier Profiles</div>
        <div className="marketplace-settings__supplier-panel">
          <div className="marketplace-settings__supplier-list">
            {suppliers.length ? (
              suppliers.map((supplier) => (
                <div
                  className={`marketplace-settings__supplier-item ${activeSupplierId === supplier.id ? "marketplace-settings__supplier-item--active" : ""}`}
                  key={supplier.id}
                >
                  <button
                    type="button"
                    className="marketplace-settings__supplier-main"
                    onClick={() => handleSwitchSupplier(supplier.id)}
                    disabled={Boolean(switchingSupplierId)}
                  >
                    {switchingSupplierId === supplier.id ? (
                      <LuLoader className="spin-icon marketplace-settings__supplier-badge" />
                    ) : (
                      <span className="marketplace-settings__supplier-badge">{supplier.badge}</span>
                    )}
                    <span>{supplier.label}</span>
                  </button>
                  <button type="button" className="marketplace-settings__supplier-menu" aria-label={`${supplier.label} options`}>
                    <LuChevronDown />
                  </button>
                </div>
              ))
            ) : (
              <p style={{ margin: 0, padding: "12px 14px", color: "#6b7280", fontSize: 13, lineHeight: 1.5 }}>
                No supplier profiles yet. Import a product from Add Product to auto-create one (e.g. Walmart US).
              </p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );

  const renderStoreSettingsTab = () => (
    <div className="marketplace-settings__store-settings card-wrapper">

      {/* ── eBay section ─────────────────────────────────────────────────────── */}
      <EbayOAuthSetupBanner onContinue={startEbayOAuthFlow} show={ebayConnections.length === 0} />
      {ebayConnections.length > 0 ? <ShipFromSetupNotice settings={accountSettings} /> : null}
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
                    Marketplace:&nbsp;
                    <span style={{ fontWeight: 600, color: "#111827" }}>
                      {EBAY_MARKETPLACES.find((option) => option.value === (conn.site_id ?? "EBAY_US"))?.label ?? (conn.site_id ?? "United States — ebay.com")}
                    </span>
                    &nbsp;·&nbsp;
                    Connected: {conn.connected_at ? new Date(conn.connected_at).toLocaleDateString() : "—"}
                    {conn.granted_scope_count ? (
                      <>&nbsp;·&nbsp;Scopes: {conn.granted_scope_count}</>
                    ) : null}
                  </p>
                  {conn.needs_reauthorization ? (
                    <p style={{ margin: "8px 0 0", fontSize: 12, color: "#b45309", fontWeight: 600 }}>
                      Missing permissions (orders/inventory). Disconnect and reconnect, or click Reconnect to grant all scopes.
                    </p>
                  ) : null}
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
                  {conn.needs_reauthorization ? (
                    <button
                      type="button"
                      className="marketplace-settings__ebay-btn marketplace-settings__ebay-btn--connect"
                      onClick={() => startEbayOAuthFlow(conn.site_id ?? "EBAY_US")}
                    >
                      <LuLink />
                      <span>Reconnect</span>
                    </button>
                  ) : null}
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
    </div>
  );

  const activeSupplier = suppliers.find((supplier) => supplier.id === activeSupplierId) || suppliers[0];
  const currentSettings = activeSupplier?.settings || createInitialSupplierSettings();
  const pricingSummary = buildPricingSummary(currentSettings.pricing);
  const editingMessage = currentSettings.orders.messages.find((message) => message.id === editingMessageId) || null;

  const resolveEbayConnectionForSupplier = (supplier) => {
    if (!ebayConnections.length) {
      return null;
    }

    if (!supplier) {
      return primaryEbayConnection;
    }

    const siteId = countryToEbaySiteId(supplier.country);

    return (
      ebayConnections.find((connection) => connection.site_id === siteId) ??
      primaryEbayConnection
    );
  };

  useEffect(() => {
    if (activePrimaryTab !== "Supplier Settings" || activeInnerTab !== "Lister") {
      return undefined;
    }

    const supplier = suppliers.find((row) => row.id === activeSupplierId) || suppliers[0];
    const connection = resolveEbayConnectionForSupplier(supplier);

    if (!connection?.id) {
      setEbayPolicyOptions({
        payment: [policyPlaceholderOption],
        shipping: [policyPlaceholderOption],
        return: [policyPlaceholderOption],
      });
      return undefined;
    }

    let cancelled = false;
    setEbayPoliciesLoading(true);

    getEbayPolicies(connection.id)
      .then((res) => {
        if (cancelled) {
          return;
        }

        const data = res.data ?? {};
        setEbayPolicyOptions({
          payment: mapPolicyOptions(data.payment_options),
          shipping: mapPolicyOptions(data.shipping_options),
          return: mapPolicyOptions(data.return_options),
        });
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }

        toast.error(err.response?.data?.error ?? "Failed to load eBay policies.");
        setEbayPolicyOptions({
          payment: [policyPlaceholderOption],
          shipping: [policyPlaceholderOption],
          return: [policyPlaceholderOption],
        });
      })
      .finally(() => {
        if (!cancelled) {
          setEbayPoliciesLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activePrimaryTab, activeInnerTab, activeSupplierId, suppliers, ebayConnections, primaryEbayConnection]);

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

  const handlePolicyChange = (labelField, idField, options, value) => {
    const selected = options.find((option) => option.value === value);

    patchSection("lister", {
      [idField]: value,
      [labelField]: selected?.label ?? "",
    });
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
      state: nextLocation.state ?? "",
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

  const saveMessageDraft = async () => {
    if (!editingMessageId) {
      return;
    }

    const updatedMessages = currentSettings.orders.messages.map((message) =>
      message.id === editingMessageId
        ? {
            ...message,
            message: messageDraft.trim() || message.message,
          }
        : message,
    );

    updateActiveSupplierSettings((settings) => ({
      ...settings,
      orders: {
        ...settings.orders,
        messages: updatedMessages,
      },
    }));

    const target = currentSettings.orders.messages.find((m) => m.id === editingMessageId);
    setEditingMessageId("");
    setMessageDraft("");

    try {
      await updateAccountSettings({
        orders: {
          auto_deliver: currentSettings.orders.autoDeliver,
          shipped_status: currentSettings.orders.shippedStatus,
          maximum_purchase_price: currentSettings.orders.maximumPurchasePrice,
          maximum_loss: currentSettings.orders.maximumLoss,
          messages: updatedMessages,
        },
      });
      toast.success(`"${target?.title || "Automatic message"}" template saved.`);
    } catch {
      // Local state is preserved
    }
  };

  const toggleMessageEnabled = async (messageId, value) => {
    const updatedMessages = currentSettings.orders.messages.map((message) =>
      message.id === messageId
        ? {
            ...message,
            enabled: value,
          }
        : message,
    );

    updateActiveSupplierSettings((settings) => ({
      ...settings,
      orders: {
        ...settings.orders,
        messages: updatedMessages,
      },
    }));

    const target = currentSettings.orders.messages.find((m) => m.id === messageId);

    try {
      await updateAccountSettings({
        orders: {
          auto_deliver: currentSettings.orders.autoDeliver,
          shipped_status: currentSettings.orders.shippedStatus,
          maximum_purchase_price: currentSettings.orders.maximumPurchasePrice,
          maximum_loss: currentSettings.orders.maximumLoss,
          messages: updatedMessages,
        },
      });
      toast.success(`"${target?.title || "Automatic message"}" ${value ? "enabled" : "disabled"}.`);
    } catch {
      // Local state is preserved
    }
  };

  const saveCurrentTab = async () => {
    if (!activeSupplier) {
      toast.warn("Add or import a supplier profile first.");
      return;
    }

    try {
      await updateAccountSettings({
        lister: {
          default_quantity: Number(currentSettings.lister.defaultQuantity) || 1,
          country: currentSettings.lister.itemCountry,
          city: currentSettings.lister.city,
          state: currentSettings.lister.state ?? "",
          zipcode: currentSettings.lister.zipcode,
          shipping_method: currentSettings.lister.shippingMethod,
          template: currentSettings.lister.defaultTemplate,
          blocked_keywords: currentSettings.lister.blockedKeywords ?? "",
        },
        pricing: {
          product_cost_percent: 0,
          fees_percent: parseNumericValue(currentSettings.pricing.feesPercent),
          fixed_fees: parseNumericValue(currentSettings.pricing.fixedFeeAmount),
          profit_percent: parseNumericValue(currentSettings.pricing.additionalProfitPercent),
          profit_amount: parseNumericValue(currentSettings.pricing.additionalProfitAmount),
          minimum_profit: parseNumericValue(currentSettings.pricing.minimumProfit),
          dynamic_profit: Boolean(currentSettings.pricing.dynamicProfit),
          round_price_cents: Boolean(currentSettings.pricing.setPriceCentsValue),
          include_shipping_price: Boolean(currentSettings.pricing.includeShippingPrice),
          default_automation: currentSettings.pricing.defaultAutomation,
        },
        orders: {
          auto_deliver: currentSettings.orders.autoDeliver,
          shipped_status: currentSettings.orders.shippedStatus,
          maximum_purchase_price: currentSettings.orders.maximumPurchasePrice,
          maximum_loss: currentSettings.orders.maximumLoss,
          messages: currentSettings.orders.messages,
        },
        general: {
          weight_unit: currentSettings.general.defaultWeightUnit,
          min_product_quantity: Number(currentSettings.general.minimumProductQuantity) || 1,
          max_shipping_days: Number(currentSettings.general.maximumShippingDays) || 30,
        },
        ebay: {
          payment_policy_id: currentSettings.lister.paymentPolicyId || null,
          fulfillment_policy_id: currentSettings.lister.shippingPolicyId || null,
          return_policy_id: currentSettings.lister.returnPolicyId || null,
        },
        suppliers,
      });
      setSaveNotice(`${activeInnerTab} settings saved for ${activeSupplier.label}.`);
      setAccountSettings((prev) => ({
        ...(prev ?? {}),
        ebay: {
          payment_policy_id: currentSettings.lister.paymentPolicyId || null,
          fulfillment_policy_id: currentSettings.lister.shippingPolicyId || null,
          return_policy_id: currentSettings.lister.returnPolicyId || null,
        },
        lister: {
          default_quantity: Number(currentSettings.lister.defaultQuantity) || 1,
          country: currentSettings.lister.itemCountry,
          city: currentSettings.lister.city,
          state: currentSettings.lister.state ?? "",
          zipcode: currentSettings.lister.zipcode,
          shipping_method: currentSettings.lister.shippingMethod,
          template: currentSettings.lister.defaultTemplate,
        },
        pricing: {
          product_cost_percent: 0,
          fees_percent: parseNumericValue(currentSettings.pricing.feesPercent),
          fixed_fees: parseNumericValue(currentSettings.pricing.fixedFeeAmount),
          profit_percent: parseNumericValue(currentSettings.pricing.additionalProfitPercent),
          profit_amount: parseNumericValue(currentSettings.pricing.additionalProfitAmount),
          minimum_profit: parseNumericValue(currentSettings.pricing.minimumProfit),
          dynamic_profit: Boolean(currentSettings.pricing.dynamicProfit),
          round_price_cents: Boolean(currentSettings.pricing.setPriceCentsValue),
          include_shipping_price: Boolean(currentSettings.pricing.includeShippingPrice),
          default_automation: currentSettings.pricing.defaultAutomation,
        },
      }));
      toast.success("Settings saved.");
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to save settings.");
    }
  };

  const addStripePaymentMethod = async () => {
    try {
      setAddingPayment(true);
      await createStripeSetupIntent();
      const paymentMethodId = window.prompt(
        "Enter Stripe payment method ID from SetupIntent (use Stripe.js in production):",
      );
      if (!paymentMethodId) return;
      await saveStripePaymentMethod(paymentMethodId);
      const methods = await getPaymentMethods();
      setPaymentMethods(methods.data?.payment_methods ?? []);
      setShowAddPayment(false);
      toast.success("Card saved.");
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to add card.");
    } finally {
      setAddingPayment(false);
    }
  };

  const addPayPalPaymentMethod = async () => {
    if (!paypalEmail.trim()) {
      toast.warn("Enter your PayPal email.");
      return;
    }
    try {
      setAddingPayment(true);
      await savePayPalPaymentMethod(paypalEmail.trim());
      const methods = await getPaymentMethods();
      setPaymentMethods(methods.data?.payment_methods ?? []);
      setPaypalEmail("");
      setShowAddPayment(false);
      toast.success("PayPal account saved.");
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to save PayPal.");
    } finally {
      setAddingPayment(false);
    }
  };

  const removePaymentMethod = async (id) => {
    try {
      await deletePaymentMethod(id);
      setPaymentMethods((cur) => cur.filter((m) => m.id !== id));
      toast.success("Payment method removed.");
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to remove payment method.");
    }
  };


  const renderListerTab = () => (
    <div className="marketplace-settings__tab-panel">
      {ebayConnections.length > 0 ? (
        <ShipFromSetupNotice
          settings={{
            lister: {
              country: currentSettings.lister.itemCountry,
              city: currentSettings.lister.city,
              state: currentSettings.lister.state,
              zipcode: currentSettings.lister.zipcode,
            },
          }}
        />
      ) : null}
      <section className="marketplace-settings__section">
        <h3 className="marketplace-settings__section-title">Lister Settings</h3>
        <p style={{ margin: "0 0 12px", color: "#6b7280", fontSize: 13 }}>
          Ship-from address is saved per your account and sent to eBay when publishing (country must match your eBay marketplace, e.g. US zip for ebay.com).
        </p>
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

          <SettingsField label="Ship-from City" required help>
            <SettingsInput
              value={currentSettings.lister.city}
              onChange={(event) => patchSection("lister", { city: event.target.value })}
              placeholder="e.g. New York"
            />
          </SettingsField>

          <SettingsField label="Ship-from State / Province" help>
            <SettingsInput
              value={currentSettings.lister.state ?? ""}
              onChange={(event) => patchSection("lister", { state: event.target.value })}
              placeholder={currentSettings.lister.itemCountry === "US" ? "e.g. NY" : "Optional"}
            />
          </SettingsField>

          <SettingsField label="Ship-from Zip / Postcode" required help>
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
              options={templateSelectOptions}
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
              value={currentSettings.lister.paymentPolicyId ?? ""}
              options={ebayPolicyOptions.payment}
              disabled={ebayPoliciesLoading || !ebayConnections.length}
              onChange={(event) =>
                handlePolicyChange(
                  "paymentPolicy",
                  "paymentPolicyId",
                  ebayPolicyOptions.payment,
                  event.target.value,
                )
              }
            />
          </SettingsField>

          <SettingsField label="Shipping Policy" help>
            <SettingsSelect
              value={currentSettings.lister.shippingPolicyId ?? ""}
              options={ebayPolicyOptions.shipping}
              disabled={ebayPoliciesLoading || !ebayConnections.length}
              onChange={(event) =>
                handlePolicyChange(
                  "shippingPolicy",
                  "shippingPolicyId",
                  ebayPolicyOptions.shipping,
                  event.target.value,
                )
              }
            />
          </SettingsField>

          <SettingsField label="Return Policy" help>
            <SettingsSelect
              value={currentSettings.lister.returnPolicyId ?? ""}
              options={ebayPolicyOptions.return}
              disabled={ebayPoliciesLoading || !ebayConnections.length}
              onChange={(event) =>
                handlePolicyChange(
                  "returnPolicy",
                  "returnPolicyId",
                  ebayPolicyOptions.return,
                  event.target.value,
                )
              }
            />
          </SettingsField>
        </div>

        {!ebayConnections.length ? (
          <p className="marketplace-settings__policy-note">
            Connect your eBay account in Store Settings to load payment, shipping, and return policies.
          </p>
        ) : ebayPoliciesLoading ? (
          <p className="marketplace-settings__policy-note">Loading policies from eBay…</p>
        ) : null}
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
        <h3 className="marketplace-settings__section-title">Blocked Keywords Settings</h3>
        <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 10px" }}>
          Listings containing any of these keywords in the title or description will be blocked from being listed on eBay.
        </p>
        <SettingsField label="Blocked Keywords (comma-separated or one per line)">
          <textarea
            className="marketplace-settings__control"
            rows={3}
            style={{ width: "100%", padding: 10, fontSize: 13, borderRadius: 6, border: "1px solid #cbd5e1", resize: "vertical" }}
            placeholder="e.g. counterfeit, replica, fake, vero_brand, rolex"
            value={currentSettings.lister.blockedKeywords ?? ""}
            onChange={(event) => patchSection("lister", { blockedKeywords: event.target.value })}
          />
        </SettingsField>
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
                <strong>+ $ Fee</strong>
                <span>{formatAud(pricingSummary.fixedFee)}</span>
              </div>
              <div>
                <strong>= Total Price</strong>
                <span>{formatAud(pricingSummary.totalPrice)}</span>
              </div>
            </div>
          </div>

          <div className="marketplace-settings__pricing-example">
            <span>{currentSettings.pricing.productCost ? formatAud(pricingSummary.productCost) : "e.g: $100"}</span>
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

          <SettingsField label="$ Fee Amount">
            <SettingsInput
              value={currentSettings.pricing.fixedFeeAmount}
              onChange={(event) => patchSection("pricing", { fixedFeeAmount: event.target.value })}
              placeholder="$0"
            />
          </SettingsField>

          <SettingsField label="Additional Profit in %">
            <SettingsInput
              value={currentSettings.pricing.additionalProfitPercent}
              onChange={(event) => patchSection("pricing", { additionalProfitPercent: event.target.value })}
              placeholder="0%"
            />
          </SettingsField>

          <SettingsField label="Additional Profit in $">
            <SettingsInput
              value={currentSettings.pricing.additionalProfitAmount}
              onChange={(event) => patchSection("pricing", { additionalProfitAmount: event.target.value })}
              placeholder="$0"
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
              placeholder="$0"
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

  const formatAddOnStartDate = () =>
    new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  const openAddOnTerms = (addOn) => {
    setAddOnTermsTarget(addOn);
  };

  const confirmEnableAddOn = () => {
    if (!addOnTermsTarget) {
      return;
    }

    setAddOns((current) =>
      current.map((addOn) =>
        addOn.id === addOnTermsTarget.id
          ? { ...addOn, active: true, actionLabel: "Cancel", tag: "Active", startedOn: `Started ${formatAddOnStartDate()}` }
          : addOn,
      ),
    );
    toast.success(`${addOnTermsTarget.title} enabled.`);
    setAddOnTermsTarget(null);
  };

  const handleCancelAddOn = (addOn) => {
    setAddOns((current) =>
      current.map((item) =>
        item.id === addOn.id
          ? { ...item, active: false, actionLabel: "Enable", tag: undefined, startedOn: undefined }
          : item,
      ),
    );
    toast.info(`${addOn.title} canceled.`);
  };

  const renderBuyerAccountsTab = () => (
    <div className="marketplace-settings__store-settings card-wrapper">
      <div className="marketplace-settings__store-settings-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h3 style={{ margin: 0 }}>Buyer Accounts</h3>
            <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
              Connect your own AliExpress account(s) to use as the "Buyer" processing method in Order Processing — orders are billed directly by AliExpress to that account instead of your AutoDS processing wallet. Tag each account with the eBay marketplace(s) it should handle — an order automatically uses the buyer account tagged for its own marketplace. An untagged account is used as a fallback for any marketplace with no dedicated account.
            </p>
          </div>
          <button
            type="button"
            className="marketplace-settings__ebay-btn marketplace-settings__ebay-btn--connect"
            onClick={connectBuyerAccount}
            disabled={buyerAccountConnecting}
            style={{ flexShrink: 0 }}
          >
            {buyerAccountConnecting ? <LuLoader className="spin-icon" /> : <LuLink />}
            <span>{buyerAccountConnecting ? "Opening AliExpress…" : "Connect Buyer Account"}</span>
          </button>
        </div>
      </div>

      {buyerAccountsLoading ? (
        <div className="marketplace-settings__ebay-status marketplace-settings__ebay-status--loading" style={{ padding: "16px 0" }}>
          <LuLoader className="spin-icon" />
          <span>Checking connected accounts…</span>
        </div>
      ) : buyerAccounts.length === 0 ? (
        <div style={{ padding: "20px 0" }}>
          <div className="marketplace-settings__ebay-status marketplace-settings__ebay-status--disconnected">
            <LuUnplug />
            <span>No buyer accounts connected. Click <em>Connect Buyer Account</em> to link your AliExpress login.</span>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
          {buyerAccounts.map((account) => (
            <div
              key={account.id}
              className="marketplace-settings__ebay-card"
              style={{ background: account.is_primary ? "#f0fdf4" : undefined, border: account.is_primary ? "1px solid #bbf7d0" : undefined }}
            >
              <div className="marketplace-settings__ebay-info">
                <div className="marketplace-settings__ebay-status marketplace-settings__ebay-status--connected">
                  <LuBadgeCheck />
                  {editingBuyerAccountId === account.id ? (
                    <input
                      className="marketplace-settings__control"
                      style={{ maxWidth: 220 }}
                      value={buyerAccountNicknameDraft}
                      onChange={(e) => setBuyerAccountNicknameDraft(e.target.value)}
                      placeholder={account.ae_user_nick ?? "Nickname"}
                      autoFocus
                    />
                  ) : (
                    <span>
                      <strong>{account.nickname || account.ae_user_nick || "AliExpress Account"}</strong>
                      {account.is_primary && (
                        <span style={{ marginLeft: 8, fontSize: 11, background: "#065f46", color: "#fff", borderRadius: 4, padding: "1px 6px", fontWeight: 600 }}>
                          DEFAULT
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <p className="marketplace-settings__ebay-sub">
                  {account.ae_user_nick ? `AliExpress: ${account.ae_user_nick}` : "AliExpress account"}
                  &nbsp;·&nbsp;
                  Connected: {account.connected_at ? new Date(account.connected_at).toLocaleDateString() : "—"}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>Marketplaces:</span>
                  {EBAY_MARKETPLACES.map((option) => {
                    const tagged = (account.site_ids ?? []).includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleBuyerAccountMarketplace(account, option.value)}
                        disabled={savingBuyerAccountId === account.id}
                        title={option.label}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          borderRadius: 999,
                          padding: "2px 9px",
                          border: tagged ? "1px solid #065f46" : "1px solid #e5e7eb",
                          background: tagged ? "#065f46" : "#f9fafb",
                          color: tagged ? "#fff" : "#6b7280",
                          cursor: savingBuyerAccountId === account.id ? "wait" : "pointer",
                        }}
                      >
                        {option.value.replace("EBAY_", "")}
                      </button>
                    );
                  })}
                  {(account.site_ids ?? []).length === 0 ? (
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>(any marketplace — used as fallback)</span>
                  ) : null}
                </div>
              </div>

              <div className="marketplace-settings__ebay-actions">
                {editingBuyerAccountId === account.id ? (
                  <>
                    <button
                      type="button"
                      className="marketplace-settings__ebay-btn marketplace-settings__ebay-btn--connect"
                      onClick={() => saveBuyerAccountNickname(account)}
                      disabled={savingBuyerAccountId === account.id}
                    >
                      {savingBuyerAccountId === account.id ? <LuLoader className="spin-icon" /> : "Save"}
                    </button>
                    <button
                      type="button"
                      className="marketplace-settings__ebay-btn"
                      style={{ background: "#f3f4f6", color: "#374151" }}
                      onClick={() => setEditingBuyerAccountId("")}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="marketplace-settings__ebay-btn"
                    style={{ background: "#f3f4f6", color: "#374151" }}
                    onClick={() => startEditBuyerAccountNickname(account)}
                  >
                    <LuPencil />
                    <span>Rename</span>
                  </button>
                )}
                <button
                  type="button"
                  className="marketplace-settings__ebay-btn marketplace-settings__ebay-btn--disconnect"
                  onClick={() => removeBuyerAccount(account.id)}
                >
                  <LuTrash2 />
                  <span>Disconnect</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderPlansAddOnsTab = () => {
    const ebayConnected = ebayConnections.length > 0;
    const plan = currentSubscription?.current_plan;
    const usage = currentSubscription?.usage ?? {};
    const planExpires = currentSubscription?.plan_expires_at || currentSubscription?.subscription?.current_period_end;

    const listingsLimit = plan?.limits?.listings ?? plan?.listings_limit ?? 50;
    const listingsUsed = usage.listings_count ?? 0;
    const listingsPct = listingsLimit > 0 ? Math.min(100, Math.round((listingsUsed / listingsLimit) * 100)) : 0;

    const ordersLimit = plan?.limits?.orders ?? plan?.orders_limit ?? 100;
    const ordersUsed = usage.orders_count ?? 0;
    const ordersPct = ordersLimit > 0 ? Math.min(100, Math.round((ordersUsed / ordersLimit) * 100)) : 0;

    const storesLimit = plan?.limits?.stores ?? plan?.stores_limit ?? 1;
    const storesUsed = usage.connections_count ?? (ebayConnections.length > 0 ? ebayConnections.length : 0);
    const storesPct = storesLimit > 0 ? Math.min(100, Math.round((storesUsed / storesLimit) * 100)) : 0;

    const aiCredits = user?.ai_credits ?? 0;

    return (
      <section className="plans-settings card-wrapper" style={{ padding: "24px" }}>
        {/* Hero / Subscription Overview */}
        <header
          className="plans-settings__hero"
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            borderRadius: "14px",
            padding: "24px 28px",
            color: "#ffffff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  background: "rgba(59, 130, 246, 0.2)",
                  color: "#60a5fa",
                  padding: "3px 10px",
                  borderRadius: "999px",
                  fontSize: "11px",
                  fontWeight: 700,
                  border: "1px solid rgba(96, 165, 250, 0.3)",
                }}
              >
                <LuCrown /> ACTIVE PLAN
              </span>
              {planExpires && (
                <span style={{ fontSize: "12px", color: "#94a3b8", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <LuClock /> Renews {formatBillingDate(planExpires)}
                </span>
              )}
            </div>
            <h2 style={{ fontSize: "24px", fontWeight: 800, margin: "0 0 4px 0", color: "#f8fafc" }}>
              {plan?.title ?? plan?.name ?? "Starter Plan"}
            </h2>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px", maxWidth: "560px" }}>
              Manage your plan limits, connected marketplace channels, AI generation credits, and automation power-ups.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setAiCreditsModalOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(168, 85, 247, 0.15)",
                color: "#d8b4fe",
                border: "1px solid rgba(168, 85, 247, 0.35)",
                borderRadius: "8px",
                padding: "10px 16px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <LuSparkles />
              <span>Buy AI Credits ({aiCredits.toLocaleString()})</span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/plans")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "10px 18px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
              }}
            >
              <LuArrowUpRight />
              <span>Upgrade Plan</span>
            </button>
          </div>
        </header>

        {/* Live Usage & Quotas Dashboard */}
        <div style={{ marginTop: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0, color: "#1e293b" }}>
                Plan Usage &amp; Quotas
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                Real-time usage for your current subscription cycle.
              </p>
            </div>
            <button
              type="button"
              className="plans-settings__link-btn"
              onClick={() => navigate("/plans")}
              style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}
            >
              Compare all plans <LuArrowUpRight />
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
            {/* Products / Listings Quota */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#475569", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <LuPackage style={{ color: "#3b82f6" }} /> Products / Listings
                </span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: listingsPct > 90 ? "#ef4444" : "#1e293b" }}>
                  {listingsUsed} / {listingsLimit}
                </span>
              </div>
              <div style={{ width: "100%", height: "6px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ width: `${listingsPct}%`, height: "100%", background: listingsPct > 90 ? "#ef4444" : "#3b82f6", borderRadius: "999px" }} />
              </div>
              <span style={{ fontSize: "11px", color: "#64748b", marginTop: "6px", display: "block" }}>
                {listingsLimit - listingsUsed > 0 ? `${listingsLimit - listingsUsed} listings available` : "Quota reached"}
              </span>
            </div>

            {/* Auto-Orders Quota */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#475569", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <LuShoppingCart style={{ color: "#10b981" }} /> Auto-Orders
                </span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: ordersPct > 90 ? "#ef4444" : "#1e293b" }}>
                  {ordersUsed} / {ordersLimit}
                </span>
              </div>
              <div style={{ width: "100%", height: "6px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ width: `${ordersPct}%`, height: "100%", background: ordersPct > 90 ? "#ef4444" : "#10b981", borderRadius: "999px" }} />
              </div>
              <span style={{ fontSize: "11px", color: "#64748b", marginTop: "6px", display: "block" }}>
                {ordersLimit - ordersUsed > 0 ? `${ordersLimit - ordersUsed} orders available` : "Quota reached"}
              </span>
            </div>

            {/* Connected Stores Quota */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#475569", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <LuStore style={{ color: "#f59e0b" }} /> Stores / Channels
                </span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>
                  {storesUsed} / {storesLimit}
                </span>
              </div>
              <div style={{ width: "100%", height: "6px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ width: `${storesPct}%`, height: "100%", background: "#f59e0b", borderRadius: "999px" }} />
              </div>
              <span style={{ fontSize: "11px", color: "#64748b", marginTop: "6px", display: "block" }}>
                {ebayConnected ? `${ebayConnections.length} eBay store linked` : "Connect an eBay store"}
              </span>
            </div>

            {/* AI Credits Balance Card */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#475569", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <LuSparkles style={{ color: "#8b5cf6" }} /> AI Studio Credits
                </span>
                <button
                  type="button"
                  onClick={() => setAiCreditsModalOpen(true)}
                  style={{
                    background: "#f3e8ff",
                    color: "#7e22ce",
                    border: "none",
                    borderRadius: "4px",
                    padding: "2px 8px",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  + Buy
                </button>
              </div>
              <div style={{ marginTop: "8px" }}>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "#1e293b" }}>
                  {aiCredits.toLocaleString()} <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748b" }}>Credits</span>
                </div>
                <span style={{ fontSize: "11px", color: "#64748b" }}>
                  Ready for AI photo &amp; vision generation
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Channels & Add-ons Grid */}
        <div style={{ marginTop: "24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
          {/* eBay Active Integration Card */}
          <article className="plans-settings__integration plans-settings__integration--connected" style={{ padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#ffffff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <PlanPlatformLogo logo="ebay" name="eBay" />
                <div>
                  <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>eBay Store Integration</h4>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    {ebayConnected
                      ? (primaryEbayConnection?.ebay_username ? `@${primaryEbayConnection.ebay_username} (${primaryEbayConnection.site_id ?? "eBay US"})` : `${ebayConnections.length} accounts linked`)
                      : "Direct API Integration"}
                  </span>
                </div>
              </div>
              <span className={`plans-settings__status ${ebayConnected ? "plans-settings__status--connected" : "plans-settings__status--idle"}`}>
                {ebayConnected ? "Connected" : "Not connected"}
              </span>
            </div>

            <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 14px 0", lineHeight: "1.5" }}>
              Sync active listings, automate price &amp; stock monitoring, and push tracking numbers directly to eBay buyers.
            </p>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
              <button
                type="button"
                className="plans-settings__ghost-btn"
                onClick={() => setActivePrimaryTab("Store Settings")}
              >
                Manage in Store Settings
              </button>
              <button
                type="button"
                className={ebayConnected ? "plans-settings__btn plans-settings__btn--secondary" : "plans-settings__btn plans-settings__btn--primary"}
                onClick={connectEbay}
                disabled={ebayConnecting}
              >
                {ebayConnecting ? "Opening eBay…" : ebayConnected ? "Add Another Account" : "Connect eBay"}
              </button>
            </div>
          </article>

          {/* AI Credits Power-Up Card */}
          <article style={{ padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#ffffff", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span className="plans-settings__addon-icon plans-settings__addon-icon--violet">
                    <LuSparkles />
                  </span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>AI Studio Credits</h4>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>Powered by OpenAI Image &amp; Vision</span>
                  </div>
                </div>
                <span className="plans-settings__addon-tag plans-settings__addon-tag--active">
                  Active
                </span>
              </div>

              <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 12px 0", lineHeight: "1.5" }}>
                Generate studio-grade product photos, lifestyle images, and ad creatives. Your current balance is <strong>{aiCredits.toLocaleString()} Credits</strong>.
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
              <button
                type="button"
                className="plans-settings__inline-link"
                onClick={() => navigate("/ai-video-generation")}
              >
                Open AI Studio
              </button>
              <button
                type="button"
                className="plans-settings__btn plans-settings__btn--primary"
                onClick={() => setAiCreditsModalOpen(true)}
              >
                <LuSparkles />
                <span>Buy AI Credits</span>
              </button>
            </div>
          </article>
        </div>

        {/* Summarized Upcoming Marketplaces & Add-ons (Coming Soon) */}
        <div style={{ marginTop: "24px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div>
              <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>
                Upcoming Marketplace Channels &amp; Power-ups
              </h4>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                Multi-channel expansion and additional research tools are in active development.
              </p>
            </div>
            <span style={{ background: "#ede9fe", color: "#6d28d9", fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "999px" }}>
              Coming Soon
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "10px" }}>
            {[
              { name: "Shopify", logo: "shop", note: "Direct store sync & automation" },
              { name: "Amazon", logo: "a", note: "FBA & merchant listing sync" },
              { name: "Facebook", logo: "f", note: "Marketplace listings & messages" },
              { name: "Wix", logo: "wix", note: "One-click product import" },
              { name: "WooCommerce", logo: "woo", note: "WordPress store automation" },
              { name: "Product Finding Hub", logo: "hub", note: "Best-seller research & analytics" },
            ].map((item) => (
              <div
                key={item.name}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                  <PlanPlatformLogo logo={item.logo} name={item.name} />
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ fontSize: "12px", color: "#1e293b", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.name}
                    </strong>
                    <span style={{ fontSize: "10px", color: "#64748b", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.note}
                    </span>
                  </div>
                </div>
                <span
                  style={{
                    background: "#f1f5f9",
                    color: "#64748b",
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: "4px",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  Soon
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade Callout Banner */}
        <article
          style={{
            marginTop: "20px",
            background: "linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)",
            border: "1px solid #bfdbfe",
            borderRadius: "12px",
            padding: "18px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#dbeafe", color: "#2563eb", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
              <LuCrown />
            </span>
            <div>
              <strong style={{ fontSize: "14px", color: "#1e293b", display: "block" }}>Ready to scale your store?</strong>
              <span style={{ fontSize: "12px", color: "#64748b" }}>Unlock higher listing limits, faster price/stock sync intervals, and multi-store automation.</span>
            </div>
          </div>
          <button
            type="button"
            className="plans-settings__btn plans-settings__btn--primary"
            onClick={() => navigate("/plans")}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <span>Browse All Plans</span>
            <LuArrowUpRight />
          </button>
        </article>

        <ConfirmModal
          open={Boolean(addOnTermsTarget)}
          title={`Enable ${addOnTermsTarget?.title ?? "add-on"}?`}
          description={addOnTermsTarget?.copy}
          confirmLabel="Agree & Enable"
          danger={false}
          requireAgreement
          agreementLabel={
            <>
              I agree to the{" "}
              <a href="/terms-and-conditions" target="_blank" rel="noopener noreferrer">
                Terms &amp; Conditions
              </a>{" "}
              for this add-on.
            </>
          }
          onConfirm={confirmEnableAddOn}
          onClose={() => setAddOnTermsTarget(null)}
        />

        <BuyAiCreditsModal
          open={aiCreditsModalOpen}
          onClose={() => setAiCreditsModalOpen(false)}
        />
      </section>
    );
  };

  const [profileName, setProfileName] = useState(user?.name ?? "");
  const [profileEmail, setProfileEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    if (user?.name) setProfileName(user.name);
    if (user?.email) setProfileEmail(user.email);
  }, [user?.name, user?.email]);

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

  const renderAccountBillingTab = () => {
    const activePlan = currentSubscription?.current_plan;
    const planExpires = currentSubscription?.plan_expires_at;
    const defaultMethod = paymentMethods.find((m) => m.is_default) ?? paymentMethods[0];
    const totalSpent = paymentHistory.reduce(
      (sum, tx) => sum + (tx.status === "completed" || !tx.status ? Number(tx.amount) : 0),
      0,
    );
    const userInitials = getUserInitials(profileName || user?.name, profileEmail || user?.email);
    const hasPasswordChange = Boolean(newPassword || confirmPassword || currentPassword);

    return (
      <section className="billing-settings card-wrapper">
        <header className="billing-settings__hero">
          <div className="billing-settings__hero-copy">
            <h2>Account &amp; Billing</h2>
            <p>Manage your profile, subscription, payment methods, and billing history in one place.</p>
          </div>
          <div className="billing-settings__hero-profile">
            <span className="billing-settings__avatar" aria-hidden="true">{userInitials}</span>
            <div>
              <strong>{profileName || user?.name || "Your Account"}</strong>
              <span>{profileEmail || user?.email || "—"}</span>
            </div>
          </div>
        </header>

        <div className="billing-settings__stats">
          <article className="billing-settings__stat">
            <span className="billing-settings__stat-icon billing-settings__stat-icon--plan"><LuCrown /></span>
            <div>
              <span className="billing-settings__stat-label">Current Plan</span>
              <strong>{activePlan?.title ?? "Free"}</strong>
            </div>
          </article>
          <article className="billing-settings__stat">
            <span className="billing-settings__stat-icon billing-settings__stat-icon--renewal"><LuCalendar /></span>
            <div>
              <span className="billing-settings__stat-label">Renewal</span>
              <strong>{planExpires ? formatBillingDate(planExpires) : activePlan ? "Active" : "—"}</strong>
            </div>
          </article>
          <article className="billing-settings__stat">
            <span className="billing-settings__stat-icon billing-settings__stat-icon--wallet"><LuWallet /></span>
            <div>
              <span className="billing-settings__stat-label">Payment Methods</span>
              <strong>{paymentMethods.length ? `${paymentMethods.length} saved` : "None"}</strong>
            </div>
          </article>
          <article className="billing-settings__stat">
            <span className="billing-settings__stat-icon billing-settings__stat-icon--spent"><LuReceipt /></span>
            <div>
              <span className="billing-settings__stat-label">Total Spent</span>
              <strong>${totalSpent.toFixed(2)}</strong>
            </div>
          </article>
        </div>

        <div className="billing-settings__layout">
          <div className="billing-settings__main">
            <article className="billing-settings__card">
              <div className="billing-settings__card-head">
                <div className="billing-settings__card-title">
                  <span className="billing-settings__card-icon"><LuUser /></span>
                  <div>
                    <h3>Profile Information</h3>
                    <p>Update your name and email address used across Auto DS.</p>
                  </div>
                </div>
              </div>
              <div className="billing-settings__fields billing-settings__fields--2">
                <label className="billing-settings__field">
                  <span>Full Name</span>
                  <input
                    className="marketplace-settings__control"
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Your name"
                  />
                </label>
                <label className="billing-settings__field">
                  <span>Email Address</span>
                  <input
                    className="marketplace-settings__control"
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </label>
              </div>
              {!hasPasswordChange ? (
                <div className="billing-settings__card-foot">
                  <button
                    type="button"
                    className="billing-settings__btn billing-settings__btn--primary"
                    onClick={saveProfile}
                    disabled={profileSaving}
                  >
                    {profileSaving ? <LuLoader className="spin-icon" /> : <LuCheck />}
                    <span>{profileSaving ? "Saving…" : "Save Profile"}</span>
                  </button>
                </div>
              ) : null}
            </article>

            <article className="billing-settings__card">
              <div className="billing-settings__card-head">
                <div className="billing-settings__card-title">
                  <span className="billing-settings__card-icon billing-settings__card-icon--security"><LuShield /></span>
                  <div>
                    <h3>Security</h3>
                    <p>Change your password to keep your account secure.</p>
                  </div>
                </div>
              </div>
              <div className="billing-settings__fields billing-settings__fields--2">
                <label className="billing-settings__field billing-settings__field--full">
                  <span>Current Password</span>
                  <input
                    className="marketplace-settings__control"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                  />
                </label>
                <label className="billing-settings__field">
                  <span>New Password</span>
                  <input
                    className="marketplace-settings__control"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                  />
                </label>
                <label className="billing-settings__field">
                  <span>Confirm New Password</span>
                  <input
                    className="marketplace-settings__control"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                  />
                </label>
              </div>
              {newPassword && newPassword.length < 8 ? (
                <p className="billing-settings__hint billing-settings__hint--warn">Password must be at least 8 characters.</p>
              ) : null}
              {newPassword && confirmPassword && newPassword !== confirmPassword ? (
                <p className="billing-settings__hint billing-settings__hint--warn">Passwords do not match.</p>
              ) : null}
              <div className="billing-settings__card-foot">
                <button
                  type="button"
                  className="billing-settings__btn billing-settings__btn--primary"
                  onClick={saveProfile}
                  disabled={profileSaving}
                >
                  {profileSaving ? <LuLoader className="spin-icon" /> : <LuShield />}
                  <span>{profileSaving ? "Saving…" : "Update Security"}</span>
                </button>
              </div>
            </article>
          </div>

          <aside className="billing-settings__sidebar">
            <article className={`billing-settings__plan-card ${activePlan ? "billing-settings__plan-card--active" : ""}`}>
              <div className="billing-settings__plan-card-top">
                <span className="billing-settings__plan-badge">{activePlan ? "Active Plan" : "No Plan"}</span>
                <LuCrown />
              </div>
              <h3>{activePlan?.title ?? "Start with a plan"}</h3>
              <p>
                {activePlan?.description
                  ?? "Unlock bulk imports, automated pricing, order sync, and more with a subscription."}
              </p>
              {activePlan ? (
                <ul className="billing-settings__plan-meta">
                  {activePlan.price != null ? (
                    <li>
                      <span>Price</span>
                      <strong>${Number(activePlan.price).toFixed(2)} {activePlan.currency ?? "USD"}</strong>
                    </li>
                  ) : null}
                  {planExpires ? (
                    <li>
                      <span>Renews</span>
                      <strong>{formatBillingDate(planExpires)}</strong>
                    </li>
                  ) : null}
                  {defaultMethod ? (
                    <li>
                      <span>Billing via</span>
                      <strong>{formatCardBrand(defaultMethod.brand ?? defaultMethod.provider)}</strong>
                    </li>
                  ) : null}
                </ul>
              ) : null}
              <div className="billing-settings__plan-actions">
                <button type="button" className="billing-settings__btn billing-settings__btn--primary" onClick={() => navigate("/plans")}>
                  <span>{activePlan ? "Upgrade Plan" : "View Plans"}</span>
                  <LuArrowUpRight />
                </button>
              </div>
            </article>

            <article className="billing-settings__card">
              <div className="billing-settings__card-head billing-settings__card-head--split">
                <div className="billing-settings__card-title">
                  <span className="billing-settings__card-icon billing-settings__card-icon--payment"><LuCreditCard /></span>
                  <div>
                    <h3>Payment Methods</h3>
                    <p>Cards and PayPal accounts used for subscriptions.</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="billing-settings__btn billing-settings__btn--ghost"
                  onClick={() => setShowAddPayment((cur) => !cur)}
                >
                  <LuPlus />
                  <span>{showAddPayment ? "Close" : "Add"}</span>
                </button>
              </div>

              <div className="billing-settings__methods">
                {paymentMethods.length ? (
                  paymentMethods.map((method) => (
                    <div
                      className={`billing-settings__method ${method.is_default ? "billing-settings__method--default" : ""}`}
                      key={method.id}
                    >
                      <div className="billing-settings__method-icon">
                        {method.provider === "paypal" ? "PP" : formatCardBrand(method.brand).slice(0, 2).toUpperCase()}
                      </div>
                      <div className="billing-settings__method-copy">
                        <strong>
                          {method.provider === "paypal"
                            ? "PayPal"
                            : `${formatCardBrand(method.brand)}${method.last4 ? ` •••• ${method.last4}` : ""}`}
                        </strong>
                        <span>
                          {method.provider === "paypal"
                            ? method.provider_method_id
                            : method.exp_month && method.exp_year
                              ? `Expires ${String(method.exp_month).padStart(2, "0")}/${String(method.exp_year).slice(-2)}`
                              : formatCardBrand(method.provider)}
                        </span>
                      </div>
                      <div className="billing-settings__method-actions">
                        {method.is_default ? <span className="billing-settings__pill">Default</span> : null}
                        <button
                          type="button"
                          className="billing-settings__icon-btn"
                          onClick={() => removePaymentMethod(method.id)}
                          aria-label="Remove payment method"
                        >
                          <LuTrash2 />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="billing-settings__empty billing-settings__empty--compact">
                    <LuCreditCard />
                    <strong>No payment method on file</strong>
                    <span>Add a card or PayPal account to purchase plans.</span>
                  </div>
                )}
              </div>

              {showAddPayment ? (
                <div className="billing-settings__add-panel">
                  <button
                    type="button"
                    className="billing-settings__add-option"
                    onClick={addStripePaymentMethod}
                    disabled={addingPayment}
                  >
                    <span className="billing-settings__add-option-icon"><LuCreditCard /></span>
                    <div>
                      <strong>Credit or Debit Card</strong>
                      <span>Secure checkout via Stripe</span>
                    </div>
                    {addingPayment ? <LuLoader className="spin-icon" /> : <LuArrowUpRight />}
                  </button>
                  <div className="billing-settings__add-paypal">
                    <label className="billing-settings__field">
                      <span>PayPal Email</span>
                      <div className="billing-settings__inline-input">
                        <LuMail />
                        <input
                          className="marketplace-settings__control"
                          type="email"
                          placeholder="you@paypal.com"
                          value={paypalEmail}
                          onChange={(e) => setPaypalEmail(e.target.value)}
                        />
                      </div>
                    </label>
                    <button
                      type="button"
                      className="billing-settings__btn billing-settings__btn--secondary"
                      onClick={addPayPalPaymentMethod}
                      disabled={addingPayment || !paypalEmail.trim()}
                    >
                      {addingPayment ? <LuLoader className="spin-icon" /> : null}
                      <span>{addingPayment ? "Saving…" : "Link PayPal"}</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </article>
          </aside>
        </div>

        <article className="billing-settings__card billing-settings__card--wide">
          <div className="billing-settings__card-head billing-settings__card-head--split">
            <div className="billing-settings__card-title">
              <span className="billing-settings__card-icon billing-settings__card-icon--history"><LuReceipt /></span>
              <div>
                <h3>Payment History</h3>
                <p>Recent charges and subscription payments.</p>
              </div>
            </div>
            {paymentHistory.length ? (
              <span className="billing-settings__pill billing-settings__pill--muted">{paymentHistory.length} transaction{paymentHistory.length === 1 ? "" : "s"}</span>
            ) : null}
          </div>

          {paymentHistory.length ? (
            <div className="billing-settings__history">
              <div className="billing-settings__history-head">
                <span>Date</span>
                <span>Description</span>
                <span>Provider</span>
                <span>Status</span>
                <span>Amount</span>
              </div>
              {paymentHistory.map((tx) => (
                <div className="billing-settings__history-row" key={tx.id}>
                  <span data-label="Date">{formatBillingDateTime(tx.created_at)}</span>
                  <span data-label="Description">
                    <strong>{tx.plan?.title ?? "Plan purchase"}</strong>
                    <small>{tx.provider_payment_id ?? `#${tx.id}`}</small>
                  </span>
                  <span data-label="Provider" className="billing-settings__provider">{tx.provider ?? "—"}</span>
                  <span data-label="Status">
                    <span className={`billing-settings__status billing-settings__status--${(tx.status ?? "completed").toLowerCase()}`}>
                      {tx.status ?? "completed"}
                    </span>
                  </span>
                  <span data-label="Amount" className="billing-settings__amount">
                    ${Number(tx.amount).toFixed(2)} {tx.currency ?? "USD"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="billing-settings__empty">
              <LuReceipt />
              <strong>No payments yet</strong>
              <span>Your subscription charges and plan purchases will appear here.</span>
              <button type="button" className="billing-settings__btn billing-settings__btn--secondary" onClick={() => navigate("/plans")}>
                Browse Plans
              </button>
            </div>
          )}
        </article>
      </section>
    );
  };

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
        <div className="marketplace-settings__workspace">
          {renderSupplierSidebar()}
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
      ) : activePrimaryTab === "Templates" ? (
        <SettingsTemplatesPanel
          initialCustomTemplates={templateCatalog.custom}
          initialDefaultId={templateCatalog.default_id}
          onTemplatesChange={setTemplateCatalog}
        />
      ) : activePrimaryTab === "Store Settings" ? (
        renderStoreSettingsTab()
      ) : activePrimaryTab === "Buyer Accounts" ? (
        renderBuyerAccountsTab()
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

            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "12px" }}>
              {[
                { label: "Buyer First Name", tag: "{{ buyer_first_name }}" },
                { label: "Buyer Name", tag: "{{ buyer_name }}" },
                { label: "Carrier", tag: "{{ shipping_carrier }}" },
                { label: "Tracking #", tag: "{{ tracking_number }}" },
                { label: "Item Title", tag: "{{ item_title }}" },
                { label: "Order ID", tag: "{{ order_id }}" },
              ].map((v) => (
                <button
                  type="button"
                  key={v.tag}
                  style={{
                    background: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    borderRadius: "4px",
                    padding: "3px 8px",
                    fontSize: "11px",
                    cursor: "pointer",
                    color: "#0f172a",
                    fontWeight: 600,
                  }}
                  onClick={() => setMessageDraft((prev) => `${prev} ${v.tag}`.trim())}
                  title={`Click to insert ${v.tag}`}
                >
                  + {v.label}
                </button>
              ))}
            </div>

            <textarea
              className="marketplace-settings__textarea"
              rows="6"
              value={messageDraft}
              onChange={(event) => setMessageDraft(event.target.value)}
              placeholder="Enter message template..."
            />

            <div
              style={{
                marginTop: "12px",
                padding: "10px 12px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                fontSize: "12px",
                color: "#334155",
                lineHeight: "1.5",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#64748b", marginBottom: "4px" }}>
                Preview (Sample Data)
              </div>
              <div style={{ whiteSpace: "pre-wrap" }}>
                {messageDraft
                  ? messageDraft
                      .replaceAll("{{ buyer_first_name }}", "John")
                      .replaceAll("{{buyer_first_name}}", "John")
                      .replaceAll("{{ buyer_name }}", "John Doe")
                      .replaceAll("{{buyer_name}}", "John Doe")
                      .replaceAll("{{ shipping_carrier }}", "USPS")
                      .replaceAll("{{shipping_carrier}}", "USPS")
                      .replaceAll("{{ tracking_number }}", "9400111899562537621124")
                      .replaceAll("{{tracking_number}}", "9400111899562537621124")
                      .replaceAll("{{ item_title }}", "Wireless Bluetooth Noise-Cancelling Earbuds")
                      .replaceAll("{{item_title}}", "Wireless Bluetooth Noise-Cancelling Earbuds")
                      .replaceAll("{{ order_id }}", "14-09823-74521")
                      .replaceAll("{{order_id}}", "14-09823-74521")
                  : "Message preview will appear here..."}
              </div>
            </div>

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

      <ConnectEbayModal
        open={connectEbayModalOpen}
        onClose={() => setConnectEbayModalOpen(false)}
        onConnect={() => startEbayOAuthFlow(ebaySiteId)}
        connecting={ebayConnecting}
        siteId={ebaySiteId}
        onSiteChange={setEbaySiteId}
      />
    </section>
  );
}
