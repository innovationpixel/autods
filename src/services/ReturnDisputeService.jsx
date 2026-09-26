import axiosInstance from './AxiosInstance';

export const getReturnsDisputes = (params = {}) =>
  axiosInstance.get('/returns-disputes', { params });

export const syncReturnsDisputes = () =>
  axiosInstance.post('/returns-disputes/sync');

export const getReturnDisputeDetail = (id) =>
  axiosInstance.get(`/returns-disputes/${id}`);
