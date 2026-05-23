import axios from 'axios';
import { BASE_URL } from '../config/api';
import { clearSession } from './AuthService';

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && !error.response?.data?.requires_auth) {
            clearSession();
            window.location.href = '/user/login';
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
