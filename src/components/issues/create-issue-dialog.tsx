"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { createIssueAction } from "@/app/issues/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  ISSUE_CATEGORY_OPTIONS,
  type IssueCategory,
} from "@/lib/types/issues";

type EntityOption = {
  id: string;
  name: string;
};

type CreateIssueDialogProps = {
  jurisdictionId: string;
  canCreate: boolean;
  entities: EntityOption[];
};

export default function CreateIssueDialog({
  jurisdictionId,
  canCreate,
  entities,
}: CreateIssueDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<IssueCategory>("other");
  const [entityId, setEntityId] = useState<string>("none");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const nextParam = useMemo(() => {
    const query = searchParams.toString();
    const nextPath = query ? `${pathname}?${query}` : pathname;
    return encodeURIComponent(nextPath);
  }, [pathname, searchParams]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("other");
    setEntityId("none");
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCreate) {
      toast({
        title: "Sign in required",
        description: "Create an account to post an issue.",
      });
      return;
    }

    startTransition(async () => {
      const result = await createIssueAction({
        jurisdictionId,
        title,
        description,
        category,
        entityId: entityId === "none" ? null : entityId,
      });

      if (!result.ok) {
        toast({
          title: "Issue failed",
          description: result.error ?? "Unable to create issue.",
        });
        return;
      }

      resetForm();
      setOpen(false);
      if (result.issueId) {
        router.push(`/issue/${result.issueId}`);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Issue</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        {canCreate ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Create an issue</DialogTitle>
              <DialogDescription>
                Report a local issue and tag the most relevant entity.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="issue-title">Title</Label>
              <Input
                id="issue-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Short, clear summary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="issue-description">Description</Label>
              <Textarea
                id="issue-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Add context, evidence, or desired outcomes."
                rows={6}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="issue-category">Category</Label>
                <Select
                  value={category}
                  onValueChange={(value) =>
                    setCategory(value as IssueCategory)
                  }
                >
                  <SelectTrigger id="issue-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {ISSUE_CATEGORY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="issue-entity">Tag entity</Label>
                <Select value={entityId} onValueChange={setEntityId}>
                  <SelectTrigger id="issue-entity">
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No entity</SelectItem>
                    {entities.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        No entities yet
                      </SelectItem>
                    ) : (
                      entities.map((entity) => (
                        <SelectItem key={entity.id} value={entity.id}>
                          {entity.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Posting..." : "Publish issue"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>Sign in to create an issue</DialogTitle>
              <DialogDescription>
                You need an account to submit an issue for this county.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-3">
              <Button asChild>
                <Link href={`/login?next=${nextParam}`}>Sign in</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/signup?next=${nextParam}`}>Create account</Link>
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
