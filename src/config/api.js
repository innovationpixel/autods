/**
 * API base URL.
 *
 * Dev (Vite): defaults to `/api` — proxied to Laravel (see vite.config.js), so no CORS.
 * Override with VITE_API_URL in `.env.development` if needed.
 *
 * Production build: uses VITE_API_URL or the deployed API host.
 */
function resolveApiBaseUrl() {
    const fromEnv = import.meta.env.VITE_API_URL;
    if (fromEnv) {
        return String(fromEnv).replace(/\/$/, '');
    }

    if (import.meta.env.DEV) {
        return '/api';
    }

    return 'https://autods.youbasautopilot.com/api';
}

export const BASE_URL = resolveApiBaseUrl();
