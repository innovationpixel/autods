import axiosInstance from './AxiosInstance';

export const getPlans = () =>
    axiosInstance.get('/plans');

export const getCurrentPlan = () =>
    axiosInstance.get('/plans/current');

export const checkoutStripe = (planId) =>
    axiosInstance.post(`/plans/${planId}/checkout/stripe`, {
        return_origin: window.location.origin,
    });

export const checkoutPayPal = (planId) =>
    axiosInstance.post(`/plans/${planId}/checkout/paypal`, {
        return_origin: window.location.origin,
    });

export const getAdminPlans = () =>
    axiosInstance.get('/admin/plans');

export const createAdminPlan = (data) =>
    axiosInstance.post('/admin/plans', data);

export const updateAdminPlan = (id, data) =>
    axiosInstance.put(`/admin/plans/${id}`, data);

export const deleteAdminPlan = (id) =>
    axiosInstance.delete(`/admin/plans/${id}`);
