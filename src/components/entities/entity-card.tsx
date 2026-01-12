import Link from "next/link";

import EntityDialog, { type EntityItem } from "@/components/entities/entity-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type EntityCardProps = {
  entity: EntityItem;
  canManage: boolean;
  jurisdictionId: string;
  countyFips: string;
  onSaved?: () => void;
};

const TYPE_LABELS: Record<EntityItem["type"], string> = {
  department: "Department",
  official: "Official",
};

export default function EntityCard({
  entity,
  canManage,
  jurisdictionId,
  countyFips,
  onSaved,
}: EntityCardProps) {
  const href = `/county/${countyFips}/entities/${entity.id}`;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={href}
                className="text-lg font-semibold text-foreground hover:underline"
              >
                {entity.name}
              </Link>
              <Badge variant="outline">{TYPE_LABELS[entity.type]}</Badge>
            </div>
            {entity.title ? (
              <p className="text-sm text-muted-foreground">{entity.title}</p>
            ) : null}
          </div>
          {canManage ? (
            <EntityDialog
              mode="edit"
              jurisdictionId={jurisdictionId}
              entity={entity}
              onSaved={onSaved}
              triggerLabel="Edit"
              triggerVariant="outline"
              triggerSize="sm"
            />
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {entity.contactEmail ? (
            <a
              href={`mailto:${entity.contactEmail}`}
              className="hover:text-foreground"
            >
              {entity.contactEmail}
            </a>
          ) : null}
          {entity.websiteUrl ? (
            <a
              href={entity.websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground"
            >
              {entity.websiteUrl}
            </a>
          ) : null}
          {!entity.contactEmail && !entity.websiteUrl ? (
            <span>No contact details listed.</span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
