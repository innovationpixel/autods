import axiosInstance from './AxiosInstance';

export const getPlans = (params = {}) =>
    axiosInstance.get('/plans', { params });

export const getPlanById = (planId) =>
    axiosInstance.get(`/plans/${planId}`);

export const getCurrentPlan = () =>
    axiosInstance.get('/plans/current');

export const checkoutStripe = (planId, options = {}) =>
    axiosInstance.post(`/plans/${planId}/checkout/stripe`, {
        return_origin: options.return_origin || window.location.origin,
        return_path: options.return_path || '/plans',
        cancel_path: options.cancel_path,
        ...(options.terms_accepted !== undefined ? { terms_accepted: options.terms_accepted } : {}),
        ...(options.privacy_accepted !== undefined ? { privacy_accepted: options.privacy_accepted } : {}),
    });

export const checkoutPayPal = (planId, options = {}) =>
    axiosInstance.post(`/plans/${planId}/checkout/paypal`, {
        return_origin: options.return_origin || window.location.origin,
        return_path: options.return_path || '/plans',
        cancel_path: options.cancel_path,
        ...(options.terms_accepted !== undefined ? { terms_accepted: options.terms_accepted } : {}),
        ...(options.privacy_accepted !== undefined ? { privacy_accepted: options.privacy_accepted } : {}),
    });

export const activatePlan = (planId, payload = {}) =>
    axiosInstance.post(`/plans/${planId}/activate`, payload);

export const confirmStripePlan = (payload) =>
    axiosInstance.post('/plans/confirm-stripe', payload);

export const confirmPayPalPlan = (payload) =>
    axiosInstance.post('/plans/confirm-paypal', payload);

export const getAdminPlans = () =>
    axiosInstance.get('/admin/plans');

export const createAdminPlan = (data) =>
    axiosInstance.post('/admin/plans', data);

export const updateAdminPlan = (id, data) =>
    axiosInstance.put(`/admin/plans/${id}`, data);

export const deleteAdminPlan = (id) =>
    axiosInstance.delete(`/admin/plans/${id}`);

export const getAddonPricing = () =>
    axiosInstance.get('/settings/addons');
