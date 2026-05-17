import axiosInstance from './AxiosInstance';

// eBay connection status
export const getEbayStatus = () =>
    axiosInstance.get('/ebay/status');

// Get eBay OAuth authorization URL (opens popup/redirect)
export const getEbayAuthUrl = () =>
    axiosInstance.get('/ebay/auth-url');

// Disconnect eBay account
export const disconnectEbay = () =>
    axiosInstance.delete('/ebay/disconnect');

// Seller's own eBay listings (Products page)
export const getEbayListings = (params = {}) =>
    axiosInstance.get('/ebay/listings', { params });

// Sync listings from eBay (pull latest from eBay API)
export const syncEbayListings = () =>
    axiosInstance.post('/ebay/listings/sync');

// Draft listings (Drafts page)
export const getEbayDrafts = (params = {}) =>
    axiosInstance.get('/ebay/drafts', { params });

// Browse eBay marketplace (Marketplace page)
export const searchEbayMarketplace = (params = {}) =>
    axiosInstance.get('/ebay/marketplace/search', { params });
