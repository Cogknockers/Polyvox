import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { signUnsubscribeToken } from "@/lib/email/token";

const requestSchema = z.object({
  entityId: z.string().uuid(),
  contentType: z.enum(["ISSUE", "POST", "COMMENT", "EVIDENCE"]),
  contentId: z.string().min(1),
  contentUrl: z.string().min(1),
  contentTitle: z.string().optional(),
  intent: z.string().optional(),
  createdBy: z.string().optional(),
});

const ALLOWED_INTENTS = new Set(["ISSUE", "QUESTION", "EVIDENCE"]);
const IMMEDIATE_THROTTLE_HOURS = 6;
const DAILY_CAP = 3;

function getBaseUrl() {
  const base = process.env.APP_BASE_URL;
  if (!base) {
    throw new Error("Missing APP_BASE_URL environment variable.");
  }
  return base.replace(/\/$/, "");
}

function resolveUrl(base: string, url: string) {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return new URL(url, `${base}/`).toString();
}

function getContactEmail(contact: Record<string, unknown>) {
  return (contact.email ?? contact.contact_email ?? contact.address) as string | undefined;
}

function getContactVerification(contact: Record<string, unknown>) {
  return (contact.verification ?? contact.email_verification) as string | undefined;
}

function normalizeMode(mode: unknown) {
  return String(mode ?? "").toUpperCase();
}

function normalizeIntent(intent: unknown) {
  return String(intent ?? "").toUpperCase();
}

function isUuid(value: string | null) {
  if (!value) return false;
  return /^[0-9a-fA-F-]{36}$/.test(value);
}

