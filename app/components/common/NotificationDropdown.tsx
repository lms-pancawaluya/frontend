"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/services/notification.service";
import { Bell, CheckCircle2, MessageSquare, Info, FileText, Loader2, AlertCircle } from "lucide-react";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch unread count on mount
    fetchUnreadCount();

    // Handle click outside to close dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  async function fetchUnreadCount() {
    try {
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
    } catch (err) {
      console.warn("Failed to fetch unread count:", err);
    }
  }

  async function fetchNotifications() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getNotifications();
      setNotifications(data);
      // Update unread count based on actual data
      setUnreadCount(data.filter((n: NotificationItem) => !n.isRead).length);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat notifikasi");
    } finally {
      setIsLoading(false);
    }
  };

  async function handleMarkAsRead(id: string, linkUrl?: string) {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await markNotificationAsRead(id);

      if (linkUrl && linkUrl.trim() !== '') {
        setIsOpen(false);
        const targetUrl = linkUrl.startsWith('http') || linkUrl.startsWith('/')
          ? linkUrl
          : `/${linkUrl}`;
        router.push(targetUrl);
      }
    } catch (err) {
      console.warn("Failed to mark as read:", err);
      // Revert on error
      fetchNotifications();
    }
  };

  async function handleMarkAllAsRead() {
    try {
      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      await markAllNotificationsAsRead();
    } catch (err) {
      console.warn("Failed to mark all as read:", err);
      fetchNotifications();
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "NEW_MODULE":
        return <FileText className="w-5 h-5 text-blue-500" />;
      case "NEW_HELPDESK_TICKET":
        return <Info className="w-5 h-5 text-amber-500" />;
      case "HELPDESK_REPLY":
        return <MessageSquare className="w-5 h-5 text-amber-500" />;
      case "NEW_COMMENT":
      case "COMMENT_REPLY":
        return <MessageSquare className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
        aria-label="Notifikasi"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 flex flex-col max-h-[85vh] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-semibold text-slate-800 text-sm">Notifikasi</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-medium text-[#0047A5] hover:text-blue-800 transition flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Loader2 className="w-6 h-6 text-[#0047A5] animate-spin" />
                <p className="text-xs text-slate-500">Memuat notifikasi...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-center px-4">
                <AlertCircle className="w-8 h-8 text-red-400" />
                <p className="text-xs text-slate-600">{error}</p>
                <button
                  onClick={fetchNotifications}
                  className="mt-2 text-xs font-medium text-[#0047A5] hover:underline"
                >
                  Coba lagi
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                  <Bell className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-700">Belum ada notifikasi</p>
                <p className="text-xs text-slate-500 mt-1">Notifikasi baru akan muncul di sini</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleMarkAsRead(notification.id, notification.linkUrl)}
                    className={`flex items-start gap-3 p-4 hover:bg-slate-50 transition cursor-pointer ${
                      !notification.isRead ? "bg-blue-50/30" : ""
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {getIconForType(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.isRead ? "font-semibold text-slate-800" : "font-medium text-slate-700"}`}>
                        {notification.title}
                      </p>
                      <p className={`text-xs mt-0.5 line-clamp-2 ${!notification.isRead ? "text-slate-600" : "text-slate-500"}`}>
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 rounded-full bg-[#0047A5] shrink-0 mt-1.5 shadow-sm"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}