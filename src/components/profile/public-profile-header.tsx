"use client";

import { useState } from "react";
import { Copy, MessageCircle } from "lucide-react";

import type { ProfilePublic } from "@/lib/types/profile";
import { formatPublicLocation, formatPublicParty, getPublicInitials } from "@/lib/profile-public";
import AvatarBadge from "@/components/profile/avatar-badge";
import FollowButton from "@/components/follows/follow-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

type PublicProfileHeaderProps = {
  profile: ProfilePublic;
  followTarget?: {
    targetId: string;
    isFollowing: boolean;
    isAuthenticated: boolean;
  };
};

export default function PublicProfileHeader({
  profile,
  followTarget,
}: PublicProfileHeaderProps) {
  const displayName = profile.display_name?.trim() || "Community member";
  const username = profile.username?.trim() || "";
  const bio = profile.bio?.trim() || "";
  const location = formatPublicLocation(profile);
  const party = formatPublicParty(profile);
  const avatarUrl = profile.avatar_url?.trim() || "";
  const badgeColor = profile.badge_color ?? "none";
  const initials = getPublicInitials(displayName, username);
  const [sharePending, setSharePending] = useState(false);

  const shareProfile = async () => {
    if (!username) return;
    setSharePending(true);
    try {
      const url =
        typeof window !== "undefined"
          ? `${window.location.origin}/u/${username}`
          : `/u/${username}`;
      await navigator.clipboard.writeText(url);
      toast({ title: "Profile link copied" });
    } catch (error) {
      toast({
        title: "Copy failed",
        description:
          error instanceof Error ? error.message : "Unable to copy the link.",
      });
    } finally {
      setSharePending(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <Card className="lg:col-span-4">
        <CardContent className="flex h-full flex-col items-center justify-center gap-4 p-6">
          <Avatar className="h-40 w-40">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={`${displayName} avatar`} />
            ) : null}
            <AvatarFallback className="text-4xl">{initials}</AvatarFallback>
            <AvatarBadge badgeColor={badgeColor} />
          </Avatar>
          <div className="text-center">
            <p className="text-xl font-semibold">{displayName}</p>
            {username ? (
              <p className="text-sm text-muted-foreground">@{username}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="lg:col-span-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold">{displayName}</h1>
            {username ? (
              <p className="text-sm text-muted-foreground">@{username}</p>
            ) : null}
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>{location}</p>
            {party ? <p>Party: {party}</p> : null}
          </div>
          {bio ? <p className="text-sm text-foreground">{bio}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Founder</Badge>
            <Badge variant="outline">Moderator</Badge>
            <Badge variant="outline">Civic Organizer</Badge>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {followTarget ? (
              <FollowButton
                targetType="user"
                targetId={followTarget.targetId}
                isFollowing={followTarget.isFollowing}
                isAuthenticated={followTarget.isAuthenticated}
                size="sm"
              />
            ) : null}
            <Button type="button" variant="outline">
              <MessageCircle className="mr-2 h-4 w-4" />
              Message
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={shareProfile}
              disabled={!username || sharePending}
            >
              <Copy className="mr-2 h-4 w-4" />
              {sharePending ? "Copying..." : "Share"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
