import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/format";
import {
  ISSUE_CATEGORY_LABELS,
  ISSUE_STATUS_LABELS,
  type IssueCategory,
  type IssueStatus,
} from "@/lib/types/issues";

export type IssueCardItem = {
  id: string;
  title: string;
  status: IssueStatus;
  category: IssueCategory;
  entityName?: string | null;
  createdAt: string;
  authorName: string;
  authorHandle?: string | null;
  authorReputation?: number | null;
};

type IssueCardProps = {
  issue: IssueCardItem;
};

export default function IssueCard({ issue }: IssueCardProps) {
  return (
    <Card className="relative">
      <Link
        href={`/issue/${issue.id}`}
        className="absolute inset-0 z-0"
        aria-label={`Open issue ${issue.title}`}
      />
      <CardContent className="relative z-10 space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">{ISSUE_STATUS_LABELS[issue.status]}</Badge>
          <Badge variant="secondary">
            {ISSUE_CATEGORY_LABELS[issue.category]}
          </Badge>
          {issue.entityName ? (
            <Badge variant="outline">{issue.entityName}</Badge>
          ) : null}
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground">{issue.title}</h3>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {issue.authorName}
            </span>
            {typeof issue.authorReputation === "number" ? (
              <Badge variant="outline" className="text-[10px]">
                Rep {issue.authorReputation}
              </Badge>
            ) : null}
            {issue.authorHandle ? <span>{issue.authorHandle}</span> : null}
            <span>{formatRelativeTime(issue.createdAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
