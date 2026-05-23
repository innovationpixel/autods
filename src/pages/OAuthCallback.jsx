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
        const base = `${returnOrigin}/settings?tab=store`;

        if (platform === 'ebay') {
            return `${base}&ebay=${callbackStatus}`;
        }
        if (platform === 'aliexpress') {
            return `${base}&aliexpress=${callbackStatus}`;
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

            try {
                window.opener.focus();
            } catch {
                // ignore cross-origin focus errors
            }
        }

        if (callbackStatus === 'connected') {
            setStatus('success');
            setDetail('Account connected successfully.');
        } else {
            setStatus('error');
            setDetail(reason ? decodeURIComponent(reason) : 'Authorization was not completed.');
        }

        const closeTimer = setTimeout(() => {
            if (window.opener && !window.opener.closed) {
                window.close();
            }
        }, 2500);

        return () => clearTimeout(closeTimer);
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
                        This window will close automatically, or use the button below.
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
