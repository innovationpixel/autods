export const PLAN_FEATURE_DEFINITIONS = [
  {
    key: "price_stock_monitor",
    title: "Price and Stock Monitor",
    description: "Stay updated automatically with price and stock changes from your suppliers.",
  },
  {
    key: "product_research_tool",
    title: "Product Research Tool",
    description: "Discover your next bestsellers in seconds. AutoDS scans global suppliers for their best-performing products.",
  },
  {
    key: "draft_manager",
    title: "Draft Manager",
    description: "View & edit your products before you import them to your store.",
  },
  {
    key: "order_manager",
    title: "Order Manager",
    description: "View & edit your store's orders in one place.",
  },
  {
    key: "store_integration_1",
    title: "1 store integration",
    description: "Link one store and start importing products in a click.",
  },
  {
    key: "product_variation_support",
    title: "Product Variation Support",
    description: "List all colors/sizes and any other product features with a click of a button.",
  },
  {
    key: "full_products_management",
    title: "Full Products Management System",
    description: "Use our smart filters and bulk change system to optimize your products.",
  },
  {
    key: "full_insights_dashboard",
    title: "Full Insights Dashboard",
    description: "Get insights from all your stores with one smart dashboard.",
  },
  {
    key: "manual_non_api_supported",
    title: "Manual (Non-API) Supported",
    description: "You can add an automated store without an API connection to eBay.",
  },
  {
    key: "automated_orders_supported",
    title: "Automated Orders Supported",
    description: "Link your buyer accounts and AutoDS will process all your orders automatically.",
  },
  {
    key: "fulfilled_by_autods",
    title: "Fulfilled by AutoDS Service Supported",
    description: "Save the headache of managing supplier buyer accounts. Load balance into AutoDS and we will fulfill your orders using our buyer accounts.",
  },
  {
    key: "auto_tracking_updates",
    title: "Automatic Tracking Updates Supported",
    description: "Your supplier got a tracking number for your order? Great! We'll update it automatically.",
  },
  {
    key: "support_24_7",
    title: "24/7 Support",
    description: "Get access to 24/7 ticket support.",
  },
  {
    key: "full_business_overview_dashboard",
    title: "Full Business Overview Dashboard",
    description: "Get insights from your entire business on one screen.",
  },
  {
    key: "all_supported_suppliers",
    title: "All Supported Suppliers",
    description: "AutoDS supports over 25 US, EU, UK, IT, AU, CN & worldwide suppliers.",
  },
  {
    key: "extension_one_click_drafts",
    title: "Extension: 'One-Click Drafts' Creator",
    description: "Use our Chrome extension to import any product from over 20 supported suppliers.",
  },
  {
    key: "bulk_products_importing",
    title: "Bulk Products Importing",
    description: "Use our 'bulk importer' to import multiple products with a click of a button.",
  },
  {
    key: "autods_academy",
    title: "AutoDS Academy",
    description: "Countless free expert tutorials and courses about all things dropshipping.",
  },
  {
    key: "ai_smart_edit",
    title: "AI SmartEdit",
    description: "AI ReWrite will effortlessly enhance and optimize your product titles and descriptions.",
  },
  {
    key: "scheduled_uploads",
    title: "Scheduled Uploads",
    description: "Schedule your listings to be uploaded to your store at a specific time.",
  },
  {
    key: "sourcing_product_agent_service",
    title: "Sourcing Product Agent Service",
    description: "Get expert assistance in finding top-quality products at unbeatable deals. Our agents work directly with suppliers to ensure quality and faster shipping times.",
  },
  {
    key: "unlimited_stores_integration",
    title: "Unlimited stores integration",
    description: "Link an unlimited number of stores and start automating your key dropshipping processes.",
  },
  {
    key: "autods_finder",
    title: "AutoDS Finder",
    description: "AutoDS scans 40,000+ dropshipping stores every day and saves their best products to our database.",
  },
  {
    key: "recurring_uploads",
    title: "Recurring Uploads",
    description: "AutoDS will upload a pre-defined amount of products to your store everyday, automatically.",
  },
  {
    key: "automatic_price_optimization",
    title: "Automatic Price Optimization",
    description: "Found a hot product? AutoDS will raise the price automatically according to your settings.",
  },
  {
    key: "custom_branding",
    title: "Custom Branding",
    description: "Build your brand by adding your logo to all orders from our suppliers.",
  },
  {
    key: "multiple_suppliers_products_builder",
    title: "Multiple suppliers products builder",
    description: "Build products of multiple variations from different suppliers.",
  },
  {
    key: "customer_support_management",
    title: "Customer Support Management",
    description: "Manage the entire customer support for all your stores directly from AutoDS.",
  },
  {
    key: "cases_returns_management",
    title: "Cases & Returns Management",
    description: "Manage the cases and returns from all your stores directly from AutoDS.",
  },
  {
    key: "automatic_messages_to_buyers",
    title: "Automatic messages to the buyers",
    description: "AutoDS sends automatic messages to your buyers to update them about their order status.",
  },
  {
    key: "vip_live_chat_support",
    title: "VIP Live Chat Support Available",
    description: "Use our priority support to grow your business faster!",
  },
  {
    key: "vip_tickets_support",
    title: "VIP Tickets Support",
    description: "Use our priority support to grow your business faster!",
  },
  {
    key: "multiple_store_management",
    title: "Multiple Store Management",
    description: "Manage multiple stores seamlessly in AutoDS.",
  },
];

