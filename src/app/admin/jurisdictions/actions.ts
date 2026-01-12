"use server";

import { z } from "zod";

import { requireAdmin } from "@/lib/authz";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const querySchema = z.string().trim().min(2).max(120);

export type CountyResult = {
  fips: string;
  name: string;
  statefp: string;
  bbox: number[] | null;
  centroid: Record<string, unknown> | string | null;
  storage_path: string | null;
};

export type UserResult = {
  user_id: string;
  email: string | null;
  username: string | null;
  display_name: string | null;
};

export type JurisdictionRow = {
  id: string;
  name: string;
  external_id: string | null;
  status: string | null;
  activated_at: string | null;
  roles_count: number;
};

const activateSchema = z.object({
  fips: z.string().min(5),
  founderUserId: z.string().uuid(),
});

const assignSchema = z.object({
  jurisdictionId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(["founder", "moderator", "editor", "member"]),
});

const archiveSchema = z.object({
  jurisdictionId: z.string().uuid(),
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function searchCounties(query: string): Promise<CountyResult[]> {
  await requireAdmin();
  const parsed = querySchema.safeParse(query);
  if (!parsed.success) {
    return [];
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("counties")
    .select("fips,name,statefp,bbox,centroid,storage_path")
    .ilike("name", `%${parsed.data}%`)
    .order("name")
    .limit(20);

  if (error) {
    throw new Error(`County search failed: ${error.message}`);
  }

  return (data ?? []) as CountyResult[];
}

export async function searchUsers(query: string): Promise<UserResult[]> {
  await requireAdmin();
  const parsed = querySchema.safeParse(query);
  if (!parsed.success) {
    return [];
  }

  const supabase = createSupabaseServiceClient();
  const needle = parsed.data.toLowerCase();
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    throw new Error(`User search failed: ${error.message}`);
  }

  const results = data.users
    .filter((user) => {
      const email = user.email?.toLowerCase() ?? "";
      const username = String(user.user_metadata?.username ?? "").toLowerCase();
      const displayName = String(user.user_metadata?.display_name ?? "").toLowerCase();
      return (
        email.includes(needle) ||
        username.includes(needle) ||
        displayName.includes(needle)
      );
    })
    .slice(0, 20)
    .map<UserResult>((user) => ({
      user_id: user.id,
      email: user.email ?? null,
      username: user.user_metadata?.username ?? null,
      display_name: user.user_metadata?.display_name ?? null,
    }));

  return results;
}

export async function activateCounty(payload: {
  fips: string;
  founderUserId: string;
}) {
  await requireAdmin();
  const parsed = activateSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: "Select a county and founder before activating." };
  }

  const supabase = createSupabaseServiceClient();
  const { data: county, error: countyError } = await supabase
    .from("counties")
    .select("fips,name,statefp,bbox,centroid,storage_path")
    .eq("fips", parsed.data.fips)
    .maybeSingle();

  if (countyError || !county) {
    return { error: countyError?.message ?? "County not found." };
  }

  const countyName = county.name.endsWith("County")
    ? county.name
    : `${county.name} County`;
  const slug = slugify(`${county.name}-county-${county.fips}`);

  const { data: jurisdiction, error: jurisdictionError } = await supabase
    .from("jurisdictions")
    .upsert(
      {
        type: "COUNTY",
        name: countyName,
        slug,
        external_id: county.fips,
        bbox: county.bbox,
        centroid: county.centroid,
        status: "ACTIVE",
        activated_at: new Date().toISOString(),
      },
      { onConflict: "type,external_id" },
    )
    .select("id")
    .maybeSingle();

  if (jurisdictionError) {
    return { error: jurisdictionError.message };
  }

  const jurisdictionId =
    jurisdiction?.id ??
    (await supabase
      .from("jurisdictions")
      .select("id")
      .eq("type", "COUNTY")
      .eq("external_id", county.fips)
      .maybeSingle()).data?.id;

  if (!jurisdictionId) {
    return { error: "Failed to resolve jurisdiction record." };
  }

  const { error: membershipError } = await supabase
    .from("jurisdiction_memberships")
    .upsert(
      {
        jurisdiction_id: jurisdictionId,
        user_id: parsed.data.founderUserId,
        role: "founder",
      },
      { onConflict: "jurisdiction_id,user_id,role" },
    );

  if (membershipError) {
    return { error: membershipError.message };
  }

  return { success: true };
}

export async function assignRole(payload: {
  jurisdictionId: string;
  userId: string;
  role: "founder" | "moderator" | "editor" | "member";
}) {
  await requireAdmin();
  const parsed = assignSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: "Select a user and role before assigning." };
  }

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from("jurisdiction_memberships")
    .upsert(
      {
        jurisdiction_id: parsed.data.jurisdictionId,
        user_id: parsed.data.userId,
        role: parsed.data.role,
      },
      { onConflict: "jurisdiction_id,user_id,role" },
    );

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function archiveJurisdiction(payload: { jurisdictionId: string }) {
  await requireAdmin();
  const parsed = archiveSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: "Invalid jurisdiction." };
  }

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from("jurisdictions")
    .update({ status: "ARCHIVED" })
    .eq("id", parsed.data.jurisdictionId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function listActivatedJurisdictions(): Promise<{
  data: JurisdictionRow[];
  error?: string;
}> {
  await requireAdmin();
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("jurisdictions")
    .select("id,name,external_id,status,activated_at")
    .eq("type", "COUNTY")
    .order("name");

  if (error) {
    return { data: [], error: `Failed to load jurisdictions: ${error.message}` };
  }

  const rows = data ?? [];
  const counts = await Promise.all(
    rows.map(async (row) => {
      const { count } = await supabase
        .from("jurisdiction_memberships")
        .select("jurisdiction_id", { count: "exact", head: true })
        .eq("jurisdiction_id", row.id);
      return { id: row.id, count: count ?? 0 };
    }),
  );

  const countMap = new Map(counts.map((entry) => [entry.id, entry.count]));

  const mapped = rows.map((row) => ({
    id: row.id,
    name: row.name,
    external_id: row.external_id,
    status: row.status,
    activated_at: row.activated_at,
    roles_count: countMap.get(row.id) ?? 0,
  }));
  return { data: mapped };
}
