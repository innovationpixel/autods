/** Built-in professional eBay & eCommerce description templates (AutoDS-style placeholders). */
export const TEMPLATE_PLACEHOLDERS = [
  { key: "TITLE_HERE", label: "Product title" },
  { key: "MAIN_IMAGE_HERE", label: "Main hero image" },
  { key: "GALLERY_IMAGES_HERE", label: "Product gallery images" },
  { key: "FEATURES_HERE", label: "Feature bullet points" },
  { key: "DESCRIPTION_HERE", label: "Full description" },
  { key: "SPECIFICATIONS_HERE", label: "Specifications & details" },
  { key: "DIMENSIONS_HERE", label: "Dimensions / sizing" },
];

export const templateLibraryCategories = [
  { id: "all", label: "All Templates" },
  { id: "general", label: "General Store" },
  { id: "electronics", label: "Electronics & Tech" },
  { id: "fashion", label: "Fashion & Luxury" },
  { id: "home", label: "Home & Living" },
  { id: "minimal", label: "Minimalist" },
];

const fontStack = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const builtInTemplates = [
  {
    id: "builtin-modern-pro",
    name: "Modern Storefront Pro",
    category: "general",
    accent: "#4f46e5",
    description: "High-converting eBay store design with trust badges, multi-photo gallery, specifications, and buyer guarantee policies.",
    html: `<div data-autods-template="builtin-modern-pro" class="autods-template-root" style="font-family:${fontStack};color:#1e293b;line-height:1.6;max-width:920px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.04);">
  <!-- Top Trust Banner -->
  <div style="background:linear-gradient(135deg,#1e1b4b,#312e81);color:#e0e7ff;padding:12px 20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;font-size:12.5px;font-weight:600;letter-spacing:0.02em;">
    <div style="display:flex;align-items:center;gap:6px;">
      <span style="color:#fbbf24;">★ ★ ★ ★ ★</span>
      <span>Top Rated eBay Seller</span>
    </div>
    <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
      <span>🚚 Fast & Free Shipping</span>
      <span>🛡️ 30-Day Money Back Guarantee</span>
      <span>💬 24/7 Dedicated Support</span>
    </div>
  </div>

  <!-- Header Title -->
  <div style="padding:26px 28px 16px;border-bottom:1px solid #f1f5f9;background:#f8fafc;">
    <span style="display:inline-block;padding:4px 10px;background:#e0e7ff;color:#4338ca;border-radius:20px;font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Featured Listing</span>
    <h1 style="margin:0;font-size:23px;font-weight:800;color:#0f172a;line-height:1.35;">TITLE_HERE</h1>
  </div>

  <!-- Main Hero Image Showcase -->
  <div style="padding:22px 24px;text-align:center;background:#ffffff;">
    <div style="max-width:520px;margin:0 auto;padding:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
      MAIN_IMAGE_HERE
    </div>
    GALLERY_IMAGES_HERE
  </div>

  <!-- Highlights & Key Features -->
  <div style="padding:22px 26px;background:#f8fafc;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;">
    <h2 style="margin:0 0 14px;font-size:17.5px;font-weight:700;color:#0f172a;display:flex;align-items:center;gap:8px;">
      <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:#4f46e5;color:#ffffff;border-radius:50%;font-size:12px;">✓</span>
      Key Product Highlights
    </h2>
    <div style="background:#ffffff;padding:16px 20px;border:1px solid #e2e8f0;border-radius:8px;">
      FEATURES_HERE
    </div>
  </div>

  <!-- Specifications Table (if available) -->
  <div style="padding:22px 26px;border-bottom:1px solid #e2e8f0;">
    <h2 style="margin:0 0 14px;font-size:17.5px;font-weight:700;color:#0f172a;">Technical Specifications</h2>
    SPECIFICATIONS_HERE
  </div>

  <!-- Detailed Description -->
  <div style="padding:22px 26px;">
    <h2 style="margin:0 0 14px;font-size:17.5px;font-weight:700;color:#0f172a;">Product Description & Overview</h2>
    <div style="font-size:14.5px;line-height:1.75;color:#334155;">
      <!-- autods:content:start -->
      DESCRIPTION_HERE
      <!-- autods:content:end -->
    </div>
    <div style="margin-top:18px;padding:12px 16px;background:#f1f5f9;border-left:4px solid #4f46e5;border-radius:0 8px 8px 0;font-size:13px;color:#475569;">
      <strong>Dimensions / Fit:</strong> DIMENSIONS_HERE
    </div>
  </div>

  <!-- Policies & Buyer Guarantee Grid -->
  <div style="padding:22px 26px;background:#f8fafc;border-top:1px solid #e2e8f0;">
    <h3 style="margin:0 0 16px;font-size:16px;font-weight:700;color:#0f172a;text-align:center;">Why Buy From Us?</h3>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;">
      <div style="background:#ffffff;padding:14px;border:1px solid #e2e8f0;border-radius:8px;text-align:center;">
        <div style="font-size:22px;margin-bottom:6px;">🚚</div>
        <strong style="display:block;font-size:13px;color:#0f172a;margin-bottom:3px;">Fast & Free Shipping</strong>
        <span style="font-size:12px;color:#64748b;">Dispatched promptly with valid tracking.</span>
      </div>
      <div style="background:#ffffff;padding:14px;border:1px solid #e2e8f0;border-radius:8px;text-align:center;">
        <div style="font-size:22px;margin-bottom:6px;">🔄</div>
        <strong style="display:block;font-size:13px;color:#0f172a;margin-bottom:3px;">30-Day Easy Returns</strong>
        <span style="font-size:12px;color:#64748b;">Hassle-free 100% money back guarantee.</span>
      </div>
      <div style="background:#ffffff;padding:14px;border:1px solid #e2e8f0;border-radius:8px;text-align:center;">
        <div style="font-size:22px;margin-bottom:6px;">🛡️</div>
        <strong style="display:block;font-size:13px;color:#0f172a;margin-bottom:3px;">100% Authentic Quality</strong>
        <span style="font-size:12px;color:#64748b;">Brand new items verified before shipping.</span>
      </div>
      <div style="background:#ffffff;padding:14px;border:1px solid #e2e8f0;border-radius:8px;text-align:center;">
        <div style="font-size:22px;margin-bottom:6px;">💬</div>
        <strong style="display:block;font-size:13px;color:#0f172a;margin-bottom:3px;">Dedicated Support</strong>
        <span style="font-size:12px;color:#64748b;">Responsive assistance whenever you need help.</span>
      </div>
    </div>
  </div>

  <!-- Footer Signoff -->
  <div style="padding:12px 20px;background:#0f172a;color:#94a3b8;text-align:center;font-size:11.5px;">
    Thank you for choosing our store! Your satisfaction is our highest priority.
  </div>
</div>`,
  },
  {
    id: "builtin-ecommerce-luxe",
    name: "Luxury Boutique & Elegance",
    category: "fashion",
    accent: "#be185d",
    description: "Sophisticated editorial styling with clean serif headings, warm neutral backgrounds, and curated gallery framing.",
    html: `<div data-autods-template="builtin-ecommerce-luxe" class="autods-template-root" style="font-family:${fontStack};color:#27272a;line-height:1.65;max-width:920px;margin:0 auto;background:#fffafc;border:1px solid #fce7f3;border-radius:12px;overflow:hidden;">
  <!-- Elegant Banner -->
  <div style="background:#831843;color:#fdf2f8;padding:12px 24px;text-align:center;letter-spacing:0.12em;font-size:11.5px;text-transform:uppercase;font-weight:700;">
    Curated Collection · Premium Quality · Guaranteed Authentic
  </div>

  <!-- Title & Subtitle -->
  <div style="padding:28px 26px 16px;text-align:center;">
    <span style="display:inline-block;color:#be185d;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;margin-bottom:6px;">Exclusive Selection</span>
    <h1 style="margin:0 0 8px;font-size:23px;font-weight:700;color:#18181b;line-height:1.35;">TITLE_HERE</h1>
    <p style="margin:0;font-size:13px;color:#71717a;">Designed with exceptional craftsmanship and modern sophistication.</p>
  </div>

  <!-- Main Hero Image -->
  <div style="padding:0 24px 20px;text-align:center;">
    <div style="max-width:500px;margin:0 auto;background:#ffffff;border:1px solid #fbcfe8;border-radius:10px;padding:12px;box-shadow:0 6px 20px rgba(190,24,93,0.06);">
      MAIN_IMAGE_HERE
    </div>
    GALLERY_IMAGES_HERE
  </div>

  <!-- Key Highlights & Details -->
  <div style="padding:22px 26px;background:#ffffff;border-top:1px solid #fce7f3;border-bottom:1px solid #fce7f3;">
    <h2 style="margin:0 0 14px;font-size:17.5px;font-weight:700;color:#831843;text-align:center;">Distinctive Features</h2>
    <div style="max-width:760px;margin:0 auto;background:#fffafc;border:1px solid #fbcfe8;border-radius:8px;padding:16px 20px;">
      FEATURES_HERE
    </div>
  </div>

  <!-- Specifications -->
  <div style="padding:22px 26px;">
    <h2 style="margin:0 0 14px;font-size:17.5px;font-weight:700;color:#18181b;">Product Specifics</h2>
    SPECIFICATIONS_HERE
  </div>

  <!-- Detailed Description -->
  <div style="padding:0 26px 24px;">
    <h2 style="margin:0 0 14px;font-size:17.5px;font-weight:700;color:#18181b;">Full Description</h2>
    <div style="font-size:14.5px;color:#3f3f46;line-height:1.8;">
      <!-- autods:content:start -->
      DESCRIPTION_HERE
      <!-- autods:content:end -->
    </div>
    <div style="margin-top:16px;padding:12px 16px;background:#fdf2f8;border-radius:8px;color:#9d174d;font-size:13px;">
      <strong>Dimensions & Sizing:</strong> DIMENSIONS_HERE
    </div>
  </div>

  <!-- Boutique Guarantee Bar -->
  <div style="padding:20px 24px;background:#fdf2f8;border-top:1px solid #fce7f3;display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;text-align:center;">
    <div>
      <span style="font-size:18px;display:block;margin-bottom:4px;">✨</span>
      <strong style="display:block;font-size:13px;color:#831843;">Boutique Quality</strong>
      <span style="font-size:11.5px;color:#71717a;">Inspected meticulously prior to dispatch.</span>
    </div>
    <div>
      <span style="font-size:18px;display:block;margin-bottom:4px;">🎀</span>
      <strong style="display:block;font-size:13px;color:#831843;">Complimentary Shipping</strong>
      <span style="font-size:11.5px;color:#71717a;">Carefully packaged for safe transit.</span>
    </div>
    <div>
      <span style="font-size:18px;display:block;margin-bottom:4px;">🤍</span>
      <strong style="display:block;font-size:13px;color:#831843;">30-Day Returns</strong>
      <span style="font-size:11.5px;color:#71717a;">Shop with complete confidence.</span>
    </div>
  </div>
</div>`,
  },
  {
    id: "builtin-tech-dark",
    name: "Tech Pro & Electronics Dark",
    category: "electronics",
    accent: "#0ea5e9",
    description: "Sleek slate dark-mode layout with electric cyan highlights, key specs matrix, and high-performance branding.",
    html: `<div data-autods-template="builtin-tech-dark" class="autods-template-root" style="font-family:${fontStack};color:#e2e8f0;line-height:1.6;max-width:920px;margin:0 auto;background:#0f172a;border:1px solid #334155;border-radius:12px;overflow:hidden;box-shadow:0 12px 36px rgba(0,0,0,0.3);">
  <!-- Tech Header -->
  <div style="background:linear-gradient(135deg,#0284c7,#0369a1);color:#ffffff;padding:12px 24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;font-size:12px;font-weight:700;letter-spacing:0.04em;">
    <span>⚡ HIGH-PERFORMANCE TECH & ELECTRONICS</span>
    <span>TESTED · VERIFIED · FAST DISPATCH</span>
  </div>

  <!-- Title Section -->
  <div style="padding:24px 26px 16px;border-bottom:1px solid #1e293b;background:#1e293b;">
    <span style="display:inline-block;padding:3px 10px;background:#0369a1;color:#bae6fd;border-radius:4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Official Specs</span>
    <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;line-height:1.35;">TITLE_HERE</h1>
  </div>

  <!-- Hero Photo & Gallery -->
  <div style="padding:22px 24px;text-align:center;background:#0f172a;">
    <div style="max-width:500px;margin:0 auto;background:#1e293b;border:1px solid #334155;border-radius:10px;padding:12px;">
      MAIN_IMAGE_HERE
    </div>
    GALLERY_IMAGES_HERE
  </div>

  <!-- Tech Highlights -->
  <div style="padding:22px 26px;background:#1e293b;border-top:1px solid #334155;border-bottom:1px solid #334155;">
    <h2 style="margin:0 0 14px;font-size:17px;font-weight:700;color:#38bdf8;">Key Features & Innovations</h2>
    <div style="background:#0f172a;padding:16px 20px;border:1px solid #334155;border-radius:8px;color:#cbd5e1;">
      FEATURES_HERE
    </div>
  </div>

  <!-- Specifications Matrix -->
  <div style="padding:22px 26px;border-bottom:1px solid #334155;">
    <h2 style="margin:0 0 14px;font-size:17px;font-weight:700;color:#ffffff;">Technical Specifications Matrix</h2>
    SPECIFICATIONS_HERE
  </div>

  <!-- Overview -->
  <div style="padding:22px 26px;">
    <h2 style="margin:0 0 14px;font-size:17px;font-weight:700;color:#ffffff;">Detailed Overview</h2>
    <div style="font-size:14px;color:#94a3b8;line-height:1.75;">
      <!-- autods:content:start -->
      DESCRIPTION_HERE
      <!-- autods:content:end -->
    </div>
    <div style="margin-top:16px;padding:12px 16px;background:#1e293b;border-left:4px solid #0ea5e9;border-radius:0 6px 6px 0;font-size:12.5px;color:#cbd5e1;">
      <strong>Specs & Dimensions:</strong> DIMENSIONS_HERE
    </div>
  </div>

  <!-- Guarantee Grid -->
  <div style="padding:18px 24px;background:#1e293b;border-top:1px solid #334155;display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;text-align:center;">
    <div style="padding:10px;background:#0f172a;border-radius:6px;border:1px solid #334155;">
      <span style="color:#38bdf8;font-size:18px;display:block;margin-bottom:3px;">🚀</span>
      <strong style="color:#ffffff;font-size:12.5px;display:block;">Tracked Express</strong>
      <span style="color:#94a3b8;font-size:11px;">Prompt dispatch with live tracking</span>
    </div>
    <div style="padding:10px;background:#0f172a;border-radius:6px;border:1px solid #334155;">
      <span style="color:#38bdf8;font-size:18px;display:block;margin-bottom:3px;">🛡️</span>
      <strong style="color:#ffffff;font-size:12.5px;display:block;">30-Day Guarantee</strong>
      <span style="color:#94a3b8;font-size:11px;">Full refund or replacement guarantee</span>
    </div>
    <div style="padding:10px;background:#0f172a;border-radius:6px;border:1px solid #334155;">
      <span style="color:#38bdf8;font-size:18px;display:block;margin-bottom:3px;">🔒</span>
      <strong style="color:#ffffff;font-size:12.5px;display:block;">Secure Checkout</strong>
      <span style="color:#94a3b8;font-size:11px;">Protected by official eBay buyer safety</span>
    </div>
  </div>
</div>`,
  },
  {
    id: "builtin-store-trust",
    name: "Verified Storefront Trust",
    category: "general",
    accent: "#059669",
    description: "Classic high-trust retail design featuring verified badges, emerald accents, and prominent buyer protection guarantees.",
    html: `<div data-autods-template="builtin-store-trust" class="autods-template-root" style="font-family:${fontStack};color:#1f2937;line-height:1.6;max-width:920px;margin:0 auto;background:#ffffff;border:2px solid #059669;border-radius:12px;overflow:hidden;">
  <!-- Trust Header Banner -->
  <div style="background:#059669;color:#ffffff;padding:12px 24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;font-size:12.5px;font-weight:700;">
    <div>⭐ VERIFIED TOP RATED STORE · 100% POSITIVE FEEDBACK</div>
    <div>FAST DISPATCH · MONEY BACK GUARANTEE</div>
  </div>

  <!-- Title Bar -->
  <div style="padding:22px 26px;background:#f0fdf4;border-bottom:1px solid #bbf7d0;">
    <h1 style="margin:0 0 6px;font-size:23px;font-weight:800;color:#065f46;line-height:1.35;">TITLE_HERE</h1>
    <span style="font-size:12.5px;color:#166534;font-weight:600;">✓ Brand New In Sealed Box · 100% Genuine Guaranteed</span>
  </div>

  <!-- Main Image & Gallery -->
  <div style="padding:22px 24px;text-align:center;">
    <div style="max-width:500px;margin:0 auto;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px;">
      MAIN_IMAGE_HERE
    </div>
    GALLERY_IMAGES_HERE
  </div>

  <!-- Product Features -->
  <div style="padding:22px 26px;background:#f9fafb;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;">
    <h2 style="margin:0 0 14px;font-size:17.5px;font-weight:700;color:#065f46;">Why Choose This Item?</h2>
    <div style="background:#ffffff;padding:16px 20px;border:1px solid #e5e7eb;border-radius:8px;">
      FEATURES_HERE
    </div>
  </div>

  <!-- Specifications -->
  <div style="padding:22px 26px;border-bottom:1px solid #e5e7eb;">
    <h2 style="margin:0 0 14px;font-size:17.5px;font-weight:700;color:#111827;">Detailed Item Specifics</h2>
    SPECIFICATIONS_HERE
  </div>

  <!-- Description -->
  <div style="padding:22px 26px;">
    <h2 style="margin:0 0 14px;font-size:17.5px;font-weight:700;color:#111827;">Overview & Information</h2>
    <div style="font-size:14.5px;color:#374151;line-height:1.75;">
      <!-- autods:content:start -->
      DESCRIPTION_HERE
      <!-- autods:content:end -->
    </div>
    <div style="margin-top:16px;padding:12px 16px;background:#f0fdf4;border-left:4px solid #059669;border-radius:0 6px 6px 0;font-size:13px;color:#166534;">
      <strong>Dimensions / Measurements:</strong> DIMENSIONS_HERE
    </div>
  </div>

  <!-- Store Guarantee Cards -->
  <div style="padding:20px 24px;background:#f0fdf4;border-top:1px solid #bbf7d0;display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;text-align:center;">
    <div style="background:#ffffff;padding:14px;border:1px solid #bbf7d0;border-radius:8px;">
      <span style="font-size:20px;display:block;margin-bottom:4px;">🚚</span>
      <strong style="color:#065f46;display:block;font-size:13px;margin-bottom:3px;">Express Delivery</strong>
      <span style="color:#4b5563;font-size:11.5px;">Tracked shipping worldwide</span>
    </div>
    <div style="background:#ffffff;padding:14px;border:1px solid #bbf7d0;border-radius:8px;">
      <span style="font-size:20px;display:block;margin-bottom:4px;">🔄</span>
      <strong style="color:#065f46;display:block;font-size:13px;margin-bottom:3px;">30 Days Return</strong>
      <span style="color:#4b5563;font-size:11.5px;">Hassle-free return policy</span>
    </div>
    <div style="background:#ffffff;padding:14px;border:1px solid #bbf7d0;border-radius:8px;">
      <span style="font-size:20px;display:block;margin-bottom:4px;">💬</span>
      <strong style="color:#065f46;display:block;font-size:13px;margin-bottom:3px;">24/7 Support</strong>
      <span style="color:#4b5563;font-size:11.5px;">We're always here to assist</span>
    </div>
  </div>
</div>`,
  },
  {
    id: "builtin-home-living",
    name: "Home, Kitchen & Living",
    category: "home",
    accent: "#d97706",
    description: "Warm amber & neutral design tailored for home decor, kitchenware, furniture, tools, and lifestyle products.",
    html: `<div data-autods-template="builtin-home-living" class="autods-template-root" style="font-family:${fontStack};color:#334155;line-height:1.6;max-width:920px;margin:0 auto;background:#ffffff;border:1px solid #fef3c7;border-radius:12px;overflow:hidden;box-shadow:0 8px 24px rgba(217,119,6,0.06);">
  <div style="background:#d97706;color:#ffffff;padding:12px 24px;text-align:center;font-weight:700;font-size:12.5px;letter-spacing:0.04em;">
    🌿 HOME & LIVING ESSENTIALS · PREMIUM QUALITY YOU CAN TRUST
  </div>

  <div style="padding:24px 26px 16px;background:#fffbeb;border-bottom:1px solid #fde68a;">
    <h1 style="margin:0 0 6px;font-size:23px;font-weight:800;color:#78350f;line-height:1.35;">TITLE_HERE</h1>
    <span style="font-size:12.5px;color:#92400e;">Durable construction · Everyday convenience · Beautiful modern finish</span>
  </div>

  <div style="padding:22px 24px;text-align:center;">
    <div style="max-width:500px;margin:0 auto;background:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:12px;">
      MAIN_IMAGE_HERE
    </div>
    GALLERY_IMAGES_HERE
  </div>

  <div style="padding:22px 26px;background:#fffbeb;border-top:1px solid #fde68a;border-bottom:1px solid #fde68a;">
    <h2 style="margin:0 0 14px;font-size:17.5px;font-weight:700;color:#78350f;">Product Features & Benefits</h2>
    <div style="background:#ffffff;padding:16px 20px;border:1px solid #fde68a;border-radius:8px;">
      FEATURES_HERE
    </div>
  </div>

  <div style="padding:22px 26px;border-bottom:1px solid #f1f5f9;">
    <h2 style="margin:0 0 14px;font-size:17.5px;font-weight:700;color:#0f172a;">Specifications & Details</h2>
    SPECIFICATIONS_HERE
  </div>

  <div style="padding:22px 26px;">
    <h2 style="margin:0 0 14px;font-size:17.5px;font-weight:700;color:#0f172a;">Complete Description</h2>
    <div style="font-size:14.5px;color:#334155;line-height:1.75;">
      <!-- autods:content:start -->
      DESCRIPTION_HERE
      <!-- autods:content:end -->
    </div>
    <div style="margin-top:16px;padding:12px 16px;background:#fffbeb;border-left:4px solid #d97706;border-radius:0 6px 6px 0;font-size:13px;color:#78350f;">
      <strong>Dimensions / Sizing:</strong> DIMENSIONS_HERE
    </div>
  </div>

  <div style="padding:18px 24px;background:#fffbeb;border-top:1px solid #fde68a;display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;text-align:center;">
    <div><strong>🚚 Prompt Shipping</strong><br /><span style="font-size:11.5px;color:#64748b;">Carefully wrapped for safe transit</span></div>
    <div><strong>🛡️ 30-Day Guarantee</strong><br /><span style="font-size:11.5px;color:#64748b;">Hassle-free money back guarantee</span></div>
    <div><strong>⭐ Top Rated Service</strong><br /><span style="font-size:11.5px;color:#64748b;">Responsive seller assistance</span></div>
  </div>
</div>`,
  },
  {
    id: "builtin-minimal-clean",
    name: "Clean Minimalist (No-Frills)",
    category: "minimal",
    accent: "#64748b",
    description: "Streamlined, distraction-free layout with clean gallery, large images, and readable typography for simple listings.",
    html: `<div data-autods-template="builtin-minimal-clean" class="autods-template-root" style="font-family:${fontStack};color:#1e293b;line-height:1.65;max-width:880px;margin:0 auto;padding:24px;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;">
  <h1 style="margin:0 0 18px;font-size:22px;font-weight:700;color:#0f172a;line-height:1.35;text-align:center;">TITLE_HERE</h1>

  <div style="margin:18px 0;text-align:center;">
    <div style="max-width:500px;margin:0 auto;padding:10px;border:1px solid #f1f5f9;border-radius:8px;">
      MAIN_IMAGE_HERE
    </div>
    GALLERY_IMAGES_HERE
  </div>

  <div style="margin:20px 0;padding:18px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
    <h3 style="margin:0 0 12px;font-size:16px;color:#0f172a;">Item Highlights</h3>
    FEATURES_HERE
  </div>

  <div style="margin:20px 0;">
    <h3 style="margin:0 0 12px;font-size:16px;color:#0f172a;">Product Details</h3>
    SPECIFICATIONS_HERE
  </div>

  <div style="margin:20px 0;">
    <h3 style="margin:0 0 12px;font-size:16px;color:#0f172a;">Description</h3>
    <div style="font-size:14.5px;color:#334155;">
      <!-- autods:content:start -->
      DESCRIPTION_HERE
      <!-- autods:content:end -->
    </div>
    <p style="margin-top:14px;font-size:13px;color:#64748b;"><strong>Dimensions:</strong> DIMENSIONS_HERE</p>
  </div>

  <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-around;font-size:12.5px;color:#64748b;text-align:center;flex-wrap:wrap;gap:12px;">
    <span>✓ Fast & Tracked Shipping</span>
    <span>✓ 30-Day Returns</span>
    <span>✓ 100% Satisfaction Guaranteed</span>
  </div>
</div>`,
  },
];

