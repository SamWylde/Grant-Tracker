import { cookies, headers as nextHeaders } from "next/headers";

import { getSupabaseServerClient, isSupabaseServerConfigured } from "@/lib/supabase/server";

import { logAdminAccessAttempt } from "./audit";

export type AdminUser = {
  id: string;
  email?: string | null;
  fullName?: string | null;
};

export type AdminOrgAccess = {
  orgId: string;
  orgName?: string | null;
  role: string;
};

export type AdminAccessResult = {
  isAuthorized: boolean;
  reason?: "not-authenticated" | "insufficient-role" | "not-configured";
  user?: AdminUser;
  isPlatformAdmin?: boolean;
  organizations?: AdminOrgAccess[];
};

export async function isPlatformAdmin(userId: string): Promise<boolean> {
  if (!userId) return false;
  if (!isSupabaseServerConfigured()) {
    return false;
  }

  const client = getSupabaseServerClient();
  const { data, error } = await client
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to verify platform admin role", error);
    return false;
  }

  return Boolean(data?.user_id);
}

async function fetchAdminMemberships(userId: string): Promise<AdminOrgAccess[]> {
  if (!isSupabaseServerConfigured()) {
    return [];
  }

  const client = getSupabaseServerClient();
  const { data, error } = await client
    .from("org_memberships")
    .select("org_id, role, status, orgs:org_id (name)")
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) {
    console.error("Failed to load admin memberships", error);
    return [];
  }

  if (!data) return [];

  return data.map((row) => {
    const org = Array.isArray(row.orgs) ? row.orgs[0] : row.orgs;
    return {
      orgId: row.org_id as string,
      orgName: (org as { name?: string | null } | null)?.name ?? null,
      role: (row.role ?? "contributor") as string
    } satisfies AdminOrgAccess;
  });
}

async function getAuthenticatedUser(): Promise<AdminUser | null> {
  if (!isSupabaseServerConfigured()) {
    return null;
  }

  const cookieStore = cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;

  if (!accessToken) {
    return null;
  }

  const client = getSupabaseServerClient();
  const { data, error } = await client.auth.getUser(accessToken);

  if (error) {
    console.error("Failed to resolve Supabase user for admin access", error);
    return null;
  }

  if (!data?.user) {
    return null;
  }

  const { user } = data;
  return {
    id: user.id,
    email: user.email,
    fullName: (user.user_metadata?.full_name as string | undefined) ?? null
  } satisfies AdminUser;
}

export type AdminRequestMetadata = { ipAddress?: string | null; userAgent?: string | null };

export function resolveAdminRequestMetadata(): AdminRequestMetadata {
  try {
    const headerList = nextHeaders();
    const forwarded = headerList.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(",")[0]?.trim() ?? null : headerList.get("x-real-ip");
    const userAgent = headerList.get("user-agent");
    return { ipAddress, userAgent };
  } catch (error) {
    console.warn("Unable to read request metadata for admin access logging", error);
    return { ipAddress: null, userAgent: null };
  }
}

export async function requireAdminAccess(
  metadata?: AdminRequestMetadata
): Promise<AdminAccessResult> {
  const requestMetadata = metadata ?? { ipAddress: null, userAgent: null };
  if (!isSupabaseServerConfigured()) {
    return {
      isAuthorized: false,
      reason: "not-configured"
    } satisfies AdminAccessResult;
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    await logAdminAccessAttempt({
      success: false,
      reason: "not-authenticated",
      ipAddress: requestMetadata.ipAddress ?? null,
      userAgent: requestMetadata.userAgent ?? null
    });
    return { isAuthorized: false, reason: "not-authenticated" } satisfies AdminAccessResult;
  }

  const platformAdmin = await isPlatformAdmin(user.id);

  if (platformAdmin) {
    await logAdminAccessAttempt({
      success: true,
      platformAdmin: true,
      userId: user.id,
      email: user.email ?? undefined,
      ipAddress: requestMetadata.ipAddress ?? null,
      userAgent: requestMetadata.userAgent ?? null
    });

    return {
      isAuthorized: true,
      user,
      isPlatformAdmin: true,
      organizations: []
    } satisfies AdminAccessResult;
  }

  const memberships = await fetchAdminMemberships(user.id);
  const hasAdminRole = memberships.some((membership) => membership.role === "admin");

  if (!hasAdminRole) {
    await logAdminAccessAttempt({
      success: false,
      userId: user.id,
      email: user.email ?? undefined,
      reason: "insufficient-role",
      ipAddress: requestMetadata.ipAddress ?? null,
      userAgent: requestMetadata.userAgent ?? null
    });

    return {
      isAuthorized: false,
      reason: "insufficient-role",
      user,
      organizations: memberships
    } satisfies AdminAccessResult;
  }

  await logAdminAccessAttempt({
    success: true,
    userId: user.id,
    email: user.email ?? undefined,
    platformAdmin: false,
    ipAddress: requestMetadata.ipAddress ?? null,
    userAgent: requestMetadata.userAgent ?? null
  });

  return {
    isAuthorized: true,
    user,
    isPlatformAdmin: false,
    organizations: memberships.filter((membership) => membership.role === "admin")
  } satisfies AdminAccessResult;
}
