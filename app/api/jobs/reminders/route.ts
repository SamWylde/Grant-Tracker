import { NextRequest } from "next/server";

import { listDueReminderJobs, markReminderJob } from "@/lib/supabase/reminder-jobs";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Number.parseInt(limitParam, 10) || 25 : 25;

  try {
    const jobs = await listDueReminderJobs(limit);
    const processed: { id: string; status: string }[] = [];

    for (const job of jobs) {
      try {
        console.info("Dispatching reminder", {
          id: job.id,
          channel: job.channel,
          orgId: job.orgId,
          payload: job.payload
        });
        await markReminderJob(job.id, "sent");
        processed.push({ id: job.id, status: "sent" });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Dispatch failed";
        await markReminderJob(job.id, "failed", { error: message });
        processed.push({ id: job.id, status: "failed" });
      }
    }

    return Response.json({ count: processed.length, processed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process reminder jobs";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
