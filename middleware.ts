import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

import { logAdminAccessAttempt } from "@/lib/admin/audit";
import { isAdminPanelEnabled } from "@/lib/admin/auth";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (!isAdminPanelEnabled()) {
    const redirectUrl = new URL("/dashboard", request.url);
    redirectUrl.searchParams.set("error", "admin_disabled");
    return NextResponse.redirect(redirectUrl);
  }

  const response = NextResponse.next();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase public credentials. Admin middleware cannot validate sessions.");
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("error", "supabase_not_configured");
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = createMiddlewareClient({ req: request, res: response }, {
    supabaseUrl,
    supabaseKey
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const ip = request.headers.get("x-forwarded-for") ?? request.ip ?? null;
  const userAgent = request.headers.get("user-agent") ?? null;

  if (!user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect_to", pathname + (searchParams.toString() ? `?${searchParams}` : ""));
    await logAdminAccessAttempt({
      userId: null,
      path: pathname,
      status: "denied",
      ip,
      userAgent,
      reason: "Unauthenticated"
    });
    return NextResponse.redirect(redirectUrl);
  }

  const serviceClient = getSupabaseServiceRoleClient();
  const { data: platformAdminRecord } = await serviceClient
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let isAuthorized = Boolean(platformAdminRecord);

  if (!isAuthorized) {
    const { data: orgAdminMemberships } = await serviceClient
      .from("org_memberships")
      .select("id")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .limit(1);

    isAuthorized = Boolean(orgAdminMemberships && orgAdminMemberships.length > 0);
  }

  if (!isAuthorized) {
    const redirectUrl = new URL("/dashboard", request.url);
    redirectUrl.searchParams.set("error", "admin_access_required");
    await logAdminAccessAttempt({
      userId: user.id,
      path: pathname,
      status: "denied",
      ip,
      userAgent,
      reason: "Insufficient role"
    });
    return NextResponse.redirect(redirectUrl);
  }

  const sessionTimeoutMinutes = Number(process.env.ADMIN_SESSION_TIMEOUT_MINUTES ?? 30);
  if (Number.isFinite(sessionTimeoutMinutes) && sessionTimeoutMinutes > 0) {
    const lastActiveRaw = request.cookies.get("gt-admin-last-active")?.value;
    if (lastActiveRaw) {
      const lastActive = Number(lastActiveRaw);
      if (Number.isFinite(lastActive)) {
        const elapsed = Date.now() - lastActive;
        if (elapsed > sessionTimeoutMinutes * 60 * 1000) {
          const redirectUrl = new URL("/login", request.url);
          redirectUrl.searchParams.set("error", "admin_session_expired");
          await logAdminAccessAttempt({
            userId: user.id,
            path: pathname,
            status: "denied",
            ip,
            userAgent,
            reason: "Session timeout"
          });
          return NextResponse.redirect(redirectUrl);
        }
      }
    }
    response.cookies.set("gt-admin-last-active", String(Date.now()), {
      httpOnly: true,
      path: "/admin",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });
  }

  await logAdminAccessAttempt({
    userId: user.id,
    path: pathname,
    status: "authorized",
    ip,
    userAgent
  });

  return response;
}

export const config = {
  matcher: ["/admin/:path*"]
};
