import Link from "next/link";
import { redirect } from "next/navigation";

import AppFooter from "@/components/app/app-footer";
import AppHeaderShell from "@/components/app/app-header-shell";
import CountyNav from "@/components/county/county-nav";
import ModerationFilters from "@/components/moderation/moderation-filters";
import ReportCard, { type ModerationReport } from "@/components/moderation/report-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCountyName } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getJurisdictionRole, isAdmin } from "@/lib/authz";
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

export default async function CountyModerationPage({
  params,
  searchParams,
}: {
  params: Promise<{ fips: string }>;
  searchParams?: { status?: string } | Promise<{ status?: string }>;
}) {
  const { fips } = await params;
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const statusParam = (resolvedSearchParams?.status ?? "").toLowerCase();
  const statusFilter = REPORT_STATUS_LABELS[statusParam as ReportStatus]
    ? (statusParam as ReportStatus)
    : null;

  const normalized = (fips ?? "").trim();
  const isValid = /^\d{5}$/.test(normalized);
  if (!isValid) {
    return <CountyNotActive />;
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) {
    redirect(`/login?next=/county/${normalized}/moderation`);
  }

  const { data: jurisdiction } = await supabase
    .from("jurisdictions")
    .select("id,name,external_id")
    .eq("type", "COUNTY")
    .eq("external_id", normalized)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (!jurisdiction) {
    return <CountyNotActive />;
  }

  const admin = await isAdmin(user.id);
  if (!admin) {
    const role = await getJurisdictionRole(user.id, jurisdiction.id);
    if (role !== "founder" && role !== "moderator") {
      redirect(`/county/${normalized}`);
    }
  }

  let reportQuery = supabase
    .from("post_reports")
    .select("id,reason,status,created_at,post_id,comment_id,created_by")
    .order("created_at", { ascending: false })
    .limit(50);

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

  const relevantReports = reports.filter((report) => {
    const post =
      (report.post_id ? postMap.get(report.post_id) : null) ??
      (report.comment_id
        ? postMap.get(commentMap.get(report.comment_id)?.post_id ?? "")
        : null);
    return post?.jurisdiction_id === jurisdiction.id;
  });

  const reporterIds = Array.from(
    new Set(
      relevantReports
        .map((report) => report.created_by)
        .filter(Boolean) as string[],
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

  const reportItems: ModerationReport[] = relevantReports.map((report) => {
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
      jurisdictionName: formatCountyName(jurisdiction.name),
    };
  });

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeaderShell showFilters={false} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Moderation
            </p>
            <h1 className="text-2xl font-semibold text-foreground">
              {formatCountyName(jurisdiction.name)}
            </h1>
            <p className="text-sm text-muted-foreground">
              Review reports for this county.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/county/${jurisdiction.external_id}`}>Back to county</Link>
          </Button>
        </div>

        <CountyNav
          fips={jurisdiction.external_id}
          canModerate
          className="mt-4"
        />

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <ModerationFilters status={statusFilter} />
        </div>

        <div className="mt-6 space-y-4">
          {reportItems.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-sm text-muted-foreground">
                No reports found for this county.
              </CardContent>
            </Card>
          ) : (
            reportItems.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
              />
            ))
          )}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}

function CountyNotActive() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeaderShell showFilters={false} />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-16">
        <Card>
          <CardHeader>
            <CardTitle>County not active yet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              This county has not been activated yet. Activation is managed by
              admins.
            </p>
            <Button asChild>
              <Link href="/">Back to home</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
      <AppFooter />
    </div>
  );
}
