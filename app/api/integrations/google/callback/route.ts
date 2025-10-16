import { NextRequest } from "next/server";

import { upsertIntegration } from "@/lib/supabase/integrations";

export const runtime = "nodejs";

function decodeState(state: string | null) {
  if (!state) return {} as Record<string, string>;
  try {
    const json = Buffer.from(state, "base64url").toString("utf8");
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, string>;
    }
    return {};
  } catch (error) {
    return {};
  }
}

async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth environment variables are not configured");
  }
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code"
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to exchange code: ${text}`);
  }

  const json = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    token_type: string;
    id_token?: string;
  };

  return json;
}

function buildRedirectUrl(request: NextRequest, params: { status: "success" | "error"; message?: string }) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? new URL("/", request.url).toString();
  const url = new URL("/integrations/google", base);
  url.searchParams.set("status", params.status);
  if (params.message) {
    url.searchParams.set("message", params.message);
  }
  return url.toString();
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const stateParam = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    const redirectUrl = buildRedirectUrl(request, { status: "error", message: error });
    return Response.redirect(redirectUrl);
  }

  if (!code) {
    const redirectUrl = buildRedirectUrl(request, {
      status: "error",
      message: "Missing authorization code"
    });
    return Response.redirect(redirectUrl);
  }

  const state = decodeState(stateParam);
  const orgId = state.orgId ?? process.env.SUPABASE_ORG_ID ?? "demo-org";
  const redirectUri = state.redirectUri ?? new URL(request.url).origin + "/api/integrations/google/callback";

  try {
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    const expiresAt = tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null;
    await upsertIntegration({
      orgId,
      provider: "google-calendar",
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      scope: state.scope ?? tokens.scope ?? null,
      tokenExpiresAt: expiresAt,
      metadata: {
        tokenType: tokens.token_type,
        idToken: tokens.id_token ?? null
      }
    });

    const redirectUrl = buildRedirectUrl(request, { status: "success" });
    return Response.redirect(redirectUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : "OAuth failed";
    const redirectUrl = buildRedirectUrl(request, { status: "error", message });
    return Response.redirect(redirectUrl);
  }
}
