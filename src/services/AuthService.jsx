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

export function checkEmailAvailability(email) {
    return axiosInstance.post('/auth/check-email', { email });
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
    const token = (typeof data.access_token === 'string' && data.access_token !== 'undefined' ? data.access_token : '')
        || (typeof data.token === 'string' && data.token !== 'undefined' ? data.token : '');

    let user = data.user;
    if (typeof user === 'string') {
        user = safeJsonParse(user, null);
    }
    if (!user || typeof user !== 'object') {
        user = getStoredUser() || null;
    }

    const expiresIn = typeof data.expires_in === 'number'
        ? data.expires_in
        : (Number(data.expires_in) || null);

    if (!token) {
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
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
        }
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
        if (user && typeof user === 'object') {
            return user;
        }

        return null;
    } catch {
        return null;
    }
}

export function getStoredToken() {
    try {
        const rawToken = localStorage.getItem('token');
        if (rawToken && rawToken !== 'undefined' && rawToken !== 'null' && typeof rawToken === 'string') {
            return rawToken;
        }

        const session = getStoredSession();
        if (session?.token && session.token !== 'undefined' && session.token !== 'null') {
            return session.token;
        }

        return null;
    } catch {
        return null;
    }
}

export function getStoredSession() {
    try {
        const raw = localStorage.getItem(SESSION_STORAGE_KEY);
        if (!raw) return null;
        return safeJsonParse(raw, null);
    } catch {
        return null;
    }
}
