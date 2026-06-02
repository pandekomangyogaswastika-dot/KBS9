import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { api, apiError } from "@/lib/apiClient";
import { realtime } from "@/lib/realtime";
import { useAuth } from "@/context/AuthContext";

const NotificationContext = createContext(null);

const RECENT_LIMIT = 10;

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);            // recent in-app notifications (DB-backed)
  const [unread, setUnread] = useState(0);
  const [connected, setConnected] = useState(false);
  const topicListenersRef = useRef(new Set());       // listeners for "topic" events

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const r = await api.get(`/notifications?limit=${RECENT_LIMIT}`);
      const data = r.data?.data || {};
      setItems(data.items || []);
      setUnread(data.unread || 0);
    } catch (e) {
      console.warn("[notif] refresh failed:", apiError(e));
    }
  }, [user]);

  const markAsRead = useCallback(async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnread((u) => Math.max(0, u - 1));
    } catch (e) {
      toast.error(apiError(e, "Gagal menandai notifikasi"));
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.post("/notifications/read-all");
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch (e) {
      toast.error(apiError(e, "Gagal menandai semua notifikasi"));
    }
  }, []);

  const deleteNotification = useCallback(async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setItems((prev) => {
        const removed = prev.find((n) => n.id === id);
        if (removed && !removed.read) setUnread((u) => Math.max(0, u - 1));
        return prev.filter((n) => n.id !== id);
      });
    } catch (e) {
      toast.error(apiError(e, "Gagal menghapus notifikasi"));
    }
  }, []);

  // Subscribe / unsubscribe to a backend topic for live updates.
  const subscribeTopic = useCallback((topic, handler) => {
    realtime.subscribe(topic);
    const off = realtime.on("topic", (msg) => {
      if (msg?.topic === topic) handler(msg);
    });
    topicListenersRef.current.add(off);
    return () => {
      off();
      topicListenersRef.current.delete(off);
      realtime.unsubscribe(topic);
    };
  }, []);

  // Connect / disconnect WebSocket based on auth state.
  useEffect(() => {
    if (!user) {
      realtime.disconnect();
      setConnected(false);
      setItems([]);
      setUnread(0);
      return undefined;
    }
    realtime.connect();
    const offOpen = realtime.on("open", () => setConnected(true));
    const offClose = realtime.on("close", () => setConnected(false));
    const offNotif = realtime.on("notification", (data) => {
      // Push to top of items, keep cap
      setItems((prev) => {
        const next = [data, ...prev.filter((n) => n.id !== data.id)];
        return next.slice(0, RECENT_LIMIT);
      });
      setUnread((u) => u + 1);
      // Toast preview
      toast(data.title || "Notifikasi baru", {
        description: data.body,
        action: data.link ? {
          label: "Buka",
          onClick: () => { window.location.href = data.link; },
        } : undefined,
      });
    });
    refresh();
    return () => {
      offOpen();
      offClose();
      offNotif();
    };
  }, [user, refresh]);

  const value = {
    items,
    unread,
    connected,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    subscribeTopic,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationProvider");
  return ctx;
}
