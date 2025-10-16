import { NextRequest } from "next/server";

import config from "@/config/grants-gov.json";
import { GrantsGovClient } from "@/lib/grants-gov/client";
import { mapOpportunityToRecord } from "@/lib/grants-gov/mapper";
import type { GrantRecord } from "@/lib/grants-gov/types";
import { GrantsRepository } from "@/lib/supabase/grants-repository";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  console.log("[Grants Ingest] Starting sync job...");
  const startTime = Date.now();

  const client = new GrantsGovClient(process.env.GRANTS_GOV_USE_STAGING === "true");
  const repository = new GrantsRepository();

  try {
    console.log("[Grants Ingest] Searching for opportunities...");
    const searchResponse = await client.search(
      {
        oppStatuses: config.filters.oppStatuses,
        fundingCategories: config.filters.fundingCategories.join("|"),
        rows: config.pagination.rowsPerPage,
        startRecordNum: 0
      },
      true
    );

    const opportunities = searchResponse.data.oppHits;
    console.log(`[Grants Ingest] Found ${opportunities.length} opportunities`);

    const records: GrantRecord[] = [];

    if (config.filters.fetchDetails) {
      console.log("[Grants Ingest] Fetching detailed information...");

      for (let index = 0; index < opportunities.length; index += 1) {
        const opportunity = opportunities[index];

        try {
          const details = await client.fetchOpportunity(opportunity.id);
          const record = mapOpportunityToRecord(opportunity, details);
          records.push(record);
        } catch (error) {
          console.error(`[Grants Ingest] Failed to fetch details for ${opportunity.number}:`, error);
          records.push(mapOpportunityToRecord(opportunity));
        }

        if (index < opportunities.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }

        if ((index + 1) % 25 === 0) {
          console.log(`[Grants Ingest] Processed ${index + 1}/${opportunities.length} opportunities`);
        }
      }
    } else {
      for (const opportunity of opportunities) {
        records.push(mapOpportunityToRecord(opportunity));
      }
    }

    const minAwardAmount = config.filters.minAwardAmount ?? 0;
    const filteredRecords =
      minAwardAmount > 0
        ? records.filter((record) => {
            const value = record.award_ceiling ?? record.estimated_funding ?? null;
            return typeof value === "number" ? value >= minAwardAmount : true;
          })
        : records;

    console.log(`[Grants Ingest] Upserting ${filteredRecords.length} records to database...`);
    const upsertResult = await repository.upsertGrants(filteredRecords);

    if (config.cleanup.enabled) {
      console.log("[Grants Ingest] Cleaning up old grants...");
      await repository.deleteOldGrants(config.cleanup.deleteOldGrantsAfterDays);
    }

    const duration = Date.now() - startTime;
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      stats: {
        fetched: opportunities.length,
        processed: filteredRecords.length,
        ...upsertResult
      }
    };

    console.log("[Grants Ingest] Sync completed", response);

    return Response.json(response, { status: 200 });
  } catch (error) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : "Unknown error";

    console.error("[Grants Ingest] Sync failed", error);

    return Response.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        error: message
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
