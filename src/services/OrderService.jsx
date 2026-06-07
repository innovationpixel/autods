import axiosInstance from './AxiosInstance';

export const getOrders = (params = {}) =>
    axiosInstance.get('/orders', { params });

export const syncOrders = () =>
    axiosInstance.post('/orders/sync');

export const updateOrderStatus = (id, status) =>
    axiosInstance.patch(`/orders/${id}/status`, { status });
