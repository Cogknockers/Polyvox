"use client";

import { useState, useTransition } from "react";

import { updateIssueStatusAction } from "@/app/issues/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  ISSUE_STATUS_LABELS,
  ISSUE_STATUS_OPTIONS,
  type IssueStatus,
} from "@/lib/types/issues";

type StatusEditorProps = {
  issueId: string;
  status: IssueStatus;
  canEdit: boolean;
};

export default function StatusEditor({
  issueId,
  status,
  canEdit,
}: StatusEditorProps) {
  const [value, setValue] = useState<IssueStatus>(status);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateIssueStatusAction({
        issueId,
        status: value,
      });

      if (!result.ok) {
        toast({
          title: "Update failed",
          description: result.error ?? "Unable to update status.",
        });
        return;
      }

      toast({ title: "Status updated" });
    });
  };

  if (!canEdit) {
    return <Badge variant="outline">{ISSUE_STATUS_LABELS[status]}</Badge>;
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={value} onValueChange={(next) => setValue(next as IssueStatus)}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          {ISSUE_STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={handleSave} disabled={isPending}>
        {isPending ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
