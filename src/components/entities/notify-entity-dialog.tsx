"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

import { createEntityNotificationEvent } from "@/app/notifications/actions";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

type NotifyEntityDialogProps = {
  entity: {
    id: string;
    name: string;
  };
  jurisdictionId: string;
  issueId?: string | null;
  postId?: string | null;
  canNotify: boolean;
  triggerLabel?: string;
  className?: string;
};

type NotifyState = {
  ok?: boolean;
  error?: string;
  warning?: string;
};

export default function NotifyEntityDialog({
  entity,
  jurisdictionId,
  issueId,
  postId,
  canNotify,
  triggerLabel,
  className,
}: NotifyEntityDialogProps) {
  const pathname = usePathname();
  const defaultSubject = useMemo(
    () => `Polyvox: New activity for ${entity.name}`,
    [entity.name],
  );
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState("");
  const [includeLinks, setIncludeLinks] = useState(true);
  const [notifyState, setNotifyState] = useState<NotifyState>({});
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (notifyState.ok) {
      toast({ title: "Notification queued" });
      setOpen(false);
      setMessage("");
      setIncludeLinks(true);
      setSubject(defaultSubject);
    }
    if (notifyState.error) {
      toast({ title: "Unable to notify", description: notifyState.error });
    }
    if (notifyState.warning) {
      toast({ title: "Heads up", description: notifyState.warning });
    }
  }, [notifyState.ok, notifyState.error, notifyState.warning, defaultSubject]);

  useEffect(() => {
    if (!open) {
      setNotifyState({});
    }
  }, [open]);

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await createEntityNotificationEvent({
        jurisdictionId,
        entityId: entity.id,
        issueId: issueId ?? undefined,
        postId: postId ?? undefined,
        subject: subject.trim(),
        message: message.trim() || undefined,
        includeLinks,
      });
      setNotifyState(result);
    });
  };

  if (!canNotify) {
    return (
      <Button asChild className={className} size="sm">
        <Link href={`/login?next=${encodeURIComponent(pathname ?? "")}`}>
          {triggerLabel ?? `Notify ${entity.name}`}
        </Link>
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={className} size="sm">
          {triggerLabel ?? `Notify ${entity.name}`}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Notify {entity.name}</DialogTitle>
          <DialogDescription>
            Create a notification event for this public entity. The message is optional.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notify-subject">Subject</Label>
            <Input
              id="notify-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder={defaultSubject}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notify-message">Message</Label>
            <Textarea
              id="notify-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Optional note for the entity..."
              rows={4}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="notify-links"
              checked={includeLinks}
              onCheckedChange={(value) => setIncludeLinks(Boolean(value))}
            />
            <Label htmlFor="notify-links">Include links</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Queueing..." : "Queue notification"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
