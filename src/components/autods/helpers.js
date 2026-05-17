import { categoryFilters } from "./constants";

export function buildItem(item) {
  return {
    shipsTo: "United States",
    currency: "USD",
    shippingTag: "Best Sellers",
    gallery: item.gallery?.length ? item.gallery : [item.image],
    ...item,
  };
}

export function parsePriceValue(price) {
  const match = String(price).match(/(\d+(\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

const categoryLabels = categoryFilters
  .filter((category) => category.key !== "all")
  .map((category) => category.label);

export function getSectionCategory(section) {
  if (categoryLabels.includes(section.title)) {
    return section.title;
  }

  const categories = new Set(section.items.map((item) => item.category).filter(Boolean));

  if (categories.size === 1) {
    return [...categories][0];
  }

  return "All Categories";
}

export function formatDisplayDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function buildSparklinePoints(values) {
  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 96 + 2;
      const y = 26 - ((value - 1) / 5) * 18;

      return `${x},${y}`;
    })
    .join(" ");
}

export function buildPaginationItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
}

export function rewriteProductTitle(title) {
  return title
    .replace(/\.\.\.$/, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/(^\w)/, (match) => match.toUpperCase())
    .concat(" | AI Optimized");
}
