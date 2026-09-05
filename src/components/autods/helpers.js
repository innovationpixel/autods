import { categoryFilters } from "./constants";

export function buildItem(item) {
  return {
    shipsTo: "United States",
    currency: "USD",
    shippingTag: "Best Sellers",
    gallery: item.gallery?.length ? item.gallery : [item.image],
    ...item,
  };
}

export function parsePriceValue(price) {
  const match = String(price).match(/(\d+(\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

/**
 * Deterministic per-day integer — same value all day (UTC calendar date) for
 * every visitor, then changes the next day. Used to pick which page/category
 * "Best Sellers" and "New Arrivals" pull from, so the marketplace's daily picks
 * rotate like AliExpress's own homepage does without needing a cron job.
 */
export function getDailySeed(salt = "") {
  const day = new Date().toISOString().slice(0, 10);
  const str = day + salt;
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function mapAliItemToCard(item, extra = {}) {
  return {
    id: item.id,
    vendor: item.seller || null,
    shopUrl: item.shop_url || null,
    title: item.title,
    price: `$${Number(item.price ?? 0).toFixed(2)}`,
    shipping:
      item.sold_count > 0
        ? `${Number(item.sold_count).toLocaleString()} sold`
        : "Ships internationally",
    shippingDays: 10,
    image_url: item.image_url,
    images: item.images,
    shippingTag: "AliExpress",
    listingUrl: item.listing_url,
    marketplace: "aliexpress",
    ...extra,
  };
}

const categoryLabels = categoryFilters
  .filter((category) => category.key !== "all")
  .map((category) => category.label);

export function getSectionCategory(section) {
  if (categoryLabels.includes(section.title)) {
    return section.title;
  }

  const categories = new Set(section.items.map((item) => item.category).filter(Boolean));

  if (categories.size === 1) {
    return [...categories][0];
  }

  return "All Categories";
}

export function formatDisplayDate(value) {
  if (!value) {
    return "—";
  }

  const raw = String(value).trim();
  const date = raw.includes("T") || raw.includes(" ")
    ? new Date(raw.replace(" ", "T"))
    : new Date(`${raw}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDisplayDateTime(value) {
  if (!value) {
    return "—";
  }

  const raw = String(value).trim();
  const date = raw.includes("T") || raw.includes(" ")
    ? new Date(raw.replace(" ", "T"))
    : new Date(`${raw}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function normalizeImageUrl(url) {
  if (!url || typeof url !== "string") {
    return null;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed.replace(/^\/+/, "")}`;
  }

  if (/^http:\/\/[^/]*alicdn\.com/i.test(trimmed)) {
    return trimmed.replace(/^http:/i, "https:");
  }

  return trimmed;
}

export function getListingImageUrl(item) {
  if (!item) {
    return null;
  }

  const candidates = [
    item.resolved_image_url,
    item.image_url,
    item.images?.[0]?.url,
    typeof item.images?.[0] === "string" ? item.images[0] : null,
    item.raw_source_data?.image_url,
    item.raw_source_data?.images?.[0],
  ];

  for (const candidate of candidates) {
    const url = normalizeImageUrl(typeof candidate === "object" ? candidate?.url : candidate);
    if (url) {
      return url;
    }
  }

  for (const sku of item.raw_source_data?.skus ?? []) {
    for (const prop of sku.properties ?? []) {
      const url = normalizeImageUrl(prop.image);
      if (url) {
        return url;
      }
    }
  }

  return null;
}

export function getMarketplaceProductImages(item) {
  if (!item) {
    return [];
  }

  const urls = [];
  const seen = new Set();

  const push = (candidate) => {
    const url = normalizeImageUrl(typeof candidate === "object" ? candidate?.url : candidate);
    if (url && !seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
  };

  if (Array.isArray(item.gallery)) {
    item.gallery.forEach(push);
  }

  if (Array.isArray(item.images)) {
    item.images.forEach(push);
  }

  push(item.image);
  push(item.image_url);

  const listingUrl = getListingImageUrl(item);
  if (listingUrl) {
    push(listingUrl);
  }

  return urls;
}

export function formatCalculationAmount(value) {
  return `$${Number(value).toFixed(2)}`;
}

export function formatCalculationRoi(value) {
  return `${Number(value).toFixed(1)}%`;
}

const EBAY_ORDER_SITE_HOSTS = {
  EBAY_US: "www.ebay.com",
  EBAY_GB: "www.ebay.co.uk",
  EBAY_AU: "www.ebay.com.au",
  EBAY_CA: "www.ebay.ca",
  EBAY_DE: "www.ebay.de",
  EBAY_FR: "www.ebay.fr",
  EBAY_IT: "www.ebay.it",
  EBAY_ES: "www.ebay.es",
};

export function getEbayOrderDetailUrl(orderId, siteId) {
  const normalized = String(orderId ?? "").trim();
  if (!normalized || normalized === "—") {
    return null;
  }

  const host = EBAY_ORDER_SITE_HOSTS[siteId] ?? "www.ebay.com";

  return `https://${host}/sh/ord/details?orderid=${encodeURIComponent(normalized)}`;
}

export function buildSourceProductUrl(platform, productId, sourceUrl) {
  const url = String(sourceUrl ?? "").trim();
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const id = String(productId ?? "").trim();
  if (!id || id === "—") {
    return url || null;
  }

  switch (String(platform ?? "").toLowerCase()) {
    case "aliexpress":
    case "appmarketplace":
      return `https://www.aliexpress.com/item/${id}.html`;
    case "amazon":
      return `https://www.amazon.com/dp/${id}`;
    case "walmart":
      return `https://www.walmart.com/ip/${id}`;
    case "etsy":
      return `https://www.etsy.com/listing/${id}`;
    case "ebay":
      return /^\d+$/.test(id) ? `https://www.ebay.com/itm/${id}` : null;
    default:
      return url || null;
  }
}

export function platformLabel(platform) {
  if (!platform) return "—";
  const map = {
    appmarketplace: "APP",
    aliexpress: "AE",
    amazon: "AMZ",
    walmart: "WMT",
    etsy: "ETSY",
    ebay: "eBay",
  };
  return map[platform] ?? platform.slice(0, 3).toUpperCase();
}

export function buildEbayListingProductUrl(listing) {
  const listingUrl = String(listing?.listing_url ?? "").trim();
  if (/^https?:\/\//i.test(listingUrl)) {
    return listingUrl;
  }

  const itemId = String(listing?.ebay_item_id ?? "").trim();
  if (itemId && itemId !== "—") {
    return `https://www.ebay.com/itm/${encodeURIComponent(itemId)}`;
  }

  return null;
}

function parseSourceProductId(input, platform) {
  const trimmed = String(input ?? "").trim();
  if (!trimmed) {
    return null;
  }

  if (/^\d{8,20}$/.test(trimmed)) {
    return trimmed;
  }

  const patterns = [
    /\/item\/(\d+)\.html/i,
    /productId=(\d+)/i,
    /\/dp\/([A-Z0-9]{10})/i,
    /\/ip\/(\d+)/i,
    /\/listing\/(\d+)/i,
    /\/itm\/(\d+)/i,
    /(\d{8,20})/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  if (platform === "amazon" && /^[A-Z0-9]{10}$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  return /^https?:\/\//i.test(trimmed) ? null : trimmed;
}

export function detectSourcePlatform(input) {
  const value = String(input ?? "").trim().toLowerCase();
  if (!value) {
    return null;
  }

  if (value.includes("amazon.") || value.includes("amzn.to/") || value.includes("a.co/")) {
    return "amazon";
  }

  if (value.includes("walmart.com") || value.includes("walmart.ca")) {
    return "walmart";
  }

  if (value.includes("aliexpress.com") || value.includes("aliexpress.us")) {
    return "aliexpress";
  }

  if (value.includes("etsy.com") || value.includes("etsy.me/")) {
    return "etsy";
  }

  if (value.includes("ebay.") || value.includes("/itm/")) {
    return "ebay";
  }

  return null;
}

export function normalizeListingSourceInput(input, fallbackPlatform = "aliexpress") {
  const trimmed = String(input ?? "").trim();

  if (!trimmed) {
    return {
      source_url: null,
      source_product_id: null,
      source_platform: fallbackPlatform,
      source_input: "",
    };
  }

  const platform = detectSourcePlatform(trimmed) ?? fallbackPlatform ?? "aliexpress";
  const productId = parseSourceProductId(trimmed, platform);
  const sourceUrl = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : buildSourceProductUrl(platform, productId, null);

  return {
    source_url: sourceUrl,
    source_product_id: productId,
    source_platform: platform,
    source_input: trimmed,
  };
}

export const TRACKING_CARRIER_OPTIONS = [
  { value: "USPS", label: "USPS" },
  { value: "UPS", label: "UPS" },
  { value: "FedEx", label: "FedEx" },
  { value: "FedExSmartPost", label: "FedEx SmartPost" },
  { value: "DHL", label: "DHL" },
  { value: "OnTrac", label: "OnTrac" },
  { value: "LASERSHIP", label: "LaserShip" },
  { value: "Other", label: "Other" },
];

export function detectTrackingCarrier(trackingNumber) {
  const value = String(trackingNumber ?? "").trim().replace(/\s+/g, "").toUpperCase();

  if (!value) {
    return null;
  }

  if (/^1Z[0-9A-Z]{16}$/.test(value)) {
    return "UPS";
  }

  if (/^(94|93|92|95|96)\d{20}$/.test(value) || /^9\d{21}$/.test(value)) {
    return "USPS";
  }

  if (/^[A-Z]{2}\d{9}US$/.test(value)) {
    return "USPS";
  }

  if (/^\d{12}$/.test(value) || /^\d{15}$/.test(value)) {
    return "FedEx";
  }

  if (/^\d{10}$/.test(value) || /^\d{11}$/.test(value)) {
    return "DHL";
  }

  if (/^JD\d+/i.test(value) || /^JJD/i.test(value)) {
    return "DHL";
  }

  return null;
}

export function normalizeTrackingCarrier(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return "";
  }

  const upper = trimmed.toUpperCase();
  const aliases = {
    USPS: "USPS",
    "U.S. POSTAL SERVICE": "USPS",
    "UNITED STATES POSTAL SERVICE": "USPS",
    UPS: "UPS",
    FEDEX: "FedEx",
    "FED EX": "FedEx",
    FEDEXSMARTPOST: "FedExSmartPost",
    DHL: "DHL",
    ONTRAC: "OnTrac",
    LASERSHIP: "LASERSHIP",
    OTHER: "Other",
  };

  return aliases[upper] ?? trimmed;
}

function titleCaseEbayStatus(value) {
  if (!value) {
    return "—";
  }

  return String(value)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function getEbayOrderStatusLabel(raw = {}) {
  const payment = String(raw.orderPaymentStatus ?? "").toUpperCase();

  if (payment && payment !== "PAID" && payment !== "PENDING") {
    return titleCaseEbayStatus(raw.orderPaymentStatus);
  }

  return titleCaseEbayStatus(raw.orderFulfillmentStatus);
}

export function getEbayOrderStatusMeta(raw = {}) {
  const fulfillment = String(raw.orderFulfillmentStatus ?? "").toUpperCase();
  const payment = String(raw.orderPaymentStatus ?? "").toUpperCase();

  let className = "pending";

  if (payment.includes("REFUND") || payment === "FAILED") {
    className = "canceled";
  } else if (fulfillment === "FULFILLED") {
    className = "delivered";
  } else if (fulfillment === "IN_PROGRESS") {
    className = "shipped";
  }

  return {
    className,
    label: getEbayOrderStatusLabel(raw),
  };
}

function normalizeCalculationTracking(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed || /^https?:\/\//i.test(trimmed)) {
    return "";
  }

  return trimmed;
}

function buildCalculationAddress(raw) {
  const buyer = raw.buyer ?? {};
  const fulfillment = raw.fulfillmentStartInstructions?.[0] ?? {};
  const shipTo = fulfillment.shippingStep?.shipTo ?? buyer.buyerRegistrationAddress ?? {};
  const contact = shipTo.contactAddress ?? shipTo;

  return [
    contact.addressLine1 ?? shipTo.addressLine1,
    contact.city ?? shipTo.city,
    contact.stateOrProvince ?? shipTo.stateOrProvince,
    contact.postalCode ?? shipTo.postalCode,
    contact.countryCode ?? shipTo.countryCode,
  ]
    .filter(Boolean)
    .join(", ") || "—";
}

export function mapApiOrderToCalculationRow(order) {
  const raw = order.raw_data ?? {};
  const lineItems = raw.lineItems ?? [];
  const firstItem = lineItems[0] ?? {};
  const pricing = raw.pricingSummary ?? {};
  const delivery = raw.deliveryCost ?? {};
  const ebayStatus = getEbayOrderStatusMeta(raw);
  const shippingStep = raw.fulfillmentStartInstructions?.[0]?.shippingStep ?? {};

  const sourceProductId = order.source_product_id ?? order.item_buy_id ?? null;
  const sourcePlatform = order.source_platform ?? "aliexpress";
  const sourceUrl = order.source_url ?? null;
  const sourceVariation = Array.isArray(order.source_variation) ? order.source_variation : null;
  const sourceVariationText = sourceVariation?.length
    ? sourceVariation.map((entry) => [entry.name, entry.value].filter(Boolean).join(": ")).join(", ")
    : "";

  const earn = Number(order.sell_price ?? pricing.total?.value ?? firstItem.lineItemCost?.value ?? 0);
  const cost = order.buy_price != null ? Number(order.buy_price) : 0;
  const shipping =
    order.shipping_cost != null
      ? Number(order.shipping_cost)
      : Number(delivery.shippingCost?.value ?? delivery.amount?.value ?? 0);
  // Tax collected by eBay is never actually kept by the seller, so it comes off
  // earnings before cost/shipping/prep the same way it would on a real payout —
  // everything downstream (After Tax eBay, Profit, ROI) is derived from it.
  const tax = Number(order.tax_amount ?? pricing.tax?.value ?? 0);
  const afterTaxEbay = Number((earn - tax).toFixed(2));
  const prep = Number(order.prep_cost ?? 0);
  const profit =
    order.profit != null ? Number(order.profit) : Number((afterTaxEbay - cost - shipping - prep).toFixed(2));
  const roi = cost > 0 ? Number(((profit / cost) * 100).toFixed(1)) : 0;
  const qty = Math.max(
    lineItems.reduce((sum, item) => sum + Number(item.quantity ?? 1), 0),
    1,
  );
  const itemSellUrl = buildEbayListingProductUrl({ ebay_item_id: order.item_sell_id ?? firstItem.legacyItemId });
  const trackingNumber =
    normalizeCalculationTracking(order.tracking_number) ||
    normalizeCalculationTracking(shippingStep.shipmentTrackingNumber);

  const variationAspects = firstItem.lineItemFulfillmentInstructions?.variations
    ?? firstItem.variationAspects
    ?? [];
  const variationText = Array.isArray(variationAspects)
    ? variationAspects
        .map((aspect) => {
          if (typeof aspect === "string") {
            return aspect;
          }

          const name = aspect.name ?? aspect.localizedName ?? "";
          const value = aspect.value ?? aspect.localizedValue ?? "";
          return [name, value].filter(Boolean).join(": ");
        })
        .filter(Boolean)
        .join(", ")
    : "";

  return {
    id: String(order.id),
    orderId: order.ebay_order_id ?? raw.orderId ?? String(order.id),
    title: order.item_title ?? firstItem.title ?? "Order item",
    image: firstItem.image?.imageUrl ?? order.listing_image_url ?? null,
    description: variationText || order.item_title || firstItem.title || "—",
    date: typeof order.order_date === "string" ? order.order_date.slice(0, 10) : order.order_date,
    ebayStatus: ebayStatus.label,
    ebayStatusClass: ebayStatus.className,
    status: order.status,
    storeName: order.store_name ?? "eBay",
    buyer: raw.buyer?.username ?? order.buyer_name ?? "—",
    cost,
    shipping,
    earn,
    profit,
    roi,
    itemSell: order.item_sell_id ?? "—",
    itemSellUrl,
    itemBuy: sourceProductId ?? "—",
    itemBuyUrl: buildSourceProductUrl(sourcePlatform, sourceProductId, sourceUrl),
    sourceUrl,
    sourcePlatform,
    sourceSkuId: order.source_sku_id ?? null,
    sourceVariationText,
    hasSource: Boolean(sourceProductId || sourceUrl),
    sku: firstItem.sku ?? "—",
    trackingNumber: trackingNumber || "—",
    qty,
    address: buildCalculationAddress(raw),
    tax,
    afterTaxEbay,
    prep,
    aliexpressOrderId: order.aliexpress_order_id ?? "—",
    aliexpressStatus: order.aliexpress_order_status ?? "—",
  };
}

export function buildOrderCalculation(order, index = 0) {
  const earn = parsePriceValue(order.price);
  const cost = Number((earn * (0.42 + (index % 7) * 0.03)).toFixed(2));
  const shipping = Number((1.2 + (index % 4) * 0.65).toFixed(2));
  const profit = Number((earn - cost - shipping).toFixed(2));
  const roi = cost > 0 ? Number(((profit / cost) * 100).toFixed(1)) : 0;

  return {
    ...order,
    orderId: order.orderSellId || order.id,
    description: order.color,
    cost,
    shipping,
    earn,
    profit,
    roi,
  };
}

export function summarizeCalculations(rows) {
  const totals = rows.reduce(
    (acc, row) => {
      acc.cost += row.cost;
      acc.shipping += row.shipping;
      acc.earn += row.earn;
      acc.profit += row.profit;
      acc.qty += row.qty ?? 0;
      acc.tax += row.tax ?? 0;
      acc.afterTaxEbay += row.afterTaxEbay ?? 0;
      acc.prep += row.prep ?? 0;
      return acc;
    },
    { cost: 0, shipping: 0, earn: 0, profit: 0, qty: 0, tax: 0, afterTaxEbay: 0, prep: 0 },
  );

  const roi = totals.cost > 0 ? Number(((totals.profit / totals.cost) * 100).toFixed(1)) : 0;

  return { ...totals, roi };
}

export function buildSparklinePoints(values) {
  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 96 + 2;
      const y = 26 - ((value - 1) / 5) * 18;

      return `${x},${y}`;
    })
    .join(" ");
}

export function buildPaginationItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
}

export function rewriteProductTitle(title) {
  return title
    .replace(/\.\.\.$/, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/(^\w)/, (match) => match.toUpperCase())
    .concat(" | AI Optimized");
}

const ORDERS_CSV_COLUMNS = [
  { key: "orderId", label: "Order ID" },
  { key: "title", label: "Item" },
  { key: "sku", label: "SKU" },
  { key: "buyerName", label: "Buyer" },
  { key: "username", label: "Buyer Username" },
  { key: "email", label: "Buyer Email" },
  { key: "date", label: "Order Date" },
  { key: "status", label: "Status" },
  { key: "total", label: "Total" },
  { key: "totalQuantity", label: "Qty" },
  { key: "trackingNumber", label: "Tracking Number" },
  { key: "carrier", label: "Carrier" },
  { key: "shippingAddress", label: "Shipping Address" },
  { key: "itemBuy", label: "Source Item ID" },
  { key: "itemSell", label: "eBay Item ID" },
  { key: "aliexpressOrderId", label: "AliExpress Order ID" },
  { key: "aliexpressStatus", label: "AliExpress Status" },
];

function escapeCsvValue(value) {
  const str = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

/** Builds a CSV string (with header row) from order rows shaped like mapApiOrder()'s output. */
export function buildOrdersCsv(rows) {
  const header = ORDERS_CSV_COLUMNS.map((col) => escapeCsvValue(col.label)).join(",");
  const lines = rows.map((row) =>
    ORDERS_CSV_COLUMNS.map((col) => escapeCsvValue(row[col.key])).join(","),
  );

  return [header, ...lines].join("\r\n");
}

/** Triggers a browser download of the given text content as a file. */
export function downloadTextFile(filename, content, mimeType = "text/csv;charset=utf-8;") {
  const blob = new Blob(["﻿", content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
