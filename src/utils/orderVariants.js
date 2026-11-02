/**
 * Utility helpers for formatting and resolving order product variants.
 */

export function formatVariantAspects(aspects) {
  if (!aspects) return "";
  if (typeof aspects === "string") return aspects.trim();

  if (Array.isArray(aspects)) {
    return aspects
      .map((aspect) => {
        if (!aspect) return "";
        if (typeof aspect === "string") return aspect.trim();
        if (typeof aspect === "object") {
          const name =
            aspect.name ??
            aspect.localizedName ??
            aspect.skuPropertyName ??
            aspect.property_name ??
            "";
          const value =
            aspect.value ??
            aspect.localizedValue ??
            aspect.skuPropertyValue ??
            aspect.property_value ??
            "";
          if (name && value) return `${name}: ${value}`;
          return value || name || "";
        }
        return String(aspect);
      })
      .filter(Boolean)
      .join(", ");
  }

  if (typeof aspects === "object") {
    return Object.entries(aspects)
      .map(([k, v]) => {
        if (v == null) return "";
        const valStr = String(v).trim();
        if (!valStr) return "";
        return isNaN(Number(k)) ? `${k}: ${valStr}` : valStr;
      })
      .filter(Boolean)
      .join(", ");
  }

  return "";
}

export function resolveOrderVariant(order) {
  if (!order) return "";

  // 1. Explicit variant_title from backend model accessor
  if (
    typeof order.variant_title === "string" &&
    order.variant_title.trim() &&
    order.variant_title !== "—"
  ) {
    return order.variant_title.trim();
  }

  // 2. Direct variant property if set
  if (
    typeof order.variant === "string" &&
    order.variant.trim() &&
    order.variant !== "—"
  ) {
    return order.variant.trim();
  }

  const raw = order.raw_data ?? {};
  const firstItem = raw.lineItems?.[0] ?? {};

  // 3. Line item variation aspects from eBay Fulfillment API
  const ebayAspects =
    firstItem.lineItemFulfillmentInstructions?.variations ??
    firstItem.variationAspects ??
    firstItem.itemVariation?.variationAspects ??
    null;

  const formattedEbay = formatVariantAspects(ebayAspects);
  if (formattedEbay) return formattedEbay;

  // 4. Source variation (AliExpress supplier / mapped variation)
  const sourceVar = order.source_variation ?? raw.source_variation ?? null;
  const formattedSource = formatVariantAspects(sourceVar);
  if (formattedSource) return formattedSource;

  // 5. Direct variation string on raw_data or firstItem
  if (typeof raw.variation === "string" && raw.variation.trim()) {
    return raw.variation.trim();
  }
  if (typeof raw.variant === "string" && raw.variant.trim()) {
    return raw.variant.trim();
  }
  if (
    typeof firstItem.selectedVariation === "string" &&
    firstItem.selectedVariation.trim()
  ) {
    return firstItem.selectedVariation.trim();
  }

  return "";
}

/**
 * Automatically match and score the best AliExpress SKU for an order
 * based on order variation aspects, color, and title keywords.
 */
export function resolveBestSku(order, skus) {
  if (!Array.isArray(skus) || !skus.length) return null;
  if (skus.length === 1) return skus[0];

  const searchTerms = new Set();

  const variantStr = order.variant || order.variantTitle || order.color || "";
  if (variantStr && variantStr !== "—") {
    variantStr.split(/[,;\/|]/).forEach((part) => {
      const trimmed = part.trim();
      if (trimmed) {
        if (trimmed.includes(":")) {
          searchTerms.add(trimmed.split(":")[1].trim().toLowerCase());
        } else {
          searchTerms.add(trimmed.toLowerCase());
        }
      }
    });
  }

  const raw = order.raw_data ?? {};
  const firstItem = raw.lineItems?.[0] ?? {};
  const aspects =
    firstItem.lineItemFulfillmentInstructions?.variations ??
    firstItem.variationAspects ??
    firstItem.itemVariation?.variationAspects ??
    order.source_variation ??
    raw.source_variation ??
    [];

  if (Array.isArray(aspects)) {
    aspects.forEach((a) => {
      if (typeof a === "string" && a.trim()) {
        searchTerms.add(a.trim().toLowerCase());
      } else if (a && typeof a === "object") {
        const val = a.value ?? a.localizedValue ?? a.skuPropertyValue ?? a.property_value;
        if (val) searchTerms.add(String(val).trim().toLowerCase());
      }
    });
  }

  const titleWords = String(order.title ?? firstItem.title ?? "").toLowerCase().split(/\s+/);

  let bestCandidate = null;
  let bestScore = -1;

  for (const sku of skus) {
    const stock = Number(sku.stock ?? sku.inventory ?? 1);
    let score = stock > 0 ? 1 : 0;

    const props = Array.isArray(sku.properties) ? sku.properties : [];
    for (const prop of props) {
      const val = String(prop.value ?? prop.property_value ?? "").trim().toLowerCase();
      if (!val) continue;

      if (searchTerms.has(val)) {
        score += 10;
      } else {
        for (const term of searchTerms) {
          if (term && (term.includes(val) || val.includes(term))) {
            score += 5;
            break;
          }
        }
        if (titleWords.includes(val)) {
          score += 3;
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestCandidate = sku;
    }
  }

  return bestCandidate || skus.find((s) => Number(s.stock ?? s.inventory ?? 1) > 0) || skus[0];
}
