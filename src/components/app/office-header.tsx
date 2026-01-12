"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { normalizeOfficeTypeLabel } from "@/lib/constants";
import type { Jurisdiction, Office } from "@/lib/mock-data";
import { stageBadgeVariant, stageHint, stageLabel, supporterProgress } from "@/lib/ui";

type OfficeHeaderProps = {
  office: Office;
  jurisdiction?: Jurisdiction;
  actionLabel: string;
  onAction?: () => void;
};

export default function OfficeHeader({
  office,
  jurisdiction,
  actionLabel,
  onAction,
}: OfficeHeaderProps) {
  const progress = supporterProgress(office);
  const jurisdictionLabel = jurisdiction
    ? `${jurisdiction.name}${jurisdiction.state ? ", " + jurisdiction.state : ""}`
    : "Unknown jurisdiction";

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={stageBadgeVariant(office.stage)}>
                {stageLabel(office.stage)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {normalizeOfficeTypeLabel(office.officeType)}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
                {office.name}
              </h1>
              <p className="text-sm text-muted-foreground">{jurisdictionLabel}</p>
            </div>
            <p className="text-sm text-muted-foreground">{stageHint(office.stage)}</p>
          </div>

          <div className="w-full max-w-sm space-y-3 md:w-auto">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Supporters</span>
              <span className="font-medium text-foreground">{progress.label}</span>
            </div>
            <Progress value={progress.value} />
            <Button onClick={onAction} className="w-full md:w-auto">
              {actionLabel}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
