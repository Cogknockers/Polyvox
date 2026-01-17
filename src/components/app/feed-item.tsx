import { Badge } from "@/components/ui/badge";
import type { FeedItemBase } from "@/lib/mock-data";
import { formatCompactNumber, formatRelativeTime } from "@/lib/format";
import { kindLabel } from "@/lib/ui";

export default function FeedItem({ item }: { item: FeedItemBase }) {
  const timestamp = formatRelativeTime(item.createdAtISO);

  return (
    <div className="space-y-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary" className="rounded-full text-[11px]">
          {kindLabel(item.kind)}
        </Badge>
        <span>{timestamp}</span>
        <span>|</span>
        <span>{item.jurisdictionTag}</span>
        {item.officeTag ? (
          <>
            <span>|</span>
            <span>{item.officeTag}</span>
          </>
        ) : null}
        {item.roleTag ? (
          <Badge variant="outline" className="rounded-full text-[11px]">
            {item.roleTag}
          </Badge>
        ) : null}
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{item.title}</h3>
        <p className="text-xs text-muted-foreground">{item.author}</p>
      </div>
      <p className="text-sm text-muted-foreground">{item.excerpt}</p>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {typeof item.stats?.replies === "number" ? (
          <span>{formatCompactNumber(item.stats.replies)} replies</span>
        ) : null}
        {typeof item.stats?.votes === "number" ? (
          <span>{formatCompactNumber(item.stats.votes)} votes</span>
        ) : null}
        {item.badges?.map((badge) => (
          <Badge key={badge} variant="outline" className="rounded-full text-[11px]">
            {badge}
          </Badge>
        ))}
      </div>
    </div>
  );
}
