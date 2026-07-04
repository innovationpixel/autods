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
  const username = connection.ebay_username ?? '';
  const siteId = connection.site_id ?? 'EBAY_US';
  const siteDisplay = ebaySiteToDisplayLabel(siteId);
  const name = username
    ? username.toLowerCase().replace(/\s+/g, '-')
    : siteDisplay.toLowerCase().replace(/\s+/g, '-');

  return {
    id: ebayConnectionId(connection.id),
    connectionId: connection.id,
    name,
    sidebarName: truncateStoreLabel(username || siteDisplay, 18),
    platformLabel: 'Platform',
    platformDisplay: 'EBAY',
    siteDisplay,
    initials: username ? storeInitialsFromName(username) : ebaySiteToCountry(siteId) || 'EB',
    country: ebaySiteToCountry(siteId),
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
