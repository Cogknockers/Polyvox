"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import EntityCard from "@/components/entities/entity-card";
import EntityDialog, { type EntityItem } from "@/components/entities/entity-dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type EntitiesDirectoryProps = {
  entities: EntityItem[];
  jurisdictionId: string;
  canManage: boolean;
  countyFips: string;
};

export default function EntitiesDirectory({
  entities,
  jurisdictionId,
  canManage,
  countyFips,
}: EntitiesDirectoryProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return entities;
    return entities.filter((entity) => {
      return (
        entity.name.toLowerCase().includes(normalized) ||
        (entity.title ?? "").toLowerCase().includes(normalized) ||
        (entity.contactEmail ?? "").toLowerCase().includes(normalized) ||
        (entity.websiteUrl ?? "").toLowerCase().includes(normalized)
      );
    });
  }, [entities, query]);

  const departments = filtered.filter((entity) => entity.type === "department");
  const officials = filtered.filter((entity) => entity.type === "official");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search departments or officials..."
          className="w-full max-w-sm"
        />
        {canManage ? (
          <EntityDialog
            mode="create"
            jurisdictionId={jurisdictionId}
            onSaved={() => router.refresh()}
            triggerLabel="Add entity"
          />
        ) : null}
      </div>

      <Tabs defaultValue="departments" className="w-full">
        <TabsList>
          <TabsTrigger value="departments">
            Departments ({departments.length})
          </TabsTrigger>
          <TabsTrigger value="officials">
            Officials ({officials.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="departments" className="mt-4 space-y-4">
          {departments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No departments found.
            </p>
          ) : (
            departments.map((entity) => (
              <EntityCard
                key={entity.id}
                entity={entity}
                canManage={canManage}
                jurisdictionId={jurisdictionId}
                countyFips={countyFips}
                onSaved={() => router.refresh()}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="officials" className="mt-4 space-y-4">
          {officials.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No officials found.
            </p>
          ) : (
            officials.map((entity) => (
              <EntityCard
                key={entity.id}
                entity={entity}
                canManage={canManage}
                jurisdictionId={jurisdictionId}
                countyFips={countyFips}
                onSaved={() => router.refresh()}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
