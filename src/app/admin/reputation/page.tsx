import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminReputationPage() {
  const supabase = createSupabaseServiceClient();

  const { data: reputationRows, error } = await supabase
    .from("user_reputation_v1")
    .select("user_id, score, posts_net_votes, posts_count, comments_count, account_age_days")
    .order("score", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(`Failed to load reputation: ${error.message}`);
  }

  const userIds = Array.from(new Set((reputationRows ?? []).map((row) => row.user_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .in("id", userIds);

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Reputation</h1>
        <p className="text-sm text-muted-foreground">
          Top 100 users by reputation score. Metrics are derived and refreshed in real time.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Net votes</th>
                  <th className="px-4 py-3">Posts</th>
                  <th className="px-4 py-3">Comments</th>
                  <th className="px-4 py-3">Account age</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(reputationRows ?? []).map((row) => {
                  const profile = profileMap.get(row.user_id);
                  const displayName = profile?.display_name ?? "Unknown";
                  const username = profile?.username ? `@${profile.username}` : null;

                  return (
                    <tr key={row.user_id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{displayName}</div>
                        {username ? (
                          <div className="text-xs text-muted-foreground">{username}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {row.score}
                      </td>
                      <td className="px-4 py-3">{row.posts_net_votes}</td>
                      <td className="px-4 py-3">{row.posts_count}</td>
                      <td className="px-4 py-3">{row.comments_count}</td>
                      <td className="px-4 py-3">{row.account_age_days} days</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
