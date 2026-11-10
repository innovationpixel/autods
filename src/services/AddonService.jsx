import axiosInstance from './AxiosInstance';

export const getAddons = () =>
    axiosInstance.get('/addons');

export const purchaseAddonWithWallet = (key, payload = {}) =>
    axiosInstance.post(`/addons/${key}/purchase/wallet`, payload);

export const checkoutAddonStripe = (key, options = {}) =>
    axiosInstance.post(`/addons/${key}/checkout/stripe`, {
        return_origin: options.return_origin || window.location.origin,
        return_path: options.return_path || '/settings?tab=plans',
        cancel_path: options.cancel_path,
        ...(options.terms_accepted !== undefined ? { terms_accepted: options.terms_accepted } : {}),
        ...(options.privacy_accepted !== undefined ? { privacy_accepted: options.privacy_accepted } : {}),
    });

export const checkoutAddonPayPal = (key, options = {}) =>
    axiosInstance.post(`/addons/${key}/checkout/paypal`, {
        return_origin: options.return_origin || window.location.origin,
        return_path: options.return_path || '/settings?tab=plans',
        cancel_path: options.cancel_path,
        ...(options.terms_accepted !== undefined ? { terms_accepted: options.terms_accepted } : {}),
        ...(options.privacy_accepted !== undefined ? { privacy_accepted: options.privacy_accepted } : {}),
    });

export const confirmAddonStripe = (payload) =>
    axiosInstance.post('/addons/confirm-stripe', payload);

export const confirmAddonPayPal = (payload) =>
    axiosInstance.post('/addons/confirm-paypal', payload);

export const cancelAddonSubscription = (key) =>
    axiosInstance.post(`/addons/${key}/cancel`);

