"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/format";
import { normalizeOfficeTypeLabel } from "@/lib/constants";
import type { Issue, Jurisdiction, Office } from "@/lib/mock-data";

const tagStyle = "rounded-full border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground";

type IssueHeaderProps = {
  issue: Issue;
  office?: Office;
  jurisdiction?: Jurisdiction;
};

export default function IssueHeader({
  issue,
  office,
  jurisdiction,
}: IssueHeaderProps) {
  const jurisdictionLabel = jurisdiction
    ? `${jurisdiction.name}${jurisdiction.state ? ", " + jurisdiction.state : ""}`
    : "Unknown";

  return (
    <div className="space-y-3">
      <Button variant="ghost" size="sm" asChild>
        <Link href={office ? `/o/${office.id}` : "/dashboard"}>
          Back to office
        </Link>
      </Button>

      <div className="flex flex-wrap items-center gap-2">
        <span className={tagStyle}>{jurisdictionLabel}</span>
        {office ? (
          <span className={tagStyle}>
            {normalizeOfficeTypeLabel(office.officeType)}
          </span>
        ) : null}
        <Badge variant="secondary">{issue.category}</Badge>
        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(issue.createdAtISO)}
        </span>
      </div>

      <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
        {issue.title}
      </h1>
    </div>
  );
}
