import { NextRequest } from "next/server";

import config from "@/config/grants-gov.json";
import { GrantsGovClient } from "@/lib/grants-gov/client";
import { mapOpportunityToRecord } from "@/lib/grants-gov/mapper";
import type { GrantRecord, GrantsGovOpportunitySummary } from "@/lib/grants-gov/types";
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

    const rawOpportunities = searchResponse.data.oppHits;
    console.log(`[Grants Ingest] Found ${rawOpportunities.length} opportunities`);

    const maxRecordsSetting = Number(config.pagination?.maxRecords ?? 0);
    const opportunities =
      Number.isFinite(maxRecordsSetting) && maxRecordsSetting > 0
        ? rawOpportunities.slice(0, Math.min(maxRecordsSetting, rawOpportunities.length))
        : rawOpportunities;

    if (opportunities.length !== rawOpportunities.length) {
      console.log(
        `[Grants Ingest] Limiting processing to ${opportunities.length} opportunities based on pagination.maxRecords`
      );
    }

    let records: GrantRecord[] = [];

    if (config.filters.fetchDetails) {
      const concurrency = resolveDetailsConcurrency();
      console.log(
        `[Grants Ingest] Fetching detailed information with concurrency ${concurrency} (total ${opportunities.length})...`
      );
      records = await fetchDetailedOpportunityRecords(opportunities, client, concurrency);
    } else {
      records = opportunities.map((opportunity) => mapOpportunityToRecord(opportunity));
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
        fetched: rawOpportunities.length,
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

function resolveDetailsConcurrency(): number {
  const fromEnv = Number(process.env.GRANTS_GOV_FETCH_DETAILS_CONCURRENCY ?? 0);
  if (Number.isFinite(fromEnv) && fromEnv > 0) {
    return Math.floor(fromEnv);
  }
  return 5;
}

async function fetchDetailedOpportunityRecords(
  opportunities: GrantsGovOpportunitySummary[],
  client: GrantsGovClient,
  concurrency: number
): Promise<GrantRecord[]> {
  if (opportunities.length === 0) {
    return [];
  }

  const sanitizedConcurrency = Math.max(1, Math.min(concurrency, opportunities.length));
  const records: GrantRecord[] = new Array(opportunities.length);
  let nextIndex = 0;
  let processed = 0;

  const workers = Array.from({ length: sanitizedConcurrency }, () =>
    (async () => {
      for (;;) {
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
        }

        const processedCount = (processed += 1);
        if (processedCount % 25 === 0 || processedCount === opportunities.length) {
          console.log(`[Grants Ingest] Processed ${processedCount}/${opportunities.length} opportunities`);
        }
      }
    })()
  );

  await Promise.all(workers);

  return records;
}
