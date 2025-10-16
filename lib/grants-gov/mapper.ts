import type {
  GrantRecord,
  GrantsGovOpportunity,
  GrantsGovOpportunitySummary
} from "./types";

function createSummary(text: string | undefined): string | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (trimmed.length <= 600) return trimmed;
  return `${trimmed.slice(0, 597)}...`;
}

function cleanNumber(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    return value === 0 ? null : value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "0" || trimmed.toUpperCase() === "TBD") {
      return null;
    }
    const parsed = Number(trimmed.replace(/[^0-9.\-]/g, ""));
    if (!Number.isFinite(parsed) || parsed === 0) {
      return null;
    }
    return parsed;
  }
  return null;
}

export function mapOpportunityToRecord(
  summary: GrantsGovOpportunitySummary,
  details?: GrantsGovOpportunity
): GrantRecord {
  const record: GrantRecord = {
    external_id: summary.number,
    grants_gov_id: summary.id,
    title: summary.title,
    agency: summary.agencyName,
    agency_code: summary.agencyCode,
    opportunity_number: summary.number,
    opportunity_category: summary.docType,
    opp_status: summary.oppStatus,
    close_date: summary.closeDate ?? null,
    posted_date: summary.openDate ?? null,
    url: `https://www.grants.gov/search-results-detail/${summary.id}`,
    last_synced_at: new Date().toISOString(),
    summary: null,
    synopsis_desc: null,
    funding_instrument: null,
    estimated_funding: null,
    award_floor: null,
    award_ceiling: null,
    expected_number_of_awards: null,
    cost_sharing: null,
    archive_date: null,
    funding_categories: null,
    focus_areas: null,
    eligibilities: null,
    states: null,
    agency_contact_name: null,
    agency_contact_email: null,
    agency_contact_phone: null
  };

  if (details) {
    const synopsis = details.synopsis?.synopsisDesc ?? undefined;

    record.synopsis_desc = synopsis ?? null;
    record.summary = createSummary(synopsis) ?? null;
    record.estimated_funding = cleanNumber(details.synopsis?.estimatedFunding);
    record.award_floor = cleanNumber(details.synopsis?.awardFloor);
    record.award_ceiling = cleanNumber(details.synopsis?.awardCeiling);
    record.expected_number_of_awards = cleanNumber(details.synopsis?.expectedNumberOfAwards);
    record.cost_sharing = details.synopsis?.costSharing ?? null;
    record.archive_date = details.archiveDate ?? null;
    record.funding_categories = details.synopsis?.fundingCategories ?? [];
    record.focus_areas = details.synopsis?.alnList?.map((entry) => entry.programTitle) ?? [];
    record.eligibilities = details.eligibility?.map((entry) => ({
      type: entry.applicantTypeDescription,
      code: entry.applicantTypeCode
    })) ?? [];
    record.agency_contact_name = details.agencyContact?.agencyContactName ?? null;
    record.agency_contact_email = details.agencyContact?.agencyContactEmail ?? null;
    record.agency_contact_phone = details.agencyContact?.agencyContactPhone ?? null;
    record.close_date = details.closeDate ?? record.close_date ?? null;
    record.posted_date = details.openDate ?? record.posted_date ?? null;
    record.url = details.opportunityLink ?? record.url ?? null;
  }

  return record;
}
