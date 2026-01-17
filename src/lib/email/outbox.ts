import type { SupabaseClient } from "@supabase/supabase-js";

import { EntityTagImmediateEmail } from "@/lib/email/templates/entity-tag-immediate";
import { EntityTagDigestEmail } from "@/lib/email/templates/entity-tag-digest";

type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
};

type SendEmailFn = (args: SendEmailArgs) => Promise<unknown>;

type OutboxRow = {
  id: string;
  contact_id: string | null;
  to_email: string;
  subject: string;
  template: string;
  payload: Record<string, unknown>;
  attempts: number | null;
};

let renderToStaticMarkup:
  | ((element: React.ReactElement) => string)
  | null = null;

async function getStaticRenderer() {
  if (!renderToStaticMarkup) {
    const mod = await import("react-dom/server");
    renderToStaticMarkup = mod.renderToStaticMarkup;
  }

  return renderToStaticMarkup;
}

function isBounceError(message: string) {
  return /bounce|invalid|undeliverable/i.test(message);
}

export async function processEmailOutbox({
  supabase,
  sendEmail,
  limit = 25,
}: {
  supabase: SupabaseClient;
  sendEmail: SendEmailFn;
  limit?: number;
}) {
  const now = new Date();
  const nowIso = now.toISOString();

  const { data: queued, error } = await supabase
    .from("email_outbox")
    .select("id,contact_id,to_email,subject,template,payload,attempts")
    .in("status", ["QUEUED", "queued"])
    .lte("send_after", nowIso)
    .order("send_after", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  let sent = 0;
  let failed = 0;

  for (const row of (queued ?? []) as OutboxRow[]) {
    const attempts = (row.attempts ?? 0) + 1;
    try {
      const renderStaticMarkup = await getStaticRenderer();
      let html: string;
      if (row.template === "entity_tag_immediate") {
        const payload = row.payload;
        html = renderStaticMarkup(
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
        html = renderStaticMarkup(
          EntityTagDigestEmail({
            entityName: String(payload.entityName ?? ""),
            jurisdictionLabel: payload.jurisdictionLabel as string | null | undefined,
            items: (payload.items as Array<Record<string, unknown>> | undefined)?.map(
              (item) => ({
                title: String(item.title ?? ""),
                excerpt: (item.excerpt as string | null | undefined) ?? null,
                url: String(item.url ?? ""),
              }),
            ) ?? [],
            unsubscribeUrl: String(payload.unsubscribeUrl ?? ""),
          }),
        );
      } else {
        throw new Error(`Unknown template: ${row.template}`);
      }

      await sendEmail({
        to: row.to_email,
        subject: row.subject,
        html,
      });

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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown send error.";
      const status = attempts >= 3 ? "FAILED" : "QUEUED";
      const nextSendAfter =
        attempts >= 3 ? nowIso : new Date(now.getTime() + 15 * 60 * 1000).toISOString();

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

  return { processed: queued?.length ?? 0, sent, failed };
}
