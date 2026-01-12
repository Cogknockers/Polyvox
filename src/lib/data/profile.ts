import type { SupabaseClient } from "@supabase/supabase-js";

export type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  avatar_path: string | null;
  bio: string | null;
  party: string | null;
  party_other_label: string | null;
  party_public: boolean | null;
  district_label: string | null;
  location_country: string | null;
  location_state: string | null;
  location_county_fips: string | null;
  location_county_name: string | null;
  location_city: string | null;
};

export type ProfileUpdatePayload = Partial<Omit<ProfileRow, "id">>;

export async function getMyProfile(supabase: SupabaseClient) {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id,username,display_name,avatar_url,avatar_path,bio,party,party_other_label,party_public,district_label,location_country,location_state,location_county_fips,location_county_name,location_city",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load profile: ${error.message}`);
  }

  return data as ProfileRow | null;
}

export async function upsertMyProfile(
  supabase: SupabaseClient,
  payload: ProfileUpdatePayload,
) {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) {
    throw new Error("Not authenticated.");
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      ...payload,
    },
    { onConflict: "id" },
  );

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }
}