export function createBlankTemplate(name = "Untitled Template") {
  return {
    id: `custom-${Date.now()}`,
    name,
    category: "general",
    accent: "#4f46e5",
    description: "Custom user-created template.",
    html: `<div data-autods-template="custom" class="autods-template-root" style="font-family:${fontStack};max-width:900px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:10px;">
  <h1 style="margin:0 0 16px;font-size:22px;color:#0f172a;">TITLE_HERE</h1>
  <div style="margin:16px 0;text-align:center;">MAIN_IMAGE_HERE</div>
  GALLERY_IMAGES_HERE
  <div style="margin:20px 0;">
    <h3 style="font-size:16px;">Key Highlights</h3>
    FEATURES_HERE
  </div>
  <div style="margin:20px 0;">
    <h3 style="font-size:16px;">Specifications</h3>
    SPECIFICATIONS_HERE
  </div>
  <div style="margin:20px 0;">
    <h3 style="font-size:16px;">Description</h3>
    <!-- autods:content:start -->
    DESCRIPTION_HERE
    <!-- autods:content:end -->
  </div>
  <p style="font-size:13px;color:#64748b;">Dimensions: DIMENSIONS_HERE</p>
</div>`,
    custom: true,
  };
}

// Sample images that are guaranteed 200 OK with no-referrer
const PREVIEW_MAIN_IMAGE = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80";
const PREVIEW_GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80",
];

