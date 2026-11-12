import axios from 'axios';
import { BASE_URL } from '../config/api';
import { clearSession, getStoredToken, saveSession } from './AuthService';

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

let isRefreshing = false;
let failedQueue = [];

function isAuthEndpoint(url = '') {
    return (
        url.includes('/auth/login') ||
        url.includes('/auth/register') ||
        url.includes('/auth/refresh') ||
        url.includes('/auth/forgot-password')
    );
}

function processQueue(error, token = null) {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve(token);
        }
    });
    failedQueue = [];
}

function storeDisabledNotice(message) {
    try {
        sessionStorage.setItem(
            'autods_disabled_notice',
            message || 'Your account has been disabled because your free trial ended.'
        );
    } catch {
        // Ignore storage quota / privacy mode errors
    }
}

function redirectToLogin() {
    clearSession();
    if (!window.location.pathname.startsWith('/user/login')) {
        window.location.href = '/user/login';
    }
}

axiosInstance.interceptors.request.use((config) => {
    const token = getStoredToken();
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 403 &&
            error.response?.data?.account_disabled === true &&
            !isAuthEndpoint(originalRequest?.url)
        ) {
            storeDisabledNotice(error.response?.data?.message);
            redirectToLogin();
            return Promise.reject(error);
        }

        if (
            error.response?.status !== 401 ||
            error.response?.data?.requires_auth ||
            error.response?.data?.platform_unavailable ||
            !originalRequest ||
            originalRequest._skipAuthRefresh ||
            isAuthEndpoint(originalRequest.url)
        ) {
            return Promise.reject(error);
        }

        if (originalRequest._retry) {
            redirectToLogin();
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            }).then((token) => {
                originalRequest.headers['Authorization'] = `Bearer ${token}`;
                return axiosInstance(originalRequest);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const token = getStoredToken();
            const response = await axios.post(
                `${BASE_URL}/auth/refresh`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                }
            );

            saveSession(response.data);
            const newToken = response.data.access_token;
            processQueue(null, newToken);
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return axiosInstance(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError, null);
            if (refreshError?.response?.data?.account_disabled === true) {
                storeDisabledNotice(refreshError.response?.data?.message);
            }
            redirectToLogin();
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default axiosInstance;
