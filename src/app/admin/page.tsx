import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminHomePage() {
  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Admin Console</h1>
        <p className="text-sm text-muted-foreground">
          Manage jurisdiction activation, roles, and platform configuration.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Jurisdiction activation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Activate counties, assign founders, and manage jurisdiction roles.
          </p>
          <Button asChild>
            <Link href="/admin/jurisdictions">Open Jurisdictions</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entity digests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Review recent digest deliveries and delivery failures.
          </p>
          <Button asChild>
            <Link href="/admin/digests">Open Digests</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
