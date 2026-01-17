"use client";

import { useState } from "react";

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
import type { Issue } from "@/lib/mock-data";
import { issueCategories } from "@/lib/mock-data";

const DEFAULT_CATEGORY = issueCategories[0] ?? "General";

type IssueCreateDialogProps = {
  officeId: string;
  onCreate: (issue: Issue) => void;
};

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export default function IssueCreateDialog({
  officeId,
  onCreate,
}: IssueCreateDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORY);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (!trimmedTitle || !trimmedBody) return;

    const issue: Issue = {
      id: createId("i"),
      officeId,
      title: trimmedTitle,
      body: trimmedBody,
      category,
      createdAtISO: new Date().toISOString(),
      author: "You",
      repliesCount: 0,
      votesCount: 0,
    };

    onCreate(issue);
    setTitle("");
    setBody("");
    setCategory(DEFAULT_CATEGORY);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Issue</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Create a new issue</DialogTitle>
            <DialogDescription>
              Share a clear problem statement and what you want the office to
              address.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="issue-title">Title</Label>
            <Input
              id="issue-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Short, specific headline"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="issue-category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="issue-category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {issueCategories.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="issue-body">Body</Label>
            <Textarea
              id="issue-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Add context, links, or data."
            />
          </div>

          <DialogFooter>
            <Button type="submit">Post Issue</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
