"use client";

import { ArrowDown, ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/format";
import type { Comment } from "@/lib/mock-data";

export type CommentVoteDirection = "up" | "down";

type CommentListProps = {
  comments: Comment[];
  votesById: Record<string, number>;
  onVote: (commentId: string, direction: CommentVoteDirection) => void;
};

export default function CommentList({
  comments,
  votesById,
  onVote,
}: CommentListProps) {
  if (comments.length === 0) {
    return <p className="text-sm text-muted-foreground">No comments yet.</p>;
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => {
        const userVote = votesById[comment.id] ?? 0;
        const displayVotes = comment.votesCount + userVote;

        return (
          <Card key={comment.id}>
            <CardContent className="flex gap-4">
              <div className="flex flex-col items-center gap-2 pt-1">
                <Button
                  variant={userVote === 1 ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onVote(comment.id, "up")}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <span className="text-sm font-semibold">{displayVotes}</span>
                <Button
                  variant={userVote === -1 ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onVote(comment.id, "down")}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {comment.author}
                  </span>
                  <span>{formatRelativeTime(comment.createdAtISO)}</span>
                </div>
                <p className="text-sm text-foreground">{comment.body}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
