import Link from "next/link";
import { redirect } from "next/navigation";

import AppHeaderShell from "@/components/app/app-header-shell";
import UpdatesFeed from "@/components/dashboard/updates-feed";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCountyName } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDashboardUpdates } from "@/lib/dashboard/get-updates";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { page?: string } | Promise<{ page?: string }>;
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/dashboard")}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("location_county_fips,location_county_name,location_state")
    .eq("id", user.id)
    .maybeSingle();

  const countyFips = profile?.location_county_fips ?? null;
  const countyName = profile?.location_county_name ?? null;
  const countyState = profile?.location_state ?? null;

  const { data: followRows } = await supabase
    .from("follows")
    .select("target_type,target_id")
    .eq("user_id", user.id);

  const follows = followRows ?? [];
  const followedJurisdictionIds = follows
    .filter((row) => row.target_type === "jurisdiction")
    .map((row) => row.target_id);
  const followedEntityIds = follows
    .filter((row) => row.target_type === "entity")
    .map((row) => row.target_id);
  const followedIssueIds = follows
    .filter((row) => row.target_type === "issue")
    .map((row) => row.target_id);
  const followedUserIds = follows
    .filter((row) => row.target_type === "user")
    .map((row) => row.target_id);

  const [jurisdictionRows, entityRows, issueRows, userRows] =
    await Promise.all([
      followedJurisdictionIds.length > 0
        ? supabase
            .from("jurisdictions")
            .select("id,name,external_id")
            .in("id", followedJurisdictionIds)
        : Promise.resolve({ data: [] }),
      followedEntityIds.length > 0
        ? supabase
            .from("public_entities")
            .select("id,name,jurisdiction_id,jurisdictions(external_id)")
            .in("id", followedEntityIds)
        : Promise.resolve({ data: [] }),
      followedIssueIds.length > 0
        ? supabase
            .from("issues")
            .select("id,title,jurisdiction_id")
            .in("id", followedIssueIds)
        : Promise.resolve({ data: [] }),
      followedUserIds.length > 0
        ? supabase
            .from("profiles")
            .select("id,username,display_name")
            .in("id", followedUserIds)
        : Promise.resolve({ data: [] }),
    ]);

  const followedCounties =
    jurisdictionRows.data?.map((row) => ({
      id: row.id,
      label: formatCountyName(row.name ?? "County"),
      href: row.external_id ? `/county/${row.external_id}` : "/dashboard",
    })) ?? [];

  const followedEntities =
    entityRows.data?.map((row) => {
      const jurisdiction = Array.isArray(row.jurisdictions)
        ? row.jurisdictions[0]
        : row.jurisdictions;
      const fips = jurisdiction?.external_id ?? null;
      return {
        id: row.id,
        label: row.name,
        href: fips ? `/county/${fips}/entities/${row.id}` : "/dashboard",
      };
    }) ?? [];

  const followedIssues =
    issueRows.data?.map((row) => ({
      id: row.id,
      label: row.title,
      href: `/issue/${row.id}`,
    })) ?? [];

  const followedUsers =
    userRows.data?.map((row) => {
      const name = row.display_name ?? row.username ?? "Community member";
      const handle = row.username ? `@${row.username}` : null;
      return {
        id: row.id,
        label: handle ? `${name} ${handle}` : name,
        href: row.username ? `/u/${row.username}` : "/dashboard",
      };
    }) ?? [];

  const currentPage = Math.max(
    1,
    Number(resolvedSearchParams?.page) || 1,
  );
  const pageSize = 25;
  const updatesResult = await getDashboardUpdates({
    supabase,
    followedJurisdictionIds,
    followedEntityIds,
    page: currentPage,
    pageSize,
  });

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeaderShell showFilters={false} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:py-10">
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Card>
              <CardHeader>
                <CardTitle>Your County</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                {countyFips ? (
                  <>
                    <p>
                      Connected to{" "}
                      <span className="font-medium text-foreground">
                        {countyName ? formatCountyName(countyName) : "your county"}
                        {countyState ? `, ${countyState}` : ""}
                      </span>
                      .
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm">
                        <Link href={`/county/${countyFips}`}>Open county</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/county/${countyFips}`}>Create Post</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/county/${countyFips}/issues`}>Create Issue</Link>
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p>
                      Set your county to personalize updates and follow local
                      conversations.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm">
                        <Link href="/profile">Set location</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href="/settings">Preferences</Link>
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Following</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                {followedCounties.length +
                  followedEntities.length +
                  followedIssues.length +
                  followedUsers.length ===
                0 ? (
                  <p>
                    Follow counties, entities, or issues to see them here.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <FollowGroup label="Counties" items={followedCounties} />
                    <FollowGroup label="Entities" items={followedEntities} />
                    <FollowGroup label="Issues" items={followedIssues} />
                    <FollowGroup label="Users" items={followedUsers} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Your Updates</CardTitle>
              <Badge variant="outline">Last 7 days</Badge>
            </CardHeader>
            <CardContent>
              <UpdatesFeed
                items={updatesResult.items}
                currentPage={updatesResult.currentPage}
                hasNextPage={updatesResult.hasNextPage}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function FollowGroup({
  label,
  items,
}: {
  label: string;
  items: Array<{ id: string; label: string; href: string }>;
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.slice(0, 6).map((item) => (
          <Button key={item.id} asChild size="sm" variant="outline">
            <Link href={item.href}>{item.label}</Link>
          </Button>
        ))}
      </div>
    </div>
  );
}
