export const ORDER_DATE_PRESETS = [
  { id: "today", label: "Today" },
  { id: "7days", label: "7 days" },
  { id: "15days", label: "15 days" },
  { id: "30days", label: "30 days" },
  { id: "month", label: "This month" },
  { id: "all", label: "All time" },
];

export const ORDER_SORT_OPTIONS = [
  { id: "orderDate", label: "Order date" },
  { id: "total", label: "Total amount" },
  { id: "profit", label: "Profit" },
];

export const DEFAULT_DATE_PRESET = "30days";

export function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getDateRangeForPreset(preset) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const to = formatDateInput(today);

  switch (preset) {
    case "today":
      return { from: to, to };
    case "7days": {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      return { from: formatDateInput(from), to };
    }
    case "15days": {
      const from = new Date(today);
      from.setDate(from.getDate() - 14);
      return { from: formatDateInput(from), to };
    }
    case "30days": {
      const from = new Date(today);
      from.setDate(from.getDate() - 29);
      return { from: formatDateInput(from), to };
    }
    case "month": {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: formatDateInput(from), to };
    }
    case "all":
      return { from: "", to: "" };
    default:
      return null;
  }
}

export function getDefaultOrderFilters() {
  const range = getDateRangeForPreset(DEFAULT_DATE_PRESET);

  return {
    dateRangePreset: DEFAULT_DATE_PRESET,
    fromDate: range?.from ?? "",
    toDate: range?.to ?? "",
    sortBy: "orderDate",
    sortDirection: "desc",
    statusFilter: "All Statuses",
    buyerFilter: "",
    orderIdFilter: "",
    storeFilter: "All Stores",
    showOnlyActive: true,
  };
}
