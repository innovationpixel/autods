import axiosInstance from './AxiosInstance';

export const getLegalDocuments = () =>
    axiosInstance.get('/legal');

