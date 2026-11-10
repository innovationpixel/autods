import axiosInstance from './AxiosInstance';

export const getAiConfig = () =>
    axiosInstance.get('/ai/config');

export const buyAiCredits = (packageIdOrPayload) => {
    const payload =
        packageIdOrPayload && typeof packageIdOrPayload === 'object'
            ? packageIdOrPayload
            : { package_id: String(packageIdOrPayload) };
    return axiosInstance.post('/ai/credits/buy', payload);
};

export const optimizeProductTitle = (payload) =>
    axiosInstance.post('/ai/optimize-title', payload);

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

export const getBundleZipUrl = (bundleId) =>
    `/api/ai/my-images/bundle/${encodeURIComponent(bundleId)}/zip`;
