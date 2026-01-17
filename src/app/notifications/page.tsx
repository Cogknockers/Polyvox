import Link from "next/link";
import { redirect } from "next/navigation";

import AppFooter from "@/components/app/app-footer";
import AppHeaderShell from "@/components/app/app-header-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const PAGE_SIZE = 25;

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams?: { page?: string } | Promise<{ page?: string }>;
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const currentPage = Math.max(1, Number(resolvedSearchParams?.page) || 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/notifications")}`);
  }

  const { data: rows, error } = await supabase
    .from("user_notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to load notifications: ${error.message}`);
  }

  const notifications = (rows ?? []) as Array<Record<string, unknown>>;
  const hasNextPage = notifications.length === PAGE_SIZE;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeaderShell showFilters={false} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:py-10">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">Notifications</h1>
              <p className="text-sm text-muted-foreground">
                Latest updates across the county network.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No notifications yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => {
                    const id = String(notification.id ?? "");
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
                    const isUnread =
                      !notification.read_at && notification.is_read !== true;
                    const url =
                      typeof notification.url === "string"
                        ? notification.url
                        : null;

                    return (
                      <Card key={id} className="border border-border">
                        <CardContent className="flex flex-col gap-2 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] uppercase">
                                {(notification.type as string | null) ?? "update"}
                              </Badge>
                              {isUnread ? (
                                <Badge variant="secondary" className="text-[10px] uppercase">
                                  Unread
                                </Badge>
                              ) : null}
                            </div>
                            {createdAt ? (
                              <span className="text-xs text-muted-foreground">
                                {formatRelativeTime(createdAt)}
                              </span>
                            ) : null}
                          </div>
                          <div className="space-y-1">
                            {url ? (
                              <Link href={url} className="text-sm font-semibold text-foreground hover:underline">
                                {title}
                              </Link>
                            ) : (
                              <p className="text-sm font-semibold text-foreground">{title}</p>
                            )}
                            {detail ? (
                              <p className="text-xs text-muted-foreground">{detail}</p>
                            ) : null}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-between pt-4">
                <Button variant="outline" disabled={currentPage <= 1} asChild>
                  <Link href={`/notifications?page=${Math.max(1, currentPage - 1)}`}>
                    Prev
                  </Link>
                </Button>
                <span className="text-xs text-muted-foreground">
                  Page {currentPage}
                </span>
                <Button variant="outline" disabled={!hasNextPage} asChild>
                  <Link href={`/notifications?page=${currentPage + 1}`}>Next</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
