// Legacy placeholder route (moved out of app router).
import Link from "next/link";

import AppFooter from "@/components/app/app-footer";
import AppHeaderShell from "@/components/app/app-header-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeaderShell />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">Back</Link>
        </Button>
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Issue {id}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Issue detail is rebuilding.
          </CardContent>
        </Card>
      </main>
      <AppFooter />
    </div>
  );
}
