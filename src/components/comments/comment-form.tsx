"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { addCommentAction } from "@/app/post/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

type CommentFormProps = {
  postId: string;
};

export default function CommentForm({ postId }: CommentFormProps) {
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;

    startTransition(async () => {
      const result = await addCommentAction({ postId, body: trimmed });
      if (!result.ok) {
        toast({
          title: "Comment failed",
          description: result.error ?? "Unable to add comment.",
        });
        return;
      }

      toast({ title: "Comment posted" });
      setBody("");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Add a comment"
        rows={4}
      />
      <Button type="submit" disabled={isPending}>
        {isPending ? "Posting..." : "Post comment"}
      </Button>
    </form>
  );
}
