"use server";

import type { OrgPreferences } from "@/components/grant-context";
import { getSupabaseServerClient } from "./server";

type OrgPreferencesRow = {
  org_id: string;
  states: string[] | null;
  focus_areas: string[] | null;
  timezone: string | null;
  reminder_channels: OrgPreferences["reminderChannels"] | null;
  unsubscribe_url: string | null;
  calendar: Partial<OrgPreferences["calendar"]> | null;
  sms_from_number: string | null;
  updated_at: string | null;
};

const DEFAULT_ORG_ID =
  process.env.SUPABASE_ORG_ID ?? process.env.NEXT_PUBLIC_SUPABASE_ORG_ID ?? "demo-org";

type SupabaseOptions = {
  signal?: AbortSignal;
};

export async function fetchOrgPreferences(
  orgId: string = DEFAULT_ORG_ID,
  options: SupabaseOptions = {}
): Promise<Partial<OrgPreferences> | null> {
  const client = getSupabaseServerClient();
  let query = client
    .from("org_preferences")
    .select(
      [
        "org_id",
        "states",
        "focus_areas",
        "timezone",
        "reminder_channels",
        "unsubscribe_url",
        "calendar",
        "sms_from_number",
        "updated_at"
      ].join(",")
    )
    .eq("org_id", orgId)
    .maybeSingle();

  if (options.signal) {
    query = query.abortSignal(options.signal);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load org preferences: ${error.message}`);
  }

  if (!data) return null;

  const row = data as OrgPreferencesRow;
  const next: Partial<OrgPreferences> = {};
  if (row.states !== null) next.states = row.states;
  if (row.focus_areas !== null) next.focusAreas = row.focus_areas;
  if (row.timezone !== null) next.timezone = row.timezone;
  if (row.reminder_channels !== null) next.reminderChannels = row.reminder_channels;
  if (row.unsubscribe_url !== null) next.unsubscribeUrl = row.unsubscribe_url;
  if (row.calendar !== null) next.calendar = row.calendar as OrgPreferences["calendar"];
  if (row.sms_from_number !== null) next.smsFromNumber = row.sms_from_number;
  return next;
}

export async function upsertOrgPreferences(
  preferences: OrgPreferences,
  orgId: string = DEFAULT_ORG_ID
) {
  const client = getSupabaseServerClient();
  const now = new Date().toISOString();
  const payload: OrgPreferencesRow = {
    org_id: orgId,
    states: preferences.states,
    focus_areas: preferences.focusAreas,
    timezone: preferences.timezone,
    reminder_channels: preferences.reminderChannels,
    unsubscribe_url: preferences.unsubscribeUrl,
    calendar: preferences.calendar,
    sms_from_number: preferences.smsFromNumber ?? null,
    updated_at: now
  };

  const { error } = await client
    .from("org_preferences")
    .upsert(payload, { onConflict: "org_id" });

  if (error) {
    throw new Error(`Failed to persist org preferences: ${error.message}`);
  }
}
