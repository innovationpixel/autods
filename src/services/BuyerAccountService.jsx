import axiosInstance from './AxiosInstance';

// Buyer account connection status — returns { connected, accounts: [] }
export const getBuyerAccounts = () =>
    axiosInstance.get('/buyer-accounts');

// Get an AliExpress OAuth authorization URL for connecting a buyer account
export const getBuyerAccountAuthUrl = (returnPath = '/settings?tab=buyer-accounts') =>
    axiosInstance.get('/buyer-accounts/auth-url', {
        params: { return_origin: window.location.origin, return_path: returnPath },
    });

// Rename (nickname) a connected buyer account
export const updateBuyerAccount = (id, data) =>
    axiosInstance.put(`/buyer-accounts/${id}`, data);

// Disconnect a buyer account
export const disconnectBuyerAccount = (id) =>
    axiosInstance.delete(`/buyer-accounts/${id}`);

// Set a buyer account as the default preselected in Order Processing
export const setPrimaryBuyerAccount = (id) =>
    axiosInstance.patch(`/buyer-accounts/${id}/primary`);
