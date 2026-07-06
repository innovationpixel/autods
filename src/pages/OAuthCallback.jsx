import { useEffect, useMemo, useState } from 'react';
import { setOAuthResult, consumeOAuthReturnOrigin } from '../utils/oauthBridge';

export default function OAuthCallback() {
    const [status, setStatus] = useState('processing');
    const [detail, setDetail] = useState('');
    const returnOrigin = useMemo(() => consumeOAuthReturnOrigin(), []);

    const returnUrl = useMemo(() => {
        const params = new URLSearchParams(window.location.search);
        const platform = params.get('platform');
        const callbackStatus = params.get('status') ?? 'connected';
        const returnPath = params.get('return_path');
        const base = `${returnOrigin}/settings?tab=store`;

        if (platform === 'ebay') {
            return `${base}&ebay=${callbackStatus}`;
        }
        if (platform === 'aliexpress') {
            const path = returnPath ?? '/settings?tab=store';
            const connector = path.includes('?') ? '&' : '?';
            return `${returnOrigin}${path}${connector}aliexpress=${callbackStatus}`;
        }

        return base;
    }, [returnOrigin]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const platform = params.get('platform');
        const callbackStatus = params.get('status');
        const reason = params.get('reason');

        const message = {
            type: 'OAUTH_CALLBACK',
            platform,
            status: callbackStatus,
            reason,
        };

        setOAuthResult({
            type: 'OAUTH_CALLBACK',
            platform,
            status: callbackStatus,
            reason,
        });

        if (window.opener && !window.opener.closed) {
            try {
                window.opener.postMessage(message, returnOrigin);
            } catch {
                // localStorage bridge handles it when same-origin
            }
        }

        if (callbackStatus === 'connected') {
            setStatus('success');
            setDetail('Account connected successfully. You can close this tab and return to Auto DS.');
        } else {
            setStatus('error');
            setDetail(reason ? decodeURIComponent(reason) : 'Authorization was not completed.');
        }
    }, [returnOrigin]);

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                fontFamily: 'system-ui, sans-serif',
                gap: 12,
                padding: 24,
                textAlign: 'center',
            }}
        >
            {status === 'success' ? (
                <>
                    <div style={{ fontSize: 48 }}>✓</div>
                    <p style={{ fontWeight: 600, color: '#065f46', margin: 0 }}>Account connected</p>
                    <p style={{ color: '#6b7280', margin: 0, fontSize: 14 }}>{detail}</p>
                    <p style={{ color: '#9ca3af', margin: 0, fontSize: 13 }}>
                        Close this tab and return to Auto DS, or use the button below.
                    </p>
                    <a
                        href={returnUrl}
                        style={{
                            marginTop: 8,
                            padding: '10px 18px',
                            borderRadius: 8,
                            background: '#065f46',
                            color: '#fff',
                            textDecoration: 'none',
                            fontWeight: 600,
                            fontSize: 14,
                        }}
                    >
                        Return to Auto DS
                    </a>
                </>
            ) : status === 'error' ? (
                <>
                    <div style={{ fontSize: 48 }}>✗</div>
                    <p style={{ fontWeight: 600, color: '#991b1b', margin: 0 }}>Connection failed</p>
                    <p style={{ color: '#6b7280', margin: 0, fontSize: 14, maxWidth: 360 }}>{detail}</p>
                    <a href={returnUrl} style={{ marginTop: 8, color: '#2563eb', fontSize: 14 }}>
                        Return to Auto DS
                    </a>
                </>
            ) : (
                <p style={{ color: '#6b7280', margin: 0 }}>Completing authorization…</p>
            )}
        </div>
    );
}
