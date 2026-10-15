export const PRODUCT_COLUMN_STORAGE_KEY = "autods_products_visible_columns_v1";

const COLUMN_MIN_WIDTHS = {
  name: 320,
  uploaded: 118,
  store: 120,
  stockAvailable: 110,
  stockOnHold: 90,
  stockOos: 72,
  stockTotal: 72,
  cost: 170,
  sold: 72,
  dws: 150,
  itemIdBuy: 150,
  itemIdSell: 150,
  tags: 100,
  asin: 120,
  views: 80,
  watchers: 90,
  daysLeft: 100,
  timeLeft: 100,
  time_left: 100,
  warnings: 48,
  actions: 94,
};

export const PRODUCT_TABLE_FIXED_WIDTH = {
  checkbox: 36,
};

export const productTableColumns = [
  { id: "name", label: "Name", defaultVisible: true, manage: true },
  { id: "uploaded", label: "Uploaded", defaultVisible: true, manage: true, sortable: true },
  { id: "store", label: "Store", defaultVisible: true, manage: true },
  { id: "stockAvailable", label: "Available", defaultVisible: true, manage: true, group: "stock" },
  { id: "stockOnHold", label: "On Hold", defaultVisible: true, manage: true, group: "stock" },
  { id: "stockOos", label: "OOS", defaultVisible: true, manage: true, group: "stock" },
  { id: "stockTotal", label: "Total", defaultVisible: true, manage: true, group: "stock" },
  { id: "cost", label: "Cost (Buy / Sell)", defaultVisible: true, manage: true },
  { id: "sold", label: "Sold", defaultVisible: true, manage: true },
  { id: "dws", label: "DWS (Day without sale)", defaultVisible: true, manage: true },
  { id: "itemIdBuy", label: "Item ID (Buy)", defaultVisible: true, manage: true },
  { id: "itemIdSell", label: "Item ID (Sell)", defaultVisible: true, manage: true },
  { id: "tags", label: "Tags", defaultVisible: true, manage: true },
  { id: "asin", label: "ASIN", defaultVisible: true, manage: true },
  { id: "views", label: "Views", defaultVisible: true, manage: true },
  { id: "watchers", label: "Watchers", defaultVisible: true, manage: true },
  { id: "daysLeft", label: "Time Left", defaultVisible: true, manage: true, sortable: true },
  { id: "warnings", label: "Warnings", defaultVisible: true, manage: true },
  { id: "actions", label: "Actions", defaultVisible: true, manage: true },
].map((column) => ({
  ...column,
  minWidth: COLUMN_MIN_WIDTHS[column.id] ?? 120,
}));

export const manageableProductColumns = productTableColumns.filter((column) => column.manage);

export const PRODUCT_GRID_COLUMN_COUNT = manageableProductColumns.length + 1;

function normalizeVisibleColumnIds(ids) {
  const withoutActions = ids.filter((id) => id !== "actions");
  return [...withoutActions, "actions"];
}

export function defaultVisibleProductColumnIds() {
  return normalizeVisibleColumnIds(
    manageableProductColumns.filter((column) => column.defaultVisible).map((column) => column.id),
  );
}

export function loadVisibleProductColumnIds() {
  try {
    const raw = localStorage.getItem(PRODUCT_COLUMN_STORAGE_KEY);
    if (!raw) {
      return defaultVisibleProductColumnIds();
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return defaultVisibleProductColumnIds();
    }

    const allowed = new Set(manageableProductColumns.map((column) => column.id));
    allowed.add("timeLeft");
    allowed.add("time_left");
    const filtered = parsed
      .filter((id) => allowed.has(id))
      .map((id) => (id === "timeLeft" || id === "time_left" ? "daysLeft" : id));

    // Keep Time Left available even for older saved column layouts.
    if (!filtered.includes("daysLeft")) {
      const watchersIdx = filtered.indexOf("watchers");
      if (watchersIdx !== -1) {
        filtered.splice(watchersIdx + 1, 0, "daysLeft");
      } else {
        const warningsIdx = filtered.indexOf("warnings");
        if (warningsIdx !== -1) {
          filtered.splice(warningsIdx, 0, "daysLeft");
        } else {
          filtered.push("daysLeft");
        }
      }
    }

    return normalizeVisibleColumnIds(filtered.length ? filtered : defaultVisibleProductColumnIds());
  } catch {
    return defaultVisibleProductColumnIds();
  }
}

export function saveVisibleProductColumnIds(ids) {
  localStorage.setItem(PRODUCT_COLUMN_STORAGE_KEY, JSON.stringify(normalizeVisibleColumnIds(ids)));
}

export function allManageableProductColumnIds() {
  return normalizeVisibleColumnIds(manageableProductColumns.map((column) => column.id));
}

export function getProductColumnById(id) {
  if (id === "timeLeft" || id === "time_left") {
    return productTableColumns.find((column) => column.id === "daysLeft");
  }
  return productTableColumns.find((column) => column.id === id);
}

export function resolveVisibleProductColumns(visibleColumnIds) {
  return normalizeVisibleColumnIds(visibleColumnIds)
    .map((id) => getProductColumnById(id))
    .filter(Boolean);
}

export function getVisibleProductTableMinWidth(visibleColumnIds) {
  const normalizedIds = normalizeVisibleColumnIds(visibleColumnIds);
  const columnsWidth = normalizedIds.reduce(
    (sum, id) => sum + (getProductColumnById(id)?.minWidth ?? 120),
    0,
  );

  return PRODUCT_TABLE_FIXED_WIDTH.checkbox + columnsWidth;
}
