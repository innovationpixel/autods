import axiosInstance from './AxiosInstance';

export const getSupportTickets = (params = {}) =>
    axiosInstance.get('/support-tickets', { params });

export const createSupportTicket = (data) =>
    axiosInstance.post('/support-tickets', data);

export const getSupportTicket = (id) =>
    axiosInstance.get(`/support-tickets/${id}`);

export const replySupportTicket = (id, message) =>
    axiosInstance.post(`/support-tickets/${id}/reply`, { message });
