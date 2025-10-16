import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ADMIN_MATCHER = "/admin";

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith(ADMIN_MATCHER)) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("sb-access-token");

  if (!accessToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};