export const ADDON_FEATURE_DEFINITIONS = [
  {
    key: "trending_products",
    title: "Trending Products",
    description: "Unlock curated daily trending product feeds without separate add-on billing.",
    isAddon: true,
  },
  {
    key: "hand_picked_products",
    title: "Hand-Picked Products",
    description: "Unlock vetted high-margin hand-picked winning products vault.",
    isAddon: true,
  },
];

export const ALL_FEATURE_DEFINITIONS = [
  ...PLAN_FEATURE_DEFINITIONS,
  ...ADDON_FEATURE_DEFINITIONS,
];

export const PRODUCT_LIMIT_PRESETS = [200, 400, 800, 1000, 2500, 5000];
export const QUOTA_INCREASE_PRESETS = [100, 250, 500, 1000, 5000];

export function buildPlanInclusions(productsLimit, features = {}, customInclusions = []) {
  const result = [];
  const limit = Number(productsLimit) || 0;
  if (limit > 0) {
    result.push(`${limit.toLocaleString()} Products`);
  }

  ALL_FEATURE_DEFINITIONS.forEach((item) => {
    if (features && features[item.key]) {
      result.push(item.title);
    }
  });

  (customInclusions || []).forEach((c) => {
    const trimmed = (c || "").trim();
    if (trimmed && !result.includes(trimmed)) {
      result.push(trimmed);
    }
  });

  return result;
}

export function parseFeaturesAndExtras(plan) {
  const features = { ...(plan?.features || {}) };
  const inclusions = Array.isArray(plan?.inclusions) ? plan.inclusions : [];
  const customInclusions = [];
  let extractedLimit = plan?.products_limit ? Number(plan.products_limit) : null;

  const titleToKey = new Map();
  ALL_FEATURE_DEFINITIONS.forEach((item) => {
    titleToKey.set(item.title.toLowerCase().trim(), item.key);
  });

  inclusions.forEach((raw) => {
    const item = (raw || "").trim();
    if (!item) return;

    // Check if it represents products limit e.g. "200 Products", "1,000 Products"
    const match = item.match(/^([\d,]+)\s+products$/i);
    if (match) {
      const parsedNum = parseInt(match[1].replace(/,/g, ""), 10);
      if (!isNaN(parsedNum) && !extractedLimit) {
        extractedLimit = parsedNum;
      }
      return;
    }

    const matchedKey = titleToKey.get(item.toLowerCase());
    if (matchedKey) {
      if (features[matchedKey] === undefined) {
        features[matchedKey] = true;
      }
    } else {
      customInclusions.push(item);
    }
  });

  return {
    products_limit: extractedLimit ?? 200,
    features,
    customInclusions,
  };
}

export function resolvePlanThemeVariant(plan, index = 0, isFeatured = false) {
  const title = (plan?.title || "").toLowerCase();

  if (plan?.is_custom) {
    return { key: "rose", tierLabel: "CUSTOM" };
  }
  if (/trial/.test(title)) {
    return { key: "emerald", tierLabel: "TRIAL" };
  }
  if (/starter|basic/.test(title)) {
    return { key: "blue", tierLabel: "STARTER" };
  }
  if (isFeatured || /\bpro\b|professional|growth/.test(title)) {
    return { key: "purple", tierLabel: "PROFESSIONAL" };
  }
  if (/enterprise|scale|unlimited|agency|business|vip/.test(title)) {
    return { key: "orange", tierLabel: "ENTERPRISE" };
  }

  const palette = [
    { key: "emerald", tierLabel: "PLAN" },
    { key: "blue", tierLabel: "STARTER" },
    { key: "purple", tierLabel: "PRO" },
    { key: "orange", tierLabel: "SCALE" },
    { key: "rose", tierLabel: "CUSTOM" },
  ];
  return palette[index % palette.length];
}

