"use server";

import type {
  Milestone,
  SavedGrant,
  Stage,
  Task
} from "@/components/grant-context";
import { getSupabaseServerClient, isSupabaseServerConfigured } from "./server";

function applyAbortSignal<T>(query: T, signal?: AbortSignal): T {
  if (
    signal &&
    query &&
    typeof query === "object" &&
    typeof (query as { abortSignal?: (signal: AbortSignal) => T }).abortSignal === "function"
  ) {
    return (query as unknown as { abortSignal: (signal: AbortSignal) => T }).abortSignal(signal);
  }
  return query;
}

type StageHistoryRow = {
  stage: Stage;
  changed_at?: string;
  note?: string | null;
};

type OrgGrantRow = {
  id: string;
  org_id: string;
  title: string;
  agency: string;
  summary: string | null;
  close_date: string | null;
  posted_date: string | null;
  url: string | null;
  stage: Stage | null;
  priority: SavedGrant["priority"] | null;
  notes: string | null;
  owner: string | null;
  attachments: string[] | null;
  history: StageHistoryRow[] | null;
  milestones: Milestone[] | null;
  tasks: Task[] | null;
  source: SavedGrant["source"] | null;
  opportunity_number: string | null;
  opportunity_category?: string | null;
  funding_instrument?: string | null;
  focus_areas: string[] | null;
  eligibilities: string[] | null;
  estimated_funding: number | null;
  award_floor: number | null;
  award_ceiling: number | null;
  expected_number_of_awards: number | null;
  created_at: string | null;
  updated_at: string | null;
};

function getDefaultOrgId() {
  const orgId = process.env.SUPABASE_ORG_ID ?? process.env.NEXT_PUBLIC_SUPABASE_ORG_ID;
  if (!orgId) {
    throw new Error("Supabase org id environment variable is not configured");
  }
  return orgId;
}

type SupabaseOptions = {
  signal?: AbortSignal;
};

function mapRowToSavedGrant(row: OrgGrantRow): SavedGrant {
  const history = (row.history ?? []).map((entry: StageHistoryRow) => {
    const changedAt =
      entry.changed_at ?? (entry as StageHistoryRow & { changedAt?: string }).changedAt ?? new Date().toISOString();

    return {
      stage: entry.stage,
      changedAt,
      note: entry.note ?? undefined
    };
  });

  const eligibilityEntries = (row.eligibilities ?? []) as Array<string | { type: string; states?: string[] }>;
  const eligibilities = eligibilityEntries
    .map((entry) =>
      typeof entry === "string"
        ? { type: entry, states: [] as string[] }
        : { type: entry.type ?? "", states: entry.states ?? [] }
    )
    .filter((entry) => entry.type);

  return {
    id: row.id,
    title: row.title,
    agency: row.agency,
    summary: row.summary ?? "",
    closeDate: row.close_date,
    postedDate: row.posted_date,
    url: row.url ?? "",
    opportunityCategory: row.opportunity_category ?? "",
    fundingInstrument: row.funding_instrument ?? "",
    stage: (row.stage ?? "Researching") as SavedGrant["stage"],
    priority: (row.priority ?? "Medium") as SavedGrant["priority"],
    notes: row.notes ?? "",
    attachments: row.attachments ?? [],
    owner: row.owner ?? undefined,
    history,
    milestones: row.milestones ?? [],
    tasks: row.tasks ?? [],
    source: row.source ?? "manual",
    opportunityNumber: row.opportunity_number ?? "",
    focusAreas: row.focus_areas ?? [],
    eligibilities,
    estimatedFunding: row.estimated_funding ?? null,
    awardFloor: row.award_floor ?? null,
    awardCeiling: row.award_ceiling ?? null,
    expectedNumberOfAwards: row.expected_number_of_awards ?? null,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined
  } as SavedGrant;
}

