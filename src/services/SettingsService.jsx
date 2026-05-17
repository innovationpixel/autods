import axiosInstance from './AxiosInstance';

export const getAccountSettings = () =>
    axiosInstance.get('/settings');

export const updateAccountSettings = (settings) =>
    axiosInstance.put('/settings', { settings });
