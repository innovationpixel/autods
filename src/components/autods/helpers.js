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
  return `A$${Number(value).toFixed(2)}`;
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

const CALCULATION_PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=120&q=80";

export function mapApiOrderToCalculationRow(order) {
  const raw = order.raw_data ?? {};
  const lineItems = raw.lineItems ?? [];
  const firstItem = lineItems[0] ?? {};
  const pricing = raw.pricingSummary ?? {};
  const delivery = raw.deliveryCost ?? {};
  const ebayStatus = getEbayOrderStatusMeta(raw);

  const earn = Number(order.sell_price ?? pricing.total?.value ?? firstItem.lineItemCost?.value ?? 0);
  const cost = order.buy_price != null ? Number(order.buy_price) : 0;
  const shipping = Number(delivery.shippingCost?.value ?? delivery.amount?.value ?? 0);
  const profit =
    order.profit != null ? Number(order.profit) : Number((earn - cost - shipping).toFixed(2));
  const roi = cost > 0 ? Number(((profit / cost) * 100).toFixed(1)) : 0;

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
    image: firstItem.image?.imageUrl ?? CALCULATION_PLACEHOLDER_IMAGE,
    description: variationText || order.item_title || firstItem.title || "—",
    date: typeof order.order_date === "string" ? order.order_date.slice(0, 10) : order.order_date,
    ebayStatus: ebayStatus.label,
    ebayStatusClass: ebayStatus.className,
    cost,
    shipping,
    earn,
    profit,
    roi,
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
      return acc;
    },
    { cost: 0, shipping: 0, earn: 0, profit: 0 },
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
