import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LuMapPin } from "react-icons/lu";
import { getShipFromStatus, SHIP_FROM_CLIENT_MESSAGE, SHIP_FROM_SETTINGS_PATH } from "../../utils/ebayShipFrom";

const SHIP_FROM_SAVED_NOTICE_KEY = "autods.shipFromSavedNoticeSeen";

export default function ShipFromSetupNotice({ settings, className = "" }) {
  const { complete, missing } = getShipFromStatus(settings);
  const [showSavedNotice, setShowSavedNotice] = useState(false);

  useEffect(() => {
    if (!complete) {
      setShowSavedNotice(false);
      return;
    }

    if (localStorage.getItem(SHIP_FROM_SAVED_NOTICE_KEY)) {
      return;
    }

    setShowSavedNotice(true);

    const timer = window.setTimeout(() => {
      setShowSavedNotice(false);
      localStorage.setItem(SHIP_FROM_SAVED_NOTICE_KEY, "1");
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [complete]);

  if (complete) {
    if (!showSavedNotice) {
      return null;
    }

    return (
      <div
        className={className}
        style={{
          marginBottom: 16,
          padding: "12px 16px",
          borderRadius: 10,
          border: "1px solid #bbf7d0",
          background: "#f0fdf4",
          color: "#166534",
          fontSize: 13,
          lineHeight: 1.5,
        }}
      >
        <strong>Ship-from address saved.</strong> You can publish listings to eBay.
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        marginBottom: 16,
        padding: "14px 16px",
        borderRadius: 10,
        border: "1px solid #fcd34d",
        background: "#fffbeb",
        color: "#92400e",
        fontSize: 13,
        lineHeight: 1.55,
      }}
    >
      <p style={{ margin: "0 0 8px", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
        <LuMapPin />
        Complete your ship-from address before publishing to eBay
      </p>
      <p style={{ margin: "0 0 10px" }}>{SHIP_FROM_CLIENT_MESSAGE}</p>
      {missing.length ? (
        <p style={{ margin: "0 0 10px" }}>
          Still needed: <strong>{missing.join(", ")}</strong>
        </p>
      ) : null}
      <Link
        to={SHIP_FROM_SETTINGS_PATH}
        style={{
          display: "inline-block",
          padding: "8px 14px",
          borderRadius: 8,
          background: "#d97706",
          color: "#fff",
          textDecoration: "none",
          fontWeight: 600,
          fontSize: 13,
        }}
      >
        Open Lister Settings
      </Link>
    </div>
  );
}
