import Link from "next/link";

import VoteButtons from "@/components/posts/vote-buttons";
import NotifyEntityDialog from "@/components/entities/notify-entity-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatCompactNumber, formatRelativeTime } from "@/lib/format";
import { POST_TYPE_LABELS, type PostType } from "@/lib/posts";

export type PostCardItem = {
  id: string;
  title: string;
  body: string;
  type: PostType;
  createdAt: string;
  authorName: string;
  authorHandle?: string | null;
  authorReputation?: number | null;
  voteTotal: number;
  commentCount: number;
  userVote?: number;
  isPinned?: boolean;
  isOfficial?: boolean;
  entityId?: string | null;
  entityName?: string | null;
};

type PostCardProps = {
  post: PostCardItem;
  canVote?: boolean;
  countyFips?: string;
  taggedEntity?: { name: string; href: string };
  notifyEntity?: {
    id: string;
    name: string;
    jurisdictionId: string;
    postId?: string;
    canNotify: boolean;
  };
};

function buildExcerpt(body: string, limit = 180) {
  const trimmed = body.trim();
  if (trimmed.length <= limit) return trimmed;
  return `${trimmed.slice(0, limit).trim()}...`;
}

export default function PostCard({
  post,
  canVote = false,
  countyFips,
  taggedEntity,
  notifyEntity,
}: PostCardProps) {
  return (
    <Card className="relative">
      <Link
        href={`/post/${post.id}`}
        className="absolute inset-0 z-0"
        aria-label={`Open post ${post.title}`}
      />
      <CardContent className="relative z-10 flex gap-4 pt-6">
        <VoteButtons
          postId={post.id}
          countyFips={countyFips}
          initialScore={post.voteTotal}
          initialUserVote={post.userVote ?? 0}
          canVote={canVote}
        />
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">{POST_TYPE_LABELS[post.type]}</Badge>
            {post.isOfficial ? (
              <Badge variant="secondary">Official</Badge>
            ) : null}
            {post.isPinned ? <Badge variant="secondary">Pinned</Badge> : null}
            {taggedEntity ? (
              <Badge variant="outline" className="flex items-center gap-1">
                Tagged:
                <Link
                  href={taggedEntity.href}
                  className="font-medium text-foreground hover:underline"
                  onClick={(event) => event.stopPropagation()}
                >
                  {taggedEntity.name}
                </Link>
              </Badge>
            ) : null}
            {notifyEntity ? (
              <span
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <NotifyEntityDialog
                  entity={{ id: notifyEntity.id, name: notifyEntity.name }}
                  jurisdictionId={notifyEntity.jurisdictionId}
                  postId={notifyEntity.postId}
                  canNotify={notifyEntity.canNotify}
                  triggerLabel="Notify"
                  className="h-6 px-2 text-[11px]"
                />
              </span>
            ) : null}
            <span className="font-medium text-foreground">
              {post.authorName}
            </span>
            {typeof post.authorReputation === "number" ? (
              <Badge variant="outline" className="text-[10px]">
                Rep {post.authorReputation}
              </Badge>
            ) : null}
            {post.authorHandle ? (
              <span className="text-muted-foreground">{post.authorHandle}</span>
            ) : null}
            <span>{formatRelativeTime(post.createdAt)}</span>
          </div>

          <div className="space-y-1">
            <CardHeader className="p-0">
              <span className="text-lg font-semibold text-foreground">
                {post.title}
              </span>
            </CardHeader>
            <p className="text-sm text-muted-foreground">
              {buildExcerpt(post.body)}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{formatCompactNumber(post.commentCount)} comments</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
