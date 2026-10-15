export const CALCULATION_COLUMN_STORAGE_KEY = "autods_calculations_visible_columns_v2";

const COLUMN_MIN_WIDTHS = {
  orderId: 150,
  itemId: 270,
  itemTracking: 320,
  trackingBuy: 220,
  trackingSell: 240,
  name: 320,
  date: 116,
  ebayStatus: 150,
  qty: 64,
  address: 300,
  cost: 92,
  tax: 92,
  afterTaxEbay: 122,
  prep: 92,
  shipping: 100,
  earn: 100,
  profit: 100,
  roi: 88,
  aliexpressOrderId: 160,
  aliexpressStatus: 145,
};

export const calculationTableColumns = [
  { id: "orderId", label: "Order ID", defaultVisible: true, manage: true },
  { id: "itemId", label: "Item IDs", defaultVisible: true, manage: true },
  { id: "itemTracking", label: "Tracking", defaultVisible: true, manage: true },
  { id: "trackingBuy", label: "Buy Tracking", defaultVisible: false, manage: true },
  { id: "trackingSell", label: "Sell Tracking", defaultVisible: false, manage: true },
  { id: "name", label: "Product", defaultVisible: true, manage: true },
  { id: "date", label: "Date", defaultVisible: true, manage: true },
  { id: "ebayStatus", label: "eBay Status", defaultVisible: true, manage: true },
  { id: "qty", label: "QTY", defaultVisible: true, manage: true },
  { id: "address", label: "Address", defaultVisible: true, manage: true },
  { id: "cost", label: "Cost", defaultVisible: true, manage: true },
  { id: "tax", label: "Tax", defaultVisible: true, manage: true },
  { id: "afterTaxEbay", label: "After Tax eBay", defaultVisible: true, manage: true },
  { id: "prep", label: "Prep", defaultVisible: true, manage: true },
  { id: "shipping", label: "Shipping", defaultVisible: true, manage: true },
  { id: "earn", label: "Earn", defaultVisible: true, manage: true },
  { id: "profit", label: "Profit", defaultVisible: true, manage: true },
  { id: "roi", label: "ROI", defaultVisible: true, manage: true },
  { id: "aliexpressOrderId", label: "AliExpress Order ID", defaultVisible: true, manage: true },
  { id: "aliexpressStatus", label: "Source Status", defaultVisible: true, manage: true },
].map((column) => ({
  ...column,
  minWidth: COLUMN_MIN_WIDTHS[column.id] ?? 120,
}));

export const manageableCalculationColumns = calculationTableColumns.filter((column) => column.manage);

export const CALCULATION_GRID_COLUMN_COUNT = manageableCalculationColumns.length;

export function defaultVisibleCalculationColumnIds() {
  return manageableCalculationColumns.filter((column) => column.defaultVisible).map((column) => column.id);
}

export function loadVisibleCalculationColumnIds() {
  try {
    let raw = localStorage.getItem(CALCULATION_COLUMN_STORAGE_KEY);
    if (!raw) {
      const legacyRaw = localStorage.getItem("autods_calculations_visible_columns_v1");
      if (legacyRaw) {
        try {
          const legacyParsed = JSON.parse(legacyRaw);
          if (Array.isArray(legacyParsed)) {
            raw = legacyRaw;
          }
        } catch {
          // ignore
        }
      }
    }

    if (!raw) {
      return defaultVisibleCalculationColumnIds();
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return defaultVisibleCalculationColumnIds();
    }

    const allowed = new Set(manageableCalculationColumns.map((column) => column.id));
    const filtered = parsed.filter((id) => allowed.has(id));

    // Ensure tracking column is always present for the user
    if (!filtered.includes("itemTracking") && !filtered.includes("trackingBuy") && !filtered.includes("trackingSell")) {
      const itemIdIdx = filtered.indexOf("itemId");
      if (itemIdIdx !== -1) {
        filtered.splice(itemIdIdx + 1, 0, "itemTracking");
      } else {
        filtered.splice(2, 0, "itemTracking");
      }
    }

    return filtered.length ? filtered : defaultVisibleCalculationColumnIds();
  } catch {
    return defaultVisibleCalculationColumnIds();
  }
}

export function saveVisibleCalculationColumnIds(ids) {
  localStorage.setItem(CALCULATION_COLUMN_STORAGE_KEY, JSON.stringify(ids));
}

export function allManageableCalculationColumnIds() {
  return manageableCalculationColumns.map((column) => column.id);
}

export function getCalculationColumnById(id) {
  return calculationTableColumns.find((column) => column.id === id);
}

export function resolveVisibleCalculationColumns(visibleColumnIds) {
  return visibleColumnIds.map((id) => getCalculationColumnById(id)).filter(Boolean);
}

export function getVisibleCalculationTableMinWidth(visibleColumnIds) {
  return visibleColumnIds.reduce((sum, id) => sum + (getCalculationColumnById(id)?.minWidth ?? 120), 0);
}
