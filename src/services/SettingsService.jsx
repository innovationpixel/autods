import axiosInstance from './AxiosInstance';

export const getAccountSettings = () =>
    axiosInstance.get('/settings');

export const updateAccountSettings = (settings) =>
    axiosInstance.put('/settings', { settings });

export const getAddonPricing = (config = {}) =>
    axiosInstance.get('/settings/addons', config);
