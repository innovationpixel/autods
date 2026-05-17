import axiosInstance from './AxiosInstance';

export function login(email, password) {
    return axiosInstance.post('/auth/login', { email, password });
}

export function logout() {
    return axiosInstance.post('/auth/logout');
}

export function getMe() {
    return axiosInstance.get('/auth/me');
}

export function saveSession(data) {
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
}

export function clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

export function getStoredUser() {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
}

export function getStoredToken() {
    return localStorage.getItem('token');
}
