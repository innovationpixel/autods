import axiosInstance from './AxiosInstance';

export const getOrders = (params = {}) =>
    axiosInstance.get('/orders', { params });

export const syncOrders = () =>
    axiosInstance.post('/orders/sync');

export const updateOrderStatus = (id, status) =>
    axiosInstance.patch(`/orders/${id}/status`, { status });

export const updateOrderSource = (id, payload) =>
    axiosInstance.patch(`/orders/${id}/source`, payload);

export const updateOrderCost = (id, payload) =>
    axiosInstance.patch(`/orders/${id}/cost`, payload);

export const updateOrderFulfillment = (id, payload) =>
    axiosInstance.patch(`/orders/${id}/fulfillment`, payload);

export const updateOrderProcessingStatus = (id, processing_status) =>
    axiosInstance.patch(`/orders/${id}/processing-status`, { processing_status });

export const getOrderCheckoutQuote = (id, params = {}) =>
    axiosInstance.get(`/orders/${id}/checkout-quote`, { params });

export const acceptRecommendedAddress = (id, payload = {}) =>
    axiosInstance.post(`/orders/${id}/accept-recommended-address`, payload);

export const placeAliExpressOrder = (id, payload = {}) =>
    axiosInstance.post(`/orders/${id}/place-aliexpress-order`, payload);

export const updateOrderShippingAddress = (id, payload) =>
    axiosInstance.put(`/orders/${id}/shipping-address`, payload);

export const updateOrderTracking = (id, payload) =>
    axiosInstance.patch(`/orders/${id}/tracking`, payload);

export const pushOrderTracking = (id) =>
    axiosInstance.post(`/orders/${id}/push-tracking`);

export const refundOrder = (id, payload) =>
    axiosInstance.post(`/orders/${id}/refund`, payload);

export const cancelOrder = (id, payload = {}) =>
    axiosInstance.post(`/orders/${id}/cancel`, payload);

export const archiveOrder = (id, archived) =>
    axiosInstance.patch(`/orders/${id}/archive`, { archived });

export const getOrdersGoogleSheetStatus = () =>
    axiosInstance.get('/orders/google-sheet');

export const syncOrdersGoogleSheet = () =>
    axiosInstance.post('/orders/google-sheet/sync');

export const inviteOrdersGoogleSheetMembers = (payload) =>
    axiosInstance.post('/orders/google-sheet/invite', payload);
