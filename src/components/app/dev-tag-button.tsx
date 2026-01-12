"use client";

import { useState } from "react";

import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DevEntityTagTester() {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const [entityId, setEntityId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!entityId) {
      toast({
        title: "Add an entity ID",
        description: "Paste a public_entities.id value to send a test mention.",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/entities/tag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityId,
          contentType: "ISSUE",
          contentId: "dev-mention",
          contentTitle: "Demo mention (dev)",
          contentUrl: "/issue/dev-mention",
          intent: "Issue",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "Request failed.");
      }

      toast({
        title: "Mention recorded",
        description: data.notified
          ? "Email queued if the entity is verified."
          : "No email queued for this entity.",
      });
    } catch (error) {
      toast({
        title: "Test failed",
        description: error instanceof Error ? error.message : "Unknown error.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-dashed shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Dev: Entity tag test</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end gap-3">
        <div className="min-w-[240px] flex-1 space-y-2">
          <Label htmlFor="dev-entity-id">Entity ID</Label>
          <Input
            id="dev-entity-id"
            value={entityId}
            onChange={(event) => setEntityId(event.target.value)}
            placeholder="public_entities.id"
          />
        </div>
        <Button onClick={handleSend} disabled={loading}>
          {loading ? "Sending..." : "Send test mention"}
        </Button>
      </CardContent>
    </Card>
  );
}