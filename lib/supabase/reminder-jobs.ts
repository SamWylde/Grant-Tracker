"use server";

import { getSupabaseServerClient, isSupabaseServerConfigured } from "./server";

export type ReminderJobStatus = "pending" | "sent" | "cancelled" | "failed";

export type ReminderJob = {
  id: string;
  orgId: string;
  orgGrantId: string | null;
  milestoneId: string | null;
  channel: string;
  sendAt: string;
  payload: Record<string, unknown>;
  status: ReminderJobStatus;
  dedupeKey: string | null;
};

type ReminderJobRow = {
  id: string;
  org_id: string;
  org_grant_id: string | null;
  milestone_id: string | null;
  channel: string;
  send_at: string;
  payload: Record<string, unknown> | null;
  status: ReminderJobStatus;
  dedupe_key: string | null;
};

export async function listDueReminderJobs(limit = 25): Promise<ReminderJob[]> {
  if (!isSupabaseServerConfigured()) return [];
  const client = getSupabaseServerClient();
  const { data, error } = await client
    .from("reminder_jobs")
    .select(
      "id,org_id,org_grant_id,milestone_id,channel,send_at,payload,status,dedupe_key"
    )
    .lte("send_at", new Date().toISOString())
    .eq("status", "pending")
    .order("send_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load reminder jobs: ${error.message}`);
  }

  return (data ?? []).map((row: ReminderJobRow) => ({
    id: row.id,
    orgId: row.org_id,
    orgGrantId: row.org_grant_id,
    milestoneId: row.milestone_id,
    channel: row.channel,
    sendAt: row.send_at,
    payload: row.payload ?? {},
    status: row.status,
    dedupeKey: row.dedupe_key
  }));
}

export async function markReminderJob(
  id: string,
  status: ReminderJobStatus,
  options: { error?: string } = {}
) {
  if (!isSupabaseServerConfigured()) return;
  const client = getSupabaseServerClient();
  const { error } = await client
    .from("reminder_jobs")
    .update({
      status,
      processed_at: new Date().toISOString(),
      error: options.error ?? null
    })
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to update reminder job ${id}: ${error.message}`);
  }
}

export async function enqueueReminderJob(job: {
  orgId: string;
  orgGrantId?: string | null;
  milestoneId?: string | null;
  channel: string;
  sendAt: string;
  payload?: Record<string, unknown>;
  dedupeKey?: string;
}) {
  if (!isSupabaseServerConfigured()) return;
  const client = getSupabaseServerClient();
  const { error } = await client.from("reminder_jobs").insert({
    org_id: job.orgId,
    org_grant_id: job.orgGrantId ?? null,
    milestone_id: job.milestoneId ?? null,
    channel: job.channel,
    send_at: job.sendAt,
    payload: job.payload ?? {},
    dedupe_key: job.dedupeKey ?? null
  });
  if (error) {
    throw new Error(`Failed to enqueue reminder job: ${error.message}`);
  }
}
