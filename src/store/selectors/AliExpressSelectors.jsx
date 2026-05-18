export const selectAliItems        = (state) => state.aliexpress.marketplace.items;
export const selectAliLoading      = (state) => state.aliexpress.marketplace.loading;
export const selectAliError        = (state) => state.aliexpress.marketplace.error;
export const selectAliTotal        = (state) => state.aliexpress.marketplace.total;
export const selectAliSearchId     = (state) => state.aliexpress.marketplace.search_id;
export const selectAliRequiresAuth = (state) => state.aliexpress.marketplace.requires_auth;

export const selectAliConnection = (state) => state.aliexpress.connection;
