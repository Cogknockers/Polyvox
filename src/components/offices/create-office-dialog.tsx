"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createOfficeAction } from "@/app/offices/actions";
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
import { toast } from "@/hooks/use-toast";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

type CreateOfficeDialogProps = {
  jurisdictionId: string;
  onCreated?: () => void;
};

export default function CreateOfficeDialog({
  jurisdictionId,
  onCreated,
}: CreateOfficeDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [aliases, setAliases] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    setName("");
    setSlug("");
    setAliases("");
  }, [open]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug) {
      setSlug(slugify(value));
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await createOfficeAction({
        jurisdictionId,
        name,
        slug: slug || name,
        aliases,
      });

      if (!result.ok) {
        toast({
          title: "Create failed",
          description: result.error ?? "Unable to create office.",
        });
        return;
      }

      toast({ title: "Office created" });
      setOpen(false);
      onCreated?.();
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Office</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Create office</DialogTitle>
            <DialogDescription>
              Add an office for this county and provide common aliases.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="office-name">Office name</Label>
            <Input
              id="office-name"
              value={name}
              onChange={(event) => handleNameChange(event.target.value)}
              placeholder="Mayor"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="office-slug">Slug</Label>
            <Input
              id="office-slug"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="mayor"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="office-aliases">Aliases</Label>
            <Input
              id="office-aliases"
              value={aliases}
              onChange={(event) => setAliases(event.target.value)}
              placeholder="Mayor of Reno, City Mayor"
            />
            <p className="text-xs text-muted-foreground">
              Separate aliases with commas.
            </p>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save office"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
