"use server";

import { z } from "zod";

import { isAdmin } from "@/lib/authz";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const createOfficeSchema = z.object({
  jurisdictionId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120),
  aliases: z.string().optional(),
});

const nominateSchema = z.object({
  jurisdictionId: z.string().uuid(),
  officeId: z.string().uuid(),
  nomineeProfileId: z.string().uuid(),
  message: z.string().trim().min(3).max(2000),
});

const voteSchema = z.object({
  nominationId: z.string().uuid(),
  value: z.union([z.literal(-1), z.literal(1)]),
});

const statusSchema = z.object({
  jurisdictionId: z.string().uuid(),
  nominationId: z.string().uuid(),
  status: z.enum(["open", "withdrawn", "accepted", "declined"]),
});

const spotlightSchema = z.object({
  jurisdictionId: z.string().uuid(),
  nominationId: z.string().uuid(),
  isSpotlighted: z.boolean(),
});

const deleteSchema = z.object({
  jurisdictionId: z.string().uuid(),
  nominationId: z.string().uuid(),
});

const searchSchema = z.object({
  query: z.string().trim().min(1).max(100),
  countyFips: z.string().regex(/^\d{5}$/),
});

export type OfficeActionResult = {
  ok?: boolean;
  error?: string;
};

export type SearchProfileResult = {
  ok?: boolean;
  error?: string;
  profiles?: Array<{
    id: string;
    display_name: string | null;
    username: string | null;
  }>;
};

async function canManage(jurisdictionId: string, userId: string) {
  const supabase = await createSupabaseServerClient();
  try {
    const admin = await isAdmin(userId);
    if (admin) return true;
  } catch {
    // fall through
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

export async function createOfficeAction(
  payload: z.infer<typeof createOfficeSchema>,
): Promise<OfficeActionResult> {
  const parsed = createOfficeSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: "Please check the form inputs." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return { ok: false, error: "Sign in required." };
  }

  const canManageOffices = await canManage(parsed.data.jurisdictionId, user.id);
  if (!canManageOffices) {
    return { ok: false, error: "You do not have permission to create offices." };
  }

  const slug = slugify(parsed.data.slug || parsed.data.name);
  if (!slug) {
    return { ok: false, error: "Please provide a valid slug." };
  }

  const { data: office, error } = await supabase
    .from("offices")
    .insert({
      jurisdiction_id: parsed.data.jurisdictionId,
      name: parsed.data.name,
      slug,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  const aliases = (parsed.data.aliases ?? "")
    .split(",")
    .map((alias) => alias.trim())
    .filter(Boolean);

  if (office?.id && aliases.length > 0) {
    const { error: aliasError } = await supabase
      .from("office_aliases")
      .insert(
        aliases.map((alias) => ({
          office_id: office.id,
          alias,
        })),
      );

    if (aliasError) {
      return { ok: false, error: aliasError.message };
    }
  }

  return { ok: true };
}

export async function createNominationAction(
  payload: z.infer<typeof nominateSchema>,
): Promise<OfficeActionResult> {
  const parsed = nominateSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: "Please check the nomination details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return { ok: false, error: "Sign in required." };
  }

  const { error } = await supabase.from("office_nominations").insert({
    jurisdiction_id: parsed.data.jurisdictionId,
    office_id: parsed.data.officeId,
    nominator_id: user.id,
    nominee_profile_id: parsed.data.nomineeProfileId,
    message: parsed.data.message,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function toggleNominationVoteAction(
  payload: z.infer<typeof voteSchema>,
): Promise<OfficeActionResult> {
  const parsed = voteSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: "Invalid vote." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return { ok: false, error: "Sign in required." };
  }

  const { data: existing } = await supabase
    .from("office_nomination_votes")
    .select("value")
    .eq("nomination_id", parsed.data.nominationId)
    .eq("voter_id", user.id)
    .maybeSingle();

  const shouldRemove = existing?.value === parsed.data.value;

  if (shouldRemove) {
    const { error } = await supabase
      .from("office_nomination_votes")
      .delete()
      .eq("nomination_id", parsed.data.nominationId)
      .eq("voter_id", user.id);

    if (error) {
      return { ok: false, error: error.message };
    }
  } else {
    const { error } = await supabase.from("office_nomination_votes").upsert(
      {
        nomination_id: parsed.data.nominationId,
        voter_id: user.id,
        value: parsed.data.value,
      },
      { onConflict: "nomination_id,voter_id" },
    );

    if (error) {
      return { ok: false, error: error.message };
    }
  }

  return { ok: true };
}

export async function updateNominationStatusAction(
  payload: z.infer<typeof statusSchema>,
): Promise<OfficeActionResult> {
  const parsed = statusSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: "Invalid status." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return { ok: false, error: "Sign in required." };
  }

  const canManageOffices = await canManage(parsed.data.jurisdictionId, user.id);
  if (!canManageOffices) {
    return { ok: false, error: "You do not have permission to update." };
  }

  const { error } = await supabase
    .from("office_nominations")
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.nominationId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function toggleNominationSpotlightAction(
  payload: z.infer<typeof spotlightSchema>,
): Promise<OfficeActionResult> {
  const parsed = spotlightSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: "Invalid request." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return { ok: false, error: "Sign in required." };
  }

  const canManageOffices = await canManage(parsed.data.jurisdictionId, user.id);
  if (!canManageOffices) {
    return { ok: false, error: "You do not have permission to update." };
  }

  const { error } = await supabase
    .from("office_nominations")
    .update({
      is_spotlighted: parsed.data.isSpotlighted,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.nominationId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function deleteNominationAction(
  payload: z.infer<typeof deleteSchema>,
): Promise<OfficeActionResult> {
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

  const canManageOffices = await canManage(parsed.data.jurisdictionId, user.id);
  if (!canManageOffices) {
    return { ok: false, error: "You do not have permission to delete." };
  }

  const { error } = await supabase
    .from("office_nominations")
    .delete()
    .eq("id", parsed.data.nominationId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function searchProfilesAction(
  payload: z.infer<typeof searchSchema>,
): Promise<SearchProfileResult> {
  const parsed = searchSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: "Invalid search." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return { ok: false, error: "Sign in required." };
  }

  const query = `%${parsed.data.query}%`;
  const { data, error } = await supabase
    .from("profiles")
    .select("id,username,display_name")
    .eq("location_county_fips", parsed.data.countyFips)
    .or(`username.ilike.${query},display_name.ilike.${query}`)
    .limit(10);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, profiles: data ?? [] };
}
