import Link from "next/link";

import ForumThreadList from "@/components/app/forum-thread-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { forumThreads } from "@/lib/mock-data";

export default function ForumsPage() {
  const threads = forumThreads
    .slice()
    .sort(
      (a, b) =>
        new Date(b.lastActivityISO).getTime() -
        new Date(a.lastActivityISO).getTime()
    );

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Forums</h1>
          <p className="text-sm text-muted-foreground">
            Community discussion threads for product ideas and local policy.
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>

      <ForumThreadList threads={threads} />

      <Card>
        <CardHeader>
          <CardTitle>Start a new thread</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Thread creation will be enabled in a later milestone. For now, add
          feedback in existing topics.
        </CardContent>
      </Card>
    </main>
  );
}
