"use client";

import Link from "next/link";
import { Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type ReputationMetrics = {
  score?: number | null;
  posts_net_votes?: number | null;
  posts_count?: number | null;
  comments_count?: number | null;
  account_age_days?: number | null;
};

function getTier(score: number) {
  if (score >= 80) return "Established";
  if (score >= 40) return "Growing";
  return "New";
}

export default function PublicReputation({
  metrics,
}: {
  metrics: ReputationMetrics | null;
}) {
  const score = metrics?.score ?? 0;
  const netVotes = metrics?.posts_net_votes ?? 0;
  const postsCount = metrics?.posts_count ?? 0;
  const commentsCount = metrics?.comments_count ?? 0;
  const accountAgeDays = metrics?.account_age_days ?? 0;

  const displayScore = Math.max(0, Math.min(100, score));
  const tier = getTier(displayScore);

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <CardTitle>Reputation &amp; Trust</CardTitle>
          <Dialog>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="rounded-full p-1 text-muted-foreground hover:text-foreground"
                      aria-label="How is reputation calculated?"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  How is this calculated?
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>How reputation is calculated</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Reputation is a simple signal based on how the community
                  responds to your posts, how active you are, and how long your
                  account has been around.
                </p>
                <p>
                  It uses net votes on posts, your post and comment counts, and
                  account age. Report penalties are not included yet.
                </p>
                <Link
                  href="/help/reputation-trust"
                  className="inline-flex text-sm font-medium text-foreground underline underline-offset-4 hover:text-primary"
                >
                  Read the full explanation
                </Link>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{tier}</Badge>
          <Badge variant="outline">Score {displayScore}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Beta — tuned over time.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Community score</span>
            <span className="font-semibold text-foreground">
              {displayScore} / 100
            </span>
          </div>
          <Progress value={displayScore} />
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Net votes (posts)</span>
            <span className="font-semibold text-foreground">{netVotes}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Posts</span>
            <span className="font-semibold text-foreground">{postsCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Comments</span>
            <span className="font-semibold text-foreground">
              {commentsCount}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Account age</span>
            <span className="font-semibold text-foreground">
              {accountAgeDays} days
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
