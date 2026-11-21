function resolveApiBaseUrl() {
    const fromEnv = import.meta.env.VITE_API_URL;
    if (fromEnv) {
        return String(fromEnv).replace(/\/$/, '');
    }

    if (import.meta.env.MODE === 'development' || import.meta.env.MODE === 'developement' || import.meta.env.DEV) {
        return 'https://autods.youbasautopilot.com/api';
    }

    return 'https://panel.autodropshipprime.com/api';
}

function resolveFrontendUrl() {
    const fromEnv = import.meta.env.VITE_FRONTEND_URL;
    if (fromEnv) {
        return String(fromEnv).replace(/\/$/, '');
    }

    if (import.meta.env.MODE === 'development' || import.meta.env.MODE === 'developement' || import.meta.env.DEV) {
        return 'https://dsapp.youbasautopilot.com';
    }

    return 'https://app.autodropshipprime.com';
}

export const BASE_URL = resolveApiBaseUrl();
export const FRONTEND_URL = resolveFrontendUrl();

export default BASE_URL;
