import "server-only";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type JurisdictionRole =
  | "admin"
  | "moderator"
  | "editor"
  | "member"
  | "viewer"
  | "founder";

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(`Failed to load user session: ${error.message}`);
  }

  return user ?? null;
}

export async function isAdmin(userId: string) {
  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("user_global_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to check admin role: ${error.message}`);
    }

    return Boolean(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.toLowerCase().includes("invalid api key")) {
      throw error;
    }
    const supabase = await createSupabaseServerClient();
    const { data, error: fallbackError } = await supabase
      .from("user_global_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (fallbackError) {
      throw new Error(`Failed to check admin role: ${fallbackError.message}`);
    }

    return Boolean(data);
  }
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const admin = await isAdmin(user.id);
  if (!admin) {
    redirect("/dashboard");
  }

  return user;
}

export async function getJurisdictionRole(
  userId: string,
  jurisdictionId: string,
) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("jurisdiction_memberships")
    .select("role")
    .eq("user_id", userId)
    .eq("jurisdiction_id", jurisdictionId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get jurisdiction role: ${error.message}`);
  }

  return data?.role ?? null;
}

type RequireRoleInput = {
  userId: string;
  jurisdictionId?: string;
  role?: JurisdictionRole;
  roles?: JurisdictionRole[];
};

export async function requireRole({
  userId,
  jurisdictionId,
  role,
  roles,
}: RequireRoleInput) {
  if (await isAdmin(userId)) {
    return;
  }

  const allowedRoles = roles ?? (role ? [role] : []);
  if (!jurisdictionId || allowedRoles.length === 0) {
    throw new Error("Unauthorized");
  }

  const membershipRole = await getJurisdictionRole(userId, jurisdictionId);
  if (!membershipRole || !allowedRoles.includes(membershipRole)) {
    throw new Error("Unauthorized");
  }
}
