"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import { createNominationAction, searchProfilesAction } from "@/app/offices/actions";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

export type NomineeProfile = {
  id: string;
  display_name: string | null;
  username: string | null;
};

type NominateDialogProps = {
  jurisdictionId: string;
  officeId: string;
  countyFips: string;
  canNominate: boolean;
  onCreated?: () => void;
};

export default function NominateDialog({
  jurisdictionId,
  officeId,
  countyFips,
  canNominate,
  onCreated,
}: NominateDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NomineeProfile[]>([]);
  const [selected, setSelected] = useState<NomineeProfile | null>(null);
  const [message, setMessage] = useState("");
  const [isSearching, startSearch] = useTransition();
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const nextParam = useMemo(() => {
    const queryString = searchParams.toString();
    const nextPath = queryString ? `${pathname}?${queryString}` : pathname;
    return encodeURIComponent(nextPath);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setResults([]);
    setSelected(null);
    setMessage("");
  }, [open]);

  const handleSearch = () => {
    if (!query.trim()) return;

    startSearch(async () => {
      const result = await searchProfilesAction({
        query: query.trim(),
        countyFips,
      });

      if (!result.ok) {
        toast({
          title: "Search failed",
          description: result.error ?? "Unable to search profiles.",
        });
        return;
      }

      setResults(result.profiles ?? []);
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selected) {
      toast({
        title: "Select a nominee",
        description: "Choose a community member to nominate.",
      });
      return;
    }

    startTransition(async () => {
      const result = await createNominationAction({
        jurisdictionId,
        officeId,
        nomineeProfileId: selected.id,
        message,
      });

      if (!result.ok) {
        toast({
          title: "Nomination failed",
          description: result.error ?? "Unable to submit nomination.",
        });
        return;
      }

      toast({ title: "Nomination submitted" });
      setOpen(false);
      onCreated?.();
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nominate someone to run</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        {canNominate ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Nominate a candidate</DialogTitle>
              <DialogDescription>
                Suggest a community member to run for this office.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="nominee-search">Search nominee</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="nominee-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by name or username"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSearch}
                  disabled={isSearching}
                >
                  {isSearching ? "Searching..." : "Search"}
                </Button>
              </div>
              {results.length > 0 ? (
                <div className="space-y-2 rounded-md border border-border p-3">
                  {results.map((profile) => {
                    const label =
                      profile.display_name ?? profile.username ?? "Member";
                    const handle = profile.username
                      ? `@${profile.username}`
                      : null;
                    const active = selected?.id === profile.id;
                    return (
                      <button
                        type="button"
                        key={profile.id}
                        onClick={() => setSelected(profile)}
                        className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${
                          active
                            ? "bg-muted text-foreground"
                            : "hover:bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        <span>{label}</span>
                        {handle ? (
                          <span className="text-xs text-muted-foreground">
                            {handle}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
              {!isSearching && query && results.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No matching profiles found.
                </p>
              ) : null}
            </div>

            {selected ? (
              <div className="rounded-md border border-border px-3 py-2 text-sm">
                Selected: {selected.display_name ?? selected.username}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="nomination-message">Why should they run?</Label>
              <Textarea
                id="nomination-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Share your reasoning and support."
                rows={5}
                required
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Submitting..." : "Submit nomination"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>Sign in to nominate</DialogTitle>
              <DialogDescription>
                You need an account to submit a nomination.
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
