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

/** Open OAuth provider in a new browser tab (not a popup). */
export function openOAuthTab(url) {
    return window.open(url, '_blank', 'noopener,noreferrer');
}

/** @deprecated Use openOAuthTab */
export function openOAuthPopup(url) {
    return openOAuthTab(url);
}

/** @deprecated Use openOAuthTab */
export function openAliExpressOAuth(url) {
    return openOAuthTab(url);
}

export const ALIEXPRESS_OAUTH_HINT =
    'Check “I agree to the Authorization Terms”, scroll down if needed, then click Sign in / Authorize.';

export const OAUTH_TAB_HINT =
    'Complete authorization in the new tab, then return here — this page will update automatically.';

/**
 * Poll localStorage (+ optional tab closed) while OAuth completes in another tab.
 */
export function watchOAuthTab(tab, onComplete) {
    const hadTab = Boolean(tab);

    const interval = setInterval(() => {
        const result = consumeOAuthResult();
        if (result) {
            clearInterval(interval);
            onComplete(result);
            return;
        }

        if (hadTab && (!tab || tab.closed)) {
            clearInterval(interval);
            onComplete(consumeOAuthResult() ?? null);
        }
    }, 400);

    return () => clearInterval(interval);
}

/** @deprecated Use watchOAuthTab */
export function watchOAuthPopup(tab, onComplete) {
    return watchOAuthTab(tab, onComplete);
}

export function isOAuthCallbackMessage(data) {
    return Boolean(data?.platform && (data.type === 'OAUTH_CALLBACK' || data.status));
}
