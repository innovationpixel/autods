import axiosInstance from './AxiosInstance';

export const importProduct = (payload) =>
    axiosInstance.post('/products/import', payload);

export const importProductsBulk = (payload) => {
    if (payload instanceof FormData) {
        return axiosInstance.post('/products/import/bulk', payload, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    }
    return axiosInstance.post('/products/import/bulk', payload);
};

export const getImportBatch = (id) =>
    axiosInstance.get(`/products/import/batches/${id}`);

export const getImportHistory = (params = {}) =>
    axiosInstance.get('/products/import/history', { params });

export const syncProductToStore = (id) =>
    axiosInstance.post(`/products/${id}/sync-to-store`);

export const publishProduct = (id) =>
    axiosInstance.post(`/products/${id}/publish`);

export const retryProductImport = (id) =>
    axiosInstance.post(`/products/${id}/retry`);

export const updateProduct = (id, data) =>
    axiosInstance.put(`/products/${id}`, data).catch((error) => {
        if ([404, 405].includes(error.response?.status)) {
            return axiosInstance.post(`/products/${id}/update`, data);
        }

        throw error;
    });

export const getProductCategorySuggestions = (id, q) =>
    axiosInstance.get(`/products/${id}/category-suggestions`, { params: { q } });

export const scheduleProducts = (payload) =>
    axiosInstance.post('/products/schedule', payload);

export const deleteProduct = (id) =>
    axiosInstance.delete(`/products/${id}`);

export const bulkDeleteProducts = (ids) =>
    axiosInstance.post('/products/bulk-delete', { ids });

export const getEbayPolicies = (connectionId) =>
    axiosInstance.get('/ebay/policies', { params: { connection_id: connectionId } });