export function cleanSupplierDescription(raw) {
  if (!raw || typeof raw !== "string") return "";
  let clean = raw;
  // Remove figures and images from supplier raw text so they don't duplicate
  clean = clean.replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi, "");
  clean = clean.replace(/<img\b[^>]*\/?>/gi, "");
  clean = clean.replace(/<span\b[^>]*class="[^"]*image-inline[^"]*"[^>]*>[\s\S]*?<\/span>/gi, "");
  // Remove empty paragraphs & empty divs
  clean = clean.replace(/<p\b[^>]*>(\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, "");
  clean = clean.replace(/<div\b[^>]*>(\s|&nbsp;|<br\s*\/?>)*<\/div>/gi, "");
  // Remove bogus CKEditor spans
  clean = clean.replace(/<span\b[^>]*class="[^"]*ck-[^"]*"[^>]*>([\s\S]*?)<\/span>/gi, "$1");
  return clean.trim();
}

export function isTemplatedDescription(html) {
  if (!html || typeof html !== "string") return false;
  return (
    html.includes("data-autods-template") ||
    html.includes("autods-template-root") ||
    html.includes("<!-- autods:template") ||
    builtInTemplates.some((tpl) => html.includes(`data-autods-template="${tpl.id}"`) || html.includes(tpl.name))
  );
}

