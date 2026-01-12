"use client";

import { Info } from "lucide-react";

import type { ProfilePublic } from "@/lib/types/profile";
import AvatarBadge from "@/components/profile/avatar-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  formatPublicLocation,
  formatPublicParty,
  getPublicInitials,
} from "@/lib/profile-public";

type PublicProfileCardProps = {
  profile: ProfilePublic;
  variant: "preview" | "public";
};


export default function PublicProfileCard({
  profile,
  variant,
}: PublicProfileCardProps) {
  const displayName = profile.display_name?.trim() || "Community member";
  const username = profile.username?.trim() || "";
  const bio = profile.bio?.trim() || "";
  const party = formatPublicParty(profile);
  const location = formatPublicLocation(profile);
  const avatarUrl = profile.avatar_url?.trim() || "";
  const badgeColor = profile.badge_color ?? "none";
  const initials = getPublicInitials(displayName, username);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>
            {variant === "preview" ? "Public Profile Preview" : "Profile"}
          </CardTitle>
          {variant === "preview" ? (
            <p className="text-sm text-muted-foreground">
              This is what other community members see.
            </p>
          ) : null}
        </div>
        {variant === "preview" ? (
          <TooltipProvider>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Public</Badge>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground"
                    aria-label="Public profile info"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  Only fields marked public appear here. Party affiliation shows
                  only when enabled.
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={`${displayName} avatar`} />
            ) : null}
            <AvatarFallback>{initials}</AvatarFallback>
            <AvatarBadge badgeColor={badgeColor} />
          </Avatar>
          <div>
            <p className="text-lg font-semibold">{displayName}</p>
            {username ? (
              <p className="text-sm text-muted-foreground">@{username}</p>
            ) : null}
          </div>
        </div>
        {bio ? (
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Bio
            </p>
            <p className="text-sm font-medium">{bio}</p>
          </div>
        ) : null}
        {party ? (
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Party affiliation
            </p>
            <p className="text-sm font-medium">{party}</p>
          </div>
        ) : null}
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Location
          </p>
          <p className="text-sm font-medium">{location}</p>
        </div>
      </CardContent>
    </Card>
  );
}
