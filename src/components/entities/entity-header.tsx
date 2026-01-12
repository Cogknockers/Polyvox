"use client";

import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import { Copy, ExternalLink, Mail } from "lucide-react";

import { runEntityDigestAction } from "@/app/notifications/actions";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import NotifyEntityDialog from "@/components/entities/notify-entity-dialog";

type EntityHeaderProps = {
  entity: {
    id: string;
    name: string;
    type: "official" | "department";
    title: string | null;
    contactEmail: string | null;
    websiteUrl: string | null;
  };
  countyFips: string;
  jurisdictionId: string;
  canNotify: boolean;
  canRunDigest?: boolean;
  followButton?: ReactNode;
};

const TYPE_LABELS: Record<EntityHeaderProps["entity"]["type"], string> = {
  department: "Department",
  official: "Official",
};

export default function EntityHeader({
  entity,
  countyFips,
  jurisdictionId,
  canNotify,
  canRunDigest = false,
  followButton,
}: EntityHeaderProps) {
  const [isCopying, setIsCopying] = useState(false);
  const [digestPending, startDigest] = useTransition();

  const handleCopy = async () => {
    if (isCopying) return;
    setIsCopying(true);
    const href =
      typeof window !== "undefined"
        ? window.location.href
        : `/county/${countyFips}/entities/${entity.id}`;
    try {
      await navigator.clipboard.writeText(href);
      toast({ title: "Link copied" });
    } catch {
      toast({ title: "Copy failed" });
    } finally {
      setIsCopying(false);
    }
  };

  const handleRunDigest = () => {
    startDigest(async () => {
      const result = await runEntityDigestAction();
      if (!result.ok) {
        toast({
          title: "Digest failed",
          description: result.error ?? "Unable to run digest.",
        });
        return;
      }
      toast({
        title: "Digest completed",
        description: `Sent ${result.summary?.sent ?? 0}, skipped ${
          result.summary?.skipped ?? 0
        }, failed ${result.summary?.failed ?? 0}.`,
      });
    });
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-foreground">
                {entity.name}
              </h1>
              <Badge variant="outline">{TYPE_LABELS[entity.type]}</Badge>
            </div>
            {entity.title ? (
              <p className="text-sm text-muted-foreground">{entity.title}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {entity.contactEmail ? (
                <a
                  href={`mailto:${entity.contactEmail}`}
                  className="inline-flex items-center gap-2 hover:text-foreground"
                >
                  <Mail className="h-4 w-4" />
                  {entity.contactEmail}
                </a>
              ) : null}
              {entity.websiteUrl ? (
                <a
                  href={entity.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 hover:text-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                  {entity.websiteUrl}
                </a>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy} disabled={isCopying}>
              <Copy className="mr-2 h-4 w-4" />
              Copy link
            </Button>
            {followButton}
            <NotifyEntityDialog
              entity={{ id: entity.id, name: entity.name }}
              jurisdictionId={jurisdictionId}
              canNotify={canNotify}
            />
            {canRunDigest ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRunDigest}
                disabled={digestPending}
              >
                {digestPending ? "Running..." : "Run digest (dev)"}
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
