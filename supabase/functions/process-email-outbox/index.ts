import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@6.7.0";
import React from "https://esm.sh/react@18";
import { renderToStaticMarkup } from "https://esm.sh/react-dom@18/server";

type OutboxRow = {
  id: string;
  contact_id: string | null;
  to_email: string;
  subject: string;
  template: string;
  payload: Record<string, unknown>;
  attempts: number | null;
};

function isBounceError(message: string) {
  return /bounce|invalid|undeliverable/i.test(message);
}

function EntityTagImmediateEmail(props: {
  entityName: string;
  jurisdictionLabel?: string | null;
  contentTitle?: string | null;
  contentExcerpt?: string | null;
  contentUrl: string;
  createdBy?: string | null;
  unsubscribeUrl: string;
}) {
  const {
    entityName,
    jurisdictionLabel,
    contentTitle,
    contentExcerpt,
    contentUrl,
    createdBy,
    unsubscribeUrl,
  } = props;

  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: "#0f172a" }}>
      <h1 style={{ fontSize: "20px", marginBottom: "12px" }}>
        Polyvox: You were mentioned
      </h1>
      <p style={{ fontSize: "14px", marginBottom: "16px" }}>
        {entityName}
        {jurisdictionLabel ? ` - ${jurisdictionLabel}` : ""} was mentioned
        {createdBy ? ` by ${createdBy}` : ""}.
      </p>
      {contentTitle ? (
        <p style={{ fontSize: "14px", marginBottom: "6px" }}>
          <strong>{contentTitle}</strong>
        </p>
      ) : null}
      {contentExcerpt ? (
        <p style={{ fontSize: "13px", marginBottom: "12px", color: "#475569" }}>
          {contentExcerpt}
        </p>
      ) : null}
      <a
        href={contentUrl}
        style={{
          display: "inline-block",
          padding: "10px 16px",
          backgroundColor: "#1f2937",
          color: "#ffffff",
          borderRadius: "8px",
          textDecoration: "none",
          fontSize: "14px",
        }}
      >
        View context
      </a>
      <p style={{ fontSize: "12px", marginTop: "20px", color: "#475569" }}>
        Public emails may receive limited notifications. Unsubscribe anytime.
      </p>
      <p style={{ fontSize: "12px", marginTop: "8px" }}>
        <a href={unsubscribeUrl} style={{ color: "#2563eb" }}>
          Unsubscribe
        </a>
      </p>
    </div>
  );
}

