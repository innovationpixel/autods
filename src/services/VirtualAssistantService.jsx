import axiosInstance from './AxiosInstance';

export const getVirtualAssistants = () =>
    axiosInstance.get('/vas');

export const createVirtualAssistant = (data) =>
    axiosInstance.post('/vas', data);

export const updateVirtualAssistant = (id, data) =>
    axiosInstance.put(`/vas/${id}`, data);

export const deleteVirtualAssistant = (id) =>
    axiosInstance.delete(`/vas/${id}`);

export const toggleVirtualAssistantStatus = (id) =>
    axiosInstance.patch(`/vas/${id}/toggle-status`);

