"use client";

import { FormEvent, useMemo, useState } from "react";

import { useAuth } from "./auth-context";
import { useGrantContext } from "./grant-context";

function formatDateInput(date: string | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

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

export function TaskChecklist({ grantId }: { grantId: string }) {
  const { user } = useAuth();
  const {
    savedGrants,
    addTask,
    updateTask,
    toggleTaskStatus,
    removeTask,
    orgPreferences
  } = useGrantContext();
  const grant = savedGrants[grantId];
  const timezone = orgPreferences.timezone ?? "UTC";

  const [label, setLabel] = useState("");
  const [dueDate, setDueDate] = useState<string>("");
  const [assignee, setAssignee] = useState<string>(user?.email ?? "");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const tasks = useMemo(() => {
    const items = grant?.tasks ?? [];
    return items
      .slice()
      .sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return a.label.localeCompare(b.label);
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [grant?.tasks]);

  if (!grant) {
    return null;
  }

  function resetForm() {
    setLabel("");
    setDueDate("");
    setAssignee(user?.email ?? "");
  }

  async function handleAddTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage(null);
    const trimmed = label.trim();
    if (!trimmed) {
      setStatusMessage("Add a task description.");
      return;
    }
    addTask(grantId, {
      label: trimmed,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      assigneeEmail: assignee || null,
      assigneeId: assignee && assignee === user?.email ? user?.id : null,
      assigneeName: assignee && assignee === user?.email ? user?.fullName ?? null : null,
      createdByEmail: user?.email ?? null,
      createdById: user?.id ?? null,
      createdByName: user?.fullName ?? null,
      status: "pending"
    });
    resetForm();
    setStatusMessage("Task added to checklist.");
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-5">
      <header className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-white">Task checklist</h2>
        <p className="text-sm text-slate-300">
          Assign workstreams with due dates so every collaborator knows what to tackle next.
        </p>
      </header>
      <form onSubmit={handleAddTask} className="mt-5 grid gap-3 rounded-2xl border border-dashed border-white/10 bg-slate-950/60 p-4 text-sm">
        <div className="grid gap-3 md:grid-cols-[2fr,1fr,1fr]">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Task</span>
            <input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Draft narrative, gather letters of support, etc."
              className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Due</span>
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Assignee</span>
            <input
              type="email"
              value={assignee}
              onChange={(event) => setAssignee(event.target.value)}
              placeholder="owner@nonprofit.org"
              className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500"
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="submit"
            className="rounded-lg bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/30 hover:text-white"
          >
            Add task
          </button>
          {statusMessage && <p className="text-xs text-slate-400">{statusMessage}</p>}
        </div>
      </form>
      <ul className="mt-6 divide-y divide-white/5 text-sm">
        {tasks.length === 0 ? (
          <li className="py-4 text-slate-400">No tasks yet. Add your first checklist item above.</li>
        ) : (
          tasks.map((task) => (
            <li key={task.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={task.status === "completed"}
                  onChange={(event) => toggleTaskStatus(grantId, task.id, event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-900 text-emerald-500 focus:ring-emerald-400"
                />
                <div>
                  <p className={`text-sm font-medium ${task.status === "completed" ? "text-slate-400 line-through" : "text-white"}`}>
                    {task.label}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatDisplayDate(task.dueDate, timezone)} • {task.assigneeEmail ? `Assigned to ${task.assigneeEmail}` : "Unassigned"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                <label className="flex items-center gap-2">
                  Due
                  <input
                    type="date"
                    value={formatDateInput(task.dueDate)}
                    onChange={(event) =>
                      updateTask(grantId, task.id, {
                        dueDate: event.target.value ? new Date(event.target.value).toISOString() : null
                      })
                    }
                    className="rounded border border-white/15 bg-slate-950/60 px-2 py-1 text-xs text-white"
                  />
                </label>
                <label className="flex items-center gap-2">
                  Assignee
                  <input
                    type="email"
                    value={task.assigneeEmail ?? ""}
                    onChange={(event) =>
                      updateTask(grantId, task.id, {
                        assigneeEmail: event.target.value || null
                      })
                    }
                    className="rounded border border-white/15 bg-slate-950/60 px-2 py-1 text-xs text-white"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeTask(grantId, task.id)}
                  className="rounded border border-white/15 px-3 py-1 font-semibold text-slate-200 transition hover:border-rose-400 hover:text-white"
                >
                  Remove
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
