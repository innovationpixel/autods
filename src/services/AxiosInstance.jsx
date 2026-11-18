import axios from 'axios';
import { BASE_URL } from '../config/api';
import { clearSession, getStoredToken, saveSession } from './AuthService';

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

const LONG_RUNNING_PATH_PATTERNS = [
    '/ai',
    '/products/import',
    '/sync',
    '/bundle/',
    '/monitor',
    '/place-aliexpress-order',
    '/google-sheet',
];

const IDEMPOTENT_PATH_PATTERNS = [
    '/wallet/deposit/',
    '/wallet/transfer-to-processing',
    '/place-aliexpress-order',
    '/refund',
    '/cancel',
    '/plans/',
    '/addons/',
    '/ai/credits/buy',
];

function generateIdempotencyKey() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

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

const PUBLIC_ROUTES = [
    '/user/login',
    '/user/register',
    '/user/user/login',
    '/user/user/register',
    '/user/forgot-password',
    '/onboarding',
    '/terms-and-conditions',
    '/privacy-policy',
];

function isPublicRoute(pathname = window.location.pathname) {
    return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

function redirectToLogin() {
    clearSession();
    if (!isPublicRoute(window.location.pathname)) {
        window.location.href = '/user/login';
    }
}

axiosInstance.interceptors.request.use((config) => {
    const token = getStoredToken();
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    const url = String(config.url || '');
    const method = String(config.method || 'get').toUpperCase();

    // Extend timeout for legitimately long-running AI, sync, and import endpoints
    if (
        (!config.timeout || config.timeout === 30000) &&
        LONG_RUNNING_PATH_PATTERNS.some((pattern) => url.includes(pattern))
    ) {
        config.timeout = 120000;
    }

    // Automatically attach an Idempotency-Key on critical mutating financial/order calls
    if (
        method === 'POST' &&
        !config.headers['Idempotency-Key'] &&
        !config.headers['X-Idempotency-Key'] &&
        IDEMPOTENT_PATH_PATTERNS.some((pattern) => url.includes(pattern))
    ) {
        config.headers['Idempotency-Key'] = generateIdempotencyKey();
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
            isAuthEndpoint(originalRequest.url) ||
            // A visitor with no session has nothing to refresh — never bounce them to login.
            !getStoredToken()
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
