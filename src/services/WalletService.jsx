import axiosInstance from './AxiosInstance';

export const getWalletSummary = () =>
    axiosInstance.get('/wallet');

export const getWalletTransactions = (params = {}) =>
    axiosInstance.get('/wallet/transactions', { params });

export const depositWalletStripe = (amount) =>
    axiosInstance.post('/wallet/deposit/stripe', {
        amount,
        return_origin: window.location.origin,
    });

export const depositWalletPayPal = (amount) =>
    axiosInstance.post('/wallet/deposit/paypal', {
        amount,
        return_origin: window.location.origin,
    });

export const confirmWalletDeposit = (payload) =>
    axiosInstance.post('/wallet/deposit/confirm', payload);
