/** Where clients configure per-account ship-from address for eBay publish. */
export const SHIP_FROM_SETTINGS_PATH = "/settings?tab=supplier&inner=lister";

export const SHIP_FROM_CLIENT_MESSAGE =
  "Before publishing to eBay, go to Settings → Supplier Settings → Lister and fill in your ship-from address (country, city, state if selling on ebay.com, and zip/postcode). Click Save — each account uses its own address, and it must match your eBay marketplace (US address for ebay.com).";

export function normalizeShipFromCountry(country) {
  if (!country) return "";
  if (country.length === 2) return country.toUpperCase();
  const map = {
    Australia: "AU",
    "United States": "US",
    "United Kingdom": "GB",
    Canada: "CA",
  };
  return map[country] ?? String(country).toUpperCase();
}

/**
 * @param {object} [settings] Account settings from API
 * @returns {{ complete: boolean, missing: string[], country: string }}
 */
export function getShipFromStatus(settings) {
  const lister = settings?.lister ?? {};
  const country = normalizeShipFromCountry(lister.country ?? lister.itemCountry);
  const missing = [];

  if (!country) missing.push("Country");
  if (!String(lister.city ?? "").trim()) missing.push("City");
  if (!String(lister.zipcode ?? "").trim()) missing.push("Zip / Postcode");
  if (country === "US" && !String(lister.state ?? "").trim()) missing.push("State");

  return {
    complete: missing.length === 0,
    missing,
    country,
  };
}

export function shipFromMissingMessage(settings) {
  const { missing } = getShipFromStatus(settings);
  if (!missing.length) return "";
  return `Add your ship-from ${missing.join(", ")} in Settings → Supplier Settings → Lister, then click Save.`;
}
