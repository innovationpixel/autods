import axiosInstance from './AxiosInstance';

const SESSION_STORAGE_KEY = 'autods_auth_session';

export function login(email, password) {
    return axiosInstance.post('/auth/login', { email, password });
}

export function register(name, email, password, passwordConfirmation) {
    return axiosInstance.post('/auth/register', {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
    });
}

export function logout() {
    return axiosInstance.post('/auth/logout');
}

export function getMe() {
    return axiosInstance.get('/auth/me');
}

export function refreshToken() {
    return axiosInstance.post('/auth/refresh');
}

export function updateProfile(payload) {
    return axiosInstance.put('/auth/profile', payload);
}

export function saveSession(data) {
    const expiresIn = data.expires_in ?? null;
    const session = {
        token: data.access_token,
        user: data.user,
        expiresIn,
        expiresAt: expiresIn ? Date.now() + expiresIn * 1000 : null,
        tokenType: data.token_type ?? 'Bearer',
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    localStorage.setItem('token', session.token);
    localStorage.setItem('user', JSON.stringify(session.user));
}

export function clearSession() {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

export function getStoredUser() {
    const session = getStoredSession();
    if (session?.user) {
        return session.user;
    }

    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
}

export function getStoredToken() {
    const session = getStoredSession();
    return session?.token || localStorage.getItem('token');
}

export function getStoredSession() {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);

    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw);
    } catch {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
    }
}
