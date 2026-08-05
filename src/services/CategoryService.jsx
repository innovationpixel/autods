import axiosInstance from './AxiosInstance';

export const getAdminCategories = () =>
    axiosInstance.get('/admin/categories');

export const createAdminCategory = (data) =>
    axiosInstance.post('/admin/categories', data);

export const updateAdminCategory = (id, data) =>
    axiosInstance.put(`/admin/categories/${id}`, data);

export const deleteAdminCategory = (id) =>
    axiosInstance.delete(`/admin/categories/${id}`);
