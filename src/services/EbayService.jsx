import axiosInstance from './AxiosInstance';

// eBay connection status — returns { connected, connections: [] }
export const getEbayStatus = () =>
    axiosInstance.get('/ebay/status');

// Get eBay OAuth authorization URL
export const getEbayAuthUrl = () =>
    axiosInstance.get('/ebay/auth-url', {
        params: { return_origin: window.location.origin },
    });

/** Finish OAuth when eBay shows its success page instead of redirecting to our callback. */
export const completeEbayOAuth = (payload) =>
    axiosInstance.post('/ebay/complete-oauth', payload);

// Disconnect a specific eBay account by connection ID
export const disconnectEbayConnection = (id) =>
    axiosInstance.delete(`/ebay/connections/${id}`);

// Set a connection as primary
export const setEbayPrimary = (id) =>
    axiosInstance.patch(`/ebay/connections/${id}/primary`);

// Sync listings for a specific connection
export const syncEbayListings = (id) =>
    axiosInstance.post(`/ebay/connections/${id}/sync`);

// Seller's own eBay listings — pass connectionId to scope to one account
export const getEbayListings = (params = {}) =>
    axiosInstance.get('/ebay/listings', { params });

// Draft listings
export const getEbayDrafts = (params = {}) =>
    axiosInstance.get('/ebay/drafts', { params });

// Browse eBay marketplace
export const searchEbayMarketplace = (params = {}) =>
    axiosInstance.get('/ebay/marketplace/search', { params });
