"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Bell, Check, Trash2, BellOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  action_url: string | null;
  is_read: boolean;
  read_at: string | null;
  reference_type: string | null;
  reference_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface NotificationsResponse {
  data: NotificationItem[];
  meta: { total: number; page: number; limit: number; unread_count: number };
}

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function typeIcon(type: string): string {
  if (type.includes("payment")) return "💳";
  if (type.includes("refund")) return "↩️";
  if (type.includes("payout")) return "💰";
  if (type.includes("registration")) return "🎟️";
  if (type.includes("ticket")) return "🎫";
  if (type.includes("event_approved")) return "✅";
  if (type.includes("event_rejected")) return "❌";
  return "🔔";
}

export function NotificationBell() {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchNotifications = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/protected/notifications?limit=20");
      if (!res.ok) throw new Error("Failed to load notifications");
      const body = (await res.json()) as NotificationsResponse;
      setItems(body.data);
      setUnreadCount(body.meta.unread_count);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll every 60 seconds for new notifications (cheap count-only path)
  React.useEffect(() => {
    let mounted = true;
    const tick = async () => {
      try {
        const res = await fetch("/api/protected/notifications?limit=1");
        if (!res.ok || !mounted) return;
        const body = (await res.json()) as NotificationsResponse;
        setUnreadCount(body.meta.unread_count);
      } catch {
        // Best-effort
      }
    };
    const interval = setInterval(tick, 60_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Load full list when opened
  React.useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  const markAllRead = async () => {
    try {
      await fetch("/api/protected/notifications/read-all", { method: "PATCH" });
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (e) {
      console.error("[NotificationBell] markAllRead failed:", e);
    }
  };

  const markOneRead = async (id: string) => {
    try {
      await fetch(`/api/protected/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_read: true }),
      });
      setItems((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error("[NotificationBell] markOneRead failed:", e);
    }
  };

  const deleteOne = async (id: string) => {
    try {
      await fetch(`/api/protected/notifications/${id}`, { method: "DELETE" });
      setItems((prev) => {
        const removed = prev.find((n) => n.id === id);
        if (removed && !removed.is_read) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== id);
      });
    } catch (e) {
      console.error("[NotificationBell] deleteOne failed:", e);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative h-9 w-9 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          <Bell className="h-4 w-4 text-muted-foreground" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                key="badge"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center shadow-sm"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[380px] max-h-[520px] overflow-y-auto p-0"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border p-3 flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllRead}
              className="h-7 text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Body */}
        <div className="divide-y divide-border">
          {loading && items.length === 0 ? (
            <div className="p-4 space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center text-sm text-destructive">{error}</div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center">
              <BellOff className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            items.map((n) => (
              <NotificationRow
                key={n.id}
                item={n}
                onMarkRead={() => markOneRead(n.id)}
                onDelete={() => deleteOne(n.id)}
              />
            ))
          )}
        </div>

        <DropdownMenuSeparator />
        <div className="p-2">
          <DropdownMenuItem asChild>
            <Link
              href="/settings/notifications"
              className="flex items-center justify-center text-xs text-primary hover:underline w-full"
            >
              Notification settings
            </Link>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface NotificationRowProps {
  item: NotificationItem;
  onMarkRead: () => void;
  onDelete: () => void;
}

function NotificationRow({ item, onMarkRead, onDelete }: NotificationRowProps) {
  return (
    <div
      className={cn(
        "relative flex items-start gap-3 p-3 transition-colors hover:bg-muted/50 group",
        !item.is_read && "bg-primary/5"
      )}
    >
      <div className="text-xl shrink-0 mt-0.5" aria-hidden>
        {typeIcon(item.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <p className={cn("text-sm font-medium truncate", !item.is_read && "text-foreground")}>
            {item.title}
          </p>
          {!item.is_read && (
            <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" aria-label="unread" />
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.message}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(item.created_at)}</p>
        {item.action_url && (
          <Link
            href={item.action_url}
            onClick={onMarkRead}
            className="text-xs text-primary hover:underline mt-1 inline-block"
          >
            View →
          </Link>
        )}
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-0.5">
        {!item.is_read && (
          <button
            onClick={onMarkRead}
            className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center"
            aria-label="Mark as read"
          >
            <Check className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
        <button
          onClick={onDelete}
          className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center"
          aria-label="Delete"
        >
          <Trash2 className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
