import AppHeader, { type AppHeaderProps } from "@/components/app/app-header";
import { getCurrentUser, isAdmin } from "@/lib/authz";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AppHeaderShell(props: AppHeaderProps) {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();
  let admin = false;
  let myCountyFips: string | null = null;

  if (user) {
    try {
      admin = await isAdmin(user.id);
    } catch {
      admin = false;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("location_county_fips")
      .eq("id", user.id)
      .maybeSingle();
    myCountyFips = profile?.location_county_fips ?? null;
  }

  return (
    <AppHeader {...props} isAdmin={admin} myCountyFips={myCountyFips} />
  );
}