function EntityTagDigestEmail(props: {
  entityName: string;
  jurisdictionLabel?: string | null;
  items: Array<{ title: string; excerpt?: string | null; url: string }>;
  unsubscribeUrl: string;
}) {
  const { entityName, jurisdictionLabel, items, unsubscribeUrl } = props;

  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: "#0f172a" }}>
      <h1 style={{ fontSize: "20px", marginBottom: "12px" }}>
        Polyvox: You were mentioned
      </h1>
      <p style={{ fontSize: "14px", marginBottom: "16px" }}>
        Daily digest for {entityName}
        {jurisdictionLabel ? ` - ${jurisdictionLabel}` : ""}.
      </p>
      <div style={{ display: "grid", gap: "12px" }}>
        {items.map((item) => (
          <div
            key={item.url}
            style={{ padding: "12px", border: "1px solid #e2e8f0", borderRadius: "8px" }}
          >
            <p style={{ fontSize: "14px", margin: 0 }}>
              <strong>{item.title}</strong>
            </p>
            {item.excerpt ? (
              <p style={{ fontSize: "13px", color: "#475569", margin: "6px 0 10px" }}>
                {item.excerpt}
              </p>
            ) : null}
            <a href={item.url} style={{ color: "#2563eb", fontSize: "13px" }}>
              View context
            </a>
          </div>
        ))}
      </div>
      <p style={{ fontSize: "12px", marginTop: "20px", color: "#475569" }}>
        Public emails may receive limited notifications. Unsubscribe anytime.
      </p>
      <p style={{ fontSize: "12px", marginTop: "8px" }}>
        <a href={unsubscribeUrl} style={{ color: "#2563eb" }}>
          Unsubscribe
        </a>
      </p>
    </div>
  );
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabaseUrl =
    Deno.env.get("SUPABASE_URL") ?? Deno.env.get("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const resendFrom = Deno.env.get("RESEND_FROM");

  if (!supabaseUrl || !serviceKey || !resendKey || !resendFrom) {
    return new Response("Missing required environment variables.", { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
  const resend = new Resend(resendKey);

  const now = new Date();
  const nowIso = now.toISOString();

  const { data: queued, error } = await supabase
    .from("email_outbox")
    .select("id,contact_id,to_email,subject,template,payload,attempts")
    .in("status", ["QUEUED", "queued"])
    .lte("send_after", nowIso)
    .order("send_after", { ascending: true })
    .limit(25);

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  let sent = 0;
  let failed = 0;

  for (const row of (queued ?? []) as OutboxRow[]) {
    const attempts = (row.attempts ?? 0) + 1;
    try {
      let html = "";
      if (row.template === "entity_tag_immediate") {
        const payload = row.payload;
        html = renderToStaticMarkup(
          EntityTagImmediateEmail({
            entityName: String(payload.entityName ?? ""),
            jurisdictionLabel: payload.jurisdictionLabel as string | null | undefined,
            contentTitle: payload.contentTitle as string | null | undefined,
            contentExcerpt: payload.contentExcerpt as string | null | undefined,
            contentUrl: String(payload.contentUrl ?? ""),
            createdBy: payload.createdBy as string | null | undefined,
            unsubscribeUrl: String(payload.unsubscribeUrl ?? ""),
          }),
        );
      } else if (row.template === "entity_tag_digest") {
        const payload = row.payload;
        const items =
          (payload.items as Array<Record<string, unknown>> | undefined)?.map((item) => ({
            title: String(item.title ?? ""),
            excerpt: (item.excerpt as string | null | undefined) ?? null,
            url: String(item.url ?? ""),
          })) ?? [];

        html = renderToStaticMarkup(
          EntityTagDigestEmail({
            entityName: String(payload.entityName ?? ""),
            jurisdictionLabel: payload.jurisdictionLabel as string | null | undefined,
            items,
            unsubscribeUrl: String(payload.unsubscribeUrl ?? ""),
          }),
        );
      } else {
        throw new Error(`Unknown template: ${row.template}`);
      }

      const result = await resend.emails.send({
        from: resendFrom,
        to: row.to_email,
        subject: row.subject,
        html,
        headers: { "X-Polyvox-Outbox": row.id },
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      await supabase
        .from("email_outbox")
        .update({
          status: "SENT",
          attempts,
          sent_at: nowIso,
          updated_at: nowIso,
          last_error: null,
        })
        .eq("id", row.id);

      if (row.contact_id) {
        await supabase
          .from("public_entity_contacts")
          .update({ last_emailed_at: nowIso, updated_at: nowIso })
          .eq("id", row.contact_id);
      }

      sent += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown send error.";
      const status = attempts >= 3 ? "FAILED" : "QUEUED";
      const nextSendAfter =
        attempts >= 3
          ? nowIso
          : new Date(now.getTime() + 15 * 60 * 1000).toISOString();

      await supabase
        .from("email_outbox")
        .update({
          status,
          attempts,
          last_error: message,
          send_after: nextSendAfter,
          updated_at: nowIso,
        })
        .eq("id", row.id);

      if (row.contact_id && isBounceError(message)) {
        const { data: contact } = await supabase
          .from("public_entity_contacts")
          .select("bounce_count")
          .eq("id", row.contact_id)
          .maybeSingle();

        const currentBounces = Number(contact?.bounce_count ?? 0);
        await supabase
          .from("public_entity_contacts")
          .update({
            email_suppressed: true,
            bounce_count: currentBounces + 1,
            updated_at: nowIso,
          })
          .eq("id", row.contact_id);
      }

      failed += 1;
    }
  }

  return new Response(JSON.stringify({ processed: queued?.length ?? 0, sent, failed }), {
    headers: { "Content-Type": "application/json" },
  });
});
