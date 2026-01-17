"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import { createPostAction } from "@/app/post/actions";
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
import { POST_TYPE_OPTIONS, type PostType } from "@/lib/posts";

type CreatePostDialogProps = {
  jurisdictionId: string;
  countyFips: string;
  canPost: boolean;
  entities?: Array<{ id: string; name: string }>;
  onCreated?: () => void;
  initialTitle?: string;
  initialType?: PostType;
  issueId?: string;
  triggerLabel?: string;
};

export default function CreatePostDialog({
  jurisdictionId,
  countyFips,
  canPost,
  entities,
  onCreated,
  initialTitle,
  initialType,
  issueId,
  triggerLabel = "Create Post",
}: CreatePostDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<PostType>(initialType ?? "DISCUSSION");
  const [title, setTitle] = useState(initialTitle ?? "");
  const [body, setBody] = useState("");
  const [entityId, setEntityId] = useState<string>("none");
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const nextParam = useMemo(() => {
    const query = searchParams.toString();
    const nextPath = query ? `${pathname}?${query}` : pathname;
    return encodeURIComponent(nextPath);
  }, [pathname, searchParams]);

  const resetForm = () => {
    setType(initialType ?? "DISCUSSION");
    setTitle(initialTitle ?? "");
    setBody("");
    setEntityId("none");
  };

  useEffect(() => {
    if (!open) return;
    setType(initialType ?? "DISCUSSION");
    setTitle(initialTitle ?? "");
    setBody("");
    setEntityId("none");
  }, [open, initialTitle, initialType]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canPost) {
      toast({
        title: "Sign in required",
        description: "Create an account to post in this county.",
      });
      return;
    }

    const safeCountyFips = /^\d{5}$/.test(countyFips) ? countyFips : undefined;

    startTransition(async () => {
      const result = await createPostAction({
        jurisdictionId,
        countyFips: safeCountyFips,
        issueId,
        type,
        title,
        body,
        entityId: entityId === "none" ? undefined : entityId,
      });

      if (!result.ok) {
        toast({
          title: "Post failed",
          description: result.error ?? "Unable to create post.",
        });
        return;
      }

      toast({ title: "Post published" });
      resetForm();
      setOpen(false);
      onCreated?.();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        {canPost ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Create a county post</DialogTitle>
              <DialogDescription>
                Share updates, questions, or announcements for this community.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="post-type">Post type</Label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as PostType)}
              >
                <SelectTrigger id="post-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {POST_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="post-title">Title</Label>
              <Input
                id="post-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Short, descriptive headline"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="post-body">Body</Label>
              <Textarea
                id="post-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Add context, links, or what you need from the community."
                rows={6}
              />
            </div>

            {entities ? (
              <div className="space-y-2">
                <Label htmlFor="post-entity">Tag official/department</Label>
                {entities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No entities yet.
                  </p>
                ) : (
                  <Select value={entityId} onValueChange={setEntityId}>
                    <SelectTrigger id="post-entity">
                      <SelectValue placeholder="Select entity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No tag</SelectItem>
                      {entities.map((entity) => (
                        <SelectItem key={entity.id} value={entity.id}>
                          {entity.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ) : null}

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Posting..." : "Publish post"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>Sign in to create a post</DialogTitle>
              <DialogDescription>
                Create an account to start a discussion or ask a question in
                this county.
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
