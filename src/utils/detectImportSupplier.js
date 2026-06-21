import { importSuppliers } from "../components/autods/constants";

/**
 * Detect buy-side supplier from a pasted URL or product ID.
 * Returns null when the input is empty or ambiguous (e.g. bare numeric ID).
 */
export function detectImportSupplier(input) {
  const value = (input ?? "").trim();
  if (!value) return null;

  const lower = value.toLowerCase();

  if (
    lower.includes("amazon.") ||
    lower.includes("amzn.to/") ||
    lower.includes("a.co/") ||
    /^[a-z0-9]{10}$/i.test(value)
  ) {
    return "amazon";
  }

  if (lower.includes("walmart.com") || lower.includes("walmart.ca")) {
    return "walmart";
  }

  if (lower.includes("aliexpress.com") || lower.includes("aliexpress.us")) {
    return "aliexpress";
  }

  if (lower.includes("etsy.com") || lower.includes("etsy.me/")) {
    return "etsy";
  }

  if (lower.includes("ebay.") || lower.includes("/itm/")) {
    return "ebay";
  }

  return null;
}

export function isImportSupplierEnabled(supplierId) {
  const supplier = importSuppliers.find((item) => item.id === supplierId);
  return supplier?.enabled !== false;
}

export function defaultWarehouseForSupplier(supplierId) {
  if (supplierId === "amazon" || supplierId === "walmart" || supplierId === "etsy" || supplierId === "ebay") {
    return "US";
  }

  return "CN";
}

export function importSupplierHint(supplierId) {
  switch (supplierId) {
    case "amazon":
      return "Paste an Amazon product URL or ASIN (e.g. B08N5WRWNW)";
    case "walmart":
      return "Paste a Walmart product URL or item ID (e.g. 123456789)";
    case "etsy":
      return "Paste an Etsy listing URL or listing ID (e.g. 1234567890)";
    case "ebay":
      return "Paste an eBay listing URL or item ID (e.g. 123456789012)";
    case "aliexpress":
      return "Paste an AliExpress product URL or item ID (e.g. 1005005760033715)";
    default:
      return "This supplier is not connected yet.";
  }
}

export function applyDetectedImportSupplier(input, { onSupplierChange, onWarehouseChange }) {
  const detected = detectImportSupplier(input);
  if (!detected || !isImportSupplierEnabled(detected)) {
    return;
  }

  onSupplierChange(detected);
  onWarehouseChange(defaultWarehouseForSupplier(detected));
}
