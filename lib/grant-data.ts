import { readFile } from "node:fs/promises";

import type { GrantOpportunity } from "./grants";
import {
  GrantsRepository,
  mapGrantRecordsToOpportunities
} from "./supabase/grants-repository";
import { isSupabaseServerConfigured } from "./supabase/server";

async function fetchFromSupabase(): Promise<GrantOpportunity[]> {
  if (!isSupabaseServerConfigured()) {
    return [];
  }

  try {
    const repository = new GrantsRepository();
    const records = await repository.getGrants();
    return mapGrantRecordsToOpportunities(records);
  } catch (error) {
    console.error("Failed to fetch grants from Supabase", error);
    return [];
  }
}

async function fetchFromSample(): Promise<GrantOpportunity[]> {
  const raw = await readFile("data/sample-grants.json", "utf-8");
  const parsed = JSON.parse(raw) as GrantOpportunity[];
  return parsed;
}

export async function fetchGrantOpportunities(): Promise<GrantOpportunity[]> {
  const liveResults = await fetchFromSupabase();
  if (liveResults.length > 0) {
    return liveResults;
  }

  return fetchFromSample();
}
