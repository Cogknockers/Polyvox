import ModerationFilters from "@/components/moderation/moderation-filters";
import ReportCard, { type ModerationReport } from "@/components/moderation/report-card";
import { Card, CardContent } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatCountyName } from "@/lib/format";
import {
  REPORT_STATUS_LABELS,
  normalizeReportStatus,
  type ReportStatus,
} from "@/lib/types/moderation";

type ReportRow = {
  id: string;
  reason: string | null;
  status: string | null;
  created_at: string;
  post_id: string | null;
  comment_id: string | null;
  created_by: string | null;
};

type PostRow = {
  id: string;
  title: string;
  body: string;
  jurisdiction_id: string;
};

type CommentRow = {
  id: string;
  body: string;
  post_id: string;
};

type JurisdictionRow = {
  id: string;
  name: string;
};

type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
};

function buildSnippet(value: string, limit = 200) {
  const trimmed = value.trim();
  if (trimmed.length <= limit) return trimmed;
  return `${trimmed.slice(0, limit).trim()}...`;
}

export default async function AdminModerationPage({
  searchParams,
}: {
  searchParams?: { status?: string } | Promise<{ status?: string }>;
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const statusParam = (resolvedSearchParams?.status ?? "").toLowerCase();
  const statusFilter = REPORT_STATUS_LABELS[statusParam as ReportStatus]
    ? (statusParam as ReportStatus)
    : null;

  const supabase = await createSupabaseServerClient();

  let reportQuery = supabase
    .from("post_reports")
    .select("id,reason,status,created_at,post_id,comment_id,created_by")
    .order("created_at", { ascending: false })
    .limit(75);

  if (statusFilter) {
    reportQuery = reportQuery.eq("status", statusFilter);
  }

  const { data: reportRows } = await reportQuery;
  const reports = (reportRows ?? []) as ReportRow[];

  const postIds = reports
    .map((report) => report.post_id)
    .filter(Boolean) as string[];
  const commentIds = reports
    .map((report) => report.comment_id)
    .filter(Boolean) as string[];

  const { data: commentRows } =
    commentIds.length > 0
      ? await supabase
          .from("post_comments")
          .select("id,body,post_id")
          .in("id", commentIds)
      : { data: [] as CommentRow[] };

  const commentMap = new Map(
    (commentRows ?? []).map((comment) => [comment.id, comment]),
  );

  const postIdsFromComments = (commentRows ?? []).map((comment) => comment.post_id);
  const allPostIds = Array.from(new Set([...postIds, ...postIdsFromComments]));

  const { data: postRows } =
    allPostIds.length > 0
      ? await supabase
          .from("posts")
          .select("id,title,body,jurisdiction_id")
          .in("id", allPostIds)
      : { data: [] as PostRow[] };

  const postMap = new Map((postRows ?? []).map((post) => [post.id, post]));

  const jurisdictionIds = Array.from(
    new Set((postRows ?? []).map((post) => post.jurisdiction_id)),
  );
  const { data: jurisdictionRows } =
    jurisdictionIds.length > 0
      ? await supabase
          .from("jurisdictions")
          .select("id,name")
          .in("id", jurisdictionIds)
      : { data: [] as JurisdictionRow[] };

  const jurisdictionMap = new Map(
    (jurisdictionRows ?? []).map((row) => [row.id, row.name]),
  );

  const reporterIds = Array.from(
    new Set(
      reports.map((report) => report.created_by).filter(Boolean) as string[],
    ),
  );
  const { data: reporterRows } =
    reporterIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id,username,display_name")
          .in("id", reporterIds)
      : { data: [] as ProfileRow[] };

  const reporterMap = new Map(
    (reporterRows ?? []).map((profile) => [profile.id, profile]),
  );

  const reportItems: ModerationReport[] = reports.map((report) => {
    const post =
      (report.post_id ? postMap.get(report.post_id) : null) ??
      (report.comment_id
        ? postMap.get(commentMap.get(report.comment_id)?.post_id ?? "")
        : null);
    const comment = report.comment_id
      ? commentMap.get(report.comment_id)
      : null;
    const reporter = report.created_by
      ? reporterMap.get(report.created_by)
      : null;
    const reporterName =
      reporter?.display_name ?? reporter?.username ?? "Anonymous";
    const reporterHandle = reporter?.username ? `@${reporter.username}` : null;

    const contentTitle = comment
      ? `Comment on ${post?.title ?? "Post"}`
      : post?.title ?? "Reported post";
    const contentSnippet = buildSnippet(
      comment?.body ?? post?.body ?? "Content unavailable.",
    );
    const jurisdictionName = post?.jurisdiction_id
      ? formatCountyName(jurisdictionMap.get(post.jurisdiction_id) ?? "")
      : null;

    return {
      id: report.id,
      reason: report.reason,
      status: normalizeReportStatus(report.status),
      createdAt: report.created_at,
      reporterName,
      reporterHandle,
      contentTitle,
      contentSnippet,
      contentType: comment ? "comment" : "post",
      postId: report.post_id,
      commentId: report.comment_id,
      jurisdictionName,
    };
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Admin moderation
        </p>
        <h1 className="text-2xl font-semibold text-foreground">
          Moderation queue
        </h1>
        <p className="text-sm text-muted-foreground">
          Review reports across all counties.
        </p>
      </header>

      <ModerationFilters status={statusFilter} />

      <div className="space-y-4">
        {reportItems.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              No reports found.
            </CardContent>
          </Card>
        ) : (
          reportItems.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))
        )}
      </div>
    </div>
  );
}
