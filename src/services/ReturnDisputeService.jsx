import axiosInstance from './AxiosInstance';

export const getReturnsDisputes = (params = {}) =>
  axiosInstance.get('/returns-disputes', { params });

export const syncReturnsDisputes = () =>
  axiosInstance.post('/returns-disputes/sync');

export const getReturnDisputeDetail = (id) =>
  axiosInstance.get(`/returns-disputes/${id}`);

export const respondReturnDispute = (id, payload) => {
  if (payload instanceof FormData) {
    return axiosInstance.post(`/returns-disputes/${id}/respond`, payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
  return axiosInstance.post(`/returns-disputes/${id}/respond`, payload);
};

export const downloadReturnDisputeLabel = (id) =>
  axiosInstance.get(`/returns-disputes/${id}/label`, { responseType: 'blob' });
