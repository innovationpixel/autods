import { encodeCode128B } from "./code128";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

function buildBarcodeSvg(text) {
  const widths = encodeCode128B(text);
  if (!widths) {
    return `<p>Could not generate a barcode for "${escapeHtml(text)}".</p>`;
  }

  const scale = 2;
  const barHeight = 60;
  let x = 0;
  let bars = "";

  widths.forEach((width, index) => {
    const isBar = index % 2 === 0;
    if (isBar) {
      bars += `<rect x="${x}" y="0" width="${width * scale}" height="${barHeight}" fill="#000" />`;
    }
    x += width * scale;
  });

  const label = escapeHtml(text);

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${x}" height="${barHeight + 26}" viewBox="0 0 ${x} ${barHeight + 26}">
      ${bars}
      <text x="${x / 2}" y="${barHeight + 20}" font-size="14" font-family="monospace" text-anchor="middle">${label}</text>
    </svg>`;
}

const DOC_TITLES = {
  invoice: "Invoice",
  "packing-slip": "Packing Slip",
  "pick-list": "Pick List",
  barcode: "Barcode",
  "shipping-label": "Shipping Label",
};

const BASE_STYLES = `
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; margin: 0; padding: 24px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  h2 { font-size: 14px; color: #6b7280; margin: 0 0 20px; font-weight: 600; }
  .doc { max-width: 760px; margin: 0 auto 40px; page-break-after: always; }
  .doc:last-child { page-break-after: auto; }
  .row { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 20px; }
  .box { flex: 1; }
  .box strong { display: block; margin-bottom: 4px; font-size: 12px; text-transform: uppercase; color: #6b7280; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
  th { background: #f9fafb; font-size: 11px; text-transform: uppercase; color: #6b7280; }
  .totals { margin-top: 16px; margin-left: auto; width: 260px; }
  .totals div { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
  .totals .grand { font-weight: 700; border-top: 1px solid #1f2937; margin-top: 6px; padding-top: 8px; font-size: 15px; }
  .barcode-block { text-align: center; margin: 60px 0; }
  .shipping-label { border: 2px solid #1f2937; border-radius: 8px; padding: 20px; max-width: 420px; }
  .shipping-label__header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px dashed #9ca3af; padding-bottom: 10px; margin-bottom: 16px; }
  .shipping-label__header strong { font-size: 16px; text-transform: uppercase; }
  .shipping-label__header span { font-size: 12px; color: #6b7280; }
  .print-toolbar { text-align: center; margin-bottom: 24px; }
  .print-toolbar button { padding: 10px 20px; font-size: 14px; font-weight: 700; border: 0; border-radius: 8px; background: #f4a944; color: #fff; cursor: pointer; }
  @media print { .print-toolbar { display: none; } }
`;

function invoiceSection(order) {
  return `
    <section class="doc">
      <h1>Invoice</h1>
      <h2>Order ${escapeHtml(order.orderId)}</h2>
      <div class="row">
        <div class="box">
          <strong>Sold by</strong>
          <span>${escapeHtml(order.storeName || "—")}</span>
        </div>
        <div class="box">
          <strong>Billed to</strong>
          <span>${escapeHtml(order.buyerName || "—")}</span><br />
          <span>${escapeHtml(order.email || "")}</span>
        </div>
        <div class="box">
          <strong>Order date</strong>
          <span>${escapeHtml(order.date || order.orderDate || "—")}</span>
        </div>
      </div>
      <table>
        <thead><tr><th>Item</th><th>SKU</th><th>Qty</th><th>Total</th></tr></thead>
        <tbody>
          <tr>
            <td>${escapeHtml(order.title)}</td>
            <td>${escapeHtml(order.sku || "—")}</td>
            <td>${escapeHtml(order.totalQuantity || 1)}</td>
            <td>${escapeHtml(order.total || "—")}</td>
          </tr>
        </tbody>
      </table>
      <div class="totals">
        <div class="grand"><span>Total</span><span>${escapeHtml(order.total || "—")}</span></div>
      </div>
    </section>`;
}

function packingSlipSection(order) {
  return `
    <section class="doc">
      <h1>Packing Slip</h1>
      <h2>Order ${escapeHtml(order.orderId)}</h2>
      <div class="row">
        <div class="box">
          <strong>Ship to</strong>
          <span>${escapeHtml(order.buyerName || "—")}</span><br />
          <span>${escapeHtml(order.shippingAddress || "—")}</span>
        </div>
        <div class="box">
          <strong>Tracking</strong>
          <span>${escapeHtml(order.trackingNumber || "Not yet shipped")}</span>
        </div>
      </div>
      <table>
        <thead><tr><th>Item</th><th>SKU</th><th>Qty</th></tr></thead>
        <tbody>
          <tr>
            <td>${escapeHtml(order.title)}</td>
            <td>${escapeHtml(order.sku || "—")}</td>
            <td>${escapeHtml(order.totalQuantity || 1)}</td>
          </tr>
        </tbody>
      </table>
    </section>`;
}

function pickListSection(orders) {
  const rows = orders
    .map(
      (order) => `
        <tr>
          <td>${escapeHtml(order.orderId)}</td>
          <td>${escapeHtml(order.title)}</td>
          <td>${escapeHtml(order.sku || "—")}</td>
          <td>${escapeHtml(order.totalQuantity || 1)}</td>
        </tr>`,
    )
    .join("");

  return `
    <section class="doc">
      <h1>Pick List</h1>
      <h2>${orders.length} order${orders.length === 1 ? "" : "s"}</h2>
      <table>
        <thead><tr><th>Order</th><th>Item</th><th>SKU</th><th>Qty</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </section>`;
}

function shippingLabelSection(order) {
  const code = order.trackingNumber && order.trackingNumber !== "—" ? order.trackingNumber : order.orderId;

  return `
    <section class="doc shipping-label">
      <div class="shipping-label__header">
        <strong>${escapeHtml(order.carrier || "Standard Shipping")}</strong>
        <span>${escapeHtml(order.shippingService || "")}</span>
      </div>
      <div class="row">
        <div class="box">
          <strong>Ship from</strong>
          <span>${escapeHtml(order.storeName || "—")}</span>
        </div>
        <div class="box">
          <strong>Ship to</strong>
          <span>${escapeHtml(order.buyerName || "—")}</span><br />
          <span>${escapeHtml(order.shippingAddress || "—")}</span>
        </div>
      </div>
      <div class="row">
        <div class="box">
          <strong>Order</strong>
          <span>${escapeHtml(order.orderId)}</span>
        </div>
        <div class="box">
          <strong>Item</strong>
          <span>${escapeHtml(order.title)}${order.totalQuantity > 1 ? ` &times; ${escapeHtml(order.totalQuantity)}` : ""}</span>
        </div>
      </div>
      <div class="barcode-block">${buildBarcodeSvg(code)}</div>
    </section>`;
}

function barcodeSection(order) {
  const code = order.trackingNumber && order.trackingNumber !== "—" ? order.trackingNumber : order.orderId;

  return `
    <section class="doc">
      <h1>Barcode</h1>
      <h2>Order ${escapeHtml(order.orderId)}</h2>
      <div class="barcode-block">${buildBarcodeSvg(code)}</div>
    </section>`;
}

const SECTION_BUILDERS = {
  invoice: invoiceSection,
  barcode: barcodeSection,
  "shipping-label": shippingLabelSection,
  "packing-slip": packingSlipSection,
};

/**
 * Opens a real, printable document (invoice / packing-slip / pick-list / barcode /
 * shipping-label) in a new browser tab. Uses window.print() (browser's native
 * print-to-PDF) — no PDF library dependency.
 *
 * @param {"invoice"|"packing-slip"|"pick-list"|"barcode"|"shipping-label"} docType
 * @param {Array<object>} orders — one or more rows shaped like mapApiOrder()'s output
 */
export function openPrintableDocument(docType, orders) {
  const list = Array.isArray(orders) ? orders : [orders];
  if (!list.length) {
    return false;
  }

  let body;
  if (docType === "pick-list") {
    body = pickListSection(list);
  } else {
    const sectionBuilder = SECTION_BUILDERS[docType] ?? packingSlipSection;
    body = list.map(sectionBuilder).join("");
  }

  const win = window.open("", "_blank");
  if (!win) {
    return false;
  }

  win.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(DOC_TITLES[docType] ?? "Document")}</title>
    <style>${BASE_STYLES}</style>
  </head>
  <body>
    <div class="print-toolbar"><button onclick="window.print()">Print / Save as PDF</button></div>
    ${body}
  </body>
</html>`);
  win.document.close();
  win.focus();

  return true;
}
