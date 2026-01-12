import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/format";

export type PostCommentItem = {
  id: string;
  body: string;
  createdAt: string;
  authorName: string;
  authorHandle?: string | null;
  authorReputation?: number | null;
};

type CommentListProps = {
  comments: PostCommentItem[];
};

export default function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return <p className="text-sm text-muted-foreground">No comments yet.</p>;
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <Card key={comment.id}>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {comment.authorName}
              </span>
              {typeof comment.authorReputation === "number" ? (
                <Badge variant="outline" className="text-[10px]">
                  Rep {comment.authorReputation}
                </Badge>
              ) : null}
              {comment.authorHandle ? (
                <span>{comment.authorHandle}</span>
              ) : null}
              <span>{formatRelativeTime(comment.createdAt)}</span>
            </div>
            <p className="text-sm text-foreground">{comment.body}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
