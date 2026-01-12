import Link from "next/link";

import ForumThreadView from "@/components/app/forum-thread-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getRepliesByThreadId, getThreadById } from "@/lib/mock-data";

export default async function ForumThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const thread = getThreadById(threadId);

  if (!thread) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
        <Card>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              This thread could not be found in the demo data.
            </p>
            <Button asChild variant="outline">
              <Link href="/forums">Back to forums</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const replies = getRepliesByThreadId(threadId);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link href="/forums">Back to forums</Link>
      </Button>
      <ForumThreadView thread={thread} initialReplies={replies} />
    </main>
  );
}
