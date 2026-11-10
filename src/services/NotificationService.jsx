import axiosInstance from './AxiosInstance';

export const NOTIFICATIONS_REFRESH_EVENT = 'autods_refresh_notifications';
export const NOTIFICATIONS_STORAGE_KEY = 'autods_notifications_updated_at';

export const getNotifications = (params = {}) =>
    axiosInstance.get('/notifications', { params });

export const getUnreadNotificationCount = () =>
    axiosInstance.get('/notifications/unread-count');

export const syncNotifications = () =>
    axiosInstance.post('/notifications/sync');

export const markNotificationRead = (id) =>
    axiosInstance.post(`/notifications/${id}/read`);

export const markAllNotificationsRead = (category = null) =>
    axiosInstance.post('/notifications/read-all', category ? { category } : {});

export const dismissNotification = (id) =>
    axiosInstance.delete(`/notifications/${id}`);

export const subscribeEbayPlatformNotifications = (payload = {}) =>
    axiosInstance.post('/ebay/notifications/subscribe', payload);

export const triggerNotificationsRefresh = () => {
    try {
        window.dispatchEvent(new CustomEvent(NOTIFICATIONS_REFRESH_EVENT));
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, String(Date.now()));
    } catch {
        // Ignore storage restrictions in private browsing
    }
};

