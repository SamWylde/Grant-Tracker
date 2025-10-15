import { NextResponse } from "next/server";

import { fetchOrgGrants, upsertOrgGrant } from "@/lib/supabase/org-grants";

export async function GET() {
  try {
    const grants = await fetchOrgGrants();
    return NextResponse.json({ grants });
  } catch (error) {
    console.error("Failed to fetch org grants", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { grant } = (await request.json()) as { grant?: Parameters<typeof upsertOrgGrant>[0] };
    if (!grant) {
      return NextResponse.json({ error: "Missing grant payload" }, { status: 400 });
    }

    await upsertOrgGrant(grant);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to upsert org grant", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