export function extractTemplateId(html) {
  if (!html || typeof html !== "string") return "";
  const match = html.match(/data-autods-template="([^"]+)"/) || html.match(/<!-- autods:template:([^\s]+) -->/);
  return match ? match[1] : "";
}

export function extractDescriptionContent(html) {
  if (!html || typeof html !== "string") return "";
  const markerMatch = html.match(/<!-- autods:content:start -->([\s\S]*?)<!-- autods:content:end -->/i);
  if (markerMatch && markerMatch[1]) {
    return cleanSupplierDescription(markerMatch[1]);
  }
  return cleanSupplierDescription(html);
}

export const extractCleanDescription = extractDescriptionContent;

export function fillTemplatePreview(html) {
  const sampleFeatures = `<ul style="margin:8px 0;padding-left:20px;line-height:1.75;color:#334155;">
    <li><strong>Active Noise Cancellation:</strong> Dual-processor noise canceling technology with 8 specialized microphones</li>
    <li><strong>Exceptional Hi-Res Audio:</strong> Engineered 30mm precision carbon fiber drivers for crystal-clear acoustic fidelity</li>
    <li><strong>30-Hour Ultra Battery:</strong> Quick 3-minute rapid charge provides up to 3 hours of continuous playback</li>
    <li><strong>Ultra-Comfort Ergonomics:</strong> Soft-fit synthetic leather headband and ear cushions for all-day listening</li>
    <li><strong>Multipoint Bluetooth 5.2:</strong> Seamlessly pair two Bluetooth devices simultaneously with smart auto-switch</li>
  </ul>`;

  const mainImgTag = `<img src="${PREVIEW_MAIN_IMAGE}" alt="Product Preview" referrerpolicy="no-referrer" width="460" height="380" style="max-width:100%;height:auto;max-height:380px;object-fit:contain;border-radius:8px;display:block;margin:0 auto;box-shadow:0 4px 16px rgba(0,0,0,0.06);" />`;

  const galleryImgTag = `<div style="display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:12px;margin:16px 0;padding:6px 0;">
    ${PREVIEW_GALLERY_IMAGES.map((url, idx) => `
      <div style="flex:0 1 150px;width:150px;max-width:160px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px;text-align:center;box-sizing:border-box;">
        <img src="${url}" alt="Gallery angle ${idx + 1}" referrerpolicy="no-referrer" width="134" height="130" style="width:100%;height:130px;max-height:130px;object-fit:contain;border-radius:6px;display:block;margin:0 auto;" />
      </div>
    `).join("")}
  </div>`;

  const sampleSpecs = `<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:13px;line-height:1.6;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
    <tr style="border-bottom:1px solid #e2e8f0;background:#f8fafc;"><td style="padding:9px 14px;font-weight:600;color:#475569;width:35%;">Brand</td><td style="padding:9px 14px;color:#0f172a;">Sony</td></tr>
    <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:9px 14px;font-weight:600;color:#475569;">Model Series</td><td style="padding:9px 14px;color:#0f172a;">WH-1000XM5 Wireless Headphones</td></tr>
    <tr style="border-bottom:1px solid #e2e8f0;background:#f8fafc;"><td style="padding:9px 14px;font-weight:600;color:#475569;">Connectivity</td><td style="padding:9px 14px;color:#0f172a;">Bluetooth 5.2 / 3.5mm Audio Cable</td></tr>
    <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:9px 14px;font-weight:600;color:#475569;">Battery Life</td><td style="padding:9px 14px;color:#0f172a;">Up to 30 Hours (ANC On)</td></tr>
    <tr><td style="padding:9px 14px;font-weight:600;color:#475569;">Condition</td><td style="padding:9px 14px;color:#0f172a;">100% Brand New in Original Sealed Packaging</td></tr>
  </table>`;

  const sampleDesc = `<p style="margin:0 0 12px;">Experience an unprecedented acoustic standard. With two processors controlling eight microphones, Auto NC Optimizer for automatically optimizing noise canceling based on your wearing conditions and environment, and a specially designed driver unit, these headphones offer industry-leading noise cancellation that delivers a whole new listening experience.</p>
  <p style="margin:0;">From airplane noise to people's voices, our noise cancelling technology keeps out more high and mid-frequency sounds than ever. Precise Voice Pickup technology uses four beamforming microphones and an AI-based noise reduction algorithm to isolate your voice accurately, ensuring crystal-clear phone calls even in noisy surroundings.</p>`;

  return (html || "")
    .replace(/TITLE_HERE/g, "Sony WH-1000XM5 Premium Wireless Noise Canceling Over-Ear Headphones")
    .replace(/MAIN_IMAGE_HERE/g, mainImgTag)
    .replace(/GALLERY_IMAGES_HERE/g, galleryImgTag)
    .replace(/FEATURES_HERE/g, sampleFeatures)
    .replace(/SPECIFICATIONS_HERE/g, sampleSpecs)
    .replace(/DESCRIPTION_HERE/g, sampleDesc)
    .replace(/DIMENSIONS_HERE/g, "8.9 × 7.4 × 2.9 inches · Weight: 8.8 oz (250g)");
}

