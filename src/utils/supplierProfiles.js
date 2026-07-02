import { importSuppliers, importWarehouses } from "../components/autods/constants";

const PLATFORM_LABELS = {
  aliexpress: "AliExpress",
  amazon: "Amazon",
  walmart: "Walmart",
  etsy: "Etsy",
  ebay: "eBay",
};

const COUNTRY_LABELS = {
  US: "US",
  CN: "CN",
  UK: "UK",
  GB: "UK",
  AU: "AU",
  DE: "DE",
  FR: "FR",
};

const BADGES = {
  aliexpress: "ae",
  amazon: "amz",
  walmart: "wm",
  etsy: "ets",
  ebay: "ebay",
};

export function normalizeSupplierCountry(country) {
  const code = String(country ?? "US").trim().toUpperCase();
  return code === "GB" ? "UK" : code || "US";
}

export function supplierProfileId(platform, countryCode) {
  return `${String(platform).toLowerCase()}-${normalizeSupplierCountry(countryCode).toLowerCase()}`;
}

export function supplierProfileLabel(platform, countryCode) {
  const name = PLATFORM_LABELS[platform] ?? String(platform).charAt(0).toUpperCase() + String(platform).slice(1);
  const region = COUNTRY_LABELS[normalizeSupplierCountry(countryCode)] ?? normalizeSupplierCountry(countryCode);
  return `${name} ${region}`;
}

export function supplierProfileBadge(platform) {
  return BADGES[platform] ?? String(platform).slice(0, 3);
}

export function buildSupplierProfile(platform, countryCode, settingsFactory) {
  return {
    id: supplierProfileId(platform, countryCode),
    label: supplierProfileLabel(platform, countryCode),
    badge: supplierProfileBadge(platform),
    platform,
    country: normalizeSupplierCountry(countryCode),
    enabled: true,
    settings: settingsFactory(),
  };
}

export function listAvailableSupplierProfiles(existingSuppliers = []) {
  const existingIds = new Set(existingSuppliers.map((supplier) => supplier.id));
  const options = [];

  for (const supplier of importSuppliers.filter((row) => row.enabled !== false)) {
    for (const warehouse of importWarehouses) {
      const id = supplierProfileId(supplier.id, warehouse.id);
      if (!existingIds.has(id)) {
        options.push({
          platform: supplier.id,
          country: warehouse.id,
          id,
          label: supplierProfileLabel(supplier.id, warehouse.id),
        });
      }
    }
  }

  return options;
}

export function normalizeSuppliersFromApi(suppliers, settingsFactory) {
  if (!Array.isArray(suppliers)) {
    return [];
  }

  return suppliers.map((supplier) => {
    const platform = supplier.platform ?? supplier.id?.split("-")?.[0] ?? "aliexpress";
    const country = normalizeSupplierCountry(supplier.country ?? supplier.id?.split("-")?.[1] ?? "US");

    return {
      ...supplier,
      id: supplier.id ?? supplierProfileId(platform, country),
      label: supplier.label ?? supplierProfileLabel(platform, country),
      badge: supplier.badge ?? supplierProfileBadge(platform),
      platform,
      country,
      enabled: supplier.enabled !== false,
      settings: supplier.settings ?? settingsFactory(),
    };
  });
}