function mapSavedGrantToRow(grant: SavedGrant, orgId: string): OrgGrantRow {
  const now = new Date().toISOString();
  const eligibilityTypes = (grant.eligibilities ?? [])
    .map((entry) => entry.type?.trim())
    .filter((value): value is string => Boolean(value));
  return {
    id: grant.id,
    org_id: orgId,
    title: grant.title,
    agency: grant.agency,
    summary: grant.summary ?? "",
    close_date: grant.closeDate ?? null,
    posted_date: grant.postedDate ?? null,
    url: grant.url ?? "",
    opportunity_category: grant.opportunityCategory ?? null,
    funding_instrument: grant.fundingInstrument ?? null,
    stage: grant.stage,
    priority: grant.priority,
    notes: grant.notes ?? "",
    owner: grant.owner ?? null,
    attachments: grant.attachments ?? [],
    history: (grant.history ?? []).map((entry) => ({
      stage: entry.stage,
      changed_at: entry.changedAt ?? now,
      note: entry.note ?? null
    } satisfies StageHistoryRow)),
    milestones: grant.milestones ?? [],
    tasks: grant.tasks ?? [],
    source: grant.source ?? "manual",
    opportunity_number: grant.opportunityNumber ?? "",
    focus_areas: grant.focusAreas ?? [],
    eligibilities: eligibilityTypes,
    estimated_funding: grant.estimatedFunding ?? null,
    award_floor: grant.awardFloor ?? null,
    award_ceiling: grant.awardCeiling ?? null,
    expected_number_of_awards: grant.expectedNumberOfAwards ?? null,
    created_at: grant.createdAt ?? now,
    updated_at: now
  } as OrgGrantRow;
}

function isOrgGrantRow(value: unknown): value is OrgGrantRow {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<OrgGrantRow>;
  return typeof candidate.id === "string" && typeof candidate.org_id === "string";
}

export async function fetchOrgGrants(
  orgId: string = getDefaultOrgId(),
  options: SupabaseOptions = {}
): Promise<SavedGrant[]> {
  if (!isSupabaseServerConfigured()) {
    return [];
  }
  const client = getSupabaseServerClient();
  let query = client
    .from("org_grants")
    .select(
      [
        "id",
        "org_id",
        "title",
        "agency",
        "summary",
        "close_date",
        "posted_date",
        "url",
        "stage",
        "priority",
        "notes",
        "owner",
        "attachments",
        "history",
        "milestones",
        "tasks",
        "source",
        "opportunity_number",
        "opportunity_category",
        "funding_instrument",
        "focus_areas",
        "eligibilities",
        "estimated_funding",
        "award_floor",
        "award_ceiling",
        "expected_number_of_awards",
        "created_at",
        "updated_at"
      ].join(",")
    )
    .eq("org_id", orgId)
    .order("updated_at", { ascending: false });

  query = applyAbortSignal(query, options.signal);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load org grants: ${error.message}`);
  }

  if (!Array.isArray(data)) {
    return [];
  }

  const rows: OrgGrantRow[] = [];
  for (const record of data) {
    if (isOrgGrantRow(record)) {
      rows.push(record);
    }
  }
  return rows.map((row) => mapRowToSavedGrant(row));
}

export async function upsertOrgGrant(
  grant: SavedGrant,
  orgId: string = getDefaultOrgId(),
  options: SupabaseOptions = {}
) {
  if (!isSupabaseServerConfigured()) {
    return;
  }
  const client = getSupabaseServerClient();
  const payload = mapSavedGrantToRow(grant, orgId);
  let query = client.from("org_grants").upsert(payload, { onConflict: "id" });
  query = applyAbortSignal(query, options.signal);
  const { error } = await query;
  if (error) {
    throw new Error(`Failed to persist org grant ${grant.id}: ${error.message}`);
  }
}

export async function deleteOrgGrant(
  grantId: string,
  orgId: string = getDefaultOrgId(),
  options: SupabaseOptions = {}
) {
  if (!isSupabaseServerConfigured()) {
    return;
  }
  const client = getSupabaseServerClient();
  let query = client
    .from("org_grants")
    .delete()
    .eq("org_id", orgId)
    .eq("id", grantId);
  query = applyAbortSignal(query, options.signal);
  const { error } = await query;
  if (error) {
    throw new Error(`Failed to remove org grant ${grantId}: ${error.message}`);
  }
}
