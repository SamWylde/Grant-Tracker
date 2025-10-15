import { NextResponse } from "next/server";

import { deleteOrgGrant } from "@/lib/supabase/org-grants";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  if (!id) {
    return NextResponse.json({ error: "Missing grant id" }, { status: 400 });
  }

  try {
    await deleteOrgGrant(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete org grant", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
