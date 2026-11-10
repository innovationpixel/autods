import { useCallback, useEffect, useRef, useState } from "react";
import {
  LuBell,
  LuBox,
  LuCheckCheck,
  LuLoader,
  LuMessageCircleMore,
  LuRefreshCw,
  LuShieldAlert,
  LuShoppingBag,
  LuStore,
  LuTriangleAlert,
  LuX,
} from "react-icons/lu";
import { toast } from "../../utils/toast";
import { getStoredToken } from "../../services/AuthService";
import {
  dismissNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATIONS_REFRESH_EVENT,
  NOTIFICATIONS_STORAGE_KEY,
  syncNotifications,
} from "../../services/NotificationService";
import { dispatchNewOrdersCount } from "../../services/OrderService";

const POLL_INTERVAL_MS = 15000;
const AUTO_SYNC_INTERVAL_MS = 60000;
const FOCUS_SYNC_COOLDOWN_MS = 30000;
const POPOVER_PREVIEW_LIMIT = 6;

const FILTER_TABS = [
  { id: "all", label: "All", countKey: "all" },
  { id: "unread", label: "Unread", countKey: "unread" },
  { id: "orders", label: "Orders", countKey: "orders" },
  { id: "messages", label: "Messages", countKey: "messages" },
  { id: "returns", label: "Returns", countKey: "returns" },
  { id: "stock", label: "Stock", countKey: "stock" },
];

const EMPTY_COUNTS = {
  all: 0,
  unread: 0,
  orders: 0,
  messages: 0,
  returns: 0,
  stock: 0,
};

function formatBadgeCount(count) {
  if (count <= 0) return "";
  return count > 99 ? "99+" : String(count);
}

