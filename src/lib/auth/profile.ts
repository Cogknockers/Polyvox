import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseServiceClient } from "@/lib/supabase/service";

type EnsureProfileInput = {
  userId: string;
  email?: string | null;
  username?: string | null;
  displayName?: string | null;
};

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildUsername({
  email,
  username,
  displayName,
  userId,
}: EnsureProfileInput & { userId: string }) {
  const base =
    username ||
    displayName ||
    (email ? email.split("@")[0] : "") ||
    "user";
  const slug = toSlug(base);
  if (slug.length >= 3) {
    return slug;
  }
  return `user-${userId.slice(0, 8)}`;
}

export async function ensureProfile(
  input: EnsureProfileInput,
  client?: SupabaseClient,
) {
  const supabase = client ?? createSupabaseServiceClient();
  const userId = input.userId;
  const username = buildUsername({ ...input, userId });
  const displayName = input.displayName ?? username;

  const basePayload = {
    id: userId,
    username,
    display_name: displayName,
  };

  const { error } = await supabase.from("profiles").upsert(basePayload, {
    onConflict: "id",
    ignoreDuplicates: true,
  });

  if (!error) {
    return;
  }

  if (error.message?.toLowerCase().includes("duplicate")) {
    const fallbackPayload = {
      ...basePayload,
      username: `user-${userId.slice(0, 8)}`,
    };
    const { error: fallbackError } = await supabase
      .from("profiles")
      .upsert(fallbackPayload, { onConflict: "id", ignoreDuplicates: true });
    if (fallbackError) {
      throw new Error(`Failed to ensure profile: ${fallbackError.message}`);
    }
    return;
  }

  throw new Error(`Failed to ensure profile: ${error.message}`);
}
