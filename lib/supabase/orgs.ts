"use server";

import { getSupabaseServerClient, isSupabaseServerConfigured } from "./server";

type OrgRow = {
  id: string;
  name: string;
  slug: string | null;
  timezone: string | null;
  calendar_ics_secret: string | null;
};

export type OrgProfile = {
  id: string;
  name: string;
  slug?: string | null;
  timezone?: string | null;
  calendarIcsSecret?: string | null;
};

export async function fetchOrgProfile(orgId: string): Promise<OrgProfile | null> {
  if (!isSupabaseServerConfigured()) {
    return {
      id: orgId,
      name: "Demo Organization",
      timezone: "UTC"
    };
  }

  const client = getSupabaseServerClient();
  const { data, error } = await client
    .from("orgs")
    .select("id,name,slug,timezone,calendar_ics_secret")
    .eq("id", orgId)
    .maybeSingle<OrgRow>();

  if (error) {
    throw new Error(`Failed to load organization: ${error.message}`);
  }

  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    timezone: data.timezone,
    calendarIcsSecret: data.calendar_ics_secret
  };
}
