"use server";

import { getSupabaseServerClient, isSupabaseServerConfigured } from "./server";

type IntegrationRow = {
  id: string;
  org_id: string;
  provider: string;
  provider_account_id: string | null;
  access_token: string | null;
  refresh_token: string | null;
  scope: string | null;
  token_expires_at: string | null;
  metadata: Record<string, unknown> | null;
};

export type IntegrationPayload = {
  provider: string;
  orgId: string;
  providerAccountId?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  scope?: string | null;
  tokenExpiresAt?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function upsertIntegration(payload: IntegrationPayload) {
  if (!isSupabaseServerConfigured()) return;
  const client = getSupabaseServerClient();
  const { error } = await client.from("integrations").upsert(
    {
      org_id: payload.orgId,
      provider: payload.provider,
      provider_account_id: payload.providerAccountId ?? null,
      access_token: payload.accessToken ?? null,
      refresh_token: payload.refreshToken ?? null,
      scope: payload.scope ?? null,
      token_expires_at: payload.tokenExpiresAt ?? null,
      metadata: payload.metadata ?? {}
    },
    { onConflict: "org_id,provider" }
  );
  if (error) {
    throw new Error(`Failed to persist integration: ${error.message}`);
  }
}

export async function deleteIntegration(orgId: string, provider: string) {
  if (!isSupabaseServerConfigured()) return;
  const client = getSupabaseServerClient();
  const { error } = await client
    .from("integrations")
    .delete()
    .eq("org_id", orgId)
    .eq("provider", provider);
  if (error) {
    throw new Error(`Failed to delete integration: ${error.message}`);
  }
}
