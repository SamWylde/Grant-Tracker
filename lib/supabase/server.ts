import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type ServerClient = SupabaseClient;

type ServerClientOptions = {
  headers?: HeadersInit;
};

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

function normalizeHeaders(input?: HeadersInit): Record<string, string> | undefined {
  if (!input) return undefined;

  if (typeof Headers !== "undefined" && input instanceof Headers) {
    const entries: Record<string, string> = {};
    input.forEach((value, key) => {
      entries[key] = value;
    });
    return entries;
  }

  if (Array.isArray(input)) {
    return Object.fromEntries(input.map(([key, value]) => [key, String(value)]));
  }

  const record = input as Record<string, string | ReadonlyArray<string>>;
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key, Array.isArray(value) ? value.join(",") : String(value)])
  );
}

export function getSupabaseServerClient(options: ServerClientOptions = {}): ServerClient {
  const { url, key } = resolveServerConfig();
  const headers = normalizeHeaders(options.headers);

  const client = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: headers ?? {}
    }
  });

  return client;
}
