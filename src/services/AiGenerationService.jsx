import axiosInstance from './AxiosInstance';

export const getAiConfig = () =>
    axiosInstance.get('/ai/config');

export const buyAiCredits = (packageId) =>
    axiosInstance.post('/ai/credits/buy', { package_id: String(packageId) });

export const generateAiImage = (formData) =>
    axiosInstance.post('/ai?image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

export const generateAiVideo = (formData) =>
    axiosInstance.post('/ai?video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

export const getMyGeneratedImages = (params = {}) =>
    axiosInstance.get('/ai/my-images', { params });

export const markImageAsViewed = (id) =>
    axiosInstance.post(`/ai/my-images/${id}/viewed`);

export const markAllImagesAsViewed = () =>
    axiosInstance.post('/ai/my-images/mark-all-viewed');

export const deleteGeneratedImage = (id) =>
    axiosInstance.delete(`/ai/my-images/${id}`);


