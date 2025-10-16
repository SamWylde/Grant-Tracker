import { NextRequest } from "next/server";

import { generateIcsFeed } from "@/lib/calendar";
import { fetchOrgGrants } from "@/lib/supabase/org-grants";
import { fetchOrgPreferences } from "@/lib/supabase/org-preferences";
import { fetchOrgProfile } from "@/lib/supabase/orgs";

export const runtime = "nodejs";

function resolveSecret(request: NextRequest) {
  return request.nextUrl.searchParams.get("secret");
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const orgId = params.id;
  try {
    const [prefs, org, grants] = await Promise.all([
      fetchOrgPreferences(orgId),
      fetchOrgProfile(orgId),
      fetchOrgGrants(orgId)
    ]);

    const secret = resolveSecret(request);
    const expectedSecret = prefs?.calendar?.icsSecret ?? org?.calendarIcsSecret ?? null;
    if (expectedSecret && secret !== expectedSecret) {
      return new Response("Unauthorized", { status: 401 });
    }

    const timezone = prefs?.timezone ?? org?.timezone ?? "UTC";
    const orgName = org?.name ?? "Grant Tracker";

    const ics = generateIcsFeed({
      orgName,
      timezone,
      grants: grants.map((grant) => ({
        id: grant.id,
        title: grant.title,
        milestones: grant.milestones ?? []
      }))
    });

    return new Response(ics, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${orgId}.ics"`
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate calendar";
    return new Response(message, { status: 500 });
  }
}
