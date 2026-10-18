import axiosInstance from './AxiosInstance';

export const getSupportConversations = (params = {}) =>
    axiosInstance.get('/support/conversations', { params });

export const syncSupportConversations = () =>
    axiosInstance.post('/support/sync');

export const getSupportConversation = (id) =>
    axiosInstance.get(`/support/conversations/${id}`);

export const replySupportConversation = (id, message) =>
    axiosInstance.post(`/support/conversations/${id}/reply`, { message });

export const updateSupportConversation = (id, payload) =>
    axiosInstance.patch(`/support/conversations/${id}`, payload);
