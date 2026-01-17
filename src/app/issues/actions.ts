"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { getJurisdictionRole, isAdmin } from "@/lib/authz";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notifyFollowersForIssue, notifyFollowersForJurisdiction } from "@/lib/notifications/notify";
import { formatCountyName } from "@/lib/format";
import {
  ISSUE_CATEGORY_OPTIONS,
  ISSUE_STATUS_OPTIONS,
  type IssueCategory,
  type IssueStatus,
} from "@/lib/types/issues";

export type IssueActionResult = {
  ok?: boolean;
  error?: string;
  issueId?: string;
  fieldErrors?: Record<string, string>;
};

const categoryValues = ISSUE_CATEGORY_OPTIONS.map((option) => option.value);
const statusValues = ISSUE_STATUS_OPTIONS.map((option) => option.value);

const createIssueSchema = z.object({
  jurisdictionId: z.string().uuid(),
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().min(10).max(6000),
  category: z.enum(categoryValues as [IssueCategory, ...IssueCategory[]]),
  entityId: z.string().uuid().nullable().optional(),
});

const statusSchema = z.object({
  issueId: z.string().uuid(),
  status: z.enum(statusValues as [IssueStatus, ...IssueStatus[]]),
});

function mapFieldErrors(errors: z.ZodError) {
  return Object.fromEntries(
    Object.entries(errors.flatten().fieldErrors).map(([key, value]) => [
      key,
      value?.[0] ?? "",
    ]),
  );
}

export async function createIssueAction(
  payload: z.infer<typeof createIssueSchema>,
): Promise<IssueActionResult> {
  const parsed = createIssueSchema.safeParse(payload);
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
    return { ok: false, error: "Sign in to create an issue." };
  }

  const { data, error } = await supabase
    .from("issues")
    .insert({
      jurisdiction_id: parsed.data.jurisdictionId,
      created_by: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      status: "reported",
      entity_id: parsed.data.entityId ?? null,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  if (data?.id) {
    revalidatePath(`/issue/${data.id}`);
  }

  if (data?.id) {
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
        type: "new_issue",
        title: `New issue in ${countyLabel}`,
        url: `/issue/${data.id}`,
        body: parsed.data.title,
      });
    } catch (notifyError) {
      console.warn(
        "createIssueAction: failed to notify followers",
        notifyError instanceof Error ? notifyError.message : notifyError,
      );
    }
  }

  return { ok: true, issueId: data?.id ?? undefined };
}

export async function updateIssueStatusAction(
  payload: z.infer<typeof statusSchema>,
): Promise<IssueActionResult> {
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

  const { data: issue, error: issueError } = await supabase
    .from("issues")
    .select("id,created_by,jurisdiction_id,title")
    .eq("id", parsed.data.issueId)
    .maybeSingle();

  if (issueError || !issue) {
    return { ok: false, error: issueError?.message ?? "Issue not found." };
  }

  const isCreator = issue.created_by === user.id;
  let canEdit = isCreator;

  if (!canEdit) {
    try {
      const admin = await isAdmin(user.id);
      if (admin) {
        canEdit = true;
      } else {
        const role = await getJurisdictionRole(
          user.id,
          issue.jurisdiction_id,
        );
        canEdit = role === "founder" || role === "moderator";
      }
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unauthorized.",
      };
    }
  }

  if (!canEdit) {
    return { ok: false, error: "You do not have permission to edit status." };
  }

  const { error } = await supabase
    .from("issues")
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.issueId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/issue/${parsed.data.issueId}`);

  try {
    await notifyFollowersForIssue(parsed.data.issueId, {
      type: "issue_status",
      title: "Issue status updated",
      url: `/issue/${parsed.data.issueId}`,
      body: issue?.title ?? null,
    });
  } catch (notifyError) {
    console.warn(
      "updateIssueStatusAction: failed to notify followers",
      notifyError instanceof Error ? notifyError.message : notifyError,
    );
  }

  return { ok: true };
}
