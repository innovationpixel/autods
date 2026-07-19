function resolveApiBaseUrl() {
    const fromEnv = import.meta.env.VITE_API_URL;
    if (fromEnv) {
        return String(fromEnv).replace(/\/$/, '');
    }

    return 'https://autods.youbasautopilot.com/api';
}

export const BASE_URL = resolveApiBaseUrl();
