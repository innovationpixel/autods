export const selectEbayConnection  = (state) => state.ebay.connection;
export const selectEbayConnected   = (state) => state.ebay.connection.connected;
export const selectEbayUsername    = (state) => state.ebay.connection.ebay_username;

export const selectEbayListings    = (state) => state.ebay.listings.data;
export const selectEbayListingsMeta = (state) => state.ebay.listings.meta;
export const selectEbayListingsLoading = (state) => state.ebay.listings.loading;
export const selectEbaySyncing     = (state) => state.ebay.listings.syncing;
export const selectEbayListingsError = (state) => state.ebay.listings.error;

export const selectEbayDrafts      = (state) => state.ebay.drafts.data;
export const selectEbayDraftsLoading = (state) => state.ebay.drafts.loading;
export const selectEbayDraftsError = (state) => state.ebay.drafts.error;

export const selectMarketplaceItems = (state) => state.ebay.marketplace.items;
export const selectMarketplaceLoading = (state) => state.ebay.marketplace.loading;
export const selectMarketplaceError = (state) => state.ebay.marketplace.error;
