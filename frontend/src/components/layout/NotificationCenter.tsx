import { useState, useRef, useEffect } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { formatRelativeTime } from "../../services/dashboard/dashboardService";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../services/notificationService";
import type { AppNotification } from "../../types/notification";

function NotificationCenter() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  // Signed-out visitors never see (or count) persisted notifications.
  const visibleNotifications = isAuthenticated ? notifications : [];
  const unreadCount = visibleNotifications.filter((n) => !n.read).length;

  /* Load on mount, signed-in state change, and whenever the dropdown opens
     so the unread badge stays fresh. */
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    getNotifications()
      .then((list) => {
        if (!cancelled) setNotifications(list.items);
      })
      .catch(() => {
        // Backend unavailable — keep whatever was already loaded.
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, open]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  function markRead(id: number) {
    // Optimistic flip — the persisted flag catches up right after.
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    markNotificationRead(id).catch(() => {
      // Keep the optimistic state; the next open refreshes from the server.
    });
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    markAllNotificationsRead().catch(() => {
      // Keep the optimistic state; the next open refreshes from the server.
    });
  }

  return (
    <div className="notification-center" ref={ref}>
      <button
        className="icon-btn notification-trigger"
        onClick={() => setOpen(!open)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
      >
        <Bell size={18} strokeWidth={2} />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="notification-dropdown animate-slide-down">
          <div className="notification-header">
            <h3 className="notification-title">Notifications</h3>
            {unreadCount > 0 && (
              <button className="notification-mark-all" onClick={markAllRead}>
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          <div className="notification-list">
            {visibleNotifications.length === 0 ? (
              <div className="notification-empty">
                <Bell size={24} strokeWidth={1.5} />
                <p>No notifications yet</p>
              </div>
            ) : (
              visibleNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`notification-item${n.read ? "" : " notification-unread"}`}
                  onClick={() => markRead(n.id)}
                >
                  {!n.read && <span className="notification-dot" />}
                  <div className="notification-content">
                    <p className="notification-item-title">{n.title}</p>
                    <span className="notification-time">{formatRelativeTime(n.created_at)}</span>
                  </div>
                  {n.read && (
                    <span className="notification-read-icon">
                      <Check size={12} />
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;
