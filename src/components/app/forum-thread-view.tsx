"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatRelativeTime } from "@/lib/format";
import type { ForumReply, ForumThread } from "@/lib/mock-data";
import CommentForm from "@/components/app/comment-form";

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

type ForumThreadViewProps = {
  thread: ForumThread;
  initialReplies: ForumReply[];
};

export default function ForumThreadView({
  thread,
  initialReplies,
}: ForumThreadViewProps) {
  const [replies, setReplies] = useState<ForumReply[]>(initialReplies);

  const handleReply = (body: string) => {
    const reply: ForumReply = {
      id: createId("r"),
      threadId: thread.id,
      author: "You",
      createdAtISO: new Date().toISOString(),
      body,
    };
    setReplies((prev) => [...prev, reply]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{thread.author}</span>
            <span>{formatRelativeTime(thread.createdAtISO)}</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground">
            {thread.title}
          </h1>
          <p className="text-sm text-muted-foreground">{thread.body}</p>
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

      <div className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Replies</h2>
        <ScrollArea className="max-h-[360px] pr-3">
          <div className="space-y-3">
            {replies.length === 0 ? (
              <p className="text-sm text-muted-foreground">No replies yet.</p>
            ) : (
              replies.map((reply) => (
                <Card key={reply.id}>
                  <CardContent className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {reply.author}
                      </span>
                      <span>{formatRelativeTime(reply.createdAtISO)}</span>
                    </div>
                    <p className="text-sm text-foreground">{reply.body}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Add a reply</h3>
        <CommentForm
          onSubmit={handleReply}
          placeholder="Share a reply"
          buttonLabel="Reply"
        />
      </div>
    </div>
  );
}
