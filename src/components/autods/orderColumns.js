/** 3Dsellers Orders Manager — 45 data columns + checkbox + actions = 47 grid columns. */
export const ORDER_COLUMN_STORAGE_KEY = "autods_orders_visible_columns_v2";

const COLUMN_MIN_WIDTHS = {
  name: 280,
  pickStatus: 120,
  itemId: 200,
  sku: 130,
  variationSpecifics: 170,
  bundleDetails: 150,
  listingsTags: 140,
  orderId: 160,
  detailsExtended: 240,
  orderDate: 118,
  status: 158,
  paidDate: 118,
  total: 100,
  totalQuantity: 118,
  transactionId: 150,
  refundDate: 118,
  refundTotal: 110,
  cancelStatus: 130,
  returnStatus: 130,
  inquiryStatus: 130,
  tags: 130,
  profit: 100,
  buyerName: 150,
  username: 130,
  buyerNotes: 200,
  email: 200,
  buyerAdditionalInfo: 180,
  shippingStatus: 140,
  shippingService: 160,
  shippingPrice: 120,
  trackingNumber: 170,
  carrier: 110,
  shippingAddress: 260,
  shipBy: 118,
  shippingDate: 130,
  estDeliveryDate: 140,
  notes: 200,
  ebaySellerNotes: 200,
  invoice: 100,
  packingSlip: 120,
  feedback: 110,
  record: 110,
  taxRef: 110,
  channel: 130,
  teammate: 120,
};

export const ORDER_TABLE_FIXED_WIDTH = {
  checkbox: 48,
  actions: 225,
};

export const orderTableColumns = [
  { id: "name", label: "Name", defaultVisible: true, manage: true, sortable: false },
  { id: "pickStatus", label: "Pick Status", defaultVisible: false, manage: true },
  { id: "itemId", label: "Item ID", defaultVisible: true, manage: true },
  { id: "sku", label: "SKU", defaultVisible: true, manage: true },
  { id: "variationSpecifics", label: "Variation Specifics", defaultVisible: true, manage: true },
  { id: "bundleDetails", label: "Bundle Details", defaultVisible: true, manage: true },
  { id: "listingsTags", label: "Listings Tags", defaultVisible: true, manage: true },
  { id: "orderId", label: "Order ID", defaultVisible: true, manage: true },
  { id: "detailsExtended", label: "Details Extended", defaultVisible: true, manage: true },
  { id: "orderDate", label: "Order Date", defaultVisible: true, manage: true, sortable: true },
  { id: "status", label: "Status", defaultVisible: true, manage: true },
  { id: "paidDate", label: "Paid Date", defaultVisible: true, manage: true },
  { id: "total", label: "Total", defaultVisible: true, manage: true },
  { id: "totalQuantity", label: "Total Quantity", defaultVisible: true, manage: true },
  { id: "transactionId", label: "Transaction ID", defaultVisible: true, manage: true },
  { id: "refundDate", label: "Refund Date", defaultVisible: true, manage: true },
  { id: "refundTotal", label: "Refund Total", defaultVisible: true, manage: true },
  { id: "cancelStatus", label: "Cancel Status", defaultVisible: true, manage: true },
  { id: "returnStatus", label: "Return Status", defaultVisible: true, manage: true },
  { id: "inquiryStatus", label: "Inquiry Status", defaultVisible: true, manage: true },
  { id: "tags", label: "Tags", defaultVisible: true, manage: true },
  { id: "profit", label: "Profit", defaultVisible: false, manage: true },
  { id: "buyerName", label: "Buyer Name", defaultVisible: false, manage: true },
  { id: "username", label: "Username", defaultVisible: false, manage: true },
  { id: "buyerNotes", label: "Buyer Notes", defaultVisible: false, manage: true },
  { id: "email", label: "Email", defaultVisible: false, manage: true },
  { id: "buyerAdditionalInfo", label: "Buyer Additional Info", defaultVisible: false, manage: true },
  { id: "shippingStatus", label: "Shipping Status", defaultVisible: false, manage: true },
  { id: "shippingService", label: "Shipping Service", defaultVisible: false, manage: true },
  { id: "shippingPrice", label: "Shipping Price", defaultVisible: false, manage: true },
  { id: "trackingNumber", label: "Tracking Number", defaultVisible: false, manage: true },
  { id: "carrier", label: "Carrier", defaultVisible: false, manage: true },
  { id: "shippingAddress", label: "Shipping Address", defaultVisible: false, manage: true },
  { id: "shipBy", label: "Ship By", defaultVisible: false, manage: true },
  { id: "shippingDate", label: "Shipping Date", defaultVisible: false, manage: true },
  { id: "estDeliveryDate", label: "Est. Delivery Date", defaultVisible: false, manage: true },
  { id: "notes", label: "Notes", defaultVisible: false, manage: true },
  { id: "ebaySellerNotes", label: "eBay Seller Notes", defaultVisible: false, manage: true },
  { id: "invoice", label: "Invoice", defaultVisible: false, manage: true },
  { id: "packingSlip", label: "Packing Slip", defaultVisible: false, manage: true },
  { id: "feedback", label: "Feedback", defaultVisible: false, manage: true },
  { id: "record", label: "Record", defaultVisible: false, manage: true },
  { id: "taxRef", label: "Tax Ref", defaultVisible: false, manage: true },
  { id: "channel", label: "Channel", defaultVisible: false, manage: true },
  { id: "teammate", label: "Teammate", defaultVisible: false, manage: true },
].map((column) => ({
  ...column,
  minWidth: COLUMN_MIN_WIDTHS[column.id] ?? 120,
}));

export const manageableOrderColumns = orderTableColumns.filter((column) => column.manage);

export const ORDER_GRID_COLUMN_COUNT = manageableOrderColumns.length + 2;

export function defaultVisibleColumnIds() {
  return manageableOrderColumns.filter((column) => column.defaultVisible).map((column) => column.id);
}

export function loadVisibleColumnIds() {
  try {
    const raw = localStorage.getItem(ORDER_COLUMN_STORAGE_KEY);
    if (!raw) {
      return defaultVisibleColumnIds();
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return defaultVisibleColumnIds();
    }

    const allowed = new Set(manageableOrderColumns.map((column) => column.id));
    const filtered = parsed.filter((id) => allowed.has(id));
    return filtered.length ? filtered : defaultVisibleColumnIds();
  } catch {
    return defaultVisibleColumnIds();
  }
}

export function saveVisibleColumnIds(ids) {
  localStorage.setItem(ORDER_COLUMN_STORAGE_KEY, JSON.stringify(ids));
}

export function allManageableColumnIds() {
  return manageableOrderColumns.map((column) => column.id);
}

export function getColumnById(id) {
  return orderTableColumns.find((column) => column.id === id);
}

export function getVisibleTableMinWidth(visibleColumnIds) {
  const columnsWidth = visibleColumnIds.reduce((sum, id) => sum + (getColumnById(id)?.minWidth ?? 120), 0);

  return ORDER_TABLE_FIXED_WIDTH.checkbox + columnsWidth + ORDER_TABLE_FIXED_WIDTH.actions;
}
