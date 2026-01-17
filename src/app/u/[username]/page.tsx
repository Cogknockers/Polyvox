import Link from "next/link";
import { notFound } from "next/navigation";

import AppFooter from "@/components/app/app-footer";
import AppHeaderShell from "@/components/app/app-header-shell";
import PublicProfileHeader from "@/components/profile/public-profile-header";
import PublicRecentActivity from "@/components/profile/public-recent-activity";
import PublicReputation from "@/components/profile/public-reputation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { ProfilePublic } from "@/lib/types/profile";

type PageProps = {
  params: { username: string } | Promise<{ username: string }>;
};

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await Promise.resolve(params);
  if (!username) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const viewer = authData.user;
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id,username,display_name,avatar_url,bio,party,party_other_label,party_public,location_city,location_county_name,location_state,location_country",
    )
    .ilike("username", username)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load profile: ${error.message}`);
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <AppHeaderShell showFilters={false} />
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle>User not found</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                We could not find that public profile.
              </p>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Back to dashboard
              </Link>
            </CardContent>
          </Card>
        </main>
        <AppFooter />
      </div>
    );
  }

  const { id: userId, ...profileData } = data as ProfilePublic & {
    id: string;
  };
  let isFollowing = false;
  if (viewer && viewer.id !== userId) {
    const { data: followRow } = await supabase
      .from("follows")
      .select("id")
      .eq("user_id", viewer.id)
      .eq("target_type", "user")
      .eq("target_id", userId)
      .maybeSingle();
    isFollowing = Boolean(followRow);
  }
  let badgeColor: string | null = null;
  let reputation = null;

  try {
    const service = createSupabaseServiceClient();
    const { data: preferences } = await service
      .from("user_preferences")
      .select("badge_color")
      .eq("user_id", userId)
      .maybeSingle();
    badgeColor = preferences?.badge_color ?? null;
  } catch {
    badgeColor = null;
  }

  const { data: reputationRow } = await supabase
    .from("user_reputation_v1")
    .select("score,posts_net_votes,posts_count,comments_count,account_age_days")
    .eq("user_id", userId)
    .maybeSingle();
  reputation = reputationRow ?? null;

  const profile: ProfilePublic = {
    ...profileData,
    badge_color: badgeColor,
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeaderShell showFilters={false} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:py-12">
        <div className="space-y-8">
          <PublicProfileHeader
            profile={profile}
            followTarget={
              !viewer || viewer.id !== userId
                ? {
                    targetId: userId,
                    isFollowing,
                    isAuthenticated: Boolean(viewer),
                  }
                : undefined
            }
          />

          <div className="grid gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-8">
              <PublicRecentActivity />
            </div>
            <div className="space-y-6 lg:col-span-4">
              <PublicReputation metrics={reputation} />
              <Card>
                <CardHeader>
                  <CardTitle>Communities</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Community memberships will appear here.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Supported Issues</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Supported issues will appear here.
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
