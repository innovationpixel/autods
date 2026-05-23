import axiosInstance from './AxiosInstance';

export const searchAliExpress = (params = {}) =>
    axiosInstance.get('/aliexpress/search', { params });

export const getAliExpressTop = (params = {}) =>
    axiosInstance.get('/aliexpress/top', { params });

export const getAliExpressStatus = () =>
    axiosInstance.get('/aliexpress/status');

export const getAliExpressAuthUrl = () =>
    axiosInstance.get('/aliexpress/auth-url', {
        params: { return_origin: window.location.origin },
    });

export const disconnectAliExpressApi = () =>
    axiosInstance.delete('/aliexpress/disconnect');

export const getAliExpressFeeds = () =>
    axiosInstance.get('/aliexpress/feeds');

export const browseAliExpress = (params = {}) =>
    axiosInstance.get('/aliexpress/browse', { params });

export const getAliExpressProduct = (id, params = {}) =>
    axiosInstance.get(`/aliexpress/product/${id}`, { params });
