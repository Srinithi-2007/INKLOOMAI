"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Icon from "./Icon";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type ApiNotification,
} from "@/lib/api";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load initial notifications
  async function fetchNotifications() {
    try {
      const res = await listNotifications({ limit: 20 });
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch (err) {
      // Ignore background fetch errors
    }
  }

  useEffect(() => {
    fetchNotifications();

    // 30s background polling fallback ensures reliable delivery across serverless platforms
    const pollInterval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    // Setup EventSource SSE connection
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
    const streamUrl = `${apiBase}/api/notifications/stream`;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(streamUrl, { withCredentials: true });

      eventSource.addEventListener("notification", (event) => {
        try {
          const newNotif: ApiNotification = JSON.parse(event.data);
          setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
          setUnreadCount((c) => c + 1);
        } catch (e) {
          console.error("Failed to parse SSE notification:", e);
        }
      });

      eventSource.onerror = () => {
        // EventSource will automatically retry connecting
      };
    } catch (err) {
      console.warn("EventSource unavailable or blocked:", err);
    }

    return () => {
      clearInterval(pollInterval);
      eventSource?.close();
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  async function handleMarkRead(id: string) {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  }

  async function handleMarkAllRead() {
    setLoading(true);
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        aria-label="View notifications"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#e4dcf5] bg-white text-ink transition-colors hover:bg-lavender/40"
      >
        <Icon name="bell" size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-white shadow-sm animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="region"
          aria-label="Notifications Dropdown"
          className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl border border-[#ebe4f7] bg-white p-4 shadow-xl animate-in fade-in slide-in-from-top-2"
        >
          <div className="flex items-center justify-between border-b border-[#f0ebfa] pb-3 mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-ink">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-lavender px-2 py-0.5 text-[11px] font-medium text-primary">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                disabled={loading}
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-accent hover:underline disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[#f5f1fc]">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted">
                No notifications yet
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex flex-col gap-1 p-2.5 transition-colors rounded-lg ${
                    notif.read ? "bg-white hover:bg-canvas/50" : "bg-lavender/30 hover:bg-lavender/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-ink">{notif.title}</span>
                    <span className="text-[10px] text-muted shrink-0">
                      {new Date(notif.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-ink-body leading-relaxed">{notif.message}</p>
                  <div className="mt-1 flex items-center justify-between">
                    {notif.link ? (
                      <Link
                        href={notif.link}
                        onClick={() => {
                          if (!notif.read) handleMarkRead(notif.id);
                          setOpen(false);
                        }}
                        className="text-[11px] font-semibold text-accent hover:underline"
                      >
                        View &rarr;
                      </Link>
                    ) : (
                      <span />
                    )}
                    {!notif.read && (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(notif.id)}
                        className="text-[10px] text-muted hover:text-ink"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
