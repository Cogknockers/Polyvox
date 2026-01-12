"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Sparkles, Trash2 } from "lucide-react";

import {
  deleteNominationAction,
  toggleNominationSpotlightAction,
  toggleNominationVoteAction,
  updateNominationStatusAction,
} from "@/app/offices/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export type NominationCardItem = {
  id: string;
  nomineeName: string;
  nomineeHandle: string | null;
  message: string;
  status: "open" | "withdrawn" | "accepted" | "declined";
  isSpotlighted: boolean;
  createdAt: string;
  score: number;
  upvotes: number;
  downvotes: number;
  userVote: number;
  isPinned: boolean;
};

type NominationCardProps = {
  nomination: NominationCardItem;
  jurisdictionId: string;
  canModerate: boolean;
  isAuthenticated: boolean;
};

const STATUS_LABELS: Record<NominationCardItem["status"], string> = {
  open: "Open",
  withdrawn: "Withdrawn",
  accepted: "Accepted",
  declined: "Declined",
};

export default function NominationCard({
  nomination,
  jurisdictionId,
  canModerate,
  isAuthenticated,
}: NominationCardProps) {
  const [isPending, startTransition] = useTransition();
  const [authOpen, setAuthOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const nextParam = useMemo(() => {
    const query = searchParams.toString();
    const nextPath = query ? `${pathname}?${query}` : pathname;
    return encodeURIComponent(nextPath);
  }, [pathname, searchParams]);

  const handleVote = (value: -1 | 1) => {
    if (!isAuthenticated) {
      setAuthOpen(true);
      return;
    }

    startTransition(async () => {
      const result = await toggleNominationVoteAction({
        nominationId: nomination.id,
        value,
      });

      if (!result.ok) {
        toast({
          title: "Vote failed",
          description: result.error ?? "Unable to record vote.",
        });
        return;
      }

      router.refresh();
    });
  };

  const handleSpotlight = () => {
    startTransition(async () => {
      const result = await toggleNominationSpotlightAction({
        jurisdictionId,
        nominationId: nomination.id,
        isSpotlighted: !nomination.isSpotlighted,
      });

      if (!result.ok) {
        toast({
          title: "Update failed",
          description: result.error ?? "Unable to update spotlight.",
        });
        return;
      }

      router.refresh();
    });
  };

  const handleDelete = () => {
    const confirmed = window.confirm(
      "Remove this nomination? This cannot be undone.",
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteNominationAction({
        jurisdictionId,
        nominationId: nomination.id,
      });

      if (!result.ok) {
        toast({
          title: "Delete failed",
          description: result.error ?? "Unable to delete nomination.",
        });
        return;
      }

      toast({ title: "Nomination removed" });
      router.refresh();
    });
  };

  const handleStatusChange = (status: NominationCardItem["status"]) => {
    startTransition(async () => {
      const result = await updateNominationStatusAction({
        jurisdictionId,
        nominationId: nomination.id,
        status,
      });

      if (!result.ok) {
        toast({
          title: "Update failed",
          description: result.error ?? "Unable to update status.",
        });
        return;
      }

      router.refresh();
    });
  };

  const initials = nomination.nomineeName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold text-foreground">
                    {nomination.nomineeName}
                  </p>
                  {nomination.nomineeHandle ? (
                    <span className="text-xs text-muted-foreground">
                      {nomination.nomineeHandle}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(nomination.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {nomination.isPinned ? (
                <Badge variant="secondary">Pinned</Badge>
              ) : null}
              {nomination.isSpotlighted ? (
                <Badge variant="outline">Spotlight</Badge>
              ) : null}
              <Badge variant="outline">
                {STATUS_LABELS[nomination.status]}
              </Badge>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">{nomination.message}</p>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={nomination.userVote === 1 ? "default" : "outline"}
                onClick={() => handleVote(1)}
                disabled={isPending}
              >
                <ChevronUp className="h-4 w-4" />
                {nomination.upvotes}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={nomination.userVote === -1 ? "default" : "outline"}
                onClick={() => handleVote(-1)}
                disabled={isPending}
              >
                <ChevronDown className="h-4 w-4" />
                {nomination.downvotes}
              </Button>
              <span className="text-sm text-muted-foreground">
                Score {nomination.score}
              </span>
            </div>

            {canModerate ? (
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={nomination.status}
                  onValueChange={(value) =>
                    handleStatusChange(value as NominationCardItem["status"])
                  }
                >
                  <SelectTrigger className="h-8 w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="sm"
                  variant={nomination.isSpotlighted ? "default" : "outline"}
                  onClick={handleSpotlight}
                  disabled={isPending}
                >
                  <Sparkles className="h-4 w-4" />
                  {nomination.isSpotlighted ? "Unspotlight" : "Spotlight"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in to vote</DialogTitle>
            <DialogDescription>
              Create an account to support or oppose nominations.
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
        </DialogContent>
      </Dialog>
    </>
  );
}
