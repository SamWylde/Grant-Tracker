import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

type ServerClient = SupabaseClient;

export function isSupabaseServerConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key);
}

function resolveServerConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing Supabase credentials. Set SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL or public counterparts."
    );
  }
  return { url, key };
}

export function getSupabaseServerClient(): ServerClient {
  const { url, key } = resolveServerConfig();
  const cookieStore = cookies();
  return createServerClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        ...Object.fromEntries(headers().entries())
      }
    },
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      }
    }
  });
}
