import type { GrantOpportunity } from "@/lib/grants";
import type { GrantRecord } from "@/lib/grants-gov/types";
import {
  getSupabaseServerClient,
  isSupabaseServerConfigured
} from "./server";
import { getSupabaseServiceRoleClient } from "./service-role";

export class GrantsRepository {
  async upsertGrants(grants: GrantRecord[]): Promise<{ inserted: number; updated: number; errors: number }> {
    if (!grants.length) {
      return { inserted: 0, updated: 0, errors: 0 };
    }

    const client = getSupabaseServiceRoleClient();

    let affected = 0;
    let errors = 0;

    const chunkSize = 100;
    for (let index = 0; index < grants.length; index += chunkSize) {
      const chunk = grants.slice(index, index + chunkSize);
      const { data, error } = await client
        .from("grants")
        .upsert(chunk, { onConflict: "external_id", ignoreDuplicates: false })
        .select("id");

      if (error) {
        console.error("Upsert error", error);
        errors += chunk.length;
        continue;
      }

      affected += data?.length ?? 0;
    }

    return { inserted: affected, updated: 0, errors };
  }

  async getGrants(filters?: {
    states?: string[];
    focusAreas?: string[];
    dueWithinDays?: number | null;
    minAward?: number | null;
    maxAward?: number | null;
    query?: string;
  }): Promise<GrantRecord[]> {
    if (!isSupabaseServerConfigured()) {
      return [];
    }

    const client = getSupabaseServerClient();

    let query = client
      .from("grants")
      .select("*")
      .eq("opp_status", "posted")
      .order("close_date", { ascending: true });

    if (filters?.states && filters.states.length > 0) {
      query = query.overlaps("states", filters.states);
    }

    if (filters?.focusAreas && filters.focusAreas.length > 0) {
      query = query.overlaps("focus_areas", filters.focusAreas);
    }

    if (filters?.dueWithinDays && filters.dueWithinDays > 0) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + filters.dueWithinDays);
      query = query.lte("close_date", futureDate.toISOString().split("T")[0]);
    }

    if (filters?.minAward != null) {
      query = query.gte("award_ceiling", filters.minAward);
    }

    if (filters?.maxAward != null) {
      query = query.lte("award_ceiling", filters.maxAward);
    }

    if (filters?.query) {
      const term = filters.query;
      query = query.or(
        `title.ilike.%${term}%,agency.ilike.%${term}%,summary.ilike.%${term}%,synopsis_desc.ilike.%${term}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  async deleteOldGrants(daysOld = 180): Promise<void> {
    const client = getSupabaseServiceRoleClient();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { error } = await client
      .from("grants")
      .delete()
      .in("opp_status", ["closed", "archived"])
      .lt("close_date", cutoffDate.toISOString().split("T")[0]);

    if (error) {
      throw error;
    }
  }
}

export function mapGrantRecordToOpportunity(record: GrantRecord): GrantOpportunity {
  const eligibilities = Array.isArray(record.eligibilities)
    ? record.eligibilities.map((entry) => {
        if (typeof entry === "object" && entry && "type" in entry) {
          return {
            type: String(entry.type ?? ""),
            states: Array.isArray(record.states) ? record.states : []
          };
        }
        return { type: String(entry ?? ""), states: Array.isArray(record.states) ? record.states : [] };
      })
    : [];

  return {
    id: record.external_id ?? record.grants_gov_id,
    title: record.title,
    agency: record.agency,
    opportunityNumber: record.opportunity_number,
    opportunityCategory: record.opportunity_category ?? "",
    summary: record.summary ?? record.synopsis_desc ?? "",
    fundingInstrument: record.funding_instrument ?? "",
    estimatedFunding: record.estimated_funding ?? null,
    awardFloor: record.award_floor ?? null,
    awardCeiling: record.award_ceiling ?? null,
    expectedNumberOfAwards: record.expected_number_of_awards ?? null,
    closeDate: record.close_date ?? null,
    postedDate: record.posted_date ?? null,
    eligibilities,
    focusAreas: record.focus_areas ?? [],
    url: record.url ?? ""
  };
}

export function mapGrantRecordsToOpportunities(records: GrantRecord[]): GrantOpportunity[] {
  return records.map((record) => mapGrantRecordToOpportunity(record));
}
