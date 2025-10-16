import { NextRequest } from "next/server";

import { deleteOrgGrant, fetchOrgGrants, upsertOrgGrant } from "@/lib/supabase/org-grants";

function resolveOrgId(request: NextRequest): string {
  const fromHeader = request.headers.get("x-org-id");
  if (fromHeader) return fromHeader;
  return process.env.SUPABASE_ORG_ID ?? process.env.NEXT_PUBLIC_SUPABASE_ORG_ID ?? "demo-org";
}

export async function GET(request: NextRequest) {
  try {
    const orgId = resolveOrgId(request);
    const grants = await fetchOrgGrants(orgId);
    return Response.json({ grants });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load grants";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const orgId = resolveOrgId(request);
    const body = await request.json();
    const grant = body?.grant;
    if (!grant || typeof grant !== "object") {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }
    await upsertOrgGrant(grant, orgId);
    return Response.json({ success: true, grantId: grant.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save grant";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}

export async function DELETE(request: NextRequest) {
  try {
    const orgId = resolveOrgId(request);
    const body = await request.json();
    const grantId = typeof body?.id === "string" ? body.id : undefined;
    if (!grantId) {
      return Response.json({ error: "Grant id required" }, { status: 400 });
    }
    await deleteOrgGrant(grantId, orgId);
    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete grant";
    return Response.json({ error: message }, { status: 500 });
  }
}
