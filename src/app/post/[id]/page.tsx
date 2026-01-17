import Link from "next/link";

import AppFooter from "@/components/app/app-footer";
import AppHeaderShell from "@/components/app/app-header-shell";
import CommentForm from "@/components/comments/comment-form";
import CommentList, {
  type PostCommentItem,
} from "@/components/comments/comment-list";
import NotifyEntityDialog from "@/components/entities/notify-entity-dialog";
import VoteButtons from "@/components/posts/vote-buttons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatRelativeTime } from "@/lib/format";
import { POST_TYPE_LABELS, normalizePostType } from "@/lib/posts";
import { getReputationMap } from "@/lib/reputation/get-reputation-map";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PostRow = {
  id: string;
  title: string;
  body: string;
  type: string | null;
  created_at: string;
  author_id: string;
  jurisdiction_id: string;
  entity_id: string | null;
  public_entities?: { name: string | null }[] | null;
};

type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
};

export default async function PostDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: { commentsPage?: string } | Promise<{ commentsPage?: string }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const commentsPageParam = resolvedSearchParams?.commentsPage;
  const commentsPage = Math.max(1, Number(commentsPageParam) || 1);
  const commentsPageSize = 25;
  const commentsFrom = (commentsPage - 1) * commentsPageSize;
  const commentsTo = commentsFrom + commentsPageSize - 1;
  const postId = (id ?? "").trim();

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id,title,body,type,created_at,author_id,jurisdiction_id,entity_id,public_entities(name)")
    .eq("id", postId)
    .maybeSingle();

  if (postError || !post) {
    return <PostNotFound />;
  }

  const postRow = post as PostRow;

  const [{ data: author }, { data: jurisdiction }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,username,display_name")
      .eq("id", postRow.author_id)
      .maybeSingle(),
    supabase
      .from("jurisdictions")
      .select("name,external_id")
      .eq("id", postRow.jurisdiction_id)
      .maybeSingle(),
  ]);

  const authorName =
    author?.display_name ?? author?.username ?? "Community member";
  const authorHandle = author?.username ? `@${author.username}` : null;
  const postType = normalizePostType(postRow.type);
  const entityName = postRow.public_entities?.[0]?.name ?? null;

  const { data: voteRows } = await supabase
    .from("post_votes")
    .select("value")
    .eq("post_id", postRow.id);
  const voteTotal = (voteRows ?? []).reduce(
    (sum, row) => sum + (row.value ?? 0),
    0,
  );

  let userVote = 0;
  if (user) {
    const { data: userVoteRow } = await supabase
      .from("post_votes")
      .select("value")
      .eq("post_id", postRow.id)
      .eq("user_id", user.id)
      .maybeSingle();
    userVote = userVoteRow?.value ?? 0;
  }

  const { data: commentRows } = await supabase
    .from("post_comments")
    .select("id,post_id,body,created_at,author_id")
    .eq("post_id", postRow.id)
    .order("created_at", { ascending: true })
    .range(commentsFrom, commentsTo);

  const comments = commentRows ?? [];
  const commentAuthorIds = Array.from(
    new Set(comments.map((comment) => comment.author_id)),
  );
  const { data: commentAuthors } =
    commentAuthorIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id,username,display_name")
          .in("id", commentAuthorIds)
      : { data: [] as ProfileRow[] };

  const commentAuthorMap = new Map(
    (commentAuthors ?? []).map((profile) => [profile.id, profile]),
  );

  const reputationMap = await getReputationMap(supabase, [
    postRow.author_id,
    ...commentAuthorIds,
  ]);
  const authorReputation = reputationMap.get(postRow.author_id)?.score ?? null;

  const commentItems: PostCommentItem[] = comments.map((comment) => {
    const commentAuthor = commentAuthorMap.get(comment.author_id);
    const name =
      commentAuthor?.display_name ??
      commentAuthor?.username ??
      "Community member";
    const handle = commentAuthor?.username
      ? `@${commentAuthor.username}`
      : null;

    return {
      id: comment.id,
      body: comment.body,
      createdAt: comment.created_at,
      authorName: name,
      authorHandle: handle,
      authorReputation: reputationMap.get(comment.author_id)?.score ?? null,
    };
  });

  const countyFips = jurisdiction?.external_id ?? null;
  const hasMoreComments = comments.length === commentsPageSize;
  const nextCommentsHref = hasMoreComments
    ? `/post/${postRow.id}?commentsPage=${commentsPage + 1}`
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeaderShell showFilters={false} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href={countyFips ? `/county/${countyFips}` : "/dashboard"}>
              Back to county
            </Link>
          </Button>
        </div>

        <Card className="mt-4">
          <CardContent className="flex gap-4 pt-6">
            <VoteButtons
              postId={postRow.id}
              countyFips={countyFips ?? undefined}
              initialScore={voteTotal}
              initialUserVote={userVote}
              canVote={Boolean(user)}
            />
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{POST_TYPE_LABELS[postType]}</Badge>
                {postType === "ANNOUNCEMENT" ? (
                  <Badge variant="secondary">Official</Badge>
                ) : null}
                {postRow.entity_id && entityName ? (
                  <>
                    <Badge variant="outline">
                      {countyFips ? (
                        <Link
                          href={`/county/${countyFips}/entities/${postRow.entity_id}`}
                          className="font-medium text-foreground hover:underline"
                        >
                          Tagged: {entityName}
                        </Link>
                      ) : (
                        <span className="font-medium text-foreground">
                          Tagged: {entityName}
                        </span>
                      )}
                    </Badge>
                    <NotifyEntityDialog
                      entity={{ id: postRow.entity_id, name: entityName }}
                      jurisdictionId={postRow.jurisdiction_id}
                      postId={postRow.id}
                      canNotify={Boolean(user)}
                      triggerLabel="Notify"
                      className="h-6 px-2 text-[11px]"
                    />
                  </>
                ) : null}
                <span className="font-medium text-foreground">{authorName}</span>
                {typeof authorReputation === "number" ? (
                  <Badge variant="outline" className="text-[10px]">
                    Rep {authorReputation}
                  </Badge>
                ) : null}
                {authorHandle ? <span>{authorHandle}</span> : null}
                <span>{formatRelativeTime(postRow.created_at)}</span>
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  {postRow.title}
                </h1>
                <p className="mt-3 whitespace-pre-line text-sm text-foreground">
                  {postRow.body}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Comments</h2>
            <span className="text-sm text-muted-foreground">
              Showing {commentItems.length} comments
            </span>
          </div>

          {user ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add a comment</CardTitle>
              </CardHeader>
              <CardContent>
                <CommentForm postId={postRow.id} />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm text-muted-foreground">
                <span>Sign in to join the discussion.</span>
                <Button asChild size="sm">
                  <Link href="/login">Sign in</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <CommentList comments={commentItems} />
          <div className="flex flex-wrap items-center gap-2">
            {commentsPage <= 1 ? (
              <Button variant="outline" disabled>
                Prev
              </Button>
            ) : (
              <Button variant="outline" asChild>
                <Link href={buildCommentsHref(postRow.id, commentsPage - 1)}>
                  Prev
                </Link>
              </Button>
            )}
            {hasMoreComments ? (
              <Button variant="outline" asChild>
                <Link href={nextCommentsHref ?? "#"}>Next</Link>
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

function buildCommentsHref(postId: string, page: number) {
  const params = new URLSearchParams();
  if (page > 1) {
    params.set("commentsPage", String(page));
  }
  const query = params.toString();
  return query ? `/post/${postId}?${query}` : `/post/${postId}`;
}

function PostNotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeaderShell showFilters={false} />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-16">
        <Card>
          <CardHeader>
            <CardTitle>Post not found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>This post may have been removed or the link is incorrect.</p>
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
