import Link from "next/link";

import AppFooter from "@/components/app/app-footer";
import AppHeaderShell from "@/components/app/app-header-shell";
import CountyNav from "@/components/county/county-nav";
import FollowButton from "@/components/follows/follow-button";
import CountyFeed from "@/components/posts/county-feed";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCountyName } from "@/lib/format";
import { normalizePostType } from "@/lib/posts";
import { getReputationMap } from "@/lib/reputation/get-reputation-map";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/authz";

type PostRow = {
  id: string;
  title: string;
  body: string;
  type: string | null;
  created_at: string;
  author_id: string;
  entity_id: string | null;
  public_entities?: { name: string | null }[] | null;
};

type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
};

type EntityOption = {
  id: string;
  name: string;
};

export default async function CountyPage({
  params,
  searchParams,
}: {
  params: Promise<{ fips: string }>;
  searchParams?:
    | { page?: string; type?: string }
    | Promise<{ page?: string; type?: string }>;
}) {
  const { fips } = await params;
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const pageParam = resolvedSearchParams?.page;
  const currentPage = Math.max(1, Number(pageParam) || 1);
  const pageSize = 20;
  const rangeFrom = (currentPage - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize - 1;
  const typeParam = (resolvedSearchParams?.type ?? "").toLowerCase();
  const typeFilter =
    typeParam === "discussion" ||
    typeParam === "question" ||
    typeParam === "announcement"
      ? typeParam
      : null;
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

  let postsQuery = supabase
    .from("posts")
    .select("id,title,body,type,created_at,author_id,entity_id,public_entities(name)")
    .eq("jurisdiction_id", jurisdiction.id)
    .order("created_at", { ascending: false })
    .range(rangeFrom, rangeTo);

  if (typeFilter) {
    postsQuery = postsQuery.eq("type", typeFilter.toUpperCase());
  }

  const { data: posts, error: postsError } = await postsQuery;

  if (postsError) {
    return (
      <CountyError message={`Failed to load posts: ${postsError.message}`} />
    );
  }

  const postRows = (posts ?? []) as PostRow[];
  const postIds = postRows.map((post) => post.id);
  const authorIds = Array.from(new Set(postRows.map((post) => post.author_id)));

  const { data: authors } =
    authorIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id,username,display_name")
          .in("id", authorIds)
      : { data: [] as ProfileRow[] };

  const authorMap = new Map(
    (authors ?? []).map((author) => [author.id, author]),
  );
  const reputationMap = await getReputationMap(supabase, authorIds);

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

  const postItems = postRows.map((post, index) => {
    const author = authorMap.get(post.author_id);
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
      isPinned: currentPage === 1 && index === 0,
      entityId: post.entity_id,
      entityName: post.public_entities?.[0]?.name ?? null,
    };
  });

  const hasNextPage = postRows.length === pageSize;

  const { data: entityRows } = await supabase
    .from("public_entities")
    .select("id,name")
    .eq("jurisdiction_id", jurisdiction.id)
    .order("name");

  const entities = (entityRows ?? []) as EntityOption[];

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

  let isFollowing = false;
  if (user) {
    const { data: followRow } = await supabase
      .from("follows")
      .select("id")
      .eq("user_id", user.id)
      .eq("target_type", "jurisdiction")
      .eq("target_id", jurisdiction.id)
      .maybeSingle();
    isFollowing = Boolean(followRow);
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
              {formatCountyName(jurisdiction.name)}
            </h1>
            <p className="text-sm text-muted-foreground">
              FIPS: {jurisdiction.external_id}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FollowButton
              targetType="jurisdiction"
              targetId={jurisdiction.id}
              isFollowing={isFollowing}
              isAuthenticated={Boolean(user)}
              size="sm"
            />
            <Button asChild variant="outline">
              <Link href={`/dashboard?fips=${jurisdiction.external_id}`}>
                View on map
              </Link>
            </Button>
          </div>
        </div>

        <CountyNav
          fips={jurisdiction.external_id}
          canModerate={canModerate}
          className="mt-4"
          actions={
            <FollowButton
              targetType="jurisdiction"
              targetId={jurisdiction.id}
              isFollowing={isFollowing}
              isAuthenticated={Boolean(user)}
              size="sm"
            />
          }
        />

        <div className="mt-6">
          <CountyFeed
            posts={postItems}
            jurisdictionId={jurisdiction.id}
            countyFips={jurisdiction.external_id}
            canPost={Boolean(user)}
            entities={entities}
            currentPage={currentPage}
            hasNextPage={hasNextPage}
            typeFilter={typeFilter}
          />
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

function CountyError({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeaderShell showFilters={false} />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-16">
        <Card>
          <CardHeader>
            <CardTitle>Unable to load county</CardTitle>
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
