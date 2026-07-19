import axiosInstance from './AxiosInstance';

export const getOrders = (params = {}) =>
    axiosInstance.get('/orders', { params });

export const syncOrders = () =>
    axiosInstance.post('/orders/sync');

export const updateOrderStatus = (id, status) =>
    axiosInstance.patch(`/orders/${id}/status`, { status });

export const updateOrderSource = (id, payload) =>
    axiosInstance.patch(`/orders/${id}/source`, payload);

export const updateOrderTracking = (id, payload) =>
    axiosInstance.patch(`/orders/${id}/tracking`, payload);

export const pushOrderTracking = (id) =>
    axiosInstance.post(`/orders/${id}/push-tracking`);

export const getOrdersGoogleSheetStatus = () =>
    axiosInstance.get('/orders/google-sheet');

export const syncOrdersGoogleSheet = () =>
    axiosInstance.post('/orders/google-sheet/sync');

export const inviteOrdersGoogleSheetMembers = (payload) =>
    axiosInstance.post('/orders/google-sheet/invite', payload);
