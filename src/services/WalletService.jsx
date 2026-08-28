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

export const depositWalletWireTransfer = (amount, screenshot, note) => {
    const formData = new FormData();
    formData.append('amount', amount);
    formData.append('screenshot', screenshot);
    if (note) {
        formData.append('note', note);
    }

    return axiosInstance.post('/wallet/deposit/wire-transfer', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

export const getWalletDepositScreenshot = (id) =>
    axiosInstance.get(`/wallet/deposits/${id}/screenshot`, { responseType: 'blob' });

export const transferToProcessingWallet = (amount) =>
    axiosInstance.post('/wallet/transfer-to-processing', { amount });
