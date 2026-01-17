import Link from "next/link";

import AppFooter from "@/components/app/app-footer";
import AppHeaderShell from "@/components/app/app-header-shell";
import CountyNav from "@/components/county/county-nav";
import CreateOfficeDialog from "@/components/offices/create-office-dialog";
import OfficeCard, { type OfficeCardItem } from "@/components/offices/office-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCountyName } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/authz";

type OfficeRow = {
  id: string;
  name: string;
  slug: string;
};

type HolderRow = {
  office_id: string;
  public_entities?: { name: string | null }[] | null;
  profiles?: { display_name: string | null; username: string | null }[] | null;
};

export default async function CountyOfficesPage({
  params,
}: {
  params: Promise<{ fips: string }>;
}) {
  const { fips } = await params;
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

  const { data: officeRows, error: officeError } = await supabase
    .from("offices")
    .select("id,name,slug")
    .eq("jurisdiction_id", jurisdiction.id)
    .order("name");

  if (officeError) {
    return (
      <CountyError message={`Failed to load offices: ${officeError.message}`} />
    );
  }

  const offices = (officeRows ?? []) as OfficeRow[];
  const officeIds = offices.map((office) => office.id);

  const { data: holderRows } =
    officeIds.length > 0
      ? await supabase
          .from("office_holders")
          .select("office_id,public_entities(name),profiles(display_name,username)")
          .eq("is_current", true)
          .in("office_id", officeIds)
      : { data: [] as HolderRow[] };

  const holderMap = new Map<string, string>();
  (holderRows ?? []).forEach((holder) => {
    const entityName = holder.public_entities?.[0]?.name ?? null;
    const profileName =
      holder.profiles?.[0]?.display_name ?? holder.profiles?.[0]?.username ?? null;
    const name = entityName ?? profileName;
    if (name) {
      holderMap.set(holder.office_id, name);
    }
  });

  const officeItems: OfficeCardItem[] = offices.map((office) => ({
    id: office.id,
    name: office.name,
    slug: office.slug,
    holderName: holderMap.get(office.id) ?? null,
  }));

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
              {formatCountyName(jurisdiction.name)} offices
            </h1>
            <p className="text-sm text-muted-foreground">
              Offices and current holders for this county.
            </p>
          </div>
          {canModerate ? (
            <CreateOfficeDialog jurisdictionId={jurisdiction.id} />
          ) : null}
        </div>

        <CountyNav fips={jurisdiction.external_id} canModerate={canModerate} className="mt-4" />

        <div className="mt-6 grid gap-4">
          {officeItems.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No offices yet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>Founders and moderators can add offices for this county.</p>
                {canModerate ? (
                  <CreateOfficeDialog jurisdictionId={jurisdiction.id} />
                ) : null}
              </CardContent>
            </Card>
          ) : (
            officeItems.map((office) => (
              <OfficeCard
                key={office.id}
                office={office}
                countyFips={jurisdiction.external_id}
              />
            ))
          )}
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

function CountyError({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeaderShell showFilters={false} />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-16">
        <Card>
          <CardHeader>
            <CardTitle>Unable to load offices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>{message}</p>
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
