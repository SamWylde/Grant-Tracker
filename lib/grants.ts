import { readFile } from "node:fs/promises";

export type GrantOpportunity = {
  id: string;
  title: string;
  agency: string;
  opportunityNumber: string;
  opportunityCategory: string;
  summary: string;
  fundingInstrument: string;
  estimatedFunding: number | null;
  awardFloor: number | null;
  awardCeiling: number | null;
  expectedNumberOfAwards: number | null;
  closeDate: string | null;
  postedDate: string | null;
  eligibilities: {
    type: string;
    states: string[];
  }[];
  focusAreas: string[];
  url: string;
};

export type GrantSearchFilters = {
  states?: string[];
  focusAreas?: string[];
  dueWithinDays?: number | null;
  minAward?: number | null;
  maxAward?: number | null;
};

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

export function applyGrantFilters(
  grants: GrantOpportunity[],
  filters: GrantSearchFilters
): GrantOpportunity[] {
  return grants.filter((grant) => {
    if (filters.states && filters.states.length > 0) {
      const opportunityStates = new Set(
        grant.eligibilities.flatMap((eligibility) => eligibility.states)
      );
      const matchesState = filters.states.some((state) => opportunityStates.has(state));
      if (!matchesState) return false;
    }

    if (filters.focusAreas && filters.focusAreas.length > 0) {
      const matchesFocus = filters.focusAreas.some((focus) =>
        grant.focusAreas.map((area) => area.toLowerCase()).includes(focus.toLowerCase())
      );
      if (!matchesFocus) return false;
    }

    if (filters.dueWithinDays && filters.dueWithinDays > 0 && grant.closeDate) {
      const dueDate = new Date(grant.closeDate);
      const now = new Date();
      const limit = new Date(now.getTime() + filters.dueWithinDays * 24 * 60 * 60 * 1000);
      if (dueDate > limit) return false;
      if (dueDate < now) return false;
    }

    if (filters.minAward != null) {
      const award = grant.awardCeiling ?? grant.estimatedFunding ?? 0;
      if (award < filters.minAward) return false;
    }

    if (filters.maxAward != null) {
      const award = grant.awardCeiling ?? grant.estimatedFunding ?? Number.MAX_SAFE_INTEGER;
      if (award > filters.maxAward) return false;
    }

    return true;
  });
}

export function getUniqueStates(grants: GrantOpportunity[]): string[] {
  const states = new Set<string>();
  for (const grant of grants) {
    for (const eligibility of grant.eligibilities) {
      for (const state of eligibility.states) {
        states.add(state);
      }
    }
  }
  return Array.from(states).sort();
}

export function getUniqueFocusAreas(grants: GrantOpportunity[]): string[] {
  const focusAreas = new Set<string>();
  for (const grant of grants) {
    for (const focusArea of grant.focusAreas) {
      focusAreas.add(focusArea);
    }
  }
  return Array.from(focusAreas).sort();
}
