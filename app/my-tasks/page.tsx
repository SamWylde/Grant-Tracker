"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useAuth } from "@/components/auth-context";
import { useGrantContext } from "@/components/grant-context";

function formatDisplayDate(date: string | null, timezone: string) {
  if (!date) return "No due date";
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(new Date(date));
  } catch (error) {
    console.error("Failed to format date", error);
    return date;
  }
}

export default function MyTasksPage() {
  const { user, isLoading } = useAuth();
  const { savedGrants, toggleTaskStatus, orgPreferences } = useGrantContext();
  const timezone = orgPreferences.timezone ?? "UTC";

  const assignments = useMemo(() => {
    const entries = [] as Array<{
      grantId: string;
      grantTitle: string;
      stage: string;
      taskId: string;
      label: string;
      dueDate: string | null;
      status: string;
    }>;
    if (!user) return entries;
    for (const [grantId, grant] of Object.entries(savedGrants)) {
      for (const task of grant.tasks ?? []) {
        const matchesAssignee =
          task.assigneeId === user.id || task.assigneeEmail?.toLowerCase() === user.email?.toLowerCase();
        if (!matchesAssignee) continue;
        entries.push({
          grantId,
          grantTitle: grant.title,
          stage: grant.stage,
          taskId: task.id,
          label: task.label,
          dueDate: task.dueDate ?? null,
          status: task.status
        });
      }
    }
    return entries.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return a.grantTitle.localeCompare(b.grantTitle);
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [savedGrants, user]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        Loading your tasks…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-center text-slate-200">
        <h1 className="text-2xl font-semibold text-white">Sign in to view &quot;My Tasks&quot;</h1>
        <p className="max-w-md text-sm text-slate-400">
          Authenticate with your Supabase account so we can personalize task assignments for you.
        </p>
        <Link
          href="/"
          className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-white/40 hover:text-white"
        >
          Return home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-white">My upcoming tasks</h1>
          <p className="text-sm text-slate-300">
            Stay ahead of due dates across every grant you&apos;re supporting. Check items off as you complete them.
          </p>
        </header>
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60">
          <table className="min-w-full divide-y divide-white/5 text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-300">
              <tr>
                <th className="px-4 py-3 font-medium">Grant</th>
                <th className="px-4 py-3 font-medium">Task</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-400">
                    No tasks assigned to you yet. Once teammates add you to a checklist item, it will appear here.
                  </td>
                </tr>
              ) : (
                assignments.map((task) => (
                  <tr key={task.taskId} className="transition hover:bg-white/5">
                    <td className="px-4 py-4 font-medium text-white">
                      <Link href={`/grants/${encodeURIComponent(task.grantId)}`} className="hover:underline">
                        {task.grantTitle}
                      </Link>
                    </td>
                    <td className="px-4 py-4">{task.label}</td>
                    <td className="px-4 py-4">{formatDisplayDate(task.dueDate, timezone)}</td>
                    <td className="px-4 py-4 text-xs uppercase tracking-wide text-slate-400">{task.stage}</td>
                    <td className="px-4 py-4">
                      <label className="inline-flex items-center gap-2 text-xs font-semibold">
                        <input
                          type="checkbox"
                          checked={task.status === "completed"}
                          onChange={(event) => toggleTaskStatus(task.grantId, task.taskId, event.target.checked)}
                          className="h-4 w-4 rounded border-white/20 bg-slate-900 text-emerald-500 focus:ring-emerald-400"
                        />
                        {task.status === "completed" ? "Completed" : "Pending"}
                      </label>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
