import { redirect } from "next/navigation";

import AppFooter from "@/components/app/app-footer";
import AppHeaderShell from "@/components/app/app-header-shell";
import SettingsClient from "@/app/settings/settings-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMyPreferences } from "@/lib/data/preferences";

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    redirect("/login?next=/settings");
  }

  const [preferences, voteWeightResult] = await Promise.all([
    getMyPreferences(supabase),
    supabase
      .from("user_vote_weight_v0")
      .select("vote_weight")
      .eq("voter_id", user.id)
      .maybeSingle(),
  ]);
  const voteWeight = voteWeightResult.data?.vote_weight ?? null;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeaderShell showFilters={false} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:py-10">
        <div className="mb-6 space-y-2">
          <h1 className="text-3xl font-semibold">Settings</h1>
          <p className="text-muted-foreground">
            Personalize your Polyvox experience.
          </p>
        </div>
        <SettingsClient preferences={preferences} voteWeight={voteWeight} />
      </main>
      <AppFooter />
    </div>
  );
}
