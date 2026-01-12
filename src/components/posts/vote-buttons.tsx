"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { togglePostVoteAction } from "@/app/post/actions";

type VoteButtonsProps = {
  postId: string;
  countyFips?: string;
  initialScore: number;
  initialUserVote?: number;
  canVote?: boolean;
};

export default function VoteButtons({
  postId,
  countyFips,
  initialScore,
  initialUserVote = 0,
  canVote = false,
}: VoteButtonsProps) {
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [isPending, startTransition] = useTransition();

  const handleVote = (value: 1 | -1) => {
    if (!canVote) {
      toast({
        title: "Sign in required",
        description: "Create an account to vote on posts.",
      });
      return;
    }

    startTransition(async () => {
      const result = await togglePostVoteAction({ postId, value, countyFips });
      if (!result.ok) {
        toast({
          title: "Vote failed",
          description: result.error ?? "Unable to update vote.",
        });
        return;
      }

      if (typeof result.voteTotal === "number") {
        setScore(result.voteTotal);
      }
      if (typeof result.userVote === "number") {
        setUserVote(result.userVote);
      }
    });
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <Button
        variant={userVote === 1 ? "default" : "outline"}
        size="icon"
        className="h-8 w-8"
        onClick={() => handleVote(1)}
        disabled={isPending}
        aria-label="Upvote"
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
      <span className="text-sm font-semibold text-foreground">{score}</span>
      <Button
        variant={userVote === -1 ? "default" : "outline"}
        size="icon"
        className="h-8 w-8"
        onClick={() => handleVote(-1)}
        disabled={isPending}
        aria-label="Downvote"
      >
        <ArrowDown className="h-4 w-4" />
      </Button>
    </div>
  );
}
