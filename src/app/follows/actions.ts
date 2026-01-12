"use server";

import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FOLLOW_TARGET_TYPES, type FollowTargetType } from "@/lib/types/follows";

const followSchema = z.object({
  targetType: z.enum(FOLLOW_TARGET_TYPES),
  targetId: z.string().uuid(),
});

type FollowResult = {
  ok?: boolean;
  error?: string;
  isFollowing?: boolean;
};

export async function followTarget(
  payload: z.infer<typeof followSchema>,
): Promise<FollowResult> {
  const parsed = followSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: "Invalid follow target." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return { ok: false, error: "Sign in required." };
  }

  const { error } = await supabase
    .from("follows")
    .upsert(
      {
        user_id: user.id,
        target_type: parsed.data.targetType,
        target_id: parsed.data.targetId,
      },
      {
        onConflict: "user_id,target_type,target_id",
        ignoreDuplicates: true,
      },
    );

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, isFollowing: true };
}

export async function unfollowTarget(
  payload: z.infer<typeof followSchema>,
): Promise<FollowResult> {
  const parsed = followSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: "Invalid follow target." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return { ok: false, error: "Sign in required." };
  }

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("user_id", user.id)
    .eq("target_type", parsed.data.targetType)
    .eq("target_id", parsed.data.targetId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, isFollowing: false };
}

export async function getMyFollowState(
  targetType: FollowTargetType,
  targetId: string,
): Promise<FollowResult> {
  const parsed = followSchema.safeParse({ targetType, targetId });
  if (!parsed.success) {
    return { ok: false, error: "Invalid follow target." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return { ok: true, isFollowing: false };
  }

  const { data, error } = await supabase
    .from("follows")
    .select("id")
    .eq("user_id", user.id)
    .eq("target_type", parsed.data.targetType)
    .eq("target_id", parsed.data.targetId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, isFollowing: Boolean(data) };
}
