import { NextResponse } from "next/server";

import { fetchOrgPreferences, upsertOrgPreferences } from "@/lib/supabase/org-preferences";

export async function GET() {
  try {
    const preferences = await fetchOrgPreferences();
    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Failed to fetch org preferences", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { preferences } = (await request.json()) as {
      preferences?: Parameters<typeof upsertOrgPreferences>[0];
    };

    if (!preferences) {
      return NextResponse.json({ error: "Missing preferences payload" }, { status: 400 });
    }

    await upsertOrgPreferences(preferences);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to upsert org preferences", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
