export interface GrantsGovSearchRequest {
  keyword?: string;
  oppNum?: string;
  rows?: number;
  startRecordNum?: number;
  oppStatuses?: string;
  agencies?: string;
  fundingCategories?: string;
  aln?: string;
  eligibilities?: string;
  fundingInstruments?: string;
}

export interface GrantsGovSearchResponse {
  errorcode: number;
  msg: string;
  token: string;
  data: {
    hitCount: number;
    startRecord: number;
    oppHits: GrantsGovOpportunitySummary[];
    fundingCategories: Array<{ code: string; name: string; count: number }>;
    agencies: Array<{ code: string; name: string; count: number }>;
    eligibilities: Array<{ code: string; name: string; count: number }>;
  };
}

export interface GrantsGovOpportunitySummary {
  id: string;
  number: string;
  title: string;
  agencyCode: string;
  agencyName: string;
  oppStatus: string;
  closeDate?: string;
  openDate?: string;
  docType?: string;
}

export interface GrantsGovOpportunity {
  opportunityId: string;
  opportunityNumber: string;
  opportunityTitle: string;
  agencyCode: string;
  agencyName: string;
  oppStatus: string;
  synopsis: {
    synopsisDesc: string;
    awardCeiling: number | null;
    awardFloor: number | null;
    estimatedFunding: number | null;
    expectedNumberOfAwards: number | null;
    costSharing: string;
    alnList: Array<{ alnNumber: string; programTitle: string }>;
    fundingCategories: string[];
    applicantEligibility: string;
  };
  eligibility: Array<{
    applicantType: string;
    applicantTypeCode: string;
    applicantTypeDescription: string;
  }>;
  agencyContact: {
    agencyContactName?: string;
    agencyContactEmail?: string;
    agencyContactPhone?: string;
  };
  openDate?: string;
  closeDate?: string;
  archiveDate?: string;
  opportunityLink: string;
}

export interface GrantRecord {
  id?: string;
  external_id: string;
  grants_gov_id: string;
  title: string;
  agency: string;
  agency_code?: string;
  opportunity_number: string;
  opportunity_category?: string;
  opp_status: string;
  summary?: string | null;
  synopsis_desc?: string | null;
  funding_instrument?: string | null;
  estimated_funding?: number | null;
  award_floor?: number | null;
  award_ceiling?: number | null;
  expected_number_of_awards?: number | null;
  cost_sharing?: string | null;
  posted_date?: string | null;
  close_date?: string | null;
  archive_date?: string | null;
  eligibilities?: Array<{ type: string; code?: string } | Record<string, unknown>> | null;
  focus_areas?: string[] | null;
  funding_categories?: string[] | null;
  states?: string[] | null;
  url?: string | null;
  agency_contact_name?: string | null;
  agency_contact_email?: string | null;
  agency_contact_phone?: string | null;
  last_synced_at?: string;
}
