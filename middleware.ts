import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
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

  const ip = request.headers.get("x-forwarded-for") ?? request.ip ?? null;
  const userAgent = request.headers.get("user-agent") ?? null;
  await supabase.auth.getUser();

  let authorizationResult: { authorized?: boolean; reason?: string } = {};

  try {
    const authorizationResponse = await fetch(new URL("/api/admin/authorize", request.url), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: request.headers.get("cookie") ?? ""
      },
      body: JSON.stringify({
        path: pathname,
        ip,
        userAgent
      })
    });

    if (authorizationResponse.headers.get("content-type")?.includes("application/json")) {
      authorizationResult = await authorizationResponse.json();
    }

    if (!authorizationResponse.ok) {
      authorizationResult.authorized = false;
      authorizationResult.reason ??= authorizationResponse.status === 401 ? "unauthenticated" : "server_error";
    }
  } catch (error) {
    console.error("Failed to verify admin authorization", error);
    const redirectUrl = new URL("/dashboard", request.url);
    redirectUrl.searchParams.set("error", "admin_verification_failed");
    return NextResponse.redirect(redirectUrl);
  }

  if (!authorizationResult.authorized) {
    const reason = authorizationResult.reason;

    if (reason === "unauthenticated") {
      const redirectUrl = new URL("/login", request.url);
      const redirectTo = pathname + (searchParams.toString() ? `?${searchParams}` : "");
      redirectUrl.searchParams.set("redirect_to", redirectTo);
      redirectUrl.searchParams.set("error", "admin_auth_required");
      return NextResponse.redirect(redirectUrl);
    }

    if (reason === "admin_disabled") {
      const redirectUrl = new URL("/dashboard", request.url);
      redirectUrl.searchParams.set("error", "admin_disabled");
      return NextResponse.redirect(redirectUrl);
    }

    if (reason === "supabase_not_configured") {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("error", "supabase_not_configured");
      return NextResponse.redirect(redirectUrl);
    }

    if (reason === "insufficient_role") {
      const redirectUrl = new URL("/dashboard", request.url);
      redirectUrl.searchParams.set("error", "admin_access_required");
      return NextResponse.redirect(redirectUrl);
    }

    const redirectUrl = new URL("/dashboard", request.url);
    redirectUrl.searchParams.set("error", "admin_verification_failed");
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

  return response;
}

export const config = {
  matcher: ["/admin/:path*"]
};
