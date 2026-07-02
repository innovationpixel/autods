import { getListingImageUrl, getMarketplaceProductImages, normalizeImageUrl } from "../components/autods/helpers";

function uid(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildVariantsFromItem(item) {
  const editorVariants = item.raw_source_data?.draft_editor?.variants;
  if (Array.isArray(editorVariants)) {
    if (editorVariants.length === 0) {
      return [
        {
          id: "default",
          label: "Default",
          price: Number(item.price ?? 0),
          quantity: Number(item.quantity ?? 1),
          image: getListingImageUrl(item),
          selected: true,
        },
      ];
    }

    return editorVariants.map((variant, index) => ({
      id: variant.id ?? uid(`variant-${index}`),
      label: variant.label ?? `Variant ${index + 1}`,
      price: Number(variant.price ?? item.price ?? 0),
      quantity: Number(variant.quantity ?? item.quantity ?? 1),
      image: normalizeImageUrl(variant.image) ?? null,
      selected: variant.selected !== false,
    }));
  }

  const savedVariants = item.raw_source_data?.draft_variants;
  if (Array.isArray(savedVariants) && savedVariants.length) {
    return savedVariants.map((variant, index) => ({
      id: variant.id ?? uid(`variant-${index}`),
      label: variant.label ?? `Variant ${index + 1}`,
      price: Number(variant.price ?? item.price ?? 0),
      quantity: Number(variant.quantity ?? item.quantity ?? 1),
      image: normalizeImageUrl(variant.image) ?? null,
      selected: variant.selected !== false,
    }));
  }

  const skus = item.raw_source_data?.skus;
  if (Array.isArray(skus) && skus.length) {
    return skus.map((sku, index) => ({
      id: String(sku.sku_id ?? sku.id ?? uid(`variant-${index}`)),
      label:
        sku.properties?.map((p) => p.value).filter(Boolean).join(" / ") || `Variant ${index + 1}`,
      price: Number(sku.price ?? item.price ?? 0),
      quantity: Number(sku.quantity ?? item.quantity ?? 1),
      image: normalizeImageUrl(sku.properties?.find((p) => p.image)?.image) ?? null,
      selected: true,
    }));
  }

  return [
    {
      id: "default",
      label: "Default",
      price: Number(item.price ?? 0),
      quantity: Number(item.quantity ?? 1),
      image: getListingImageUrl(item),
      selected: true,
    },
  ];
}

function collectImportImageUrls(item) {
  const urls = [];
  const seen = new Set();

  const push = (candidate) => {
    const url = normalizeImageUrl(typeof candidate === "object" ? candidate?.url : candidate);
    if (url && !seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
  };

  for (const entry of item.raw_source_data?.images ?? []) {
    push(entry);
  }

  for (const sku of item.raw_source_data?.skus ?? []) {
    for (const prop of sku.properties ?? []) {
      push(prop.image);
    }
  }

  getMarketplaceProductImages(item).forEach(push);

  return urls;
}

function buildImagesFromItem(item) {
  const editorImages = item.raw_source_data?.draft_editor?.images;
  if (Array.isArray(editorImages)) {
    return editorImages
      .map((image, index) => ({
        id: image.id ?? uid(`image-${index}`),
        url: normalizeImageUrl(image.url) ?? "",
        selected: image.selected !== false,
      }))
      .filter((image) => image.url);
  }

  const allUrls = collectImportImageUrls(item);
  const savedUrls = new Set(
    (item.images ?? [])
      .map((image) => normalizeImageUrl(typeof image === "object" ? image?.url : image))
      .filter(Boolean),
  );

  if (savedUrls.size > 0) {
    const baseUrls = allUrls.length ? allUrls : [...savedUrls];
    return baseUrls.map((url, index) => ({
      id: uid(`image-${index}`),
      url,
      selected: savedUrls.has(url),
    }));
  }

  return allUrls.map((url, index) => ({
    id: uid(`image-${index}`),
    url,
    selected: true,
  }));
}

function buildSpecificsFromItem(item) {
  const editorSpecifics = item.raw_source_data?.draft_editor?.specifics;
  if (Array.isArray(editorSpecifics)) {
    return editorSpecifics.map((row, index) => ({
      id: row.id ?? uid(`specific-${index}`),
      name: row.name ?? "",
      value: row.value ?? "",
    }));
  }

  const raw = item.raw_source_data?.specifics ?? item.raw_source_data?.attributes;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return Object.entries(raw).map(([name, value], index) => ({
      id: uid(`specific-${index}`),
      name,
      value: String(value),
    }));
  }

  if (Array.isArray(raw)) {
    return raw.map((row, index) => ({
      id: uid(`specific-${index}`),
      name: row.name ?? row.label ?? `Attribute ${index + 1}`,
      value: row.value ?? "",
    }));
  }

  return [
    { id: uid("specific-brand"), name: "Brand", value: item.raw_source_data?.brand ?? "Unbranded" },
    { id: uid("specific-type"), name: "Type", value: item.category_name ?? "—" },
    { id: uid("specific-condition"), name: "Condition", value: item.condition ?? "New" },
  ];
}

function resolveImportedDescription(item) {
  const raw = item.raw_source_data ?? {};
  const candidates = [raw.description, raw.detail, item.description];

  for (const candidate of candidates) {
    if (typeof candidate !== "string") {
      continue;
    }

    const trimmed = candidate.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  return "";
}

export function buildDraftFormState(item) {
  const saved = item.raw_source_data?.draft_editor ?? {};
  const monitoring = saved.monitoring ?? {};

  return {
    title: item.title ?? "",
    description: saved.description ?? resolveImportedDescription(item),
    price: Number(item.price ?? 0),
    quantity: Number(item.quantity ?? 1),
    condition: saved.condition ?? item.condition ?? "NEW",
    brand: saved.brand ?? item.raw_source_data?.brand ?? "Unbranded",
    mpn: saved.mpn ?? item.raw_source_data?.mpn ?? "Does Not Apply",
    zipCode: saved.zipCode ?? (item.warehouse_country === "US" ? "10001" : ""),
    allowBestOffer: saved.allowBestOffer ?? false,
    categoryId: saved.categoryId ?? item.category_id ?? "",
    categoryName: saved.categoryName ?? item.category_name ?? "",
    variants: buildVariantsFromItem(item),
    images: buildImagesFromItem(item),
    specifics: buildSpecificsFromItem(item),
    monitoring: {
      dynamicPricing: monitoring.dynamicPricing ?? true,
      outOfStockMonitoring: monitoring.outOfStockMonitoring ?? true,
      buyPrice: Number(monitoring.buyPrice ?? item.buy_price ?? 0),
      profit: Number(monitoring.profit ?? item.profit ?? 0),
    },
  };
}

export function mergeDraftFormState(item, overrides = {}) {
  return {
    ...buildDraftFormState(item),
    ...overrides,
  };
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function serializeDraftFormForApi(form) {
  const selectedImages = form.images.filter((image) => image.selected && image.url);
  const primaryImage = selectedImages[0]?.url ?? form.images.find((image) => image.url)?.url ?? null;
  const buyPrice = roundMoney(form.monitoring.buyPrice);
  const profit = roundMoney(form.monitoring.profit);
  const listPrice = roundMoney(buyPrice + profit);

  return {
    title: form.title,
    description: form.description,
    price: listPrice,
    quantity: Math.max(1, Number(form.quantity) || 1),
    condition: form.condition,
    category_id: form.categoryId || null,
    category_name: form.categoryName || null,
    buy_price: buyPrice,
    profit,
    images: selectedImages.map((image) => ({ url: image.url })),
    image_url: primaryImage,
    draft_editor: {
      condition: form.condition,
      brand: form.brand,
      mpn: form.mpn,
      zipCode: form.zipCode,
      allowBestOffer: form.allowBestOffer,
      categoryId: form.categoryId,
      categoryName: form.categoryName,
      description: form.description,
      variants: form.variants,
      images: form.images,
      specifics: form.specifics,
      monitoring: {
        ...form.monitoring,
        buyPrice,
        profit,
      },
    },
    variants: form.variants,
    specifics: form.specifics,
  };
}

export { uid };
