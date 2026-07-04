import axiosInstance from './AxiosInstance';

export const getOrders = (params = {}) =>
    axiosInstance.get('/orders', { params });

export const syncOrders = () =>
    axiosInstance.post('/orders/sync');

export const updateOrderStatus = (id, status) =>
    axiosInstance.patch(`/orders/${id}/status`, { status });

export const getOrdersGoogleSheetStatus = () =>
    axiosInstance.get('/orders/google-sheet');

export const syncOrdersGoogleSheet = () =>
    axiosInstance.post('/orders/google-sheet/sync');
