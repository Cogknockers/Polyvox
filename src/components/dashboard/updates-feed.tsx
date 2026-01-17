import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/format";
import type { DashboardUpdateItem, DashboardUpdateType } from "@/lib/dashboard/get-updates";

type UpdatesFeedProps = {
  items: DashboardUpdateItem[];
  currentPage: number;
  hasNextPage: boolean;
};

const TYPE_LABELS: Record<DashboardUpdateType, string> = {
  post: "Post",
  issue: "Issue",
  status: "Status",
};

export default function UpdatesFeed({
  items,
  currentPage,
  hasNextPage,
}: UpdatesFeedProps) {
  const prevHref = currentPage > 1 ? `/dashboard?page=${currentPage - 1}` : null;
  const nextHref = hasNextPage ? `/dashboard?page=${currentPage + 1}` : null;

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
        No updates yet. Follow counties, entities, or issues to populate this feed.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={`${item.type}-${item.id}-${item.createdAt}`}
            className="flex flex-col gap-2 rounded-lg border border-border p-4"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">{TYPE_LABELS[item.type]}</Badge>
              <span className="font-medium text-foreground">{item.sourceLabel}</span>
              <span>{formatRelativeTime(item.createdAt)}</span>
            </div>
            <Link
              href={item.href}
              className="text-base font-semibold text-foreground hover:underline"
            >
              {item.title}
            </Link>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {prevHref ? (
          <Button variant="outline" asChild>
            <Link href={prevHref}>Prev</Link>
          </Button>
        ) : (
          <Button variant="outline" disabled>
            Prev
          </Button>
        )}
        {nextHref ? (
          <Button variant="outline" asChild>
            <Link href={nextHref}>Next</Link>
          </Button>
        ) : (
          <Button variant="outline" disabled>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
