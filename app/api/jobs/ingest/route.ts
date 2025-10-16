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

    const availableOpportunities = searchResponse.data.oppHits;
    console.log(`[Grants Ingest] Found ${availableOpportunities.length} opportunities`);

    const maxRecords = Math.min(
      config.pagination.maxRecords ?? availableOpportunities.length,
      availableOpportunities.length
    );
    const opportunities = availableOpportunities.slice(0, maxRecords);

    if (opportunities.length < availableOpportunities.length) {
      console.log(
        `[Grants Ingest] Limiting processing to ${opportunities.length} opportunities per pagination.maxRecords`
      );
    }

    const detailConfig = config.details ?? {};
    const detailConcurrency = Math.max(1, detailConfig.concurrency ?? 5);
    const detailThrottleMs = Math.max(0, detailConfig.throttleMs ?? 0);
    const records: (GrantRecord | undefined)[] = new Array(opportunities.length);

    if (config.filters.fetchDetails && opportunities.length > 0) {
      console.log(
        `[Grants Ingest] Fetching detailed information with concurrency ${detailConcurrency}...`
      );

      let nextIndex = 0;
      let processed = 0;
      const workerCount = Math.min(detailConcurrency, opportunities.length);

      const workers = Array.from({ length: workerCount }, async () => {
        while (true) {
          const currentIndex = nextIndex;
          nextIndex += 1;

          if (currentIndex >= opportunities.length) {
            break;
          }

          const opportunity = opportunities[currentIndex];

          try {
            const details = await client.fetchOpportunity(opportunity.id);
            records[currentIndex] = mapOpportunityToRecord(opportunity, details);
          } catch (error) {
            console.error(`[Grants Ingest] Failed to fetch details for ${opportunity.number}:`, error);
            records[currentIndex] = mapOpportunityToRecord(opportunity);
          } finally {
            processed += 1;
            if (processed % 25 === 0 || processed === opportunities.length) {
              console.log(`[Grants Ingest] Processed ${processed}/${opportunities.length} opportunities`);
            }
          }

          if (detailThrottleMs > 0) {
            await delay(detailThrottleMs);
          }
        }
      });

      await Promise.all(workers);
    } else {
      for (let index = 0; index < opportunities.length; index += 1) {
        const opportunity = opportunities[index];
        records[index] = mapOpportunityToRecord(opportunity);
      }
    }

    const completedRecords = records.filter((record): record is GrantRecord => Boolean(record));

    const minAwardAmount = config.filters.minAwardAmount ?? 0;
    const filteredRecords =
      minAwardAmount > 0
        ? completedRecords.filter((record) => {
            const value = record.award_ceiling ?? record.estimated_funding ?? null;
            return typeof value === "number" ? value >= minAwardAmount : true;
          })
        : completedRecords;

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
        totalAvailable: availableOpportunities.length,
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

function delay(durationMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}
