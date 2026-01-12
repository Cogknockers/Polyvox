// Entity digest sender for Polyvox.
// Set secrets with:
// supabase secrets set RESEND_API_KEY=... RESEND_FROM=... PUBLIC_APP_URL=... SUPABASE_SERVICE_ROLE_KEY=... DIGEST_RUNNER_TOKEN=...

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type DigestRequest = {
  limitEntities?: number;
  maxEventsPerDigest?: number;
  dryRun?: boolean;
};

type SubscriptionRow = {
  id: string;
  entity_id: string;
  contact_email: string;
  digest_frequency: "hourly" | "daily";
  last_sent_at: string | null;
  unsubscribe_token: string;
  public_entities?: {
    id: string;
    name: string;
    jurisdiction_id: string;
    jurisdictions?: { name: string | null; external_id: string | null; status: string | null } | null;
  } | null;
};

type EventRow = {
  id: string;
  created_at: string;
  event_type: string;
  issue_id: string | null;
  post_id: string | null;
  payload: Record<string, unknown> | null;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EVENT_LABELS: Record<string, string> = {
  entity_tagged: "Entity tagged",
  issue_created: "Issue created",
  issue_updated: "Issue updated",
  post_tagged: "Post tagged",
  manual_notify: "Manual notification",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  const runnerToken = Deno.env.get("DIGEST_RUNNER_TOKEN");
  if (!runnerToken) {
    return new Response("Missing DIGEST_RUNNER_TOKEN.", {
      status: 500,
      headers: corsHeaders,
    });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const token =
    authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : authHeader.trim();

  if (!token || token !== runnerToken) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const resendFrom = Deno.env.get("RESEND_FROM");
  const appUrl = Deno.env.get("PUBLIC_APP_URL");

  if (!supabaseUrl || !serviceKey || !resendKey || !resendFrom || !appUrl) {
    return new Response("Missing required environment variables.", {
      status: 500,
      headers: corsHeaders,
    });
  }

  let body: DigestRequest = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const limitEntities = Math.max(1, Number(body.limitEntities) || 25);
  const maxEventsPerDigest = Math.max(
    1,
    Number(body.maxEventsPerDigest) || 20,
  );
  const dryRun = Boolean(body.dryRun);

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const now = new Date();
  const nowIso = now.toISOString();
  const baseUrl = appUrl.replace(/\/+$/, "");

  const { data: subscriptions, error } = await supabase
    .from("entity_contact_subscriptions")
    .select(
      "id,entity_id,contact_email,digest_frequency,last_sent_at,unsubscribe_token,public_entities(id,name,jurisdiction_id,jurisdictions(name,external_id,status))",
    )
    .eq("is_enabled", true)
    .is("unsubscribed_at", null)
    .order("created_at", { ascending: true })
    .limit(limitEntities);

  if (error) {
    return new Response(error.message, { status: 500, headers: corsHeaders });
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  let processedEvents = 0;

  for (const row of (subscriptions ?? []) as SubscriptionRow[]) {
    const entity = row.public_entities;
    const jurisdiction = entity?.jurisdictions ?? null;
    const jurisdictionLabel = jurisdiction?.name ?? null;
    const jurisdictionStatus = jurisdiction?.status ?? null;

    if (!entity || jurisdictionStatus !== "ACTIVE") {
      skipped += 1;
      continue;
    }

    if (row.last_sent_at) {
      const lastSent = new Date(row.last_sent_at).getTime();
      const diffMinutes = (now.getTime() - lastSent) / 60000;
      if (
        (row.digest_frequency === "hourly" && diffMinutes < 55) ||
        (row.digest_frequency === "daily" && diffMinutes < 23 * 60)
      ) {
        if (!dryRun) {
          await supabase.from("entity_digest_deliveries").insert({
            entity_id: row.entity_id,
            contact_email: row.contact_email,
            period_start: nowIso,
            period_end: nowIso,
            events_count: 0,
            status: "skipped",
          });
        }
        skipped += 1;
        continue;
      }
    }

    const { data: events, error: eventError } = await supabase
      .from("entity_notification_events")
      .select("id,created_at,event_type,issue_id,post_id,payload")
      .eq("entity_id", row.entity_id)
      .is("processed_at", null)
      .order("created_at", { ascending: true })
      .limit(maxEventsPerDigest);

    if (eventError) {
      failed += 1;
      if (!dryRun) {
        await supabase.from("entity_digest_deliveries").insert({
          entity_id: row.entity_id,
          contact_email: row.contact_email,
          period_start: nowIso,
          period_end: nowIso,
          events_count: 0,
          status: "failed",
          error: eventError.message,
        });
      }
      continue;
    }

    const eventRows = (events ?? []) as EventRow[];
    if (eventRows.length === 0) {
      continue;
    }

    const subject = `Polyvox Digest: Updates for ${entity.name}`;
    const unsubscribeUrl = `${baseUrl}/unsubscribe/entity?token=${row.unsubscribe_token}`;
    const manageUrl = `${baseUrl}/help`;

    const items = eventRows.map((event) => {
      const label = EVENT_LABELS[event.event_type] ?? "Update";
      const created = new Date(event.created_at).toLocaleString();
      const issueUrl = event.issue_id
        ? `${baseUrl}/issue/${event.issue_id}`
        : null;
      const postUrl = event.post_id
        ? `${baseUrl}/post/${event.post_id}`
        : null;
      const link = issueUrl ?? postUrl ?? null;
      const title =
        (event.payload?.subject as string | undefined) ??
        `${label} • ${created}`;

      return { label, created, link, title };
    });

    const html = renderHtml({
      entityName: entity.name,
      jurisdictionLabel,
      items,
      unsubscribeUrl,
      manageUrl,
    });

    const text = renderText({
      entityName: entity.name,
      jurisdictionLabel,
      items,
      unsubscribeUrl,
      manageUrl,
    });

    if (dryRun) {
      skipped += 1;
      continue;
    }

    const sendResult = await sendResendEmail({
      apiKey: resendKey,
      from: resendFrom,
      to: row.contact_email,
      subject,
      html,
      text,
    });

    if (!sendResult.ok) {
      failed += 1;
      await supabase.from("entity_digest_deliveries").insert({
        entity_id: row.entity_id,
        contact_email: row.contact_email,
        period_start: eventRows[0].created_at,
        period_end: eventRows[eventRows.length - 1].created_at,
        events_count: eventRows.length,
        status: "failed",
        error: sendResult.error ?? "Resend failed",
      });
      continue;
    }

    await supabase.from("entity_digest_deliveries").insert({
      entity_id: row.entity_id,
      contact_email: row.contact_email,
      period_start: eventRows[0].created_at,
      period_end: eventRows[eventRows.length - 1].created_at,
      events_count: eventRows.length,
      resend_message_id: sendResult.messageId,
      status: "sent",
    });

    await supabase
      .from("entity_contact_subscriptions")
      .update({ last_sent_at: nowIso, updated_at: nowIso })
      .eq("id", row.id);

    await supabase
      .from("entity_notification_events")
      .update({ processed_at: nowIso })
      .in(
        "id",
        eventRows.map((event) => event.id),
      );

    sent += 1;
    processedEvents += eventRows.length;
  }

  const payload = {
    sent,
    skipped,
    failed,
    processedEvents,
    dryRun,
  };

  return new Response(JSON.stringify(payload), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
});

function renderHtml(props: {
  entityName: string;
  jurisdictionLabel: string | null;
  items: Array<{ label: string; created: string; link: string | null; title: string }>;
  unsubscribeUrl: string;
  manageUrl: string;
}) {
  const { entityName, jurisdictionLabel, items, unsubscribeUrl, manageUrl } = props;
  const subtitle = jurisdictionLabel ? ` • ${jurisdictionLabel}` : "";

  const rows = items
    .map((item) => {
      const linkHtml = item.link
        ? `<a href="${item.link}" style="color:#2563eb;text-decoration:none;">View</a>`
        : "";
      return `<tr>
        <td style="padding:8px 0;">
          <div style="font-size:13px;color:#475569;">${item.label} • ${item.created}</div>
          <div style="font-size:14px;color:#0f172a;font-weight:600;">${item.title}</div>
        </td>
        <td style="padding:8px 0;text-align:right;">${linkHtml}</td>
      </tr>`;
    })
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;color:#0f172a;">
      <h1 style="font-size:20px;margin-bottom:8px;">Polyvox Digest</h1>
      <p style="font-size:14px;margin:0 0 16px 0;">Updates for ${entityName}${subtitle}</p>
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
      <p style="font-size:12px;color:#475569;margin-top:18px;">
        You are receiving this digest based on public entity notifications.
      </p>
      <p style="font-size:12px;margin-top:8px;">
        <a href="${unsubscribeUrl}" style="color:#2563eb;">Unsubscribe</a> •
        <a href="${manageUrl}" style="color:#2563eb;">Manage notifications</a>
      </p>
    </div>
  `;
}

function renderText(props: {
  entityName: string;
  jurisdictionLabel: string | null;
  items: Array<{ label: string; created: string; link: string | null; title: string }>;
  unsubscribeUrl: string;
  manageUrl: string;
}) {
  const { entityName, jurisdictionLabel, items, unsubscribeUrl, manageUrl } = props;
  const subtitle = jurisdictionLabel ? ` • ${jurisdictionLabel}` : "";
  const lines = items.map((item) => {
    const link = item.link ? ` (${item.link})` : "";
    return `- ${item.label} • ${item.created} • ${item.title}${link}`;
  });

  return [
    `Polyvox Digest`,
    `Updates for ${entityName}${subtitle}`,
    "",
    ...lines,
    "",
    `Unsubscribe: ${unsubscribeUrl}`,
    `Manage: ${manageUrl}`,
  ].join("\n");
}

async function sendResendEmail(payload: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${payload.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: payload.from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { ok: false, error: json?.message ?? "Resend error" };
    }

    return { ok: true, messageId: json?.id ?? null };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Resend error",
    };
  }
}
