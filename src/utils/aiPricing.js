export function formatAiUsd(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) {
    return "$0.00";
  }

  const r2 = Math.round(num * 100) / 100;
  const r3 = Math.round(num * 1000) / 1000;
  const r4 = Math.round(num * 10000) / 10000;

  if (Math.abs(r4 - r2) < 0.00005) {
    return `$${r2.toFixed(2)}`;
  }

  if (Math.abs(r4 - r3) < 0.00005) {
    return `$${r3.toFixed(3)}`;
  }

  return `$${r4.toFixed(4)}`;
}

export function formatAiInputUsd(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) {
    return "0.00";
  }

  const r2 = Math.round(num * 100) / 100;
  const r4 = Math.round(num * 10000) / 10000;
  if (Math.abs(r4 - r2) < 0.00005) {
    return r2.toFixed(2);
  }

  return Number(r4.toFixed(4)).toString();
}

export function formatCreditConversionLabel(pricePerCredit) {
  const rate = Math.max(0.0001, Number(pricePerCredit) || 0.02);
  if (rate <= 1) {
    const perDollar = 1 / rate;
    const formatted = Number.isInteger(perDollar)
      ? perDollar.toLocaleString()
      : (Math.round(perDollar * 100) / 100).toLocaleString();
    return `$1.00 = ${formatted} credits`;
  }
  return `10 credits = ${formatAiUsd(rate * 10)}`;
}

export function normalizeAiConfig(raw = {}) {
  const pricePerCredit = Math.max(0.0001, Number(raw.price_per_credit ?? 0.02) || 0.02);
  const creditsPerImage = Math.max(1, parseInt(raw.credits_per_image ?? 1, 10) || 1);
  const creditsPerTitle = Math.max(1, parseInt(raw.credits_per_title ?? 1, 10) || 1);
  const imageCostUsd =
    raw.image_cost_usd !== undefined
      ? Number(raw.image_cost_usd)
      : Math.round(creditsPerImage * pricePerCredit * 10000) / 10000;
  const titleCostUsd =
    raw.title_cost_usd !== undefined
      ? Number(raw.title_cost_usd)
      : Math.round(creditsPerTitle * pricePerCredit * 10000) / 10000;

  return {
    configured: Boolean(raw.configured),
    price_per_credit: pricePerCredit,
    credits_per_image: creditsPerImage,
    image_cost_usd: imageCostUsd,
    credits_per_title: creditsPerTitle,
    title_cost_usd: titleCostUsd,
    min_custom_credits: Math.max(
      1,
      parseInt(raw.min_custom_credits ?? Math.ceil(0.01 / pricePerCredit), 10) || 1
    ),
    ai_credits: raw.ai_credits !== undefined ? Number(raw.ai_credits) : undefined,
    wallet_balance: raw.wallet_balance !== undefined ? Number(raw.wallet_balance) : undefined,
    packages: Array.isArray(raw.packages) ? raw.packages : null,
  };
}
