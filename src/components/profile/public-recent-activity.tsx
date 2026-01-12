import Link from "next/link";
import { MessageSquare, FileText, ThumbsUp, Megaphone } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockPublicActivity } from "@/lib/mock-public-activity";
import { formatRelativeTime } from "@/lib/format";

const iconMap: Record<string, JSX.Element> = {
  post: <Megaphone className="h-4 w-4" />,
  comment: <MessageSquare className="h-4 w-4" />,
  issue: <FileText className="h-4 w-4" />,
  vote: <ThumbsUp className="h-4 w-4" />,
};

export default function PublicRecentActivity() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Activity</CardTitle>
        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
          View all
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockPublicActivity.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="flex items-start gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/40"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
              {iconMap[item.type]}
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.excerpt}</p>
              <p className="text-xs text-muted-foreground">
                {formatRelativeTime(item.created_at)}
              </p>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
