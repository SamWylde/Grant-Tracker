import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | undefined;

const PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isSupabaseBrowserConfigured(): boolean {
  return Boolean(PUBLIC_SUPABASE_URL && PUBLIC_SUPABASE_ANON_KEY);
}

function resolveConfig() {
  const url = PUBLIC_SUPABASE_URL;
  const key = PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  return { url, key };
}

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;
  const { url, key } = resolveConfig();
  browserClient = createClient(url, key, {
    auth: {
      persistSession: true,
      storageKey: "grant-tracker-auth",
      detectSessionInUrl: true,
      flowType: "pkce"
    }
  });
  return browserClient;
}
