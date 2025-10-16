import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

import { logAdminAccessAttempt } from "@/lib/admin/audit";
import { AdminAccessError, isAdminPanelEnabled, loadAdminAuthorization } from "@/lib/admin/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type AuthorizationRequest = {
  path: string;
  ip?: string | null;
  userAgent?: string | null;
};

function resolveSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return { supabaseUrl, supabaseKey };
}

async function safelyLogAttempt(payload: Parameters<typeof logAdminAccessAttempt>[0]) {
  try {
    await logAdminAccessAttempt(payload);
  } catch (error) {
    console.error("Failed to persist admin access attempt", error);
  }
}

export async function POST(request: Request) {
  let body: AuthorizationRequest;
  try {
    body = await request.json();
  } catch {
    body = { path: "/admin" };
  }

  const path = body.path ?? "/admin";
  const ip = body.ip ?? null;
  const userAgent = body.userAgent ?? null;

  if (!isAdminPanelEnabled()) {
    await safelyLogAttempt({
      userId: null,
      path,
      status: "denied",
      ip,
      userAgent,
      reason: "Admin panel disabled"
    });
    return NextResponse.json({ authorized: false, reason: "admin_disabled", isPlatformAdmin: false, adminOrgIds: [] }, { status: 403 });
  }

  const supabaseConfig = resolveSupabaseConfig();
  if (!supabaseConfig) {
    console.error("Supabase public credentials are not configured for admin authorization checks.");
    return NextResponse.json(
      { authorized: false, reason: "supabase_not_configured", isPlatformAdmin: false, adminOrgIds: [] },
      { status: 500 }
    );
  }

  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore }, supabaseConfig);

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("Failed to fetch Supabase user for admin authorization", authError);
  }

  if (!user) {
    await safelyLogAttempt({
      userId: null,
      path,
      status: "denied",
      ip,
      userAgent,
      reason: "Unauthenticated"
    });
    return NextResponse.json({ authorized: false, reason: "unauthenticated", isPlatformAdmin: false, adminOrgIds: [] }, { status: 401 });
  }

  try {
    const { isPlatformAdmin, adminOrgIds } = await loadAdminAuthorization(user.id);

    if (!isPlatformAdmin && adminOrgIds.length === 0) {
      await safelyLogAttempt({
        userId: user.id,
        path,
        status: "denied",
        ip,
        userAgent,
        reason: "Insufficient role"
      });
      return NextResponse.json(
        { authorized: false, reason: "insufficient_role", isPlatformAdmin, adminOrgIds },
        { status: 403 }
      );
    }

    return NextResponse.json({ authorized: true, isPlatformAdmin, adminOrgIds });
  } catch (error) {
    const message =
      error instanceof AdminAccessError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Unknown error";

    await safelyLogAttempt({
      userId: user.id,
      path,
      status: "denied",
      ip,
      userAgent,
      reason: message
    });

    return NextResponse.json(
      { authorized: false, reason: "server_error", isPlatformAdmin: false, adminOrgIds: [] },
      { status: 500 }
    );
  }
}
