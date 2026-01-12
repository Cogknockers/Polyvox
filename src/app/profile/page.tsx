import { redirect } from "next/navigation";

import AppFooter from "@/components/app/app-footer";
import AppHeaderShell from "@/components/app/app-header-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/data/profile";
import { getMyPreferences } from "@/lib/data/preferences";
import ProfileClient from "@/app/profile/profile-client";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    redirect("/login");
  }

  const [profile, preferences, reputationResult] = await Promise.all([
    getMyProfile(supabase),
    getMyPreferences(supabase),
    supabase
      .from("user_reputation_v1")
      .select("score,posts_net_votes,posts_count,comments_count,account_age_days")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const reputation = reputationResult.error ? null : reputationResult.data ?? null;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeaderShell showFilters={false} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:py-10">
        <ProfileClient
          profile={profile}
          preferences={preferences}
          reputation={reputation}
        />
      </main>
      <AppFooter />
    </div>
  );
}