export function resolveFeatureRowVisual(keyOrText = "") {
  const value = String(keyOrText).toLowerCase();

  if (value.includes("trending")) return "trending";
  if (value.includes("hand_picked") || value.includes("hand-picked")) return "hand_picked";
  if (value.includes("research") || value.includes("finder")) return "research";
  if (value.includes("ai_") || value.includes("smartedit") || value.includes("ai ") || value.includes("content")) return "ai";
  if (value.includes("schedule") || value.includes("recurring")) return "schedule";
  if (value.includes("price") || value.includes("stock") || value.includes("monitor")) return "monitor";
  if (value.includes("order") || value.includes("tracking") || value.includes("fulfilled")) return "orders";
  if (value.includes("bulk") || value.includes("extension") || value.includes("sheet") || value.includes("draft")) return "sheets";
  if (value.includes("return") || value.includes("case") || value.includes("refund")) return "returns";
  if (value.includes("store")) return "stores";
  if (value.includes("team") || value.includes("customer_support") || value.includes("buyer") || value.includes("branding")) return "team";
  if (value.includes("vip") || value.includes("support") || value.includes("chat") || value.includes("ticket")) return "support";
  if (value.includes("import") || value.includes("supplier") || value.includes("product")) return "import";

  return "default";
}

export function buildPlanCardRows(plan) {
  const parsed = parseFeaturesAndExtras(plan);
  const featuresMap = parsed.features || {};
  const productsLimit =
    plan?.products_limit !== null && plan?.products_limit !== undefined
      ? Number(plan.products_limit)
      : parsed.products_limit ?? 200;

  const rows = [
    {
      id: "quota-products",
      visualType: "import",
      label: "Import Products (All Platforms)",
      valueText: `${Number(productsLimit || 0).toLocaleString()} Listings`,
      isChecked: false,
    },
  ];

  if (plan?.orders_limit !== null && plan?.orders_limit !== undefined) {
    rows.push({
      id: "quota-orders",
      visualType: "orders",
      label: "Auto-Orders Capacity",
      valueText: `${Number(plan.orders_limit).toLocaleString()} Orders`,
      isChecked: false,
    });
  }

  const skippedFeatureKeys = new Set([
    "store_integration_1",
    "unlimited_stores_integration",
    "support_24_7",
    "vip_live_chat_support",
    "vip_tickets_support",
  ]);

  ALL_FEATURE_DEFINITIONS.forEach((def) => {
    if (skippedFeatureKeys.has(def.key)) return;
    if (featuresMap[def.key]) {
      rows.push({
        id: `feat-${def.key}`,
        visualType: resolveFeatureRowVisual(def.key),
        label: def.title,
        isChecked: true,
        isAddon: Boolean(def.isAddon),
      });
    }
  });

  // Extract explicit stores count from custom inclusion if stores_limit isn't set
  let extractedStoresLabel = null;
  if (plan?.stores_limit !== null && plan?.stores_limit !== undefined) {
    const num = Number(plan.stores_limit);
    extractedStoresLabel = num >= 999 ? "Unlimited" : `${num} ${num === 1 ? "store" : "stores"}`;
  } else if (featuresMap.unlimited_stores_integration) {
    extractedStoresLabel = "Unlimited";
  } else if (featuresMap.store_integration_1) {
    extractedStoresLabel = "1 store";
  }

  const remainingCustom = [];
  (parsed.customInclusions || []).forEach((raw) => {
    const line = String(raw || "").trim();
    if (!line) return;

    const storeMatch = line.match(/^(\d+|unlimited)\s+(?:ebay\s+)?stores?$/i);
    if (storeMatch) {
      if (!extractedStoresLabel) {
        extractedStoresLabel = line;
      }
      return;
    }

    if (/^(basic|priority|vip|live chat)\s+support$/i.test(line)) {
      return;
    }

    remainingCustom.push(line);
  });

  remainingCustom.forEach((line, idx) => {
    rows.push({
      id: `custom-${idx}`,
      visualType: resolveFeatureRowVisual(line),
      label: line,
      isChecked: true,
    });
  });

  if (extractedStoresLabel) {
    rows.push({
      id: "quota-stores",
      visualType: "stores",
      label: "eBay Stores",
      valueText: extractedStoresLabel,
      isChecked: false,
    });
  }

  let supportLabel = null;
  if (featuresMap.vip_live_chat_support || featuresMap.vip_tickets_support) {
    supportLabel = "VIP Support";
  } else if (featuresMap.support_24_7) {
    supportLabel = "Live Chat";
  } else {
    const matchedSupport = (parsed.customInclusions || []).find((line) =>
      /support/i.test(String(line || ""))
    );
    if (matchedSupport) {
      supportLabel = matchedSupport;
    }
  }

  if (supportLabel) {
    rows.push({
      id: "meta-support",
      visualType: "support",
      label: "24/7 Customer Support",
      valueText: supportLabel,
      isChecked: false,
    });
  }

  return rows;
}


