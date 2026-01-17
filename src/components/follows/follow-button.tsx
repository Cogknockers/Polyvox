"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { followTarget, unfollowTarget } from "@/app/follows/actions";
import { toast } from "@/hooks/use-toast";
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
import type { FollowTargetType } from "@/lib/types/follows";

type FollowButtonProps = {
  targetType: FollowTargetType;
  targetId: string;
  isFollowing: boolean;
  isAuthenticated: boolean;
  size?: "sm" | "default";
  className?: string;
};

export default function FollowButton({
  targetType,
  targetId,
  isFollowing,
  isAuthenticated,
  size = "default",
  className,
}: FollowButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const nextParam = useMemo(() => {
    const query = searchParams.toString();
    const nextPath = query ? `${pathname}?${query}` : pathname;
    return encodeURIComponent(nextPath);
  }, [pathname, searchParams]);

  const handleToggle = () => {
    if (!isAuthenticated) {
      setOpen(true);
      return;
    }

    startTransition(async () => {
      const result = isFollowing
        ? await unfollowTarget({ targetType, targetId })
        : await followTarget({ targetType, targetId });

      if (!result.ok) {
        toast({
          title: "Follow failed",
          description: result.error ?? "Unable to update follow status.",
        });
        return;
      }

      router.refresh();
    });
  };

  const button = (
    <Button
      type="button"
      size={size}
      variant={isFollowing ? "outline" : "default"}
      onClick={handleToggle}
      disabled={isPending}
      className={className}
    >
      {isPending ? "Updating..." : isFollowing ? "Following" : "Follow"}
    </Button>
  );

  if (isAuthenticated) {
    return button;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{button}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign in to follow</DialogTitle>
          <DialogDescription>
            Create an account to keep up with updates.
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
  );
}
