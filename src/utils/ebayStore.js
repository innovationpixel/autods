/** Map eBay site_id (e.g. EBAY_AU) to a short country label for the UI. */
export function ebaySiteToCountry(siteId) {
  const map = {
    EBAY_US: 'US',
    EBAY_AU: 'AU',
    EBAY_GB: 'UK',
    EBAY_DE: 'DE',
    EBAY_CA: 'CA',
    EBAY_FR: 'FR',
    EBAY_IT: 'IT',
    EBAY_ES: 'ES',
  };

  if (!siteId) {
    return '—';
  }

  return map[siteId] ?? siteId.replace(/^EBAY_/i, '').slice(0, 3).toUpperCase();
}

/** Map eBay site_id to standard currency code (e.g. EBAY_GB → GBP) */
export function ebaySiteToCurrency(siteId) {
  const map = {
    EBAY_GB: 'GBP',
    EBAY_UK: 'GBP',
    EBAY_DE: 'EUR',
    EBAY_FR: 'EUR',
    EBAY_IT: 'EUR',
    EBAY_ES: 'EUR',
    EBAY_NL: 'EUR',
    EBAY_IE: 'EUR',
    EBAY_AT: 'EUR',
    EBAY_BE: 'EUR',
    EBAY_PL: 'EUR',
    EBAY_AU: 'AUD',
    EBAY_CA: 'CAD',
    EBAY_US: 'USD',
  };

  if (!siteId) {
    return 'USD';
  }

  return map[siteId] ?? 'USD';
}

/** Map eBay site_id to display currency symbol (e.g. EBAY_GB → £) */
export function ebaySiteToCurrencySymbol(siteId) {
  const currency = ebaySiteToCurrency(siteId);
  const symbolMap = {
    GBP: '£',
    EUR: '€',
    AUD: 'AU$',
    CAD: 'CA$',
    USD: '$',
  };

  return symbolMap[currency] ?? '$';
}

/** Sidebar / store label, e.g. EBAY_US → EBAY US */
export function ebaySiteToDisplayLabel(siteId) {
  if (!siteId) {
    return 'EBAY US';
  }

  return String(siteId).trim().replace(/_/g, ' ').toUpperCase();
}

export function storeInitialsFromName(name) {
  const cleaned = String(name ?? '').trim();
  if (!cleaned) {
    return 'EB';
  }

  const parts = cleaned.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return cleaned.slice(0, 2).toUpperCase();
}

export function truncateStoreLabel(name, maxLength = 20) {
  const text = String(name ?? '').trim();
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1)}…`;
}

export function ebayConnectionId(connectionId) {
  return `ebay-${connectionId}`;
}

export function parseEbayConnectionId(storeId) {
  const match = String(storeId).match(/^ebay-(\d+)$/);
  return match ? Number(match[1]) : null;
}

/** Build a store-switcher row from a backend eBay connection. */
export function mapEbayConnectionToStore(connection) {
  const rawUsername = String(connection.ebay_username ?? connection.store_name ?? connection.name ?? '').trim();
  // Filter out site identifiers like "EBAY_US", "EBAY US", "EBAY" so they aren't used as the store name
  const isSitePlaceholder = !rawUsername || /^ebay[\s_-]*(us|uk|gb|au|de|ca|fr|it|es)?$/i.test(rawUsername);
  const siteId = connection.site_id ?? 'EBAY_US';
  const siteDisplay = ebaySiteToDisplayLabel(siteId);
  const currency = connection.currency ?? ebaySiteToCurrency(siteId);
  const currencySymbol = connection.currency_symbol ?? ebaySiteToCurrencySymbol(siteId);

  const storeName = !isSitePlaceholder
    ? rawUsername
    : 'eBay Store';

  const name = storeName.toLowerCase().replace(/\s+/g, '-');

  return {
    id: ebayConnectionId(connection.id),
    connectionId: connection.id,
    name,
    storeName,
    sidebarName: truncateStoreLabel(storeName, 22),
    platformLabel: 'Platform',
    platformDisplay: 'EBAY',
    siteDisplay,
    initials: storeInitialsFromName(storeName),
    country: ebaySiteToCountry(siteId),
    currency,
    currencySymbol,
    marketplace: 'eBay',
    siteId,
    isPrimary: Boolean(connection.is_primary),
    orders: 0,
    products: 0,
    stockLimit: '—',
    priceLimit: '—',
    connection: 'API',
  };
}
