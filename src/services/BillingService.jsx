import axiosInstance from './AxiosInstance';

export const getAccountAlert = () =>
    axiosInstance.get('/billing/account-alert');

export const getPaymentMethods = () =>
    axiosInstance.get('/billing/payment-methods');

export const createStripeSetupIntent = () =>
    axiosInstance.post('/billing/payment-methods/stripe/setup-intent');

export const saveStripePaymentMethod = (paymentMethodId) =>
    axiosInstance.post('/billing/payment-methods/stripe', { payment_method_id: paymentMethodId });

export const savePayPalPaymentMethod = (email) =>
    axiosInstance.post('/billing/payment-methods/paypal', { email });

export const deletePaymentMethod = (id) =>
    axiosInstance.delete(`/billing/payment-methods/${id}`);

export const getPaymentHistory = (params = {}) =>
    axiosInstance.get('/billing/history', { params });
