import { useEffect, useState } from "react";
import {
  LuChevronDown,
  LuCopy,
  LuEllipsisVertical,
  LuMapPin,
  LuPencil,
  LuPlus,
  LuRefreshCcw,
  LuX,
} from "react-icons/lu";

const settingsPrimaryTabs = [
  "Supplier Settings",
  "Automations",
  "Templates",
  "Keywords",
  "Plans & Add-ons",
  "Account & Billing",
  "Users",
  "Buyer Accounts",
  "Notifications",
  "Store Settings",
];

const settingsInnerTabs = ["Lister", "Pricing", "Orders", "General"];

const storeOptions = [
  "nrf-enterprise_inc-llc-au",
  "sheikh002-au",
  "storefront-global-us",
];

const plansOverviewCards = [
  {
    id: "ebay-plan",
    name: "eBay",
    logo: "ebay",
    current: true,
    summary: "Master 10K | $345.90/mo",
    metrics: [
      { label: "Started On:", value: "April 15, 2026" },
      { label: "Variations:", value: "14777/10000" },
      { label: "Stores:", value: "2/500" },
    ],
    secondaryAction: "Cancel",
    primaryAction: "Upgrade Plan",
  },
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
    copy: "AutoDS automates your product listings, prices, customer orders, price/stock monitoring, and more, so you can invest your growing your Amazon business.",
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
    copy: "AutoDS automates your product listings, product editing, image optimization, customer orders, pricing, and stock monitoring from 25+ global suppliers.",
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

const accountBillingHistory = [
  {
    date: "Apr 15, 2026",
    id: "A-171242-8736",
    type: "eBay Plan",
    amount: "$0.00",
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
  const [activePrimaryTab, setActivePrimaryTab] = useState("Supplier Settings");
  const [activeInnerTab, setActiveInnerTab] = useState("Lister");
  const [selectedStore, setSelectedStore] = useState(storeOptions[0]);
  const [suppliers, setSuppliers] = useState(createInitialSuppliers);
  const [activeSupplierId, setActiveSupplierId] = useState(supplierTemplates[0].id);
  const [itemSpecificDraft, setItemSpecificDraft] = useState({ name: "", description: "" });
  const [editAllItemSpecifics, setEditAllItemSpecifics] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState("");
  const [messageDraft, setMessageDraft] = useState("");
  const [inactiveSubscriptionModalOpen, setInactiveSubscriptionModalOpen] = useState(false);
  const [saveNotice, setSaveNotice] = useState("");

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

  useEffect(() => {
    if (activePrimaryTab === "Account & Billing") {
      setInactiveSubscriptionModalOpen(true);
      return;
    }

    setInactiveSubscriptionModalOpen(false);
  }, [activePrimaryTab]);

  useEffect(() => {
    if (!inactiveSubscriptionModalOpen) {
      return undefined;
    }

    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyTouchAction = body.style.touchAction;
    const previousHtmlOverflow = documentElement.style.overflow;
    const previousHtmlTouchAction = documentElement.style.touchAction;

    body.style.overflow = "hidden";
    body.style.touchAction = "none";
    documentElement.style.overflow = "hidden";
    documentElement.style.touchAction = "none";

    return () => {
      body.style.overflow = previousBodyOverflow;
      body.style.touchAction = previousBodyTouchAction;
      documentElement.style.overflow = previousHtmlOverflow;
      documentElement.style.touchAction = previousHtmlTouchAction;
    };
  }, [inactiveSubscriptionModalOpen]);

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

  const addSupplier = () => {
    const nextTemplate = supplierTemplates.find(
      (template) => !suppliers.some((supplier) => supplier.id === template.id),
    );

    const fallbackIndex = suppliers.length + 1;
    const newSupplier = nextTemplate
      ? createSupplier(nextTemplate)
      : createSupplier({
          id: `custom-supplier-${fallbackIndex}`,
          label: `Supplier ${fallbackIndex}`,
          badge: "new",
        });

    setSuppliers((currentSuppliers) => [...currentSuppliers, newSupplier]);
    setActiveSupplierId(newSupplier.id);
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

  const openPlansAndAddOns = () => {
    setInactiveSubscriptionModalOpen(false);
    setActivePrimaryTab("Plans & Add-ons");
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

  const renderPlansAddOnsTab = () => (
    <section className="marketplace-settings__full-panel card-wrapper">
      <div className="marketplace-settings__plans-layout">
        <div className="marketplace-settings__plans-main">
          <div className="marketplace-settings__plans-heading">My Plans</div>
          <div className="marketplace-settings__plans-grid">
            {plansOverviewCards.map((plan) => (
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
                    <button type="button" className="marketplace-settings__plan-link">
                      {plan.secondaryAction}
                    </button>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    className={plan.current ? "marketplace-settings__plan-btn marketplace-settings__plan-btn--outline" : "marketplace-settings__plan-btn"}
                  >
                    {plan.primaryAction}
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

  const renderAccountBillingTab = () => (
    <section className="marketplace-settings__full-panel marketplace-settings__billing-page card-wrapper">
      <div className="marketplace-settings__billing-section">
        <h3>Account Details</h3>
        <div className="marketplace-settings__billing-inline">
          <span>roselime9900@gmail.com</span>
          <button type="button">Manage Email</button>
          <button type="button">Change Password</button>
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
          <button type="button">See All</button>
        </div>
        <div className="marketplace-settings__billing-history">
          <div className="marketplace-settings__billing-history-head">
            <span>Date</span>
            <span>ID</span>
            <span>Type</span>
            <span>Total</span>
          </div>
          {accountBillingHistory.map((item) => (
            <div className="marketplace-settings__billing-history-row" key={item.id}>
              <span>{item.date}</span>
              <span>{item.id}</span>
              <span>{item.type}</span>
              <strong>{item.amount}</strong>
            </div>
          ))}
        </div>
      </div>

      {inactiveSubscriptionModalOpen ? (
        <div className="marketplace-settings__plan-modal-layer" role="dialog" aria-modal="true" aria-label="Inactive subscription">
          <button
            type="button"
            className="marketplace-settings__modal-backdrop"
            aria-label="Close inactive subscription"
            onClick={() => setInactiveSubscriptionModalOpen(false)}
          />

          <section className="marketplace-settings__plan-modal">
            <button
              type="button"
              className="marketplace-settings__modal-close"
              aria-label="Close"
              onClick={() => setInactiveSubscriptionModalOpen(false)}
            >
              <LuX />
            </button>

            <div className="marketplace-settings__plan-illustration" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>

            <h3>Your store activities are temporarily inactive with limited access</h3>
            <p>
              Your account is currently inactive, which affects your subscriptions. To regain access to your subscription plans,
              <strong> reactivate your account.</strong>
            </p>

            <div className="marketplace-settings__plan-modal-list">
              <div className="marketplace-settings__plan-modal-row">
                <div className="marketplace-settings__plan-modal-main">
                  <span className="marketplace-settings__plan-modal-badge">ebay</span>
                  <strong>eBay Plan</strong>
                  <em>Failed Payment</em>
                </div>
                <span className="marketplace-settings__plan-modal-price">$345.9/mo</span>
                <button type="button" className="marketplace-settings__plan-link">
                  Cancel
                </button>
              </div>
            </div>

            <div className="marketplace-settings__plan-modal-subtitle">Your add-ons:</div>

            <div className="marketplace-settings__plan-modal-list">
              <div className="marketplace-settings__plan-modal-row marketplace-settings__plan-modal-row--addon">
                <div className="marketplace-settings__plan-modal-main">
                  <span className="marketplace-settings__plan-modal-addon-icon">+</span>
                  <div>
                    <strong>Orders Processor</strong>
                    <span>Automate your orders and tracking updates</span>
                  </div>
                </div>
                <span className="marketplace-settings__plan-modal-price">$9.9/mo</span>
                <button type="button" className="marketplace-settings__plan-link">
                  Cancel
                </button>
              </div>
            </div>

            <div className="marketplace-settings__plan-modal-actions">
              <button type="button" className="marketplace-settings__plan-modal-link" onClick={openPlansAndAddOns}>
                Select another plan
              </button>
              <button type="button" className="marketplace-settings__modal-btn marketplace-settings__modal-btn--primary">
                Reactivate Account
              </button>
            </div>
          </section>
        </div>
      ) : null}
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
        <div className="marketplace-settings__workspace">
          <aside className="marketplace-settings__sidebar">
            <SettingsField label="Select Store" className="marketplace-settings__sidebar-field">
              <SettingsSelect
                value={selectedStore}
                options={storeOptions}
                onChange={(event) => setSelectedStore(event.target.value)}
              />
            </SettingsField>

            <div className="marketplace-settings__supplier-panel">
              <div className="marketplace-settings__supplier-label">Supplier</div>

              <div className="marketplace-settings__supplier-list">
                {suppliers.map((supplier) => (
                  <div
                    className={`marketplace-settings__supplier-item ${activeSupplierId === supplier.id ? "marketplace-settings__supplier-item--active" : ""}`}
                    key={supplier.id}
                  >
                    <button
                      type="button"
                      className="marketplace-settings__supplier-main"
                      onClick={() => setActiveSupplierId(supplier.id)}
                    >
                      <span className="marketplace-settings__supplier-badge">{supplier.badge}</span>
                      <span>{supplier.label}</span>
                    </button>

                    <button type="button" className="marketplace-settings__supplier-menu" aria-label={`More options for ${supplier.label}`}>
                      <LuEllipsisVertical />
                    </button>
                  </div>
                ))}
              </div>

              <button type="button" className="marketplace-settings__add-supplier" onClick={addSupplier}>
                <LuPlus />
                <span>Add Supplier</span>
              </button>
            </div>
          </aside>

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
