import axiosInstance from './AxiosInstance';

export const getAdminDashboard = () =>
    axiosInstance.get('/admin/dashboard');

export const getAdminUsers = (params = {}) =>
    axiosInstance.get('/admin/users', { params });

export const getAdminUser = (id) =>
    axiosInstance.get(`/admin/users/${id}`);

export const createAdminUser = (data) =>
    axiosInstance.post('/admin/users', data);

export const updateAdminUser = (id, data) =>
    axiosInstance.put(`/admin/users/${id}`, data);

export const deleteAdminUser = (id) =>
    axiosInstance.delete(`/admin/users/${id}`);

export const getAdminAliExpressStatus = () =>
    axiosInstance.get('/admin/aliexpress/status');

export const getAdminAliExpressAuthUrl = (returnPath = '/admin/settings') =>
    axiosInstance.get('/admin/aliexpress/auth-url', {
        params: {
            return_origin: window.location.origin,
            return_path: returnPath,
        },
    });

export const disconnectAdminAliExpress = () =>
    axiosInstance.delete('/admin/aliexpress/disconnect');
