import axiosInstance from './AxiosInstance';

export const getAdminAliExpressStatus = () =>
    axiosInstance.get('/admin/aliexpress/status');

export const getAdminAliExpressAuthUrl = (returnPath = '/admin/plans') =>
    axiosInstance.get('/admin/aliexpress/auth-url', {
        params: {
            return_origin: window.location.origin,
            return_path: returnPath,
        },
    });

export const disconnectAdminAliExpress = () =>
    axiosInstance.delete('/admin/aliexpress/disconnect');
