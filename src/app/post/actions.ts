"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notifyFollowersForJurisdiction } from "@/lib/notifications/notify";
import { normalizePostType } from "@/lib/posts";
import { formatCountyName } from "@/lib/format";

export type PostActionResult = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  voteTotal?: number;
  userVote?: number;
};

const postSchema = z.object({
  jurisdictionId: z.string().uuid(),
  countyFips: z.string().regex(/^\d{5}$/).optional(),
  issueId: z.string().uuid().optional(),
  entityId: z.string().uuid().optional(),
  type: z.enum(["DISCUSSION", "QUESTION", "ANNOUNCEMENT"]),
  title: z.string().trim().min(3).max(120),
  body: z.string().trim().min(10).max(5000),
});

const commentSchema = z.object({
  postId: z.string().uuid(),
  body: z.string().trim().min(3).max(2000),
});

const voteSchema = z.object({
  postId: z.string().uuid(),
  value: z.union([z.literal(-1), z.literal(1)]),
  countyFips: z.string().regex(/^\d{5}$/).optional(),
});

function mapFieldErrors(errors: z.ZodError) {
  return Object.fromEntries(
    Object.entries(errors.flatten().fieldErrors).map(([key, value]) => [
      key,
      value?.[0] ?? "",
    ]),
  );
}

export async function createPostAction(
  payload: z.infer<typeof postSchema>,
): Promise<PostActionResult> {
  const parsed = postSchema.safeParse({
    ...payload,
    type: normalizePostType(payload.type),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: mapFieldErrors(parsed.error),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return { ok: false, error: "Sign in to create a post." };
  }

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
    jurisdiction_id: parsed.data.jurisdictionId,
    issue_id: parsed.data.issueId ?? null,
    entity_id: parsed.data.entityId ?? null,
    author_id: user.id,
    type: parsed.data.type,
    title: parsed.data.title,
    body: parsed.data.body,
  })
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  if (post?.id) {
    let countyLabel = "County";
    const { data: jurisdiction } = await supabase
      .from("jurisdictions")
      .select("name")
      .eq("id", parsed.data.jurisdictionId)
      .maybeSingle();

    if (jurisdiction?.name) {
      countyLabel = formatCountyName(jurisdiction.name);
    }

    try {
      await notifyFollowersForJurisdiction(parsed.data.jurisdictionId, {
        type: "new_post",
        title: `New post in ${countyLabel}`,
        url: `/post/${post.id}`,
        body: parsed.data.title,
      });
    } catch (notifyError) {
      console.warn(
        "createPostAction: failed to notify followers",
        notifyError instanceof Error ? notifyError.message : notifyError,
      );
    }
  }

  if (parsed.data.countyFips) {
    revalidatePath(`/county/${parsed.data.countyFips}`);
  }

  return { ok: true };
}

export async function addCommentAction(
  payload: z.infer<typeof commentSchema>,
): Promise<PostActionResult> {
  const parsed = commentSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Comment must be at least 3 characters.",
      fieldErrors: mapFieldErrors(parsed.error),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return { ok: false, error: "Sign in to comment." };
  }

  const { error } = await supabase.from("post_comments").insert({
    post_id: parsed.data.postId,
    author_id: user.id,
    body: parsed.data.body,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/post/${parsed.data.postId}`);

  return { ok: true };
}

export async function togglePostVoteAction(
  payload: z.infer<typeof voteSchema>,
): Promise<PostActionResult> {
  const parsed = voteSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: "Invalid vote." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return { ok: false, error: "Sign in to vote." };
  }

  const { data: existing } = await supabase
    .from("post_votes")
    .select("value")
    .eq("post_id", parsed.data.postId)
    .eq("user_id", user.id)
    .maybeSingle();

  const shouldRemove = existing?.value === parsed.data.value;

  if (shouldRemove) {
    const { error } = await supabase
      .from("post_votes")
      .delete()
      .eq("post_id", parsed.data.postId)
      .eq("user_id", user.id);

    if (error) {
      return { ok: false, error: error.message };
    }
  } else {
    const { error } = await supabase.from("post_votes").upsert(
      {
        post_id: parsed.data.postId,
        user_id: user.id,
        value: parsed.data.value,
      },
      { onConflict: "post_id,user_id" },
    );

    if (error) {
      return { ok: false, error: error.message };
    }
  }

  const { data: votes } = await supabase
    .from("post_votes")
    .select("value")
    .eq("post_id", parsed.data.postId);

  const voteTotal = (votes ?? []).reduce(
    (sum, row) => sum + (row.value ?? 0),
    0,
  );

  revalidatePath(`/post/${parsed.data.postId}`);
  if (parsed.data.countyFips) {
    revalidatePath(`/county/${parsed.data.countyFips}`);
  }

  return {
    ok: true,
    voteTotal,
    userVote: shouldRemove ? 0 : parsed.data.value,
  };
}
