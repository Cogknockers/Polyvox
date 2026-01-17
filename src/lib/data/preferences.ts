import type { SupabaseClient } from "@supabase/supabase-js";

export type UserPreferencesRow = {
  user_id: string;
  theme_mode: "system" | "light" | "dark";
  theme_primary_oklch: string | null;
  theme_accent_seed: string | null;
  reduce_motion: boolean;
  badge_color: string | null;
};

export type PreferencesUpdatePayload = Partial<Omit<UserPreferencesRow, "user_id">>;

export async function getMyPreferences(supabase: SupabaseClient) {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from("user_preferences")
    .select(
      "user_id,theme_mode,theme_primary_oklch,theme_accent_seed,reduce_motion,badge_color",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load preferences: ${error.message}`);
  }

  return data as UserPreferencesRow | null;
}

export async function upsertMyPreferences(
  supabase: SupabaseClient,
  payload: PreferencesUpdatePayload,
) {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) {
    throw new Error("Not authenticated.");
  }

  const { error } = await supabase.from("user_preferences").upsert(
    {
      user_id: user.id,
      ...payload,
      badge_color: payload.badge_color ?? "none",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw new Error(`Failed to update preferences: ${error.message}`);
  }
}
