import { useCallback, useEffect, useState } from "react";
import { LuCopy, LuExternalLink } from "react-icons/lu";
import { getEbayOAuthSetup } from "../../services/EbayService";
import { toast } from "../../utils/toast";

const DISMISS_KEY = "autods_ebay_oauth_setup_dismissed";

export function wasEbayOAuthSetupDismissed() {
  return localStorage.getItem(DISMISS_KEY) === "1";
}

export function dismissEbayOAuthSetup() {
  localStorage.setItem(DISMISS_KEY, "1");
}

export function resetEbayOAuthSetupDismissed() {
  localStorage.removeItem(DISMISS_KEY);
}

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard");
  } catch {
    toast.error("Could not copy — select and copy manually");
  }
}

/**
 * Shown when eBay RuName still points at ngrok / wrong callback.
 * The redirect URL after eBay login is controlled in the eBay Developer Portal, not in app code.
 */
export default function EbayOAuthSetupBanner({ onContinue, show = true }) {
  const [setup, setSetup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(wasEbayOAuthSetupDismissed());

  const load = useCallback(() => {
    setLoading(true);
    getEbayOAuthSetup()
      .then((res) => setSetup(res.data ?? null))
      .catch(() => setSetup(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!show || dismissed || loading || !setup) {
    return null;
  }

  const callbackUrl = setup.callback_url ?? "";

  return (
    <div
      style={{
        marginBottom: 16,
        padding: "16px 18px",
        borderRadius: 10,
        border: "1px solid #fca5a5",
        background: "#fef2f2",
        color: "#7f1d1d",
        fontSize: 13,
        lineHeight: 1.55,
      }}
    >
      <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 14 }}>
        eBay redirect must be fixed in the eBay Developer Portal
      </p>
      <p style={{ margin: "0 0 10px" }}>
        If you see an <strong>ngrok</strong> URL or <strong>ERR_NGROK_3200</strong> after clicking Add eBay Account,
        your eBay RuName still points at an old tunnel. Our app cannot change that — you must update it on eBay.
      </p>

      {setup.config_errors?.length ? (
        <ul style={{ margin: "0 0 10px", paddingLeft: 20, color: "#991b1b" }}>
          {setup.config_errors.map((err) => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      ) : null}

      <ol style={{ margin: "0 0 12px", paddingLeft: 20 }}>
        {(setup.instructions ?? []).map((step) => (
          <li key={step} style={{ marginBottom: 4 }}>
            {step}
          </li>
        ))}
      </ol>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 10 }}>
        <code
          style={{
            flex: "1 1 240px",
            padding: "8px 10px",
            background: "#fff",
            border: "1px solid #fecaca",
            borderRadius: 6,
            wordBreak: "break-all",
            color: "#111827",
          }}
        >
          {callbackUrl}
        </code>
        <button
          type="button"
          className="marketplace-settings__ebay-btn"
          onClick={() => copyText(callbackUrl)}
          style={{ flexShrink: 0 }}
        >
          <LuCopy />
          <span>Copy callback URL</span>
        </button>
      </div>

      {setup.runame ? (
        <p style={{ margin: "0 0 10px" }}>
          RuName in <code>.env</code>: <strong>{setup.runame}</strong>
          {setup.sandbox ? " (sandbox)" : " (production)"}
        </p>
      ) : null}

      {setup.scopes?.length ? (
        <div style={{ margin: "0 0 12px" }}>
          <p style={{ margin: "0 0 6px", fontWeight: 600 }}>
            Enable these OAuth scopes in the eBay Developer Portal:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {setup.scopes.map((scope) => (
              <li key={scope} style={{ fontSize: 12, wordBreak: "break-all" }}>
                {scope.replace("https://api.ebay.com/oauth/api_scope", "").replace(/^\//, "") || "api_scope (base)"}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <a
          href={setup.portal_url}
          target="_blank"
          rel="noopener noreferrer"
          className="marketplace-settings__ebay-btn marketplace-settings__ebay-btn--connect"
          style={{ textDecoration: "none" }}
        >
          <LuExternalLink />
          <span>Open eBay Developer Portal</span>
        </a>
        {onContinue ? (
          <button
            type="button"
            className="marketplace-settings__ebay-btn marketplace-settings__ebay-btn--connect"
            onClick={() => {
              dismissEbayOAuthSetup();
              setDismissed(true);
              onContinue();
            }}
          >
            I updated the RuName — connect eBay
          </button>
        ) : null}
        <button
          type="button"
          className="marketplace-settings__ebay-btn"
          onClick={() => {
            dismissEbayOAuthSetup();
            setDismissed(true);
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