export async function POST(request: Request) {
  let payload: z.infer<typeof requestSchema>;
  try {
    payload = requestSchema.parse(await request.json());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request payload.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabaseService = createSupabaseServiceClient();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const devUserId =
    process.env.NODE_ENV !== "production"
      ? request.headers.get("x-dev-user-id")
      : null;

  const createdByCandidate = payload.createdBy ?? user?.id ?? devUserId ?? null;
  const createdBy = isUuid(createdByCandidate) ? createdByCandidate : null;

  const baseUrl = getBaseUrl();
  const contentUrl = resolveUrl(baseUrl, payload.contentUrl);

  const { data: entity, error: entityError } = await supabaseService
    .from("public_entities")
    .select("*")
    .eq("id", payload.entityId)
    .maybeSingle();

  if (entityError) {
    return NextResponse.json({ error: entityError.message }, { status: 500 });
  }

  if (!entity) {
    return NextResponse.json({ error: "Entity not found." }, { status: 404 });
  }

  const mentionInsert = {
    entity_id: payload.entityId,
    content_type: payload.contentType,
    content_id: payload.contentId,
    content_url: contentUrl,
    content_title: payload.contentTitle ?? null,
    intent: payload.intent ?? null,
    created_by: createdBy,
  };

  const { error: mentionError } = await supabaseService
    .from("entity_mentions")
    .insert(mentionInsert);

  if (mentionError) {
    return NextResponse.json({ error: mentionError.message }, { status: 500 });
  }

  const intent = normalizeIntent(payload.intent);
  const shouldNotify = intent
    ? ALLOWED_INTENTS.has(intent)
    : payload.contentType === "ISSUE" || payload.contentType === "EVIDENCE";

  if (!shouldNotify) {
    return NextResponse.json({ status: "recorded", notified: false });
  }

  const { data: contacts, error: contactError } = await supabaseService
    .from("public_entity_contacts")
    .select("*")
    .eq("entity_id", payload.entityId)
    .eq("kind", "EMAIL")
    .eq("is_public", true)
    .eq("email_suppressed", false)
    .in("verification", ["VERIFIED_BY_MOD", "VERIFIED_BY_DOMAIN"])
    .order("is_primary", { ascending: false })
    .limit(1);

  if (contactError) {
    return NextResponse.json({ error: contactError.message }, { status: 500 });
  }

  const contact = contacts?.[0] as Record<string, unknown> | undefined;
  const contactEmail = contact ? getContactEmail(contact) : undefined;
  const contactVerification = contact ? getContactVerification(contact) : undefined;

  if (!contact || !contactEmail) {
    return NextResponse.json({ status: "recorded", notified: false });
  }

  if (!contactVerification || !["VERIFIED_BY_MOD", "VERIFIED_BY_DOMAIN"].includes(contactVerification)) {
    return NextResponse.json({ status: "recorded", notified: false });
  }

  const notificationMode = normalizeMode(entity.notification_mode);
  if (notificationMode === "NONE" || notificationMode === "IN_APP_ONLY") {
    return NextResponse.json({ status: "recorded", notified: false });
  }

  const now = new Date();
  const recentStart = new Date(now.getTime() - IMMEDIATE_THROTTLE_HOURS * 60 * 60 * 1000);
  const dayStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const dateKey = now.toISOString().slice(0, 10);

  const contactId = String(contact.id);
  const immediateDedupeKey = `${contactId}:${payload.contentType}:${payload.contentId}`;
  const digestDedupeKey = `${contactId}:${dateKey}`;

  const { data: recentImmediate } = await supabaseService
    .from("email_outbox")
    .select("id")
    .eq("dedupe_key", immediateDedupeKey)
    .in("status", ["QUEUED", "SENT"])
    .gte("created_at", recentStart.toISOString())
    .maybeSingle();

  const { count: recentCount } = await supabaseService
    .from("email_outbox")
    .select("id", { count: "exact", head: true })
    .eq("contact_id", contactId)
    .in("status", ["QUEUED", "SENT"])
    .gte("created_at", dayStart.toISOString());

  const shouldFallBackToDigest = Boolean(recentImmediate) || (recentCount ?? 0) >= DAILY_CAP;

  const unsubscribeToken = signUnsubscribeToken({
    contactId,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 30,
  });

  const unsubscribeUrl = resolveUrl(
    baseUrl,
    `/api/email/unsubscribe?token=${unsubscribeToken}`,
  );

  const jurisdictionLabel = (entity.jurisdiction_label ?? entity.jurisdiction_name ?? null) as
    | string
    | null;

  const contentExcerpt = payload.intent
    ? `Intent: ${payload.intent}`
    : payload.contentTitle
      ? `Content type: ${payload.contentType}`
      : null;

  if (notificationMode === "EMAIL_IMMEDIATE" && !shouldFallBackToDigest) {
    const sendAfter = new Date(now.getTime() + 60 * 1000).toISOString();

    const { error: outboxError } = await supabaseService
      .from("email_outbox")
      .insert({
        entity_id: payload.entityId,
        contact_id: contactId,
        to_email: contactEmail,
        subject: "Polyvox: You were mentioned",
        template: "entity_tag_immediate",
        payload: {
          entityName: entity.name,
          jurisdictionLabel,
          contentTitle: payload.contentTitle ?? null,
          contentExcerpt,
          contentUrl,
          createdBy,
          unsubscribeUrl,
        },
        status: "QUEUED",
        send_after: sendAfter,
        dedupe_key: immediateDedupeKey,
      });

    if (outboxError) {
      return NextResponse.json({ error: outboxError.message }, { status: 500 });
    }

    return NextResponse.json({ status: "recorded", notified: true });
  }

  if (notificationMode === "EMAIL_DIGEST" || shouldFallBackToDigest) {
    const { data: existingDigest } = await supabaseService
      .from("email_outbox")
      .select("id")
      .eq("dedupe_key", digestDedupeKey)
      .eq("status", "QUEUED")
      .gte("created_at", dayStart.toISOString())
      .maybeSingle();

    if (!existingDigest) {
      const sendAfter = new Date(now.getTime() + 5 * 60 * 1000).toISOString();
      const { error: digestError } = await supabaseService
        .from("email_outbox")
        .insert({
          entity_id: payload.entityId,
          contact_id: contactId,
          to_email: contactEmail,
          subject: "Polyvox: You were mentioned",
          template: "entity_tag_digest",
          payload: {
            entityName: entity.name,
            jurisdictionLabel,
            items: [
              {
                title: payload.contentTitle ?? payload.contentType,
                excerpt: contentExcerpt,
                url: contentUrl,
              },
            ],
            unsubscribeUrl,
          },
          status: "QUEUED",
          send_after: sendAfter,
          dedupe_key: digestDedupeKey,
        });

      if (digestError) {
        return NextResponse.json({ error: digestError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ status: "recorded", notified: true });
  }

  return NextResponse.json({ status: "recorded", notified: false });
}