export function applyTemplateToProduct(html, product = {}, templateId = "") {
  const title = (product.title || product.itemTitle || "Product").trim();
  const titleEscaped = title.replace(/"/g, "&quot;");

  // Extract all images
  let allImages = [];
  if (Array.isArray(product.images) && product.images.length > 0) {
    allImages = product.images
      .map((img) => (typeof img === "string" ? img : img?.url || img?.imageUrl || ""))
      .filter(Boolean);
  } else if (product.image_url || product.imageUrl) {
    allImages = [product.image_url || product.imageUrl];
  }

  // Find main image
  const selectedObj = Array.isArray(product.images)
    ? product.images.find((img) => typeof img === "object" && img?.selected)
    : null;
  const mainImageUrl = selectedObj?.url || selectedObj?.imageUrl || allImages[0] || product.image_url || product.imageUrl || "";

  const mainImgTag = mainImageUrl
    ? `<img src="${mainImageUrl}" alt="${titleEscaped}" referrerpolicy="no-referrer" width="460" height="380" style="max-width:100%;height:auto;max-height:380px;object-fit:contain;border-radius:8px;display:block;margin:0 auto;box-shadow:0 4px 16px rgba(0,0,0,0.06);" />`
    : "";

  // Secondary gallery images (up to 4 in a neat row)
  const secondaryImages = allImages.filter((url) => url !== mainImageUrl).slice(0, 4);
  const galleryHtml = secondaryImages.length > 0
    ? `<div style="display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:12px;margin:16px 0;padding:6px 0;">
        ${secondaryImages.map((url, i) => `
          <div style="flex:0 1 150px;width:150px;max-width:160px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px;text-align:center;box-sizing:border-box;">
            <img src="${url}" alt="${titleEscaped} - View ${i + 1}" referrerpolicy="no-referrer" width="134" height="130" style="width:100%;height:130px;max-height:130px;object-fit:contain;border-radius:6px;display:block;margin:0 auto;" />
          </div>
        `).join("")}
      </div>`
    : "";

  // Clean description text (strip embedded supplier images to avoid duplicate clutter)
  const rawInput = product.cleanDescription || product.description || title;
  const rawClean = extractDescriptionContent(rawInput) || cleanSupplierDescription(rawInput) || title;
  const descriptionHtml = rawClean.startsWith("<")
    ? rawClean
    : rawClean
        .split("\n\n")
        .map((p) => `<p style="margin:0 0 12px;line-height:1.7;">${p.replace(/\n/g, "<br />")}</p>`)
        .join("");

  // Features
  let featuresHtml = "";
  if (product.features && typeof product.features === "string") {
    featuresHtml = product.features;
  } else if (Array.isArray(product.features) && product.features.length > 0) {
    featuresHtml = `<ul style="margin:8px 0;padding-left:20px;line-height:1.75;color:#334155;">
      ${product.features.map((f) => `<li>${f}</li>`).join("")}
    </ul>`;
  } else {
    featuresHtml = `<ul style="margin:8px 0;padding-left:20px;line-height:1.75;color:#334155;">
      <li><strong>Premium Quality Construction:</strong> Fabricated with high-grade, durable materials designed for longevity.</li>
      <li><strong>Fast Tracked Delivery:</strong> Promptly dispatched with full tracking provided upon shipment.</li>
      <li><strong>100% Satisfaction Guarantee:</strong> Easy 30-day returns and dedicated seller customer support.</li>
    </ul>`;
  }

  // Specifications
  let specsHtml = "";
  if (product.specifications && Array.isArray(product.specifications) && product.specifications.length > 0) {
    specsHtml = `<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:13px;line-height:1.6;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      ${product.specifications.map((s, idx) => `
        <tr style="border-bottom:1px solid #e2e8f0;${idx % 2 === 0 ? "background:#f8fafc;" : ""}">
          <td style="padding:9px 14px;font-weight:600;color:#475569;width:35%;">${s.name || s.key || "Property"}</td>
          <td style="padding:9px 14px;color:#0f172a;">${s.value || "—"}</td>
        </tr>
      `).join("")}
    </table>`;
  } else {
    specsHtml = `<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:13px;line-height:1.6;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      <tr style="border-bottom:1px solid #e2e8f0;background:#f8fafc;"><td style="padding:9px 14px;font-weight:600;color:#475569;width:35%;">Condition</td><td style="padding:9px 14px;color:#0f172a;">Brand New in Factory Packaging</td></tr>
      <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:9px 14px;font-weight:600;color:#475569;">Authenticity</td><td style="padding:9px 14px;color:#0f172a;">100% Original & Verified</td></tr>
      <tr><td style="padding:9px 14px;font-weight:600;color:#475569;">Delivery</td><td style="padding:9px 14px;color:#0f172a;">Fast Shipping with Tracking</td></tr>
    </table>`;
  }

  const dimensions = product.dimensions || product.size || "Standard retail dimensions";

  let compiled = (html || "")
    .replace(/TITLE_HERE/g, title)
    .replace(/MAIN_IMAGE_HERE/g, mainImgTag)
    .replace(/GALLERY_IMAGES_HERE/g, galleryHtml)
    .replace(/FEATURES_HERE/g, featuresHtml)
    .replace(/SPECIFICATIONS_HERE/g, specsHtml)
    .replace(/DESCRIPTION_HERE/g, descriptionHtml)
    .replace(/DIMENSIONS_HERE/g, dimensions);

  if (templateId && !compiled.includes("data-autods-template")) {
    compiled = compiled.replace(
      /^(\s*<div\b)/i,
      `$1 data-autods-template="${templateId}" class="autods-template-root"`
    );
  }

  return compiled;
}

export function allTemplates(customTemplates = []) {
  return [...builtInTemplates, ...customTemplates];
}

export function templateById(id, customTemplates = []) {
  return allTemplates(customTemplates).find((template) => template.id === id) ?? null;
}
