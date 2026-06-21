/** Built-in eBay description templates (AutoDS-style placeholders). */
export const TEMPLATE_PLACEHOLDERS = [
  { key: "TITLE_HERE", label: "Product title" },
  { key: "MAIN_IMAGE_HERE", label: "Main image" },
  { key: "FEATURES_HERE", label: "Feature bullets" },
  { key: "DESCRIPTION_HERE", label: "Full description" },
  { key: "DIMENSIONS_HERE", label: "Dimensions" },
];

export const templateLibraryCategories = [
  { id: "all", label: "All Templates" },
  { id: "general", label: "General Store" },
  { id: "electronics", label: "Electronics" },
  { id: "fashion", label: "Fashion" },
  { id: "home", label: "Home & Garden" },
  { id: "pets", label: "Pets" },
  { id: "holiday", label: "Holiday" },
];

const baseStyles = `
  font-family: Arial, Helvetica, sans-serif;
  color: #333;
  line-height: 1.55;
`;

export const builtInTemplates = [
  {
    id: "builtin-general-clean",
    name: "Clean Essentials",
    category: "general",
    accent: "#eda343",
    html: `<div style="${baseStyles} max-width:860px;margin:0 auto;padding:18px;">
  <div style="background:#f7f8fb;border:1px solid #e7eaf1;border-radius:8px;padding:20px;text-align:center;">
    <h2 style="margin:0 0 12px;font-size:22px;color:#2f2e37;">TITLE_HERE</h2>
    <div style="margin:16px 0;">MAIN_IMAGE_HERE</div>
    <p style="margin:0;color:#666;">Trusted quality · Fast dispatch · Friendly support</p>
  </div>
  <div style="margin-top:18px;padding:16px;border:1px solid #eceef3;border-radius:8px;">
    <h3 style="margin:0 0 10px;font-size:16px;">Product Highlights</h3>
    FEATURES_HERE
  </div>
  <div style="margin-top:18px;padding:16px;border:1px solid #eceef3;border-radius:8px;">
    <h3 style="margin:0 0 10px;font-size:16px;">Description</h3>
    DESCRIPTION_HERE
  </div>
</div>`,
  },
  {
    id: "builtin-general-trust",
    name: "Trust Banner",
    category: "general",
    accent: "#4aa56d",
    html: `<div style="${baseStyles} max-width:860px;margin:0 auto;">
  <div style="background:linear-gradient(135deg,#1f2937,#374151);color:#fff;padding:18px 20px;border-radius:8px 8px 0 0;">
    <strong>Premium Pick</strong> · Secure checkout · 30-day support
  </div>
  <div style="border:1px solid #e5e7eb;border-top:0;padding:20px;border-radius:0 0 8px 8px;">
    <h2 style="margin:0 0 14px;font-size:21px;">TITLE_HERE</h2>
    <div style="text-align:center;margin:14px 0;">MAIN_IMAGE_HERE</div>
    FEATURES_HERE
    <hr style="border:0;border-top:1px solid #eceef3;margin:18px 0;" />
    DESCRIPTION_HERE
    <p style="margin:16px 0 0;font-size:12px;color:#777;">Dimensions: DIMENSIONS_HERE</p>
  </div>
</div>`,
  },
  {
    id: "builtin-electronics-tech",
    name: "Tech Pro",
    category: "electronics",
    accent: "#2563eb",
    html: `<div style="${baseStyles} max-width:860px;margin:0 auto;padding:16px;background:#0f172a;color:#e2e8f0;border-radius:10px;">
  <div style="display:block;text-align:center;padding-bottom:14px;border-bottom:1px solid #334155;">
    <h2 style="margin:0;font-size:22px;color:#fff;">TITLE_HERE</h2>
    <span style="display:inline-block;margin-top:8px;font-size:12px;color:#94a3b8;">Electronics · Tested · Ready to ship</span>
  </div>
  <div style="text-align:center;margin:18px 0;">MAIN_IMAGE_HERE</div>
  <div style="background:#111827;border-radius:8px;padding:16px;">
    <h3 style="margin:0 0 10px;color:#fff;font-size:15px;">Key Specs</h3>
    FEATURES_HERE
    DESCRIPTION_HERE
  </div>
</div>`,
  },
  {
    id: "builtin-fashion-boutique",
    name: "Boutique Style",
    category: "fashion",
    accent: "#db2777",
    html: `<div style="${baseStyles} max-width:860px;margin:0 auto;padding:22px;border:1px solid #f3e8ff;background:#fffafc;border-radius:12px;">
  <p style="margin:0 0 8px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#be185d;">New Arrival</p>
  <h2 style="margin:0 0 16px;font-size:24px;font-weight:400;">TITLE_HERE</h2>
  <div style="text-align:center;margin-bottom:18px;">MAIN_IMAGE_HERE</div>
  FEATURES_HERE
  <div style="margin-top:16px;padding-top:16px;border-top:1px dashed #f5d0fe;">
    DESCRIPTION_HERE
  </div>
</div>`,
  },
  {
    id: "builtin-home-garden",
    name: "Home & Garden",
    category: "home",
    accent: "#16a34a",
    html: `<div style="${baseStyles} max-width:860px;margin:0 auto;">
  <div style="background:#ecfdf5;border:1px solid #bbf7d0;border-radius:10px;padding:18px;">
    <h2 style="margin:0 0 12px;color:#166534;">TITLE_HERE</h2>
    <div style="text-align:center;">MAIN_IMAGE_HERE</div>
  </div>
  <div style="margin-top:16px;padding:16px;background:#fafafa;border-radius:8px;">
    <h3 style="margin:0 0 8px;">Why you'll love it</h3>
    FEATURES_HERE
    DESCRIPTION_HERE
    <p style="margin:12px 0 0;font-size:13px;color:#666;">Size / dimensions: DIMENSIONS_HERE</p>
  </div>
</div>`,
  },
  {
    id: "builtin-pets-care",
    name: "Care Pets",
    category: "pets",
    accent: "#ea580c",
    html: `<div style="${baseStyles} max-width:860px;margin:0 auto;border:2px solid #fed7aa;border-radius:14px;overflow:hidden;">
  <div style="background:#ffedd5;padding:14px 18px;">
    <strong style="color:#9a3412;">Pet Approved</strong>
    <h2 style="margin:8px 0 0;font-size:21px;color:#431407;">TITLE_HERE</h2>
  </div>
  <div style="padding:18px;">
    <div style="text-align:center;margin-bottom:14px;">MAIN_IMAGE_HERE</div>
    FEATURES_HERE
    DESCRIPTION_HERE
  </div>
</div>`,
  },
  {
    id: "builtin-holiday-gift",
    name: "Holiday Gift Box",
    category: "holiday",
    accent: "#dc2626",
    html: `<div style="${baseStyles} max-width:860px;margin:0 auto;padding:18px;background:linear-gradient(180deg,#fef2f2,#fff);border:1px solid #fecaca;border-radius:12px;">
  <div style="text-align:center;margin-bottom:12px;">
    <span style="display:inline-block;padding:6px 12px;background:#dc2626;color:#fff;border-radius:999px;font-size:12px;font-weight:700;">Holiday Special</span>
  </div>
  <h2 style="margin:0 0 14px;text-align:center;font-size:22px;">TITLE_HERE</h2>
  <div style="text-align:center;">MAIN_IMAGE_HERE</div>
  FEATURES_HERE
  <div style="margin-top:16px;padding:14px;background:#fff;border-radius:8px;border:1px solid #fee2e2;">
    DESCRIPTION_HERE
  </div>
</div>`,
  },
  {
    id: "builtin-minimal-text",
    name: "Minimal Text",
    category: "general",
    accent: "#64748b",
    html: `<div style="${baseStyles} max-width:860px;margin:0 auto;padding:12px 4px;">
  <h2 style="margin:0 0 12px;font-size:20px;">TITLE_HERE</h2>
  <div style="margin:12px 0;">MAIN_IMAGE_HERE</div>
  FEATURES_HERE
  <div style="margin-top:14px;">DESCRIPTION_HERE</div>
</div>`,
  },
];

