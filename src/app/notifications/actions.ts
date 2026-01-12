"use server";

import { randomUUID } from "crypto";
import { z } from "zod";

import { isAdmin } from "@/lib/authz";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const notifySchema = z.object({
  jurisdictionId: z.string().uuid(),
  entityId: z.string().uuid(),
  issueId: z.string().uuid().optional(),
  postId: z.string().uuid().optional(),
  subject: z.string().trim().min(3).max(140),
  message: z.string().trim().max(2000).optional(),
  includeLinks: z.boolean(),
});

type NotifyResult = {
  ok?: boolean;
  error?: string;
  warning?: string;
};

export async function createEntityNotificationEvent(
  payload: z.infer<typeof notifySchema>,
): Promise<NotifyResult> {
  const parsed = notifySchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: "Please check the notification details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return { ok: false, error: "Sign in required." };
  }

  const { data: entity, error: entityError } = await supabase
    .from("public_entities")
    .select("id,name,jurisdiction_id,contact_email")
    .eq("id", parsed.data.entityId)
    .maybeSingle();

  if (entityError || !entity) {
    return { ok: false, error: "Entity not found." };
  }

  if (entity.jurisdiction_id !== parsed.data.jurisdictionId) {
    return { ok: false, error: "Entity mismatch." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name,username")
    .eq("id", user.id)
    .maybeSingle();

  const actorDisplayName =
    profile?.display_name ??
    (profile?.username ? `@${profile.username}` : null) ??
    "Community member";

  const payloadData: Record<string, unknown> = {
    subject: parsed.data.subject,
    message: parsed.data.message ?? "",
    include_links: parsed.data.includeLinks,
    actor_display_name: actorDisplayName,
    entity_name: entity.name,
    entity_id: entity.id,
  };

  if (parsed.data.issueId) {
    payloadData.issue_id = parsed.data.issueId;
  }
  if (parsed.data.postId) {
    payloadData.post_id = parsed.data.postId;
  }

  const { error } = await supabase
    .from("entity_notification_events")
    .insert({
      jurisdiction_id: parsed.data.jurisdictionId,
      entity_id: parsed.data.entityId,
      issue_id: parsed.data.issueId ?? null,
      post_id: parsed.data.postId ?? null,
      actor_id: user.id,
      event_type: "manual_notify",
      payload: payloadData,
    });

  if (error) {
    return { ok: false, error: error.message };
  }

  let warning: string | undefined;
  if (entity.contact_email) {
    try {
      const service = createSupabaseServiceClient();
      await service
        .from("entity_contact_subscriptions")
        .upsert(
          {
            entity_id: entity.id,
            contact_email: entity.contact_email,
            unsubscribe_token: randomUUID().replace(/-/g, ""),
          },
          {
            onConflict: "entity_id,contact_email",
            ignoreDuplicates: true,
          },
        );
    } catch (subscribeError) {
      warning =
        subscribeError instanceof Error
          ? subscribeError.message
          : "Subscription sync failed.";
    }
  } else {
    warning = "No public contact email on file for this entity.";
  }

  return warning ? { ok: true, warning } : { ok: true };
}

type DigestResult = {
  ok?: boolean;
  error?: string;
  summary?: {
    sent: number;
    skipped: number;
    failed: number;
    processedEvents: number;
    dryRun: boolean;
  };
};

export async function runEntityDigestAction(): Promise<DigestResult> {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return { ok: false, error: "Sign in required." };
  }

  const admin = await isAdmin(user.id);
  if (!admin) {
    return { ok: false, error: "Admin access required." };
  }

  const token = process.env.DIGEST_RUNNER_TOKEN;
  if (!token) {
    return { ok: false, error: "Missing DIGEST_RUNNER_TOKEN." };
  }

  const baseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) {
    return { ok: false, error: "Missing SUPABASE_URL." };
  }
  const endpoint = `${baseUrl.replace(/\/$/, "")}/functions/v1/entity-digest`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        limitEntities: 25,
        maxEventsPerDigest: 20,
        dryRun: false,
      }),
    });

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      return { ok: false, error: json?.message ?? "Digest run failed." };
    }

    return {
      ok: true,
      summary: {
        sent: Number(json?.sent ?? 0),
        skipped: Number(json?.skipped ?? 0),
        failed: Number(json?.failed ?? 0),
        processedEvents: Number(json?.processedEvents ?? 0),
        dryRun: Boolean(json?.dryRun ?? false),
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Digest run failed.",
    };
  }
}

export async function markNotificationRead(
  notificationId: string,
): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return { ok: false, error: "Sign in required." };
  }

  const { error: readAtError } = await supabase
    .from("user_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (!readAtError) {
    return { ok: true };
  }

  const { error: fallbackError } = await supabase
    .from("user_notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (fallbackError) {
    return { ok: false, error: fallbackError.message };
  }

  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<{
  ok?: boolean;
  error?: string;
}> {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return { ok: false, error: "Sign in required." };
  }

  const { error: rpcError } = await supabase.rpc("mark_notifications_read");
  if (!rpcError) {
    return { ok: true };
  }

  const { error: updateError } = await supabase
    .from("user_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (!updateError) {
    return { ok: true };
  }

  const { error: fallbackError } = await supabase
    .from("user_notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (fallbackError) {
    return { ok: false, error: fallbackError.message };
  }

  return { ok: true };
}
