import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient, type SupabaseClient } from "@supabase/auth-helpers-nextjs";

import { logAdminAccessAttempt } from "@/lib/admin/audit";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

type SupabaseDatabase = any;

type AdminContext = {
  userId: string;
  email: string | null;
  isPlatformAdmin: boolean;
  adminOrgIds: string[];
};

export class AdminAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminAccessError";
  }
}

export function isAdminPanelEnabled(): boolean {
  const flag = process.env.ADMIN_PANEL_ENABLED;
  return flag === undefined ? true : flag !== "false";
}

function createServerSupabaseClient(): SupabaseClient<SupabaseDatabase> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase public credentials are not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  const cookieStore = cookies();
  return createServerComponentClient<SupabaseDatabase>({
    cookies: () => cookieStore
  }, {
    supabaseUrl,
    supabaseKey
  });
}

export async function isPlatformAdmin(userId: string): Promise<boolean> {
  const serviceClient = getSupabaseServiceRoleClient();
  const { data, error } = await serviceClient
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load platform admin status", error);
    return false;
  }

  return Boolean(data?.user_id);
}

export async function fetchAdminOrgIds(userId: string): Promise<string[]> {
  const serviceClient = getSupabaseServiceRoleClient();
  const { data, error } = await serviceClient
    .from("org_memberships")
    .select("org_id")
    .eq("user_id", userId)
    .eq("role", "admin");

  if (error) {
    console.error("Failed to fetch admin memberships", error);
    return [];
  }

  return (data ?? []).map((row) => row.org_id).filter(Boolean);
}

export async function loadAdminAuthorization(userId: string): Promise<{
  isPlatformAdmin: boolean;
  adminOrgIds: string[];
}> {
  const isPlatform = await isPlatformAdmin(userId);
  const adminOrgIds = await fetchAdminOrgIds(userId);
  return { isPlatformAdmin: isPlatform, adminOrgIds };
}

export async function getAdminContext(): Promise<AdminContext> {
  if (!isAdminPanelEnabled()) {
    throw new AdminAccessError("Admin panel is disabled");
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Failed to fetch Supabase user for admin request", error);
  }

  if (!user) {
    throw new AdminAccessError("You must be signed in to access the admin panel.");
  }

  const { isPlatformAdmin: platformAdmin, adminOrgIds } = await loadAdminAuthorization(user.id);

  if (!platformAdmin && adminOrgIds.length === 0) {
    throw new AdminAccessError("You need the admin role to access this area.");
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    isPlatformAdmin: platformAdmin,
    adminOrgIds
  } satisfies AdminContext;
}

export async function requireAdminContext({
  path,
  redirectOnFailure = true
}: {
  path: string;
  redirectOnFailure?: boolean;
}): Promise<AdminContext> {
  try {
    const context = await getAdminContext();
    await logAdminAccessAttempt({
      userId: context.userId,
      path,
      status: "authorized"
    });
    return context;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await logAdminAccessAttempt({
      userId: null,
      path,
      status: "denied",
      reason: message
    });

    if (!redirectOnFailure) {
      throw error;
    }

    redirect(`/dashboard?error=${encodeURIComponent("admin_access_required")}`);
  }
}

export type { AdminContext };
