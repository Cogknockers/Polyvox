"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { removeReportedContentAction, updateReportStatusAction } from "@/app/moderation/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { formatRelativeTime } from "@/lib/format";
import {
  REPORT_STATUS_LABELS,
  REPORT_STATUS_OPTIONS,
  type ReportStatus,
} from "@/lib/types/moderation";

export type ModerationReport = {
  id: string;
  reason: string | null;
  status: ReportStatus;
  createdAt: string;
  reporterName: string;
  reporterHandle?: string | null;
  contentTitle: string;
  contentSnippet: string;
  contentType: "post" | "comment" | "unknown";
  postId?: string | null;
  commentId?: string | null;
  jurisdictionName?: string | null;
};

type ReportCardProps = {
  report: ModerationReport;
};

export default function ReportCard({ report }: ReportCardProps) {
  const router = useRouter();
  const [statusValue, setStatusValue] = useState<ReportStatus>(report.status);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateReportStatusAction({
        reportId: report.id,
        status: statusValue,
      });
      if (!result.ok) {
        toast({
          title: "Update failed",
          description: result.error ?? "Unable to update report status.",
        });
        return;
      }
      toast({ title: "Report updated" });
      router.refresh();
    });
  };

  const handleRemove = () => {
    const confirmed = window.confirm(
      "Remove the reported content? This cannot be undone.",
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await removeReportedContentAction({ reportId: report.id });
      if (!result.ok) {
        toast({
          title: "Removal failed",
          description: result.error ?? "Unable to remove content.",
        });
        return;
      }
      toast({ title: "Content removed" });
      router.refresh();
    });
  };

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">
              {REPORT_STATUS_LABELS[report.status]}
            </Badge>
            {report.jurisdictionName ? (
              <Badge variant="secondary">{report.jurisdictionName}</Badge>
            ) : null}
            <span className="font-medium text-foreground">
              {report.reporterName}
            </span>
            {report.reporterHandle ? <span>{report.reporterHandle}</span> : null}
            <span>{formatRelativeTime(report.createdAt)}</span>
          </div>
          <Badge variant="outline">
            {report.contentType === "comment" ? "Comment" : "Post"}
          </Badge>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            {report.contentTitle}
          </h3>
          <p className="text-sm text-muted-foreground">{report.contentSnippet}</p>
        </div>

        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Reason:</span>{" "}
          {report.reason ?? "No reason provided."}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={statusValue}
            onValueChange={(value) => setStatusValue(value as ReportStatus)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {REPORT_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save status"}
          </Button>
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={isPending}
          >
            Remove content
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
