"use server";

import { z } from "zod";

import { isAdmin } from "@/lib/authz";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const entitySchema = z.object({
  jurisdictionId: z.string().uuid(),
  type: z.enum(["official", "department"]),
  name: z.string().trim().min(2).max(200),
  title: z
    .preprocess(
      (value) =>
        typeof value === "string" && value.trim() === "" ? null : value,
      z.string().trim().max(200).nullable().optional(),
    )
    .optional(),
  contactEmail: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().email().nullable().optional(),
  ),
  websiteUrl: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().url().nullable().optional(),
  ),
});

const updateSchema = entitySchema.extend({
  id: z.string().uuid(),
});

const deleteSchema = z.object({
  id: z.string().uuid(),
  jurisdictionId: z.string().uuid(),
});

type EntityActionResult = {
  ok?: boolean;
  error?: string;
};

const notifySchema = z.object({
  entityId: z.string().uuid(),
  jurisdictionId: z.string().uuid(),
  message: z.string().trim().max(500).optional(),
});

async function canManageEntities(
  jurisdictionId: string,
  userId: string,
) {
  const supabase = await createSupabaseServerClient();

  try {
    const admin = await isAdmin(userId);
    if (admin) {
      return true;
    }
  } catch {
    // fall through to role check
  }

  const { data, error } = await supabase.rpc("has_jurisdiction_role", {
    jurisdiction_id: jurisdictionId,
    roles: ["founder", "moderator"],
  });

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

export async function createEntityAction(
  payload: z.infer<typeof entitySchema>,
): Promise<EntityActionResult> {
  const parsed = entitySchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: "Please check the form inputs." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return { ok: false, error: "Sign in required." };
  }

  const canManage = await canManageEntities(parsed.data.jurisdictionId, user.id);
  if (!canManage) {
    return { ok: false, error: "You do not have permission to manage entities." };
  }

  const { error } = await supabase.from("public_entities").insert({
    jurisdiction_id: parsed.data.jurisdictionId,
    type: parsed.data.type,
    name: parsed.data.name,
    title: parsed.data.title ?? null,
    contact_email: parsed.data.contactEmail ?? null,
    website_url: parsed.data.websiteUrl ?? null,
    created_by: user.id,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function updateEntityAction(
  payload: z.infer<typeof updateSchema>,
): Promise<EntityActionResult> {
  const parsed = updateSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: "Please check the form inputs." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return { ok: false, error: "Sign in required." };
  }

  const canManage = await canManageEntities(parsed.data.jurisdictionId, user.id);
  if (!canManage) {
    return { ok: false, error: "You do not have permission to manage entities." };
  }

  const { error } = await supabase
    .from("public_entities")
    .update({
      type: parsed.data.type,
      name: parsed.data.name,
      title: parsed.data.title ?? null,
      contact_email: parsed.data.contactEmail ?? null,
      website_url: parsed.data.websiteUrl ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function deleteEntityAction(
  payload: z.infer<typeof deleteSchema>,
): Promise<EntityActionResult> {
  const parsed = deleteSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: "Invalid request." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return { ok: false, error: "Sign in required." };
  }

  const canManage = await canManageEntities(parsed.data.jurisdictionId, user.id);
  if (!canManage) {
    return { ok: false, error: "You do not have permission to manage entities." };
  }

  const { error } = await supabase
    .from("public_entities")
    .delete()
    .eq("id", parsed.data.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function notifyEntityAction(
  payload: z.infer<typeof notifySchema>,
): Promise<EntityActionResult> {
  const parsed = notifySchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: "Invalid request." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) {
    return { ok: false, error: "Sign in required." };
  }

  const { data: entity } = await supabase
    .from("public_entities")
    .select("id,jurisdiction_id")
    .eq("id", parsed.data.entityId)
    .maybeSingle();

  if (!entity || entity.jurisdiction_id !== parsed.data.jurisdictionId) {
    return { ok: false, error: "Entity not found." };
  }

  const { error } = await supabase.from("entity_notification_events").insert({
    jurisdiction_id: parsed.data.jurisdictionId,
    entity_id: parsed.data.entityId,
    actor_id: user.id,
    event_type: "manual_notify",
    payload: parsed.data.message
      ? { message: parsed.data.message }
      : {},
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
