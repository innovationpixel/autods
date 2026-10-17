function sampleImage(title, subtitle, from, to) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
<rect width="600" height="600" fill="url(#g)"/>
<rect x="190" y="170" width="220" height="260" rx="26" fill="rgba(255,255,255,.88)"/>
<rect x="235" y="120" width="130" height="90" rx="45" fill="none" stroke="rgba(255,255,255,.88)" stroke-width="18"/>
<text x="300" y="510" font-family="Arial, sans-serif" font-size="40" font-weight="700" fill="#fff" text-anchor="middle">${title}</text>
<text x="300" y="548" font-family="Arial, sans-serif" font-size="22" fill="rgba(255,255,255,.85)" text-anchor="middle">${subtitle}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** Local sample shown in the gallery until real templates are published. Delete to remove. */
export const SAMPLE_TEMPLATE = {
  id: "sample-product-showcase",
  is_sample: true,
  name: "Product Showcase Pack (Sample)",
  category: "Product Showcase",
  badge: "New",
  is_active: true,
  uses_count: 0,
  created_at: "2026-01-01T00:00:00Z",
  aspect_ratio: "1:1",
  width: 1024,
  height: 1024,
  format: "png",
  logo_position: "top-left",
  logo_size_percent: 16,
  prompts: [
    { prompt: "Main product image on a clean white background with soft professional lighting, premium look.", reference_index: null },
    { prompt: "Product features image showing key highlights with clean icons and short callout text.", reference_index: null },
    { prompt: "Lifestyle image with the product in a stylish real-world setting, natural light.", reference_index: null },
  ],
  input_images: [],
  example_images: [
    { id: "s1", url: sampleImage("Hero Shot", "Clean white background", "#7c3aed", "#4c1d95") },
    { id: "s2", url: sampleImage("Key Features", "Highlights & icons", "#0ea5e9", "#1e3a8a") },
    { id: "s3", url: sampleImage("Lifestyle", "In a stylish setting", "#f59e0b", "#b45309") },
  ],
};
