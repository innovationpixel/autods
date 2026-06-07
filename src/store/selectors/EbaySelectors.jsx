// ─── Connections (multi-account) ──────────────────────────────────────────────
export const selectEbayConnections       = (state) => state.ebay.connections;
export const selectEbayConnectionsLoading = (state) => state.ebay.connectionsLoading;
export const selectEbayConnected         = (state) => state.ebay.connections.length > 0;
export const selectEbayPrimaryConnection = (state) =>
    state.ebay.connections.find((c) => c.is_primary) ?? state.ebay.connections[0] ?? null;

// Legacy alias — resolves to the primary connection object (for code that used selectEbayConnection)
export const selectEbayConnection = selectEbayPrimaryConnection;

export const selectEbaySyncingIds = (state) => state.ebay.syncingIds;
export const selectEbaySyncing    = (state) => state.ebay.syncingIds.length > 0;
export const selectEbayIsSyncing  = (id) => (state) => state.ebay.syncingIds.includes(id);

// ─── Listings / Drafts / Marketplace ─────────────────────────────────────────
export const selectEbayListings        = (state) => state.ebay.listings.data;
export const selectEbayListingsMeta    = (state) => state.ebay.listings.meta;
export const selectEbayListingsLoading = (state) => state.ebay.listings.loading;
export const selectEbayListingsError   = (state) => state.ebay.listings.error;

export const selectEbayDrafts        = (state) => state.ebay.drafts.data;
export const selectEbayDraftsMeta    = (state) => state.ebay.drafts.meta;
export const selectEbayDraftsLoading = (state) => state.ebay.drafts.loading;
export const selectEbayDraftsError   = (state) => state.ebay.drafts.error;

export const selectMarketplaceItems   = (state) => state.ebay.marketplace.items;
export const selectMarketplaceLoading = (state) => state.ebay.marketplace.loading;
export const selectMarketplaceError   = (state) => state.ebay.marketplace.error;
