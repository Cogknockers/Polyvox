import Link from "next/link";

import AppHeaderShell from "@/components/app/app-header-shell";
import FollowButton from "@/components/follows/follow-button";
import NotifyEntityDialog from "@/components/entities/notify-entity-dialog";
import CreatePostDialog from "@/components/posts/create-post-dialog";
import PostCard, { type PostCardItem } from "@/components/posts/post-card";
import StatusEditor from "@/components/issues/status-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/format";
import { normalizePostType } from "@/lib/posts";
import { getReputationMap } from "@/lib/reputation/get-reputation-map";
import { ISSUE_CATEGORY_LABELS, ISSUE_STATUS_LABELS, type IssueCategory, type IssueStatus } from "@/lib/types/issues";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getJurisdictionRole, isAdmin } from "@/lib/authz";

type IssueRow = {
  id: string;
  title: string;
  description: string;
  status: IssueStatus;
  category: IssueCategory;
  entity_id: string | null;
  created_at: string;
  created_by: string;
  jurisdiction_id: string;
};

type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
};

type EntityRow = {
  id: string;
  name: string;
  type: string;
  title: string | null;
};

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

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ issueId: string }>;
}) {
  const { issueId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  const { data: issueData, error } = await supabase
    .from("issues")
    .select(
      "id,title,description,status,category,entity_id,created_at,created_by,jurisdiction_id",
    )
    .eq("id", issueId)
    .maybeSingle();

  if (error || !issueData) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
        <Card>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              This issue could not be found.
            </p>
            <Button asChild variant="outline">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const issue = issueData as IssueRow;

  const [
    { data: creator },
    { data: entity },
    { data: jurisdiction },
    { data: entityRows },
  ] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id,username,display_name")
        .eq("id", issue.created_by)
        .maybeSingle(),
      issue.entity_id
        ? supabase
            .from("public_entities")
            .select("id,name,type,title")
            .eq("id", issue.entity_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("jurisdictions")
        .select("name,external_id")
        .eq("id", issue.jurisdiction_id)
        .maybeSingle(),
      supabase
        .from("public_entities")
        .select("id,name")
        .eq("jurisdiction_id", issue.jurisdiction_id)
        .order("name"),
    ]);

  const creatorName =
    creator?.display_name ?? creator?.username ?? "Community member";
  const creatorHandle = creator?.username ? `@${creator.username}` : null;
  const entityRecord = (entity as EntityRow | null) ?? null;
  let isFollowing = false;
  if (user) {
    const { data: followRow } = await supabase
      .from("follows")
      .select("id")
      .eq("user_id", user.id)
      .eq("target_type", "issue")
      .eq("target_id", issue.id)
      .maybeSingle();
    isFollowing = Boolean(followRow);
  }

  let canEditStatus = false;
  if (user) {
    if (user.id === issue.created_by) {
      canEditStatus = true;
    } else {
      try {
        const admin = await isAdmin(user.id);
        if (admin) {
          canEditStatus = true;
        } else {
          const role = await getJurisdictionRole(user.id, issue.jurisdiction_id);
          canEditStatus = role === "founder" || role === "moderator";
        }
      } catch {
        canEditStatus = false;
      }
    }
  }

  const { data: relatedPosts } = await supabase
    .from("posts")
    .select("id,title,body,type,created_at,author_id,entity_id,public_entities(name)")
    .eq("issue_id", issue.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const postRows = (relatedPosts ?? []) as PostRow[];
  const postIds = postRows.map((post) => post.id);
  const authorIds = Array.from(new Set(postRows.map((post) => post.author_id)));

  const { data: postAuthors } =
    authorIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id,username,display_name")
          .in("id", authorIds)
      : { data: [] as ProfileRow[] };

  const authorMap = new Map(
    (postAuthors ?? []).map((profile) => [profile.id, profile]),
  );
  const reputationMap = await getReputationMap(supabase, [
    issue.created_by,
    ...authorIds,
  ]);
  const creatorReputation = reputationMap.get(issue.created_by)?.score ?? null;

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

  const postItems: PostCardItem[] = postRows.map((post) => {
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
      entityId: post.entity_id,
      entityName: post.public_entities?.[0]?.name ?? null,
    };
  });

  const countyFips = jurisdiction?.external_id ?? "";

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeaderShell showFilters={false} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href={countyFips ? `/county/${countyFips}/issues` : "/dashboard"}>
              Back to issues
            </Link>
          </Button>
          <FollowButton
            targetType="issue"
            targetId={issue.id}
            isFollowing={isFollowing}
            isAuthenticated={Boolean(user)}
            size="sm"
          />
        </div>

        <div className="mt-4 space-y-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{ISSUE_STATUS_LABELS[issue.status]}</Badge>
              <Badge variant="secondary">
                {ISSUE_CATEGORY_LABELS[issue.category]}
              </Badge>
            </div>
            <h1 className="text-3xl font-semibold text-foreground">
              {issue.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{creatorName}</span>
              {typeof creatorReputation === "number" ? (
                <Badge variant="outline" className="text-[10px]">
                  Rep {creatorReputation}
                </Badge>
              ) : null}
              {creatorHandle ? <span>{creatorHandle}</span> : null}
              <span>{formatRelativeTime(issue.created_at)}</span>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p className="whitespace-pre-line text-foreground">
                {issue.description}
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle>Tagged entity</CardTitle>
              </div>
              {entityRecord ? (
                <NotifyEntityDialog
                  entity={{ id: entityRecord.id, name: entityRecord.name }}
                  jurisdictionId={issue.jurisdiction_id}
                  issueId={issue.id}
                  canNotify={Boolean(user)}
                />
              ) : null}
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {entityRecord ? (
                <>
                  <p className="text-base font-semibold text-foreground">
                    {entityRecord.name}
                  </p>
                  {entityRecord.title ? <p>{entityRecord.title}</p> : null}
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {entityRecord.type}
                  </p>
                </>
              ) : (
                <p>No entity tagged.</p>
              )}
            </CardContent>
          </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Related discussion</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                      Latest posts tied to this issue.
                    </p>
                    <CreatePostDialog
                      jurisdictionId={issue.jurisdiction_id}
                      countyFips={countyFips}
                      canPost={Boolean(user)}
                      initialTitle={`Discussion: ${issue.title}`}
                      initialType="DISCUSSION"
                      issueId={issue.id}
                      entities={entityRows ?? []}
                      triggerLabel="Start discussion"
                    />
                  </div>
                  {postItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No discussions yet. Start the first one.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {postItems.map((post) => (
                        <PostCard
                          key={post.id}
                          post={post}
                          canVote={Boolean(user)}
                          countyFips={countyFips}
                          taggedEntity={
                            post.entityId && post.entityName
                              ? {
                                  name: post.entityName,
                                  href: `/county/${countyFips}/entities/${post.entityId}`,
                                }
                              : undefined
                          }
                          notifyEntity={
                            post.entityId && post.entityName
                              ? {
                                  id: post.entityId,
                                  name: post.entityName,
                                  jurisdictionId: issue.jurisdiction_id,
                                  postId: post.id,
                                  canNotify: Boolean(user),
                                }
                              : undefined
                          }
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <aside className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    {canEditStatus
                      ? "Update the status to reflect current progress."
                      : "Status updates are managed by the creator or moderators."}
                  </p>
                  <StatusEditor
                    issueId={issue.id}
                    status={issue.status}
                    canEdit={canEditStatus}
                  />
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
