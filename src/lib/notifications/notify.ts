import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";

const MAX_RECIPIENTS = 200;

type NotificationPayload = {
  type: string;
  title: string;
  url: string;
  body?: string | null;
};

type NotifyResult = {
  recipients: number;
  inserted: number;
  truncated: boolean;
};

export async function notifyFollowersForJurisdiction(
  jurisdictionId: string,
  payload: NotificationPayload,
): Promise<NotifyResult> {
  return notifyFollowers("jurisdiction", jurisdictionId, payload);
}

export async function notifyFollowersForIssue(
  issueId: string,
  payload: NotificationPayload,
): Promise<NotifyResult> {
  return notifyFollowers("issue", issueId, payload);
}

async function notifyFollowers(
  targetType: "jurisdiction" | "issue",
  targetId: string,
  payload: NotificationPayload,
): Promise<NotifyResult> {
  const service = createSupabaseServiceClient();

  const { data: follows, error } = await service
    .from("follows")
    .select("user_id")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .order("created_at", { ascending: false })
    .limit(MAX_RECIPIENTS + 1);

  if (error) {
    console.warn("notifyFollowers: failed to load followers", error.message);
    return { recipients: 0, inserted: 0, truncated: false };
  }

  const rows = follows ?? [];
  const truncated = rows.length > MAX_RECIPIENTS;
  const recipients = truncated ? rows.slice(0, MAX_RECIPIENTS) : rows;

  if (truncated) {
    console.warn(
      `notifyFollowers: recipient cap hit (${rows.length} > ${MAX_RECIPIENTS}) for ${targetType}:${targetId}`,
    );
  }

  if (recipients.length === 0) {
    return { recipients: 0, inserted: 0, truncated };
  }

  const notificationRows = recipients.map((row) => ({
    user_id: row.user_id,
    type: payload.type,
    title: payload.title,
    body: payload.body ?? null,
    url: payload.url,
  }));

  const { error: insertError } = await service
    .from("user_notifications")
    .insert(notificationRows);

  if (insertError) {
    console.warn("notifyFollowers: insert failed", insertError.message);
    return {
      recipients: recipients.length,
      inserted: 0,
      truncated,
    };
  }

  return {
    recipients: recipients.length,
    inserted: recipients.length,
    truncated,
  };
}
