import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

function resolveConfig() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing Supabase service role configuration. Set SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL."
    );
  }
  return { url, key };
}

export function getSupabaseServiceRoleClient(): SupabaseClient {
  if (!client) {
    const { url, key } = resolveConfig();
    client = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }
  return client;
}
