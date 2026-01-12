"use server";

import { z } from "zod";

import { getJurisdictionRole, isAdmin } from "@/lib/authz";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { REPORT_STATUS_OPTIONS, type ReportStatus } from "@/lib/types/moderation";

const statusValues = REPORT_STATUS_OPTIONS.map((option) => option.value);

const statusSchema = z.object({
  reportId: z.string().uuid(),
  status: z.enum(statusValues as [ReportStatus, ...ReportStatus[]]),
});

const removeSchema = z.object({
  reportId: z.string().uuid(),
});

type ModerationActionResult = {
  ok?: boolean;
  error?: string;
};

async function resolveReportContext(reportId: string) {
  const service = createSupabaseServiceClient();
  const { data: report, error } = await service
    .from("post_reports")
    .select("id,post_id,comment_id")
    .eq("id", reportId)
    .maybeSingle();

  if (error || !report) {
    throw new Error(error?.message ?? "Report not found.");
  }

  let jurisdictionId: string | null = null;
  let postId: string | null = report.post_id ?? null;
  let commentId: string | null = report.comment_id ?? null;

  if (commentId) {
    const { data: comment } = await service
      .from("post_comments")
      .select("id,post_id")
      .eq("id", commentId)
      .maybeSingle();
    postId = comment?.post_id ?? postId;
  }

  if (postId) {
    const { data: post } = await service
      .from("posts")
      .select("id,jurisdiction_id")
      .eq("id", postId)
      .maybeSingle();
    jurisdictionId = post?.jurisdiction_id ?? null;
  }

  if (!jurisdictionId) {
    throw new Error("Unable to resolve jurisdiction for this report.");
  }

  return { report, jurisdictionId, postId, commentId };
}

async function assertCanModerate(jurisdictionId: string, userId: string) {
  const admin = await isAdmin(userId);
  if (admin) {
    return;
  }
  const role = await getJurisdictionRole(userId, jurisdictionId);
  if (role !== "founder" && role !== "moderator") {
    throw new Error("You do not have permission to moderate this county.");
  }
}

export async function updateReportStatusAction(
  payload: z.infer<typeof statusSchema>,
): Promise<ModerationActionResult> {
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

  let context;
  try {
    context = await resolveReportContext(parsed.data.reportId);
    await assertCanModerate(context.jurisdictionId, user.id);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unauthorized.",
    };
  }

  const service = createSupabaseServiceClient();
  const { error } = await service
    .from("post_reports")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.reportId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function removeReportedContentAction(
  payload: z.infer<typeof removeSchema>,
): Promise<ModerationActionResult> {
  const parsed = removeSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: "Invalid request." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return { ok: false, error: "Sign in required." };
  }

  let context;
  try {
    context = await resolveReportContext(parsed.data.reportId);
    await assertCanModerate(context.jurisdictionId, user.id);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unauthorized.",
    };
  }

  const service = createSupabaseServiceClient();

  if (context.commentId) {
    const { error } = await service
      .from("post_comments")
      .delete()
      .eq("id", context.commentId);
    if (error) {
      return { ok: false, error: error.message };
    }
  } else if (context.postId) {
    const { error } = await service
      .from("posts")
      .delete()
      .eq("id", context.postId);
    if (error) {
      return { ok: false, error: error.message };
    }
  }

  await service
    .from("post_reports")
    .update({ status: "resolved" })
    .eq("id", parsed.data.reportId);

  return { ok: true };
}
