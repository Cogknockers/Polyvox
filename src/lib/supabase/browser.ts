import { createClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "./env";

export function createSupabaseBrowserClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createClient(url, anonKey, {
    auth: { persistSession: true },
  });
}
