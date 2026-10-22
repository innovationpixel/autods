import axiosInstance from './AxiosInstance';

const multipart = { headers: { 'Content-Type': 'multipart/form-data' } };

export const getAiTemplates = () =>
    axiosInstance.get('/ai/templates');

export const getAdminAiTemplates = () =>
    axiosInstance.get('/admin/ai-templates');

export const createAdminAiTemplate = (formData) =>
    axiosInstance.post('/admin/ai-templates', formData, multipart);

export const updateAdminAiTemplate = (id, formData) => {
    formData.append('_method', 'PUT');
    return axiosInstance.post(`/admin/ai-templates/${id}`, formData, multipart);
};

export const deleteAdminAiTemplate = (id) =>
    axiosInstance.delete(`/admin/ai-templates/${id}`);

export const generateAdminAiTemplateImage = (formData) =>
    axiosInstance.post('/admin/ai-templates/generate-image', formData, multipart);

