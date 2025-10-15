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
