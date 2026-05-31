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

export function formatCalculationAmount(value) {
  return `A$${Number(value).toFixed(2)}`;
}

export function formatCalculationRoi(value) {
  return `${Number(value).toFixed(1)}%`;
}

export function buildOrderCalculation(order, index = 0) {
  const earn = parsePriceValue(order.price);
  const cost = Number((earn * (0.42 + (index % 7) * 0.03)).toFixed(2));
  const shipping = Number((1.2 + (index % 4) * 0.65).toFixed(2));
  const profit = Number((earn - cost - shipping).toFixed(2));
  const roi = cost > 0 ? Number(((profit / cost) * 100).toFixed(1)) : 0;

  return {
    ...order,
    orderId: order.orderSellId || order.id,
    description: order.color,
    cost,
    shipping,
    earn,
    profit,
    roi,
  };
}

export function summarizeCalculations(rows) {
  const totals = rows.reduce(
    (acc, row) => {
      acc.cost += row.cost;
      acc.shipping += row.shipping;
      acc.earn += row.earn;
      acc.profit += row.profit;
      return acc;
    },
    { cost: 0, shipping: 0, earn: 0, profit: 0 },
  );

  const roi = totals.cost > 0 ? Number(((totals.profit / totals.cost) * 100).toFixed(1)) : 0;

  return { ...totals, roi };
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
