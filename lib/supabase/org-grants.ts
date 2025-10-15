"use server";

import type {
  Milestone,
  SavedGrant,
  Stage,
  Task
} from "@/components/grant-context";
import { getSupabaseServerClient } from "./server";

type StageHistoryRecord = SavedGrant["history"][number] & { changed_at?: string };

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
  history: StageHistoryRecord[] | null;
  milestones: Milestone[] | null;
  tasks: Task[] | null;
  source: SavedGrant["source"] | null;
  opportunity_number: string | null;
  focus_areas: string[] | null;
  eligibilities: string[] | null;
  estimated_funding: number | null;
  award_floor: number | null;
  award_ceiling: number | null;
  expected_number_of_awards: number | null;
  created_at: string | null;
  updated_at: string | null;
};

const DEFAULT_ORG_ID =
  process.env.SUPABASE_ORG_ID ?? process.env.NEXT_PUBLIC_SUPABASE_ORG_ID ?? "demo-org";

function mapRowToSavedGrant(row: OrgGrantRow): SavedGrant {
  const history = (row.history ?? []).map((entry) => ({
    stage: entry.stage,
    changedAt: entry.changedAt ?? entry.changed_at ?? new Date().toISOString(),
    note: entry.note
  }));

  return {
    id: row.id,
    title: row.title,
    agency: row.agency,
    summary: row.summary ?? "",
    closeDate: row.close_date,
    postedDate: row.posted_date,
    url: row.url ?? "",
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
    eligibilities: row.eligibilities ?? [],
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
  return {
    id: grant.id,
    org_id: orgId,
    title: grant.title,
    agency: grant.agency,
    summary: grant.summary ?? "",
    close_date: grant.closeDate ?? null,
    posted_date: grant.postedDate ?? null,
    url: grant.url ?? "",
    stage: grant.stage,
    priority: grant.priority,
    notes: grant.notes ?? "",
    owner: grant.owner ?? null,
    attachments: grant.attachments ?? [],
    history: grant.history ?? [],
    milestones: grant.milestones ?? [],
    tasks: grant.tasks ?? [],
    source: grant.source ?? "manual",
    opportunity_number: grant.opportunityNumber ?? "",
    focus_areas: grant.focusAreas ?? [],
    eligibilities: grant.eligibilities ?? [],
    estimated_funding: grant.estimatedFunding ?? null,
    award_floor: grant.awardFloor ?? null,
    award_ceiling: grant.awardCeiling ?? null,
    expected_number_of_awards: grant.expectedNumberOfAwards ?? null,
    created_at: grant.createdAt ?? now,
    updated_at: now
  } as OrgGrantRow;
}

export async function fetchOrgGrants(orgId: string = DEFAULT_ORG_ID): Promise<SavedGrant[]> {
  const client = getSupabaseServerClient();
  const { data, error } = await client
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

  if (error) {
    throw new Error(`Failed to load org grants: ${error.message}`);
  }

  return (data ?? []).map((row) => mapRowToSavedGrant(row as OrgGrantRow));
}

export async function upsertOrgGrant(grant: SavedGrant, orgId: string = DEFAULT_ORG_ID) {
  const client = getSupabaseServerClient();
  const payload = mapSavedGrantToRow(grant, orgId);
  const { error } = await client.from("org_grants").upsert(payload, { onConflict: "id" });
  if (error) {
    throw new Error(`Failed to persist org grant ${grant.id}: ${error.message}`);
  }
}

export async function deleteOrgGrant(grantId: string, orgId: string = DEFAULT_ORG_ID) {
  const client = getSupabaseServerClient();
  const { error } = await client
    .from("org_grants")
    .delete()
    .eq("org_id", orgId)
    .eq("id", grantId);
  if (error) {
    throw new Error(`Failed to remove org grant ${grantId}: ${error.message}`);
  }
}
