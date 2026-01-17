import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type ReputationRow = {
  user_id: string;
  score: number;
  posts_net_votes: number;
  posts_count: number;
  comments_count: number;
  account_age_days: number;
  penalties?: number | null;
};

export async function getReputationMap(
  supabase: SupabaseClient,
  userIds: string[],
) {
  const uniqueIds = Array.from(new Set(userIds)).filter(Boolean);
  if (uniqueIds.length === 0) {
    return new Map<string, ReputationRow>();
  }

  const { data, error } = await supabase
    .from("user_reputation_v1")
    .select(
      "user_id,score,posts_net_votes,posts_count,comments_count,account_age_days,penalties",
    )
    .in("user_id", uniqueIds);

  if (error) {
    console.warn("getReputationMap: failed to load reputations", error.message);
    return new Map<string, ReputationRow>();
  }

  return new Map(
    (data ?? []).map((row) => [row.user_id, row as ReputationRow]),
  );
}
