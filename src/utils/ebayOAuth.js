/**
 * Parse eBay OAuth result from a pasted URL (success page or app callback).
 */
export function parseEbayOAuthUrl(input) {
    const raw = String(input ?? '').trim();
    if (!raw) {
        return null;
    }

    try {
        const url = raw.startsWith('http') ? new URL(raw) : new URL(raw, 'https://ebay.com');
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const success = url.searchParams.get('isAuthSuccessful');

        if (!code) {
            return null;
        }

        if (success === 'false') {
            return { error: url.searchParams.get('error') ?? 'Authorization was declined.' };
        }

        return { code, state };
    } catch {
        return null;
    }
}
