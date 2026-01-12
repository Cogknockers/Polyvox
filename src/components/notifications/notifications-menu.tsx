"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";

import { markAllNotificationsRead, markNotificationRead } from "@/app/notifications/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const PAGE_LIMIT = 20;
const MAX_BADGE = 99;

export type NotificationRow = {
  id: string;
  title?: string | null;
  body?: string | null;
  type?: string | null;
  url?: string | null;
  created_at?: string | null;
  read_at?: string | null;
  is_read?: boolean | null;
  [key: string]: unknown;
};

export default function NotificationsMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const unreadLabel = useMemo(() => {
    if (unreadCount <= 0) return null;
    if (unreadCount > MAX_BADGE) return `${MAX_BADGE}+`;
    return String(unreadCount);
  }, [unreadCount]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let active = true;

    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user ?? null;
      if (!active) return;

      setIsAuthed(Boolean(user));
      setUserId(user?.id ?? null);
      if (!user) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      void refreshUnreadCount(user.id, supabase);
    };

    syncSession();
    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      syncSession();
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!open || !userId) return;
    void refreshNotifications(userId);
  }, [open, userId]);

  const refreshNotifications = async (uid: string) => {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("user_notifications")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(PAGE_LIMIT);

    if (!error) {
      setNotifications((data ?? []) as NotificationRow[]);
    }

    await refreshUnreadCount(uid, supabase, (data ?? []) as NotificationRow[]);
    setLoading(false);
  };

  const refreshUnreadCount = async (
    uid: string,
    supabase = createSupabaseBrowserClient(),
    fallbackList: NotificationRow[] = notifications,
  ) => {
    const { data: unreadRow, error: unreadError } = await supabase
      .from("user_unread_count_v1")
      .select("unread_count")
      .eq("user_id", uid)
      .maybeSingle();

    if (!unreadError && typeof unreadRow?.unread_count === "number") {
      setUnreadCount(unreadRow.unread_count);
      return;
    }

    const { count, error: countError } = await supabase
      .from("user_notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", uid)
      .is("read_at", null);

    if (!countError && typeof count === "number") {
      setUnreadCount(count);
      return;
    }

    const { count: fallbackCount, error: fallbackError } = await supabase
      .from("user_notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", uid)
      .eq("is_read", false);

    if (!fallbackError && typeof fallbackCount === "number") {
      setUnreadCount(fallbackCount);
      return;
    }

    const computed = fallbackList.filter((item) => !isRead(item)).length;
    setUnreadCount(computed);
  };

  const handleNotificationClick = (notification: NotificationRow) => {
    if (!notification.id) return;
    if (notification.url) {
      router.push(notification.url as string);
    }

    if (!isRead(notification)) {
      startTransition(async () => {
        await markNotificationRead(notification.id);
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id
              ? { ...item, read_at: item.read_at ?? new Date().toISOString(), is_read: true }
              : item,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      });
    }
  };

  const handleMarkAllRead = () => {
    if (!userId || notifications.length === 0) return;
    startTransition(async () => {
      await markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          read_at: item.read_at ?? new Date().toISOString(),
          is_read: true,
        })),
      );
      setUnreadCount(0);
    });
  };

  if (!isAuthed) {
    return null;
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {unreadLabel ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unreadLabel}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            <p className="text-xs text-muted-foreground">Latest updates for you</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={notifications.length === 0 || isPending}
            onClick={handleMarkAllRead}
          >
            Mark all read
          </Button>
        </div>
        <ScrollArea className="h-80">
          {loading ? (
            <div className="px-4 py-6 text-sm text-muted-foreground">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-6 text-sm text-muted-foreground">
              No notifications yet.
            </div>
          ) : (
            <div className="py-2">
              {notifications.map((notification) => {
                const title =
                  (notification.title as string | null) ??
                  (notification.subject as string | null) ??
                  "Notification";
                const detail =
                  (notification.body as string | null) ??
                  (notification.message as string | null);
                const createdAt =
                  typeof notification.created_at === "string"
                    ? notification.created_at
                    : null;
                const isUnread = !isRead(notification);

                return (
                  <DropdownMenuItem
                    key={notification.id}
                    className={cn(
                      "flex cursor-pointer flex-col items-start gap-2 px-4 py-3",
                      isUnread ? "bg-muted/40" : "",
                    )}
                    onSelect={() => handleNotificationClick(notification)}
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {(notification.type as string | null) ?? "update"}
                      </Badge>
                      {createdAt ? (
                        <span className="text-[11px] text-muted-foreground">
                          {formatRelativeTime(createdAt)}
                        </span>
                      ) : null}
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {title}
                    </span>
                    {detail ? (
                      <span className="text-xs text-muted-foreground">
                        {detail}
                      </span>
                    ) : null}
                  </DropdownMenuItem>
                );
              })}
            </div>
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <div className="px-4 py-2">
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <Link href={`/notifications?next=${encodeURIComponent(pathname ?? "/")}`}>
              View all notifications
            </Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function isRead(notification: NotificationRow) {
  return Boolean(notification.read_at) || notification.is_read === true;
}
