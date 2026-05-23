import { useEffect } from 'react';
import { toast } from '../utils/toast';
import { isOAuthCallbackMessage, consumeOAuthResult } from '../utils/oauthBridge';

function applyOAuthResult(data, handlers) {
    if (!data?.platform) return;

    const { platform, status, reason } = data;
    const { onEbayConnected, onEbayError, onAliConnected, onAliError } = handlers;

    if (platform === 'ebay') {
        if (status === 'connected') {
            onEbayConnected?.();
            toast.success('eBay account connected successfully!');
        } else if (status === 'error') {
            onEbayError?.(reason);
            toast.error(`eBay connection failed: ${reason ?? 'Unknown error'}`);
        }
    }

    if (platform === 'aliexpress') {
        if (status === 'connected') {
            onAliConnected?.();
            toast.success('AliExpress account connected successfully!');
        } else if (status === 'error') {
            onAliError?.(reason);
            toast.error(`AliExpress connection failed: ${reason ?? 'Unknown error'}`);
        }
    }
}

/**
 * Listens for OAuth results via postMessage and localStorage bridge.
 */
export function useOAuthHandler(handlers) {
    useEffect(() => {
        const handleMessage = (event) => {
            if (!isOAuthCallbackMessage(event.data)) return;
            applyOAuthResult(event.data, handlers);
        };

        window.addEventListener('message', handleMessage);

        const pending = consumeOAuthResult();
        if (pending) {
            applyOAuthResult(pending, handlers);
        }

        return () => window.removeEventListener('message', handleMessage);
    }, [handlers]);
}
