import Link from "next/link";

import AppFooter from "@/components/app/app-footer";
import AppHeaderShell from "@/components/app/app-header-shell";
import CountyNav from "@/components/county/county-nav";
import EntitiesDirectory from "@/components/entities/entities-directory";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCountyName } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/authz";

type EntityRow = {
  id: string;
  type: "official" | "department";
  name: string;
  title: string | null;
  contact_email: string | null;
  website_url: string | null;
};

export default async function CountyEntitiesPage({
  params,
}: {
  params: Promise<{ fips: string }>;
}) {
  const { fips } = await params;
  const normalized = (fips ?? "").trim();
  const isValid = /^\d{5}$/.test(normalized);

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
    .eq("external_id", normalized)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (!jurisdiction) {
    return <CountyNotActive />;
  }

  const { data: entityRows } = await supabase
    .from("public_entities")
    .select("id,type,name,title,contact_email,website_url")
    .eq("jurisdiction_id", jurisdiction.id)
    .order("name");

  const entities = (entityRows ?? []) as EntityRow[];

  let canManage = false;
  if (user) {
    try {
      const admin = await isAdmin(user.id);
      if (admin) {
        canManage = true;
      } else {
        const { data: hasRole } = await supabase.rpc(
          "has_jurisdiction_role",
          {
            jurisdiction_id: jurisdiction.id,
            roles: ["founder", "moderator"],
          },
        );
        canManage = Boolean(hasRole);
      }
    } catch {
      canManage = false;
    }
  }

  const entityItems = entities.map((entity) => ({
    id: entity.id,
    type: entity.type,
    name: entity.name,
    title: entity.title,
    contactEmail: entity.contact_email,
    websiteUrl: entity.website_url,
  }));

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
              {formatCountyName(jurisdiction.name)} entities
            </h1>
            <p className="text-sm text-muted-foreground">
              Departments and officials tied to this county.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/county/${jurisdiction.external_id}`}>Back to feed</Link>
          </Button>
        </div>

        <CountyNav
          fips={jurisdiction.external_id}
          canModerate={canManage}
          className="mt-4"
        />

        <div className="mt-6">
          <EntitiesDirectory
            entities={entityItems}
            jurisdictionId={jurisdiction.id}
            canManage={canManage}
            countyFips={jurisdiction.external_id}
          />
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
