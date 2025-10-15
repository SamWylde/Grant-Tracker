import { readFile } from "node:fs/promises";

import type { GrantOpportunity } from "./grants";

const GRANTS_GOV_ENDPOINT =
  "https://www.grants.gov/grantsws/rest/opportunities/search";

async function fetchFromApi(): Promise<GrantOpportunity[]> {
  try {
    const params = new URLSearchParams({
      sortBy: "closeDate|desc",
      startRecordNum: "0",
      // request a small page of data so that the UI remains fast even without an API key
      // the API responds with JSON when the Accept header prefers it
      numberOfRecords: "50"
    });

    const response = await fetch(`${GRANTS_GOV_ENDPOINT}?${params.toString()}`, {
      headers: {
        Accept: "application/json"
      },
      // cache results on the server for an hour to avoid hammering the API
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch grants.gov data: ${response.status}`);
    }

    const payload = (await response.json()) as {
      opportunitySearchResults?: {
        opportunityNumber: string;
        opportunityTitle: string;
        agency: string;
        opportunityCategory: string;
        synopsis: string;
        fundingInstrumentType: string;
        estimatedFunding: number | null;
        awardCeiling: number | null;
        awardFloor: number | null;
        expectedNumberOfAwards: number | null;
        closeDate: string | null;
        postedDate: string | null;
        eligibility: {
          applicantType: string;
          applicantTypeCode: string;
          applicantTypeDescription: string;
        }[];
        cfdaList: { cfdaNumber: string; cfdaTitle: string }[];
        costSharingOrMatchingRequirement: string;
        eligibleApplicants: string;
        additionalInformationUrl: string | null;
        opportunityId: string;
        opportunityLink: string;
        agencyCode: string;
        agencyContact: string | null;
        agencyEmailAddress: string | null;
        categoryDescription: string | null;
        subAgency: string | null;
        fundingCategories: { category: string }[];
        fundingCategoryDescription: string | null;
        stateList: string[] | null;
      }[];
    };

    const items = payload.opportunitySearchResults ?? [];

    return items.map((item) => ({
      id: item.opportunityId ?? item.opportunityNumber,
      title: item.opportunityTitle,
      agency: item.agency,
      opportunityNumber: item.opportunityNumber,
      opportunityCategory: item.opportunityCategory,
      summary: item.synopsis,
      fundingInstrument: item.fundingInstrumentType,
      estimatedFunding: item.estimatedFunding ?? null,
      awardFloor: item.awardFloor ?? null,
      awardCeiling: item.awardCeiling ?? null,
      expectedNumberOfAwards: item.expectedNumberOfAwards ?? null,
      closeDate: item.closeDate ?? null,
      postedDate: item.postedDate ?? null,
      eligibilities: (item.eligibility ?? []).map((eligibility) => ({
        type: eligibility.applicantTypeDescription,
        states: item.stateList ?? []
      })),
      focusAreas: (item.fundingCategories ?? []).map((category) => category.category),
      url: item.opportunityLink
    }));
  } catch (error) {
    console.error("Falling back to bundled grant sample due to API error", error);
    return [];
  }
}

async function fetchFromSample(): Promise<GrantOpportunity[]> {
  const raw = await readFile("data/sample-grants.json", "utf-8");
  const parsed = JSON.parse(raw) as GrantOpportunity[];
  return parsed;
}

export async function fetchGrantOpportunities(): Promise<GrantOpportunity[]> {
  const [apiResults, sampleResults] = await Promise.all([
    fetchFromApi(),
    fetchFromSample()
  ]);

  // merge and de-duplicate by ID, preferring live API results when they are available
  const byId = new Map<string, GrantOpportunity>();
  for (const grant of [...sampleResults, ...apiResults]) {
    if (!grant.id) continue;
    byId.set(grant.id, grant);
  }

  return Array.from(byId.values());
}
