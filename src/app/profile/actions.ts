"use server";

import { randomUUID } from "crypto";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { upsertMyProfile } from "@/lib/data/profile";
import { upsertMyPreferences } from "@/lib/data/preferences";

export type ProfileActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export type PreferencesActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export type AvatarActionState = {
  ok?: boolean;
  error?: string;
  avatarUrl?: string;
};

const partyValues = [
  "unknown",
  "democrat",
  "republican",
  "independent",
  "libertarian",
  "green",
  "constitution",
  "nonpartisan",
  "other",
] as const;

const profileSchema = z
  .object({
  display_name: z.string().trim().max(80).nullable(),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters.")
    .max(32, "Username must be 32 characters or fewer.")
    .regex(/^[a-z0-9-]+$/i, "Username can use letters, numbers, and hyphens.")
    .nullable(),
  bio: z.string().trim().max(500).nullable(),
  party: z.enum(partyValues).nullable(),
  party_other_label: z.string().trim().max(40).nullable(),
  party_public: z.boolean().nullable(),
  district_label: z.string().trim().max(80).nullable(),
  location_country: z.string().trim().max(64).nullable(),
  location_state: z.string().trim().max(32).nullable(),
  location_county_fips: z.string().trim().max(8).nullable(),
  location_county_name: z.string().trim().max(80).nullable(),
  location_city: z.string().trim().max(80).nullable(),
})
  .refine(
    (data) =>
      data.party !== "other" ||
      (data.party_other_label && data.party_other_label.trim().length > 0),
    {
      message: "Provide a party label for Other.",
      path: ["party_other_label"],
    },
  );

const badgeColors = [
  "none",
  "red",
  "blue",
  "green",
  "yellow",
  "purple",
  "orange",
  "gray",
] as const;

const preferencesSchema = z.object({
  theme_mode: z.enum(["system", "light", "dark"]),
  theme_primary_oklch: z.string().trim().max(64).nullable(),
  theme_accent_seed: z.string().trim().max(64).nullable(),
  reduce_motion: z.boolean(),
  badge_color: z.enum(badgeColors),
});

const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

function readString(
  formData: FormData,
  key: string,
  options?: { optional?: boolean },
) {
  if (!formData.has(key)) {
    return options?.optional ? undefined : null;
  }
  const raw = formData.get(key);
  if (raw === null) return null;
  const value = String(raw).trim();
  if (!value) return null;
  return value;
}

function readBoolean(formData: FormData, key: string) {
  if (!formData.has(key)) return undefined;
  return String(formData.get(key)) === "true";
}

function compact<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as T;
}

export async function updateProfileAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const payload = compact({
    display_name: readString(formData, "display_name", { optional: true }),
    username: readString(formData, "username", { optional: true }),
    bio: readString(formData, "bio", { optional: true }),
    party: readString(formData, "party", { optional: true }) ?? "unknown",
    party_other_label: readString(formData, "party_other_label", {
      optional: true,
    }),
    party_public: readBoolean(formData, "party_public"),
    district_label: readString(formData, "district_label", { optional: true }),
    location_country: readString(formData, "location_country", {
      optional: true,
    }),
    location_state: readString(formData, "location_state", { optional: true }),
    location_city: readString(formData, "location_city", { optional: true }),
    location_county_name: readString(formData, "location_county_name", {
      optional: true,
    }),
    location_county_fips: readString(formData, "location_county_fips", {
      optional: true,
    }),
  });

  const parseResult = profileSchema.safeParse({
    display_name:
      payload.display_name === undefined ? null : payload.display_name,
    username: payload.username === undefined ? null : payload.username,
    bio: payload.bio === undefined ? null : payload.bio,
    party: payload.party === undefined ? "unknown" : payload.party,
    party_other_label:
      payload.party_other_label === undefined ? null : payload.party_other_label,
    party_public:
      payload.party_public === undefined ? null : payload.party_public,
    district_label:
      payload.district_label === undefined ? null : payload.district_label,
    location_country:
      payload.location_country === undefined ? null : payload.location_country,
    location_state:
      payload.location_state === undefined ? null : payload.location_state,
    location_city:
      payload.location_city === undefined ? null : payload.location_city,
    location_county_name:
      payload.location_county_name === undefined
        ? null
        : payload.location_county_name,
    location_county_fips:
      payload.location_county_fips === undefined
        ? null
        : payload.location_county_fips,
  });

  if (!parseResult.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: Object.fromEntries(
        Object.entries(parseResult.error.flatten().fieldErrors).map(
          ([key, value]) => [key, value?.[0] ?? ""],
        ),
      ),
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const normalizedPayload = {
      ...payload,
      party_other_label:
        payload.party === "other" ? payload.party_other_label : null,
    };
    await upsertMyProfile(supabase, normalizedPayload);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update profile.",
    };
  }
}