export function createBlankTemplate(name = "Untitled Template") {
  return {
    id: `custom-${Date.now()}`,
    name,
    category: "general",
    accent: "#eda343",
    html: `<div style="${baseStyles} max-width:860px;margin:0 auto;padding:16px;">
  <h2 style="margin:0 0 12px;">TITLE_HERE</h2>
  <div style="margin:12px 0;text-align:center;">MAIN_IMAGE_HERE</div>
  <div>FEATURES_HERE</div>
  <div style="margin-top:14px;">DESCRIPTION_HERE</div>
</div>`,
    custom: true,
  };
}

export function fillTemplatePreview(html) {
  const sampleFeatures = `<ul style="margin:8px 0;padding-left:20px;">
    <li>Premium materials and reliable build quality</li>
    <li>Fast shipping from trusted fulfillment partners</li>
    <li>Easy returns and responsive customer support</li>
  </ul>`;

  return (html || "")
    .replace(/TITLE_HERE/g, "Wireless Bluetooth Headphones with Noise Cancellation")
    .replace(
      /MAIN_IMAGE_HERE/g,
      '<img src="https://images.unsplash.com/photo-1505740106531-4243c5d4d0aa?auto=format&fit=crop&w=640&q=80" alt="Product" style="max-width:100%;height:auto;border-radius:8px;" />',
    )
    .replace(/FEATURES_HERE/g, sampleFeatures)
    .replace(/DESCRIPTION_HERE/g, "This product is designed for everyday use with durable construction and a clean, modern finish. Perfect for home, office, or travel.")
    .replace(/DIMENSIONS_HERE/g, "10 × 8 × 3 in (approx.)");
}

export function allTemplates(customTemplates = []) {
  return [...builtInTemplates, ...customTemplates];
}

export function templateById(id, customTemplates = []) {
  return allTemplates(customTemplates).find((template) => template.id === id) ?? null;
}
