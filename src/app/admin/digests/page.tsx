import { redirect } from "next/navigation";

import { isAdmin } from "@/lib/authz";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type DigestRow = {
  id: string;
  created_at: string;
  entity_id: string;
  contact_email: string;
  events_count: number;
  status: "queued" | "sent" | "failed" | "skipped";
  resend_message_id: string | null;
  error: string | null;
  public_entities?: { name: string | null }[] | null;
};

const STATUS_LABELS: Record<DigestRow["status"], string> = {
  queued: "Queued",
  sent: "Sent",
  failed: "Failed",
  skipped: "Skipped",
};

export default async function AdminDigestsPage({
  searchParams,
}: {
  searchParams?: { status?: string };
}) {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    redirect("/");
  }

  const admin = await isAdmin(user.id);
  if (!admin) {
    redirect("/");
  }

  const rawStatus = (searchParams?.status ?? "").toLowerCase();
  const statusFilter =
    rawStatus === "sent" ||
    rawStatus === "failed" ||
    rawStatus === "skipped" ||
    rawStatus === "queued"
      ? (rawStatus as DigestRow["status"])
      : null;

  let query = supabase
    .from("entity_digest_deliveries")
    .select(
      "id,created_at,entity_id,contact_email,events_count,status,resend_message_id,error,public_entities(name)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load digest deliveries: ${error.message}`);
  }

  const rows = (data ?? []) as DigestRow[];

  return (
    <main className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Digest monitor</h1>
          <p className="text-sm text-muted-foreground">
            Track recent entity digest sends and failures.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant={statusFilter ? "outline" : "default"}>
            <Link href="/admin/digests">All</Link>
          </Button>
          <Button asChild variant={statusFilter === "sent" ? "default" : "outline"}>
            <Link href="/admin/digests?status=sent">Sent</Link>
          </Button>
          <Button asChild variant={statusFilter === "failed" ? "default" : "outline"}>
            <Link href="/admin/digests?status=failed">Failed</Link>
          </Button>
          <Button asChild variant={statusFilter === "skipped" ? "default" : "outline"}>
            <Link href="/admin/digests?status=skipped">Skipped</Link>
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Latest deliveries</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Created</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Events</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Resend ID</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-sm text-muted-foreground">
                    No digest deliveries found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{formatDate(row.created_at)}</TableCell>
                    <TableCell>{row.public_entities?.[0]?.name ?? "Unknown"}</TableCell>
                    <TableCell>{maskEmail(row.contact_email)}</TableCell>
                    <TableCell>{row.events_count}</TableCell>
                    <TableCell>
                      <Badge variant={row.status === "failed" ? "destructive" : "secondary"}>
                        {STATUS_LABELS[row.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[160px] truncate">
                      {row.resend_message_id ?? "-"}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate">
                      {row.error ? truncate(row.error, 120) : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  if (!name) return `***@${domain}`;
  if (name.length === 1) return `${name[0]}***@${domain}`;
  return `${name[0]}***@${domain}`;
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}…`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