export async function updatePreferencesAction(
  _prevState: PreferencesActionState,
  formData: FormData,
): Promise<PreferencesActionState> {
  const intent = formData.get("intent");
  const reduceMotionValue = readBoolean(formData, "reduce_motion");

  const rawPayload = {
    theme_mode: (readString(formData, "theme_mode") ?? "system") as
      | "system"
      | "light"
      | "dark",
    theme_primary_oklch: readString(formData, "theme_primary_oklch"),
    theme_accent_seed: readString(formData, "theme_accent_seed"),
    reduce_motion: reduceMotionValue ?? false,
    badge_color: (readString(formData, "badge_color") ?? "none") as
      | "none"
      | "red"
      | "blue"
      | "green"
      | "yellow"
      | "purple"
      | "orange"
      | "gray",
  };

  const payload =
    intent === "reset"
      ? {
          ...rawPayload,
          theme_mode: "system" as const,
          theme_primary_oklch: null,
          theme_accent_seed: null,
        }
      : rawPayload;

  const parseResult = preferencesSchema.safeParse(payload);
  if (!parseResult.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: Object.fromEntries(
        Object.entries(parseResult.error.flatten().fieldErrors).map(
          ([key, value]) => [key, value?.[0] ?? ""],
        ),
      ),
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    await upsertMyPreferences(supabase, payload);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update preferences.",
    };
  }
}

export async function updateAvatarAction(
  _prevState: AvatarActionState,
  formData: FormData,
): Promise<AvatarActionState> {
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Select an image to upload." };
  }

  if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
    return { ok: false, error: "Upload a PNG, JPG, WEBP, or GIF image." };
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return { ok: false, error: "Image must be 2MB or smaller." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) {
      return { ok: false, error: "You must be signed in." };
    }

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("avatar_path")
      .eq("id", user.id)
      .maybeSingle();

    const fileExtRaw = file.name.split(".").pop()?.toLowerCase();
    const fileExt =
      fileExtRaw && /^[a-z0-9]+$/.test(fileExtRaw) ? fileExtRaw : "png";
    const fileName = `${randomUUID()}.${fileExt}`;
    const storagePath = `${user.id}/${fileName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const service = createSupabaseServiceClient();
    const { error: uploadError } = await service.storage
      .from(AVATAR_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return { ok: false, error: `Upload failed: ${uploadError.message}` };
    }

    const { data: publicData } = service.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(storagePath);
    const avatarUrl = publicData.publicUrl;

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        avatar_url: avatarUrl,
        avatar_path: storagePath,
      },
      { onConflict: "id" },
    );

    if (profileError) {
      return { ok: false, error: profileError.message };
    }

    const oldPath = existingProfile?.avatar_path;
    if (oldPath && oldPath !== storagePath) {
      await service.storage.from(AVATAR_BUCKET).remove([oldPath]);
    }

    return { ok: true, avatarUrl };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Failed to upload avatar.",
    };
  }
}
