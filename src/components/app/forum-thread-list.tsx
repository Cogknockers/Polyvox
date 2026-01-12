"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/format";
import type { ForumThread } from "@/lib/mock-data";

type ForumThreadListProps = {
  threads: ForumThread[];
};

export default function ForumThreadList({ threads }: ForumThreadListProps) {
  if (threads.length === 0) {
    return <p className="text-sm text-muted-foreground">No threads yet.</p>;
  }

  return (
    <div className="grid gap-4">
      {threads.map((thread) => (
        <Link key={thread.id} href={`/forums/${thread.id}`}>
          <Card className="transition hover:-translate-y-0.5 hover:border-foreground/20">
            <CardContent className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {thread.author}
                </span>
                <span>{formatRelativeTime(thread.lastActivityISO)}</span>
                <span>{thread.repliesCount} replies</span>
              </div>
              <h3 className="text-base font-semibold text-foreground">
                {thread.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {thread.body.length > 140
                  ? `${thread.body.slice(0, 140)}...`
                  : thread.body}
              </p>
              {thread.tags?.length ? (
                <div className="flex flex-wrap gap-2">
                  {thread.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
