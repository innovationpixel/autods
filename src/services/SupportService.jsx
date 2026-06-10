import axiosInstance from './AxiosInstance';

export const getSupportConversations = (params = {}) =>
    axiosInstance.get('/support/conversations', { params });

export const syncSupportConversations = () =>
    axiosInstance.post('/support/sync');

export const updateSupportConversation = (id, payload) =>
    axiosInstance.patch(`/support/conversations/${id}`, payload);
