import axiosInstance from './AxiosInstance';

const SESSION_STORAGE_KEY = 'autods_auth_session';

export function login(email, password) {
    return axiosInstance.post('/auth/login', { email, password });
}

export function register(payloadOrName, email, password, passwordConfirmation) {
    const payload = typeof payloadOrName === 'object' && payloadOrName !== null
        ? payloadOrName
        : {
            name: payloadOrName,
            email,
            password,
            password_confirmation: passwordConfirmation,
        };

    return axiosInstance.post('/auth/register', payload);
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

export function acceptLegalConsent(payload) {
    return axiosInstance.post('/auth/legal-consent', payload);
}

export function sendPasswordResetCode(email) {
    return axiosInstance.post('/auth/forgot-password/send-code', { email });
}

export function verifyPasswordResetCode(email, code) {
    return axiosInstance.post('/auth/forgot-password/verify-code', { email, code });
}

export function resetPasswordWithCode(payload) {
    return axiosInstance.post('/auth/forgot-password/reset', payload);
}

function safeJsonParse(val, fallback = null) {
    if (!val || val === 'undefined' || val === 'null' || typeof val !== 'string') {
        return fallback;
    }
    try {
        return JSON.parse(val);
    } catch {
        return fallback;
    }
}

export function saveSession(data) {
    if (!data || typeof data !== 'object') return;
    const token = typeof data.access_token === 'string' && data.access_token !== 'undefined'
        ? data.access_token
        : '';
    const user = data.user && typeof data.user === 'object' ? data.user : null;
    const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : null;

    if (!token || !user) {
        clearSession();
        return;
    }

    const session = {
        token,
        user,
        expiresIn,
        expiresAt: expiresIn ? Date.now() + expiresIn * 1000 : null,
        tokenType: data.token_type ?? 'Bearer',
    };

    try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    } catch {
        // Storage full or quota exceeded
    }
}

export function clearSession() {
    try {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    } catch {
        // Ignore storage errors
    }
}

export function getStoredUser() {
    try {
        const session = getStoredSession();
        if (session?.user && typeof session.user === 'object') {
            return session.user;
        }

        const raw = localStorage.getItem('user');
        const user = safeJsonParse(raw, null);
        if (!user || typeof user !== 'object') {
            if (raw) {
                localStorage.removeItem('user');
            }
            return null;
        }
        return user;
    } catch {
        return null;
    }
}

export function getStoredToken() {
    try {
        const session = getStoredSession();
        const token = session?.token || localStorage.getItem('token');
        if (!token || token === 'undefined' || token === 'null' || typeof token !== 'string') {
            localStorage.removeItem('token');
            return null;
        }
        return token;
    } catch {
        return null;
    }
}

export function getStoredSession() {
    try {
        const raw = localStorage.getItem(SESSION_STORAGE_KEY);
        const session = safeJsonParse(raw, null);
        if (!session || !session.token || session.token === 'undefined' || !session.user) {
            if (raw) {
                localStorage.removeItem(SESSION_STORAGE_KEY);
            }
            return null;
        }
        return session;
    } catch {
        return null;
    }
}
