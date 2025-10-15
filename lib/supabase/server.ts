import { cookies, headers } from "next/headers";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type ServerClient = SupabaseClient;

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
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        ...Object.fromEntries(headers().entries())
      }
    },
    cookies: {
      get: (name: string) => cookies().get(name)?.value,
      set: (name: string, value: string, options) =>
        cookies().set(name, value, options as any),
      remove: (name: string, options) =>
        cookies().set(name, "", { ...(options as Record<string, unknown>), maxAge: 0 })
    }
  });
}
