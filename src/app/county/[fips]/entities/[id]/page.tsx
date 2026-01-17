import Link from "next/link";

import AppFooter from "@/components/app/app-footer";
import AppHeaderShell from "@/components/app/app-header-shell";
import CountyNav from "@/components/county/county-nav";
import EntityHeader from "@/components/entities/entity-header";
import FollowButton from "@/components/follows/follow-button";
import IssueCard, { type IssueCardItem } from "@/components/issues/issue-card";
import IssueFilters from "@/components/issues/issue-filters";
import PostCard, { type PostCardItem } from "@/components/posts/post-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCountyName } from "@/lib/format";
import { normalizePostType } from "@/lib/posts";
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
  created_at: string;
  created_by: string;
};

type PostRow = {
  id: string;
  title: string;
  body: string;
  type: string | null;
  created_at: string;
  author_id: string;
};

type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
};

type EntityRow = {
  id: string;
  name: string;
  type: "official" | "department";
  title: string | null;
  contact_email: string | null;
  website_url: string | null;
};

type StatsRow = {
  entity_id: string;
  total_issues_count: number | null;
  recent_posts_count: number | null;
};

export default async function EntityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ fips: string; id: string }>;
  searchParams?:
    | { status?: string; category?: string }
    | Promise<{ status?: string; category?: string }>;
}) {
  const { fips, id } = await params;
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const statusParam = (resolvedSearchParams?.status ?? "").toLowerCase();
  const categoryParam = (resolvedSearchParams?.category ?? "").toLowerCase();

  const statusFilter = ISSUE_STATUS_LABELS[statusParam as IssueStatus]
    ? (statusParam as IssueStatus)
    : null;
  const categoryFilter = ISSUE_CATEGORY_LABELS[categoryParam as IssueCategory]
    ? (categoryParam as IssueCategory)
    : null;

  const normalizedFips = (fips ?? "").trim();
  const isValidFips = /^\d{5}$/.test(normalizedFips);
  if (!isValidFips) {
    return <CountyNotActive />;
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  const { data: jurisdiction } = await supabase
    .from("jurisdictions")
    .select("id,name,external_id")
    .eq("type", "COUNTY")
    .eq("external_id", normalizedFips)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (!jurisdiction) {
    return <CountyNotActive />;
  }

  const { data: entity } = await supabase
    .from("public_entities")
    .select("id,name,type,title,contact_email,website_url")
    .eq("id", id)
    .eq("jurisdiction_id", jurisdiction.id)
    .maybeSingle();

  if (!entity) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <AppHeaderShell showFilters={false} />
        <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16">
          <Card>
            <CardHeader>
              <CardTitle>Entity not found</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>This entity does not exist or has been removed.</p>
              <Button asChild>
                <Link href={`/county/${normalizedFips}/entities`}>
                  Back to entities
                </Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <AppFooter />
      </div>
    );
  }

  let stats: StatsRow | null = null;
  try {
    const { data: statsRow } = await supabase
      .from("entity_stats_v1")
      .select("entity_id,total_issues_count,recent_posts_count")
      .eq("entity_id", entity.id)
      .maybeSingle();
    stats = statsRow as StatsRow | null;
  } catch {
    stats = null;
  }

  let issuesQuery = supabase
    .from("issues")
    .select("id,title,status,category,created_at,created_by")
    .eq("entity_id", entity.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (statusFilter && ISSUE_STATUS_LABELS[statusFilter]) {
    issuesQuery = issuesQuery.eq("status", statusFilter);
  }

  if (categoryFilter && ISSUE_CATEGORY_LABELS[categoryFilter]) {
    issuesQuery = issuesQuery.eq("category", categoryFilter);
  }

  const { data: issueRows } = await issuesQuery;
  const issues = (issueRows ?? []) as IssueRow[];
  const issueCreatorIds = Array.from(
    new Set(issues.map((issue) => issue.created_by)),
  );

  const { data: issueCreators } =
    issueCreatorIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id,username,display_name")
          .in("id", issueCreatorIds)
      : { data: [] as ProfileRow[] };

  const issueCreatorMap = new Map(
    (issueCreators ?? []).map((profile) => [profile.id, profile]),
  );
  const issueReputationMap = await getReputationMap(
    supabase,
    issueCreatorIds,
  );

  const issueItems: IssueCardItem[] = issues.map((issue) => {
    const creator = issueCreatorMap.get(issue.created_by);
    const authorName =
      creator?.display_name ?? creator?.username ?? "Community member";
    const authorHandle = creator?.username ? `@${creator.username}` : null;
    const authorReputation =
      issueReputationMap.get(issue.created_by)?.score ?? null;

    return {
      id: issue.id,
      title: issue.title,
      status: issue.status,
      category: issue.category,
      entityName: entity.name,
      createdAt: issue.created_at,
      authorName,
      authorHandle,
      authorReputation,
    };
  });

  const { data: postRows } = await supabase
    .from("posts")
    .select("id,title,body,type,created_at,author_id")
    .eq("entity_id", entity.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const posts = (postRows ?? []) as PostRow[];
  const postIds = posts.map((post) => post.id);
  const postAuthorIds = Array.from(
    new Set(posts.map((post) => post.author_id)),
  );

  const { data: postAuthors } =
    postAuthorIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id,username,display_name")
          .in("id", postAuthorIds)
      : { data: [] as ProfileRow[] };

  const postAuthorMap = new Map(
    (postAuthors ?? []).map((profile) => [profile.id, profile]),
  );
  const reputationMap = await getReputationMap(supabase, postAuthorIds);

  const voteTotals = new Map<string, number>();
  if (postIds.length > 0) {
    const { data: voteRows } = await supabase
      .from("post_votes")
      .select("post_id,value")
      .in("post_id", postIds);
    (voteRows ?? []).forEach((row) => {
      const current = voteTotals.get(row.post_id) ?? 0;
      voteTotals.set(row.post_id, current + (row.value ?? 0));
    });
  }

  const commentCounts = new Map<string, number>();
  if (postIds.length > 0) {
    const { data: commentRows } = await supabase
      .from("post_comments")
      .select("post_id")
      .in("post_id", postIds);
    (commentRows ?? []).forEach((row) => {
      const current = commentCounts.get(row.post_id) ?? 0;
      commentCounts.set(row.post_id, current + 1);
    });
  }

  const userVotes = new Map<string, number>();
  if (user && postIds.length > 0) {
    const { data: userVoteRows } = await supabase
      .from("post_votes")
      .select("post_id,value")
      .eq("user_id", user.id)
      .in("post_id", postIds);
    (userVoteRows ?? []).forEach((row) => {
      userVotes.set(row.post_id, row.value ?? 0);
    });
  }

  const postItems: PostCardItem[] = posts.map((post) => {
    const author = postAuthorMap.get(post.author_id);
    const authorName =
      author?.display_name ?? author?.username ?? "Community member";
    const authorHandle = author?.username ? `@${author.username}` : null;
    const postType = normalizePostType(post.type);
    const authorReputation = reputationMap.get(post.author_id)?.score ?? null;

    return {
      id: post.id,
      title: post.title,
      body: post.body,
      type: postType,
      createdAt: post.created_at,
      authorName,
      authorHandle,
      authorReputation,
      voteTotal: voteTotals.get(post.id) ?? 0,
      commentCount: commentCounts.get(post.id) ?? 0,
      userVote: userVotes.get(post.id) ?? 0,
      isOfficial: postType === "ANNOUNCEMENT",
    };
  });

  let isAdminUser = false;
  let canModerate = false;
  if (user) {
    try {
      isAdminUser = await isAdmin(user.id);
    } catch {
      isAdminUser = false;
    }

    if (isAdminUser) {
      canModerate = true;
    } else {
      try {
        const { data: hasRole } = await supabase.rpc(
          "has_jurisdiction_role",
          {
            jurisdiction_id: jurisdiction.id,
            roles: ["founder", "moderator"],
          },
        );
        canModerate = Boolean(hasRole);
      } catch {
        canModerate = false;
      }
    }
  }

  let isFollowing = false;
  if (user) {
    const { data: followRow } = await supabase
      .from("follows")
      .select("id")
      .eq("user_id", user.id)
      .eq("target_type", "entity")
      .eq("target_id", entity.id)
      .maybeSingle();
    isFollowing = Boolean(followRow);
  }

  const statsIssues = stats?.total_issues_count ?? issueItems.length;
  const statsPosts = stats?.recent_posts_count ?? postItems.length;
  const entityHref = `/county/${jurisdiction.external_id}/entities/${entity.id}`;

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
              {formatCountyName(jurisdiction.name)} entities
            </h1>
            <p className="text-sm text-muted-foreground">
              Entity detail view
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/county/${jurisdiction.external_id}/entities`}>
              Back to entities
            </Link>
          </Button>
        </div>

        <CountyNav
          fips={jurisdiction.external_id}
          canModerate={canModerate}
          className="mt-4"
        />

        <div className="mt-6 space-y-6">
          <EntityHeader
            entity={{
              id: entity.id,
              name: entity.name,
              type: entity.type,
              title: entity.title,
              contactEmail: entity.contact_email,
              websiteUrl: entity.website_url,
            }}
            countyFips={jurisdiction.external_id}
            jurisdictionId={jurisdiction.id}
            canNotify={Boolean(user)}
            canRunDigest={isAdminUser}
            followButton={
              <FollowButton
                targetType="entity"
                targetId={entity.id}
                isFollowing={isFollowing}
                isAuthenticated={Boolean(user)}
                size="sm"
              />
            }
          />

          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <Tabs defaultValue="issues">
                <TabsList>
                  <TabsTrigger value="issues">Issues</TabsTrigger>
                  <TabsTrigger value="posts">Posts</TabsTrigger>
                </TabsList>

                <TabsContent value="issues" className="mt-4 space-y-4">
                  <IssueFilters
                    status={statusFilter}
                    category={categoryFilter}
                    entityId={null}
                    entities={[]}
                    showEntity={false}
                  />
                  {issueItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No issues tagged to this entity yet.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {issueItems.map((issue) => (
                        <IssueCard key={issue.id} issue={issue} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="posts" className="mt-4 space-y-4">
                  {postItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No posts tagged to this entity yet.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {postItems.map((post) => (
                        <PostCard
                          key={post.id}
                          post={post}
                          canVote={Boolean(user)}
                          countyFips={jurisdiction.external_id}
                          taggedEntity={{
                            name: entity.name,
                            href: entityHref,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            <aside className="space-y-6 lg:col-span-4">
              <Card>
                <CardHeader>
                  <CardTitle>Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Total issues tagged</span>
                    <span className="font-semibold text-foreground">
                      {statsIssues}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Recent posts (30d)</span>
                    <span className="font-semibold text-foreground">
                      {statsPosts}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    Public entities are listed to make it easier to organize
                    issues and conversations around real departments and
                    officials.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{entity.name}</Badge>
                    <Badge variant="outline">
                      {formatCountyName(jurisdiction.name)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
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
