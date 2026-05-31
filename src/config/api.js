const isLocalHost = typeof window !== 'undefined'
    && ['localhost', '127.0.0.1'].includes(window.location.hostname);

export const BASE_URL = 'https://autods.youbasautopilot.com/api';