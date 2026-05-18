import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OAuthCallback() {
    const navigate = useNavigate();
    const [status, setStatus] = useState('processing');

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

        if (window.opener && !window.opener.closed) {
            try {
                window.opener.postMessage(message, window.location.origin);
            } catch (_) {}
            setStatus(callbackStatus === 'connected' ? 'success' : 'error');
            setTimeout(() => window.close(), 800);
        } else {
            // Not in a popup — redirect directly to settings
            const dest = callbackStatus === 'connected'
                ? `/settings?tab=store&${platform}=connected`
                : `/settings?tab=store&${platform}=error&reason=${encodeURIComponent(reason ?? '')}`;
            navigate(dest, { replace: true });
        }
    }, [navigate]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            fontFamily: 'system-ui, sans-serif',
            gap: 12,
        }}>
            {status === 'success' ? (
                <>
                    <div style={{ fontSize: 48 }}>✓</div>
                    <p style={{ fontWeight: 600, color: '#065f46' }}>Account connected! Closing…</p>
                </>
            ) : status === 'error' ? (
                <>
                    <div style={{ fontSize: 48 }}>✗</div>
                    <p style={{ fontWeight: 600, color: '#991b1b' }}>Connection failed. Closing…</p>
                </>
            ) : (
                <p style={{ color: '#6b7280' }}>Completing authorization…</p>
            )}
        </div>
    );
}
