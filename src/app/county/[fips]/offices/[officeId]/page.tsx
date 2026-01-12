import Link from "next/link";

import AppFooter from "@/components/app/app-footer";
import AppHeaderShell from "@/components/app/app-header-shell";
import CountyNav from "@/components/county/county-nav";
import NominateDialog from "@/components/offices/nominate-dialog";
import NominationCard, { type NominationCardItem } from "@/components/offices/nomination-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/authz";

type HolderRow = {
  entity_id: string | null;
  profile_id: string | null;
  public_entities?: { name: string | null } | null;
  profiles?: { display_name: string | null; username: string | null } | null;
};

type NominationRow = {
  id: string;
  nominee_profile_id: string;
  message: string;
  status: "open" | "withdrawn" | "accepted" | "declined";
  is_spotlighted: boolean;
  created_at: string;
};

type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
};

type ScoreRow = {
  nomination_id: string;
  upvotes: number | null;
  downvotes: number | null;
  score: number | null;
};

export default async function OfficeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ fips: string; officeId: string }>;
  searchParams?: { page?: string } | Promise<{ page?: string }>;
}) {
  const { fips, officeId } = await params;
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const currentPage = Math.max(1, Number(resolvedSearchParams?.page) || 1);
  const pageSize = 20;
  const rangeFrom = (currentPage - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize - 1;

  const normalizedFips = (fips ?? "").trim();
  const isValid = /^\d{5}$/.test(normalizedFips);
  if (!isValid) {
    return <CountyNotActive />;
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  const { data: jurisdiction } = await supabase
    .from("jurisdictions")
    .select("id,name,external_id")
    .eq("type", "COUNTY")
    .eq("external_id", normalizedFips)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (!jurisdiction) {
    return <CountyNotActive />;
  }

  const { data: office } = await supabase
    .from("offices")
    .select("id,name,slug")
    .eq("id", officeId)
    .eq("jurisdiction_id", jurisdiction.id)
    .maybeSingle();

  if (!office) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <AppHeaderShell showFilters={false} />
        <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16">
          <Card>
            <CardHeader>
              <CardTitle>Office not found</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>This office does not exist or has been removed.</p>
              <Button asChild>
                <Link href={`/county/${normalizedFips}/offices`}>
                  Back to offices
                </Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <AppFooter />
      </div>
    );
  }

  const { data: holderRow } = await supabase
    .from("office_holders")
    .select("entity_id,profile_id,public_entities(name),profiles(display_name,username)")
    .eq("office_id", office.id)
    .eq("is_current", true)
    .maybeSingle();

  const holder = holderRow as HolderRow | null;
  const holderName = holder?.public_entities?.name ?? holder?.profiles?.display_name ?? holder?.profiles?.username ?? null;
  const holderHref = holder?.entity_id
    ? `/county/${jurisdiction.external_id}/entities/${holder.entity_id}`
    : holder?.profiles?.username
      ? `/u/${holder.profiles.username}`
      : null;

  const { data: nominationRows } = await supabase
    .from("office_nominations")
    .select("id,nominee_profile_id,message,status,is_spotlighted,created_at")
    .eq("office_id", office.id)
    .order("is_spotlighted", { ascending: false })
    .order("created_at", { ascending: false })
    .range(rangeFrom, rangeTo);

  const nominations = (nominationRows ?? []) as NominationRow[];
  const nominationIds = nominations.map((row) => row.id);
  const nomineeIds = Array.from(new Set(nominations.map((row) => row.nominee_profile_id)));

  const { data: nomineeProfiles } = nomineeIds.length
    ? await supabase
        .from("profiles")
        .select("id,username,display_name")
        .in("id", nomineeIds)
    : { data: [] as ProfileRow[] };

  const profileMap = new Map(
    (nomineeProfiles ?? []).map((profile) => [profile.id, profile]),
  );

  const { data: scoreRows } = nominationIds.length
    ? await supabase
        .from("office_nomination_scores_v1")
        .select("nomination_id,upvotes,downvotes,score")
        .in("nomination_id", nominationIds)
    : { data: [] as ScoreRow[] };

  const scoreMap = new Map(
    (scoreRows ?? []).map((row) => [row.nomination_id, row]),
  );

  const userVoteMap = new Map<string, number>();
  if (user && nominationIds.length > 0) {
    const { data: voteRows } = await supabase
      .from("office_nomination_votes")
      .select("nomination_id,value")
      .eq("voter_id", user.id)
      .in("nomination_id", nominationIds);

    (voteRows ?? []).forEach((row) => {
      userVoteMap.set(row.nomination_id, row.value ?? 0);
    });
  }

  let nominationItems: NominationCardItem[] = nominations.map((row) => {
    const nominee = profileMap.get(row.nominee_profile_id);
    const nomineeName = nominee?.display_name ?? nominee?.username ?? "Member";
    const nomineeHandle = nominee?.username ? `@${nominee.username}` : null;
    const score = scoreMap.get(row.id);
    return {
      id: row.id,
      nomineeName,
      nomineeHandle,
      message: row.message,
      status: row.status,
      isSpotlighted: row.is_spotlighted,
      createdAt: row.created_at,
      score: score?.score ?? 0,
      upvotes: score?.upvotes ?? 0,
      downvotes: score?.downvotes ?? 0,
      userVote: userVoteMap.get(row.id) ?? 0,
      isPinned: false,
    };
  });

  nominationItems = nominationItems.sort((a, b) => {
    if (a.isSpotlighted !== b.isSpotlighted) {
      return a.isSpotlighted ? -1 : 1;
    }
    if (a.score !== b.score) {
      return b.score - a.score;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (currentPage === 1 && nominationItems.length > 0) {
    const newest = nominationItems.reduce((latest, item) =>
      new Date(item.createdAt).getTime() > new Date(latest.createdAt).getTime()
        ? item
        : latest,
    );
    nominationItems = nominationItems.map((item) =>
      item.id === newest.id ? { ...item, isPinned: true } : item,
    );
  }

  const hasNextPage = nominations.length === pageSize;

  let canModerate = false;
  if (user) {
    try {
      const admin = await isAdmin(user.id);
      if (admin) {
        canModerate = true;
      } else {
        const { data: hasRole } = await supabase.rpc("has_jurisdiction_role", {
          jurisdiction_id: jurisdiction.id,
          roles: ["founder", "moderator"],
        });
        canModerate = Boolean(hasRole);
      }
    } catch {
      canModerate = false;
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeaderShell showFilters={false} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              County community
            </p>
            <h1 className="text-2xl font-semibold text-foreground">
              {office.name}
            </h1>
            <p className="text-sm text-muted-foreground">/{office.slug}</p>
          </div>
          <NominateDialog
            jurisdictionId={jurisdiction.id}
            officeId={office.id}
            countyFips={jurisdiction.external_id}
            canNominate={Boolean(user)}
          />
        </div>

        <CountyNav fips={jurisdiction.external_id} canModerate={canModerate} className="mt-4" />

        <div className="mt-6 grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Current holder</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {holderName ? (
                holderHref ? (
                  <Link href={holderHref} className="font-medium text-foreground hover:underline">
                    {holderName}
                  </Link>
                ) : (
                  <span className="font-medium text-foreground">{holderName}</span>
                )
              ) : (
                "Unknown"
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Nominations
                </h2>
                <p className="text-sm text-muted-foreground">
                  Spotlighted nominations appear first. Vote anonymously to help signal support.
                </p>
              </div>
            </div>

            {nominationItems.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No nominations yet</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Be the first to nominate someone for this office.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {nominationItems.map((nomination) => (
                  <NominationCard
                    key={nomination.id}
                    nomination={nomination}
                    jurisdictionId={jurisdiction.id}
                    canModerate={canModerate}
                    isAuthenticated={Boolean(user)}
                  />
                ))}
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                disabled={currentPage <= 1}
                asChild
              >
                <Link
                  href={`/county/${jurisdiction.external_id}/offices/${office.id}?page=${Math.max(
                    1,
                    currentPage - 1,
                  )}`}
                >
                  Prev
                </Link>
              </Button>
              <Button
                variant="outline"
                disabled={!hasNextPage}
                asChild
              >
                <Link
                  href={`/county/${jurisdiction.external_id}/offices/${office.id}?page=${currentPage + 1}`}
                >
                  Next
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}

function CountyNotActive() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeaderShell showFilters={false} />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-16">
        <Card>
          <CardHeader>
            <CardTitle>County not active yet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              This county has not been activated yet. Activation is managed by
              admins.
            </p>
            <Button asChild>
              <Link href="/">Back to home</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
      <AppFooter />
    </div>
  );
}