function formatSyncTimeLabel(isoString) {
  if (!isoString) return "";
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) return "";
  const diffSec = Math.max(0, Math.floor((Date.now() - parsed.getTime()) / 1000));
  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h ago`;
}

function resolveNotificationVisual(notification) {
  const category = String(notification?.category || "system").toLowerCase();
  const severity = String(notification?.severity || "info").toLowerCase();

  let Icon = LuBell;
  if (category === "order") {
    Icon = LuShoppingBag;
  } else if (category === "message") {
    Icon = LuMessageCircleMore;
  } else if (category === "return" || category === "dispute") {
    Icon = LuShieldAlert;
  } else if (category === "stock" || category === "listing") {
    Icon = severity === "danger" || severity === "warning" ? LuTriangleAlert : LuBox;
  }

  return {
    Icon,
    tone: ["success", "warning", "danger", "info"].includes(severity) ? severity : "info",
  };
}

function NotificationRow({ notification, onSelect, onDismiss }) {
  const { Icon, tone } = resolveNotificationVisual(notification);
  const isUnread = !notification.is_read;

  return (
    <div
      className={`notification-item-wrap ${isUnread ? "notification-item-wrap--unread" : "notification-item-wrap--read"}`}
    >
      <button
        type="button"
        className="notification-popover__item"
        onClick={() => onSelect(notification)}
      >
        <span className={`notification-popover__dot notification-popover__dot--${tone}`} aria-hidden="true">
          <Icon />
        </span>

        <span className="notification-popover__copy">
          <span className="notification-popover__headline-row">
            <strong>{notification.title}</strong>
            {isUnread ? <span className="notification-popover__unread-pip" aria-label="Unread" /> : null}
          </span>
          <span>{notification.message}</span>
          {(notification.store_name || notification.category) ? (
            <span className="notification-popover__meta-row">
              {notification.store_name ? (
                <span className="notification-popover__store-tag">
                  <LuStore />
                  {notification.store_name}
                </span>
              ) : null}
              <span className="notification-popover__cat-tag">{notification.category}</span>
            </span>
          ) : null}
        </span>

        <span className="notification-popover__time">{notification.time}</span>
      </button>

      <button
        type="button"
        className="notification-item__dismiss"
        aria-label="Dismiss notification"
        title="Dismiss"
        onClick={(event) => onDismiss(event, notification)}
      >
        <LuX />
      </button>
    </div>
  );
}

export default function HeaderNotifications({
  notificationsRef,
  open,
  setOpen,
  modalOpen,
  setModalOpen,
  onBeforeOpen,
  onNavigate,
}) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState(EMPTY_COUNTS);
  const [hasEbayConnection, setHasEbayConnection] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [bellPulse, setBellPulse] = useState(false);

  const activeFilterRef = useRef("all");
  const initializedRef = useRef(false);
  const seenUnreadIdsRef = useRef(new Set());
  const lastLiveSyncAttemptRef = useRef(0);
  const inFlightRef = useRef(false);
  const pulseTimerRef = useRef(null);

  useEffect(() => {
    activeFilterRef.current = activeFilter;
  }, [activeFilter]);

  const applyResponsePayload = useCallback((payload, announceNew = false) => {
    const list = Array.isArray(payload?.notifications) ? payload.notifications : [];
    const nextUnread = Number(payload?.unread_count ?? 0);
    const nextTotal = Number(payload?.total_count ?? list.length);

    setNotifications(list);
    setUnreadCount(nextUnread);
    setTotalCount(nextTotal);
    setCategoryCounts({ ...EMPTY_COUNTS, ...(payload?.category_counts || {}) });
    setHasEbayConnection(payload?.has_ebay_connection ?? true);
    if (payload?.last_synced_at) {
      setLastSyncedAt(payload.last_synced_at);
    }
    if (
      payload?.new_orders_count !== undefined &&
      Number.isFinite(Number(payload.new_orders_count))
    ) {
      dispatchNewOrdersCount(Number(payload.new_orders_count));
    }

    const unreadItems = list.filter((item) => !item.is_read);

    if (!initializedRef.current) {
      initializedRef.current = true;
      unreadItems.forEach((item) => seenUnreadIdsRef.current.add(item.id));
      return;
    }

    const newlyArrived = unreadItems.filter((item) => !seenUnreadIdsRef.current.has(item.id));
    unreadItems.forEach((item) => seenUnreadIdsRef.current.add(item.id));

    if (announceNew && newlyArrived.length > 0) {
      setBellPulse(true);
      if (pulseTimerRef.current) {
        clearTimeout(pulseTimerRef.current);
      }
      pulseTimerRef.current = setTimeout(() => setBellPulse(false), 1800);

      const latest = newlyArrived[0];
      if (newlyArrived.length === 1) {
        toast.info(`${latest.title}`);
      } else {
        toast.info(`${newlyArrived.length} new eBay notifications`);
      }
    }
  }, []);

  const fetchNotifications = useCallback(
    async ({ sync = false, filter = activeFilterRef.current, announceNew = true } = {}) => {
      if (!getStoredToken()) {
        setLoading(false);
        return;
      }

      if (inFlightRef.current) {
        return;
      }

      inFlightRef.current = true;
      if (sync) {
        lastLiveSyncAttemptRef.current = Date.now();
      }

      try {
        const params = { limit: 40 };
        if (filter && filter !== "all") {
          params.category = filter;
        }
        if (sync) {
          params.sync = 1;
        }

        const res = await getNotifications(params);
        applyResponsePayload(res.data, announceNew);
      } catch {
        // Keep last visible state seamlessly on transient network failures
      } finally {
        inFlightRef.current = false;
        setLoading(false);
      }
    },
    [applyResponsePayload],
  );

  // Initial load + 15s polling (DB read every 15s, live eBay sync every 60s when visible)
  useEffect(() => {
    fetchNotifications({ sync: true, announceNew: false });

    const intervalId = setInterval(() => {
      if (document.visibilityState !== "visible") {
        return;
      }
      const dueForEbaySync = Date.now() - lastLiveSyncAttemptRef.current >= AUTO_SYNC_INTERVAL_MS;
      fetchNotifications({ sync: dueForEbaySync, announceNew: true });
    }, POLL_INTERVAL_MS);

    const handleFocusOrVisible = () => {
      if (document.visibilityState !== "visible") {
        return;
      }
      const dueForEbaySync = Date.now() - lastLiveSyncAttemptRef.current >= FOCUS_SYNC_COOLDOWN_MS;
      fetchNotifications({ sync: dueForEbaySync, announceNew: true });
    };

    const handleRefreshEvent = () => {
      fetchNotifications({ sync: false, announceNew: false });
    };

    const handleStorageEvent = (event) => {
      if (event.key === NOTIFICATIONS_STORAGE_KEY) {
        fetchNotifications({ sync: false, announceNew: false });
      }
    };

    window.addEventListener("focus", handleFocusOrVisible);
    document.addEventListener("visibilitychange", handleFocusOrVisible);
    window.addEventListener(NOTIFICATIONS_REFRESH_EVENT, handleRefreshEvent);
    window.addEventListener("storage", handleStorageEvent);

    return () => {
      clearInterval(intervalId);
      if (pulseTimerRef.current) {
        clearTimeout(pulseTimerRef.current);
      }
      window.removeEventListener("focus", handleFocusOrVisible);
      document.removeEventListener("visibilitychange", handleFocusOrVisible);
      window.removeEventListener(NOTIFICATIONS_REFRESH_EVENT, handleRefreshEvent);
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, [fetchNotifications]);

  // Close popover or modal on Escape
  useEffect(() => {
    if (!open && !modalOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        setModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, modalOpen, setOpen, setModalOpen]);

  const handleToggleBell = () => {
    const nextOpen = !open;
    if (nextOpen) {
      onBeforeOpen?.();
      const dueForSync = Date.now() - lastLiveSyncAttemptRef.current >= FOCUS_SYNC_COOLDOWN_MS;
      fetchNotifications({ sync: dueForSync, announceNew: false });
    }
    setOpen(nextOpen);
    setModalOpen(false);
  };

  const handleFilterChange = (filterId) => {
    setActiveFilter(filterId);
    activeFilterRef.current = filterId;
    fetchNotifications({ sync: false, filter: filterId, announceNew: false });
  };

  const handleManualSync = async () => {
    if (syncing) return;
    setSyncing(true);
    lastLiveSyncAttemptRef.current = Date.now();
    try {
      const res = await syncNotifications();
      applyResponsePayload(res.data, false);
      if (res.data?.message) {
        toast.info(res.data.message);
      }
    } catch {
      toast.error("Failed to sync notifications from eBay.");
    } finally {
      setSyncing(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    const scopeCategory = activeFilter !== "all" && activeFilter !== "unread" ? activeFilter : null;

    try {
      const res = await markAllNotificationsRead(scopeCategory);
      const nextUnread = Number(res.data?.unread_count ?? 0);
      setUnreadCount(nextUnread);
      setNotifications((current) => {
        const updated = current.map((item) => ({ ...item, is_read: true }));
        return activeFilter === "unread" ? [] : updated;
      });
      setCategoryCounts((current) => ({ ...current, unread: nextUnread }));
    } catch {
      toast.error("Could not mark notifications as read.");
    } finally {
      setMarkingAll(false);
    }
  };

  const handleSelectNotification = async (notification) => {
    const wasUnread = !notification.is_read;

    if (wasUnread) {
      setUnreadCount((current) => Math.max(0, current - 1));
      setCategoryCounts((current) => ({ ...current, unread: Math.max(0, (current.unread ?? 0) - 1) }));
      setNotifications((current) => {
        const updated = current.map((item) =>
          item.id === notification.id ? { ...item, is_read: true } : item,
        );
        return activeFilter === "unread"
          ? updated.filter((item) => item.id !== notification.id)
          : updated;
      });

      markNotificationRead(notification.id)
        .then((res) => {
          if (typeof res.data?.unread_count === "number") {
            setUnreadCount(res.data.unread_count);
          }
        })
        .catch(() => {});
    }

    setOpen(false);
    setModalOpen(false);

    if (notification.action_path && onNavigate) {
      onNavigate(notification.action_path);
    }
  };

  const handleDismissNotification = async (event, notification) => {
    event.stopPropagation();

    setNotifications((current) => current.filter((item) => item.id !== notification.id));
    setTotalCount((current) => Math.max(0, current - 1));
    if (!notification.is_read) {
      setUnreadCount((current) => Math.max(0, current - 1));
    }

    try {
      const res = await dismissNotification(notification.id);
      if (typeof res.data?.unread_count === "number") {
        setUnreadCount(res.data.unread_count);
      }
      fetchNotifications({ sync: false, filter: activeFilterRef.current, announceNew: false });
    } catch {
      fetchNotifications({ sync: false, filter: activeFilterRef.current, announceNew: false });
    }
  };

  const previewNotifications = notifications.slice(0, POPOVER_PREVIEW_LIMIT);
  const badgeText = formatBadgeCount(unreadCount);
  const lastSyncLabel = formatSyncTimeLabel(lastSyncedAt);

  const renderFilterTabs = (keyPrefix) => (
    <div className="notification-tabs" role="tablist" aria-label="Filter notifications">
      {FILTER_TABS.map((tab) => {
        const count = Number(categoryCounts?.[tab.countKey] ?? 0);
        const isActive = activeFilter === tab.id;
        return (
          <button
            key={`${keyPrefix}-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`notification-tab ${isActive ? "notification-tab--active" : ""}`}
            onClick={() => handleFilterChange(tab.id)}
          >
            <span>{tab.label}</span>
            {count > 0 ? <span className="notification-tab__count">{count > 99 ? "99+" : count}</span> : null}
          </button>
        );
      })}
    </div>
  );

  const renderEmptyState = (inModal = false) => (
    <div className={`notification-empty-state ${inModal ? "notification-empty-state--modal" : ""}`}>
      {loading ? (
        <>
          <span className="notification-empty-state__icon">
            <LuLoader className="spin-icon" />
          </span>
          <strong>Checking eBay notifications...</strong>
          <p>Syncing live orders, messages, returns, and stock alerts.</p>
        </>
      ) : !hasEbayConnection ? (
        <>
          <span className="notification-empty-state__icon">
            <LuStore />
          </span>
          <strong>No eBay store connected</strong>
          <p>Connect your eBay seller account to get real-time orders, buyer messages, and stock alerts here.</p>
          <button
            type="button"
            className="notification-empty-state__cta"
            onClick={() => {
              setOpen(false);
              setModalOpen(false);
              onNavigate?.("/settings");
            }}
          >
            Connect eBay Store
          </button>
        </>
      ) : (
        <>
          <span className="notification-empty-state__icon">
            <LuBell />
          </span>
          <strong>
            {activeFilter === "all"
              ? "You're all caught up"
              : `No ${activeFilter} notifications`}
          </strong>
          <p>
            {activeFilter === "all"
              ? "Real-time alerts from eBay orders, buyer messages, returns, and stock changes appear here."
              : "Switch tabs or sync with eBay to check for recent updates."}
          </p>
          <button
            type="button"
            className="notification-empty-state__cta"
            onClick={handleManualSync}
            disabled={syncing}
          >
            {syncing ? <LuLoader className="spin-icon" /> : <LuRefreshCw />}
            <span>{syncing ? "Syncing..." : "Check eBay Now"}</span>
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className="marketplace-header__notifications" ref={notificationsRef}>
      <button
        type="button"
        className={`marketplace-header__icon-btn marketplace-header__icon-btn--bell ${unreadCount > 0 ? "marketplace-header__icon-btn--has-unread" : ""} ${bellPulse ? "marketplace-header__icon-btn--pulse" : ""}`}
        aria-label={unreadCount > 0 ? `Open notifications (${unreadCount} unread)` : "Open notifications"}
        aria-expanded={open}
        onClick={handleToggleBell}
      >
        <LuBell />
        {unreadCount > 0 ? (
          <span className="marketplace-header__bell-badge" aria-hidden="true">
            {badgeText}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="notification-popover" role="dialog" aria-label="eBay Notifications">
          <div className="notification-popover__head">
            <div className="notification-popover__title">
              <LuBell />
              <h2>Notifications</h2>
              <span>{unreadCount}</span>
            </div>

            <div className="notification-popover__actions">
              <button
                type="button"
                className="notification-popover__action-btn"
                title="Sync from eBay"
                aria-label="Sync notifications from eBay"
                onClick={handleManualSync}
                disabled={syncing}
              >
                <LuRefreshCw className={syncing ? "spin-icon" : ""} />
              </button>
              <button
                type="button"
                className="notification-popover__action-btn"
                title="Mark all as read"
                aria-label="Mark all notifications as read"
                onClick={handleMarkAllRead}
                disabled={markingAll || unreadCount === 0}
              >
                <LuCheckCheck />
              </button>
              <button
                type="button"
                className="notification-popover__close"
                aria-label="Close notifications"
                onClick={() => setOpen(false)}
              >
                <LuX />
              </button>
            </div>
          </div>

          {renderFilterTabs("pop")}

          {previewNotifications.length > 0 ? (
            <div className="notification-popover__list">
              {previewNotifications.map((notification) => (
                <NotificationRow
                  key={`pop-${notification.id}`}
                  notification={notification}
                  onSelect={handleSelectNotification}
                  onDismiss={handleDismissNotification}
                />
              ))}
            </div>
          ) : (
            renderEmptyState(false)
          )}

          <div className="notification-popover__footer">
            {lastSyncLabel ? (
              <span className="notification-popover__sync-note">Live eBay sync · {lastSyncLabel}</span>
            ) : (
              <span className="notification-popover__sync-note">Auto-syncs with eBay</span>
            )}

            {notifications.length > 0 ? (
              <button
                type="button"
                className="notification-popover__see-more"
                onClick={() => {
                  setOpen(false);
                  setModalOpen(true);
                }}
              >
                {totalCount > POPOVER_PREVIEW_LIMIT
                  ? `See all notifications (${totalCount})`
                  : "Expand view"}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {modalOpen ? (
        <div className="notification-modal-layer" role="dialog" aria-label="All eBay notifications">
          <button
            type="button"
            className="notification-modal-layer__backdrop"
            aria-label="Close notifications modal"
            onClick={() => setModalOpen(false)}
          />
          <section className="notification-modal">
            <div className="notification-modal__head">
              <div className="notification-popover__title">
                <LuBell />
                <h2>eBay Notifications</h2>
                <span>{unreadCount}</span>
              </div>

              <div className="notification-popover__actions">
                <button
                  type="button"
                  className="notification-popover__action-text-btn"
                  onClick={handleManualSync}
                  disabled={syncing}
                >
                  <LuRefreshCw className={syncing ? "spin-icon" : ""} />
                  <span>{syncing ? "Syncing..." : "Sync eBay"}</span>
                </button>
                <button
                  type="button"
                  className="notification-popover__action-text-btn"
                  onClick={handleMarkAllRead}
                  disabled={markingAll || unreadCount === 0}
                >
                  <LuCheckCheck />
                  <span>Mark all read</span>
                </button>
                <button
                  type="button"
                  className="notification-popover__close"
                  aria-label="Close all notifications"
                  onClick={() => setModalOpen(false)}
                >
                  <LuX />
                </button>
              </div>
            </div>

            {renderFilterTabs("modal")}

            <div className="notification-modal__body">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <NotificationRow
                    key={`modal-${notification.id}`}
                    notification={notification}
                    onSelect={handleSelectNotification}
                    onDismiss={handleDismissNotification}
                  />
                ))
              ) : (
                renderEmptyState(true)
              )}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
