const isLocalHost = typeof window !== 'undefined'
    && ['localhost', '127.0.0.1'].includes(window.location.hostname);

export const BASE_URL = import.meta.env.VITE_API_URL
    || (isLocalHost ? 'http://localhost:8001/api' : 'https://autods.youbasautopilot.com/api');
