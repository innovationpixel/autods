export const selectAliItems        = (state) => state.aliexpress.marketplace.items;
export const selectAliLoading      = (state) => state.aliexpress.marketplace.loading;
export const selectAliError        = (state) => state.aliexpress.marketplace.error;
export const selectAliTotal        = (state) => state.aliexpress.marketplace.total;
export const selectAliSearchId     = (state) => state.aliexpress.marketplace.search_id;
export const selectAliRequiresAuth = (state) => state.aliexpress.marketplace.requires_auth;
export const selectAliCredentialsMissing = (state) => state.aliexpress.marketplace.credentials_missing;

export const selectAliConnection = (state) => state.aliexpress.connection;
export const selectAliConnected = (state) => Boolean(state.aliexpress.connection.connected);
export const selectAliConnectionLoading = (state) => Boolean(state.aliexpress.connection.loading);
export const selectAliPlatformReady = (state) => {
    const connection = state.aliexpress.connection;
    return Boolean(connection.connected || connection.platform_import_available);
};
export const selectAliPlatformUnavailable = (state) => {
    const connection = state.aliexpress.connection;
    if (connection.loading) return false;
    if (connection.credentials_configured === false) return false;
    return !(connection.connected || connection.platform_import_available);
};
export const selectAliCredentialsConfigured = (state) =>
    state.aliexpress.connection.credentials_configured !== false;
