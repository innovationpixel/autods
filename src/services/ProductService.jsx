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

export const publishProduct = (id) =>
    axiosInstance.post(`/products/${id}/publish`);

export const retryProductImport = (id) =>
    axiosInstance.post(`/products/${id}/retry`);

export const updateProduct = (id, data) =>
    axiosInstance.patch(`/products/${id}`, data);

export const deleteProduct = (id) =>
    axiosInstance.delete(`/products/${id}`);

export const bulkDeleteProducts = (ids) =>
    axiosInstance.post('/products/bulk-delete', { ids });

export const getEbayPolicies = (connectionId) =>
    axiosInstance.get('/ebay/policies', { params: { connection_id: connectionId } });
