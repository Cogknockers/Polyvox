"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import {
  createEntityAction,
  deleteEntityAction,
  updateEntityAction,
} from "@/app/entities/actions";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

export type EntityItem = {
  id: string;
  type: "official" | "department";
  name: string;
  title?: string | null;
  contactEmail?: string | null;
  websiteUrl?: string | null;
};

type EntityDialogProps = {
  mode: "create" | "edit";
  jurisdictionId: string;
  entity?: EntityItem;
  onSaved?: () => void;
  trigger?: React.ReactNode;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost";
  triggerSize?: "default" | "sm" | "lg" | "icon";
};

export default function EntityDialog({
  mode,
  jurisdictionId,
  entity,
  onSaved,
  trigger,
  triggerLabel = "Add entity",
  triggerVariant = "default",
  triggerSize = "default",
}: EntityDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<EntityItem["type"]>(
    entity?.type ?? "department",
  );
  const [name, setName] = useState(entity?.name ?? "");
  const [title, setTitle] = useState(entity?.title ?? "");
  const [contactEmail, setContactEmail] = useState(entity?.contactEmail ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(entity?.websiteUrl ?? "");
  const [isPending, startTransition] = useTransition();

  const dialogTitle = useMemo(
    () => (mode === "create" ? "Add entity" : "Edit entity"),
    [mode],
  );

  useEffect(() => {
    if (!open) return;
    setType(entity?.type ?? "department");
    setName(entity?.name ?? "");
    setTitle(entity?.title ?? "");
    setContactEmail(entity?.contactEmail ?? "");
    setWebsiteUrl(entity?.websiteUrl ?? "");
  }, [open, entity]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const payload = {
        jurisdictionId,
        type,
        name,
        title,
        contactEmail,
        websiteUrl,
      };

      const result =
        mode === "create"
          ? await createEntityAction(payload)
          : await updateEntityAction({
              id: entity?.id ?? "",
              ...payload,
            });

      if (!result.ok) {
        toast({
          title: "Save failed",
          description: result.error ?? "Unable to save entity.",
        });
        return;
      }

      toast({
        title: mode === "create" ? "Entity created" : "Entity updated",
      });
      setOpen(false);
      onSaved?.();
    });
  };

  const handleDelete = () => {
    if (!entity) return;
    const confirmed = window.confirm(
      "Delete this entity? This action cannot be undone.",
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteEntityAction({
        id: entity.id,
        jurisdictionId,
      });

      if (!result.ok) {
        toast({
          title: "Delete failed",
          description: result.error ?? "Unable to delete entity.",
        });
        return;
      }

      toast({ title: "Entity deleted" });
      setOpen(false);
      onSaved?.();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant={triggerVariant} size={triggerSize}>
            {triggerLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>
              Capture local departments and officials to tag in issues.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="entity-type">Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as EntityItem["type"])}>
              <SelectTrigger id="entity-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="department">Department</SelectItem>
                <SelectItem value="official">Official</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="entity-name">Name</Label>
            <Input
              id="entity-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Entity name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="entity-title">Title</Label>
            <Input
              id="entity-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Optional title or role"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="entity-email">Contact email</Label>
              <Input
                id="entity-email"
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
                placeholder="name@agency.gov"
                type="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entity-website">Website</Label>
              <Input
                id="entity-website"
                value={websiteUrl}
                onChange={(event) => setWebsiteUrl(event.target.value)}
                placeholder="https://"
                type="url"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-wrap items-center gap-2 sm:justify-between">
            {mode === "edit" ? (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isPending}
              >
                Delete
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
