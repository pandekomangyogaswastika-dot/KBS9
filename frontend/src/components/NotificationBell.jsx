/**
 * NotificationBell — header dropdown showing recent notifications (Phase 15).
 *
 * Displays a bell icon with an unread count badge. Clicking opens a dropdown
 * (Popover) listing the most recent notifications, with mark-as-read and
 * mark-all-read actions.
 */
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Bell, CheckCheck, Inbox, BadgeCheck, FolderKanban, FileText, MessageSquare,
  Lightbulb, Receipt, AlertCircle, Trash2,
} from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/context/NotificationContext";

/**
 * Get icon component for notification type
 * Uses explicit conditionals to avoid dynamic JSX issues (TD-007)
 */
function getNotificationIcon(type) {
  if (type === "lead.created") return Inbox;
  if (type === "project.created") return FolderKanban;
  if (type === "project.status_changed") return FolderKanban;
  if (type === "project.assigned") return FolderKanban;
  if (type === "approval.requested") return BadgeCheck;
  if (type === "approval.signed") return BadgeCheck;
  if (type === "approval.decided") return BadgeCheck;
  if (type === "invoice.created") return Receipt;
  if (type === "invoice.overdue") return AlertCircle;
  if (type === "invoice.status_changed") return Receipt;
  if (type === "document.uploaded") return FileText;
  if (type === "chat.message") return MessageSquare;
  if (type === "system") return Lightbulb;
  return Bell; // default fallback
}

function RelativeTime({ iso }) {
  if (!iso) return null;
  try {
    const date = new Date(iso);
    const diff = Math.max(0, Date.now() - date.getTime());
    const m = Math.floor(diff / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    let label;
    if (m < 1) label = "baru saja";
    else if (m < 60) label = `${m}m lalu`;
    else if (h < 24) label = `${h}j lalu`;
    else if (d < 7) label = `${d}h lalu`;
    else label = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return <span className="text-[10px] text-[color:var(--kti-text-faint)]">{label}</span>;
  } catch (_e) {
    return null;
  }
}

export function NotificationBell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, unread, connected, markAsRead, markAllAsRead, deleteNotification, refresh } =
    useNotifications();

  const onItemClick = async (n) => {
    if (!n.read) await markAsRead(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-testid="notification-bell"
          aria-label={t("notif.aria")}
          className="kti-focus relative grid size-9 place-items-center rounded-lg border border-white/10 text-[color:var(--kti-text-dim)] transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <Bell className="size-4" />
          {unread > 0 ? (
            <span
              data-testid="notification-bell-badge"
              className="absolute -right-1 -top-1 grid min-w-[18px] place-items-center rounded-full border border-[#0B0D17] bg-[var(--kti-accent,#7C68E1)] px-1 text-[10px] font-semibold text-white shadow"
            >
              {unread > 99 ? "99+" : unread}
            </span>
          ) : null}
          <span
            className={`absolute -bottom-0.5 -left-0.5 size-1.5 rounded-full ${connected ? "bg-emerald-400" : "bg-amber-400"}`}
            aria-hidden
            title={connected ? t("notif.connected") : t("notif.offline")}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[360px] border-white/10 bg-[#0F1322] p-0 text-[color:var(--kti-text-strong)]"
        data-testid="notification-bell-popover"
      >
        <header className="flex items-center justify-between border-b border-white/8 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-white">{t("notif.title")}</p>
            <p className="text-[10px] text-[color:var(--kti-text-dim)]">
              {unread > 0 ? t("notif.unreadCount", { count: unread }) : t("notif.allRead")}
            </p>
          </div>
          {unread > 0 ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 gap-1.5 text-xs text-[color:var(--kti-text-dim)] hover:text-white"
              onClick={() => { markAllAsRead(); }}
              data-testid="notification-mark-all-read"
            >
              <CheckCheck className="size-3.5" />{t("notif.markAllRead")}
            </Button>
          ) : null}
        </header>
        <ScrollArea className="max-h-[420px]">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center text-xs text-[color:var(--kti-text-dim)]">
              <Bell className="size-6 opacity-30" />
              <p>{t("notif.empty")}</p>
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {items.map((n) => {
                const Icon = getNotificationIcon(n.type);
                return (
                  <li
                    key={n.id}
                    data-testid="notification-item"
                    className={`group relative flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-white/[0.04] ${n.read ? "" : "bg-[rgba(124,104,225,0.06)]"}`}
                    onClick={() => onItemClick(n)}
                  >
                    <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border border-white/8 bg-white/[0.04]">
                      <Icon className="size-3.5 text-[color:var(--kti-accent,#7C68E1)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{n.title}</p>
                      {n.body ? <p className="mt-0.5 line-clamp-2 text-[11px] text-[color:var(--kti-text-dim)]">{n.body}</p> : null}
                      <div className="mt-1 flex items-center gap-2">
                        <RelativeTime iso={n.created_at} />
                        {!n.read ? <span className="size-1.5 rounded-full bg-[var(--kti-accent,#7C68E1)]" aria-hidden /> : null}
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label={t("notif.delete")}
                      className="absolute right-2 top-2 hidden size-6 place-items-center rounded text-[color:var(--kti-text-faint)] hover:bg-white/[0.08] hover:text-white group-hover:grid"
                      onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                      data-testid="notification-delete-button"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
        <footer className="border-t border-white/8 px-4 py-2 text-right">
          <button
            type="button"
            onClick={() => { refresh(); }}
            className="text-[11px] text-[color:var(--kti-text-dim)] hover:text-white"
            data-testid="notification-refresh"
          >
            {t("notif.refresh")}
          </button>
        </footer>
      </PopoverContent>
    </Popover>
  );
}

export default NotificationBell;
