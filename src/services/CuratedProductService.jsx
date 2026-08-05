import axiosInstance from './AxiosInstance';

export const resolveAliExpressProduct = (urlOrId, country) =>
    axiosInstance.post('/admin/aliexpress/resolve-product', { url_or_id: urlOrId, country });

export const getAdminTrendingProducts = (params = {}) =>
    axiosInstance.get('/admin/trending-products', { params });

export const createAdminTrendingProduct = (data) =>
    axiosInstance.post('/admin/trending-products', data);

export const updateAdminTrendingProduct = (id, data) =>
    axiosInstance.put(`/admin/trending-products/${id}`, data);

export const deleteAdminTrendingProduct = (id) =>
    axiosInstance.delete(`/admin/trending-products/${id}`);

export const getAdminHandPickedProducts = (params = {}) =>
    axiosInstance.get('/admin/hand-picked-products', { params });

export const createAdminHandPickedProduct = (data) =>
    axiosInstance.post('/admin/hand-picked-products', data);

export const updateAdminHandPickedProduct = (id, data) =>
    axiosInstance.put(`/admin/hand-picked-products/${id}`, data);

export const deleteAdminHandPickedProduct = (id) =>
    axiosInstance.delete(`/admin/hand-picked-products/${id}`);

export const getMarketplaceCategories = () =>
    axiosInstance.get('/marketplace/categories');

export const getCuratedProducts = (params = {}) =>
    axiosInstance.get('/marketplace/curated-products', { params });
