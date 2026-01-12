import Link from "next/link";

import AppFooter from "@/components/app/app-footer";
import AppHeaderShell from "@/components/app/app-header-shell";
import CountyNav from "@/components/county/county-nav";
import CreateIssueDialog from "@/components/issues/create-issue-dialog";
import IssueCard, { type IssueCardItem } from "@/components/issues/issue-card";
import IssueFilters from "@/components/issues/issue-filters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCountyName } from "@/lib/format";
import { getReputationMap } from "@/lib/reputation/get-reputation-map";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/authz";
import {
  ISSUE_CATEGORY_LABELS,
  ISSUE_STATUS_LABELS,
  type IssueCategory,
  type IssueStatus,
} from "@/lib/types/issues";

type IssueRow = {
  id: string;
  title: string;
  status: IssueStatus;
  category: IssueCategory;
  entity_id: string | null;
  created_at: string;
  created_by: string;
};

type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
};

type EntityRow = {
  id: string;
  name: string;
};

export default async function CountyIssuesPage({
  params,
  searchParams,
}: {
  params: Promise<{ fips: string }>;
  searchParams?:
    | { page?: string; status?: string; category?: string; entity?: string }
    | Promise<{
        page?: string;
        status?: string;
        category?: string;
        entity?: string;
      }>;
}) {
  const { fips } = await params;
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const pageParam = resolvedSearchParams?.page;
  const currentPage = Math.max(1, Number(pageParam) || 1);
  const pageSize = 20;
  const rangeFrom = (currentPage - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize - 1;

  const statusParam = (resolvedSearchParams?.status ?? "").toLowerCase();
  const categoryParam = (resolvedSearchParams?.category ?? "").toLowerCase();
  const entityParam = (resolvedSearchParams?.entity ?? "").trim();

  const statusFilter = ISSUE_STATUS_LABELS[statusParam as IssueStatus]
    ? (statusParam as IssueStatus)
    : null;
  const categoryFilter = ISSUE_CATEGORY_LABELS[categoryParam as IssueCategory]
    ? (categoryParam as IssueCategory)
    : null;
  const entityFilter = entityParam && entityParam !== "all" ? entityParam : null;

  const normalized = (fips ?? "").trim();
  const isValid = /^\d{5}$/.test(normalized);
  if (!isValid) {
    return <CountyNotActive />;
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

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

  const { data: entityRows } = await supabase
    .from("public_entities")
    .select("id,name")
    .eq("jurisdiction_id", jurisdiction.id)
    .order("name");

  const entities = (entityRows ?? []) as EntityRow[];
  const entityMap = new Map(entities.map((entity) => [entity.id, entity.name]));

  let issuesQuery = supabase
    .from("issues")
    .select("id,title,status,category,entity_id,created_at,created_by")
    .eq("jurisdiction_id", jurisdiction.id)
    .order("created_at", { ascending: false })
    .range(rangeFrom, rangeTo);

  if (statusFilter && ISSUE_STATUS_LABELS[statusFilter]) {
    issuesQuery = issuesQuery.eq("status", statusFilter);
  }

  if (categoryFilter && ISSUE_CATEGORY_LABELS[categoryFilter]) {
    issuesQuery = issuesQuery.eq("category", categoryFilter);
  }

  if (entityFilter) {
    issuesQuery = issuesQuery.eq("entity_id", entityFilter);
  }

  const { data: issuesRows, error } = await issuesQuery;
  if (error) {
    return <CountyError message={`Failed to load issues: ${error.message}`} />;
  }

  const issues = (issuesRows ?? []) as IssueRow[];
  const creatorIds = Array.from(new Set(issues.map((issue) => issue.created_by)));

  const { data: creatorRows } =
    creatorIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id,username,display_name")
          .in("id", creatorIds)
      : { data: [] as ProfileRow[] };

  const creatorMap = new Map(
    (creatorRows ?? []).map((profile) => [profile.id, profile]),
  );
  const reputationMap = await getReputationMap(supabase, creatorIds);

  const issueItems: IssueCardItem[] = issues.map((issue) => {
    const creator = creatorMap.get(issue.created_by);
    const authorName =
      creator?.display_name ?? creator?.username ?? "Community member";
    const authorHandle = creator?.username ? `@${creator.username}` : null;
    const authorReputation = reputationMap.get(issue.created_by)?.score ?? null;

    return {
      id: issue.id,
      title: issue.title,
      status: issue.status,
      category: issue.category,
      entityName: issue.entity_id ? entityMap.get(issue.entity_id) : null,
      createdAt: issue.created_at,
      authorName,
      authorHandle,
      authorReputation,
    };
  });

  const hasNextPage = issues.length === pageSize;
  let canModerate = false;
  if (user) {
    try {
      const admin = await isAdmin(user.id);
      if (admin) {
        canModerate = true;
      } else {
        const { data: hasRole } = await supabase.rpc(
          "has_jurisdiction_role",
          {
            jurisdiction_id: jurisdiction.id,
            roles: ["founder", "moderator"],
          },
        );
        canModerate = Boolean(hasRole);
      }
    } catch {
      canModerate = false;
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeaderShell showFilters={false} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              County community
            </p>
            <h1 className="text-2xl font-semibold text-foreground">
              {formatCountyName(jurisdiction.name)} issues
            </h1>
            <p className="text-sm text-muted-foreground">
              Track and tag community issues for this county.
            </p>
          </div>
          <CreateIssueDialog
            jurisdictionId={jurisdiction.id}
            canCreate={Boolean(user)}
            entities={entities}
          />
        </div>

        <CountyNav
          fips={jurisdiction.external_id}
          canModerate={canModerate}
          className="mt-4"
        />

        <div className="mt-6 space-y-6">
          <IssueFilters
            status={statusFilter}
            category={categoryFilter}
            entityId={entityFilter}
            entities={entities}
          />

          {issueItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No issues yet. Be the first to report one.
            </p>
          ) : (
            <div className="space-y-4">
              {issueItems.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {currentPage <= 1 ? (
              <Button variant="outline" disabled>
                Prev
              </Button>
            ) : (
              <Button variant="outline" asChild>
                <Link href={buildPageHref(resolvedSearchParams, currentPage - 1)}>
                  Prev
                </Link>
              </Button>
            )}
            {hasNextPage ? (
              <Button variant="outline" asChild>
                <Link href={buildPageHref(resolvedSearchParams, currentPage + 1)}>
                  Next
                </Link>
              </Button>
            ) : (
              <Button variant="outline" disabled>
                Next
              </Button>
            )}
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}

function buildPageHref(
  searchParams:
    | { page?: string; status?: string; category?: string; entity?: string }
    | undefined,
  page: number,
) {
  const params = new URLSearchParams();
  if (searchParams?.status) params.set("status", searchParams.status);
  if (searchParams?.category) params.set("category", searchParams.category);
  if (searchParams?.entity) params.set("entity", searchParams.entity);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `?${query}` : "";
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

function CountyError({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeaderShell showFilters={false} />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-16">
        <Card>
          <CardHeader>
            <CardTitle>Unable to load issues</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>{message}</p>
            <Button asChild>
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
      <AppFooter />
    </div>
  );
}
