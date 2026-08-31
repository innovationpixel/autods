import axiosInstance from './AxiosInstance';

export const generateAiImage = (formData) =>
    axiosInstance.post('/ai?image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

export const generateAiVideo = (formData) =>
    axiosInstance.post('/ai?video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
