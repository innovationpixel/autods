const OAUTH_RESULT_KEY = 'autods_oauth_result';
const OAUTH_RETURN_ORIGIN_KEY = 'autods_oauth_return_origin';

/** Remember portal origin when starting OAuth (used by callback page). */
export function markOAuthReturnOrigin(origin = window.location.origin) {
    sessionStorage.setItem(OAUTH_RETURN_ORIGIN_KEY, origin);
}

export function consumeOAuthReturnOrigin() {
    const origin = sessionStorage.getItem(OAUTH_RETURN_ORIGIN_KEY);
    sessionStorage.removeItem(OAUTH_RETURN_ORIGIN_KEY);
    return origin || window.location.origin;
}

/**
 * Persist OAuth outcome so the opener can read it if postMessage fails (eBay often drops opener).
 */
export function setOAuthResult(payload) {
    localStorage.setItem(
        OAUTH_RESULT_KEY,
        JSON.stringify({ ...payload, ts: Date.now() }),
    );
}

export function consumeOAuthResult(maxAgeMs = 120000) {
    const raw = localStorage.getItem(OAUTH_RESULT_KEY);
    if (!raw) return null;

    try {
        const data = JSON.parse(raw);
        if (!data?.ts || Date.now() - data.ts > maxAgeMs) {
            localStorage.removeItem(OAUTH_RESULT_KEY);
            return null;
        }
        localStorage.removeItem(OAUTH_RESULT_KEY);
        return data;
    } catch {
        localStorage.removeItem(OAUTH_RESULT_KEY);
        return null;
    }
}

function openCenteredWindow(url, name, width, height, features = '') {
    const left = Math.round(window.screenX + (window.outerWidth - width) / 2);
    const top = Math.round(window.screenY + (window.outerHeight - height) / 2);
    const size = `width=${width},height=${height},left=${left},top=${top}`;

    return window.open(url, name, `${size},toolbar=0,scrollbars=1,resizable=1${features ? `,${features}` : ''}`);
}

/** eBay and other providers — compact centered popup. */
export function openOAuthPopup(url, name = 'oauth_popup') {
    return openCenteredWindow(url, name, 620, 720);
}

export const ALIEXPRESS_OAUTH_HINT =
    'Check “I agree to the Authorization Terms”, scroll down if needed, then click Sign in / Authorize.';

/**
 * AliExpress consent pages are tall; use a large centered popup (same as eBay flow).
 */
export function openAliExpressOAuth(url) {
    const width = Math.min(1100, Math.max(900, window.screen.availWidth - 48));
    const height = Math.min(920, Math.max(820, window.screen.availHeight - 80));
    return openCenteredWindow(url, 'aliexpress_oauth', width, height);
}

/**
 * Poll localStorage + popup closed while OAuth completes.
 */
export function watchOAuthPopup(popup, onComplete) {
    const hadPopup = Boolean(popup);

    const interval = setInterval(() => {
        const result = consumeOAuthResult();
        if (result) {
            clearInterval(interval);
            onComplete(result);
            return;
        }

        if (hadPopup && (!popup || popup.closed)) {
            clearInterval(interval);
            onComplete(consumeOAuthResult() ?? null);
        }
    }, 400);

    return () => clearInterval(interval);
}

export function isOAuthCallbackMessage(data) {
    return Boolean(data?.platform && (data.type === 'OAUTH_CALLBACK' || data.status));
}
