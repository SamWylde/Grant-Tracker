"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { useGrantContext, type Priority, type Stage } from "./grant-context";

const STAGE_OPTIONS: Stage[] = ["Researching", "Drafting", "Submitted", "Awarded", "Declined"];
const PRIORITY_OPTIONS: Priority[] = ["High", "Medium", "Low"];

type TaskDraftState = {
  label: string;
  dueDate: string;
  assignee: string;
};

export function ManualGrantForm() {
  const { createManualGrant } = useGrantContext();
  const [title, setTitle] = useState("");
  const [agency, setAgency] = useState("");
  const [summary, setSummary] = useState("");
  const [closeDate, setCloseDate] = useState("");
  const [owner, setOwner] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [stage, setStage] = useState<Stage>("Researching");
  const [tasks, setTasks] = useState<TaskDraftState[]>([]);
  const [createdGrantId, setCreatedGrantId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const addEmptyTask = () => {
    setTasks((prev) => [...prev, { label: "", dueDate: "", assignee: "" }]);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    if (!title.trim() || !agency.trim()) {
      setStatus("Title and agency are required.");
      return;
    }
    const id = createManualGrant({
      title: title.trim(),
      agency: agency.trim(),
      summary: summary.trim(),
      closeDate: closeDate ? new Date(closeDate).toISOString() : null,
      owner: owner.trim() || undefined,
      notes,
      priority,
      stage,
      tasks: tasks
        .filter((task) => task.label.trim())
        .map((task) => ({
          label: task.label.trim(),
          dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null,
          assigneeEmail: task.assignee.trim() || null,
          status: "pending"
        })),
      source: "manual"
    });
    setCreatedGrantId(id);
    setStatus("Grant added to your workspace.");
    setTitle("");
    setAgency("");
    setSummary("");
    setCloseDate("");
    setOwner("");
    setNotes("");
    setPriority("Medium");
    setStage("Researching");
    setTasks([]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-white/10 bg-slate-900/60 p-6 text-sm text-slate-200">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-white">Log a manual opportunity</h1>
        <p className="text-sm text-slate-300">
          Capture prospects that aren&apos;t published on Grants.gov. They&apos;ll appear alongside your pipeline with full reminders and tasks.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Grant title</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
            placeholder="Local foundation opportunity"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Funding agency</span>
          <input
            value={agency}
            onChange={(event) => setAgency(event.target.value)}
            required
            className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
            placeholder="Community Foundation"
          />
        </label>
        <label className="md:col-span-2 flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Summary</span>
          <textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            className="h-24 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
            placeholder="Key fit notes or requirements"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Primary due date</span>
          <input
            type="date"
            value={closeDate}
            onChange={(event) => setCloseDate(event.target.value)}
            className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pipeline owner email</span>
          <input
            type="email"
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
            placeholder="teammate@nonprofit.org"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Stage</span>
          <select
            value={stage}
            onChange={(event) => setStage(event.target.value as Stage)}
            className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
          >
            {STAGE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Priority</span>
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as Priority)}
            className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Notes</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="h-24 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
          placeholder="Submission approach, contacts, or history"
        />
      </label>
      <section className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
        <header className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-white">Checklist tasks</h2>
          <p className="text-xs text-slate-400">
            Break the work down and assign it immediately. Leave blank if you&apos;ll create tasks later.
          </p>
        </header>
        {tasks.length === 0 && (
          <p className="text-xs text-slate-400">No tasks yet. Add your first item below.</p>
        )}
        {tasks.map((task, index) => (
          <div key={`task-${index}`} className="grid gap-3 md:grid-cols-[2fr,1fr,1fr,auto]">
            <input
              value={task.label}
              onChange={(event) => {
                const value = event.target.value;
                setTasks((prev) =>
                  prev.map((item, taskIndex) => (taskIndex === index ? { ...item, label: value } : item))
                );
              }}
              placeholder="Draft narrative"
              className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
            />
            <input
              type="date"
              value={task.dueDate}
              onChange={(event) => {
                const value = event.target.value;
                setTasks((prev) =>
                  prev.map((item, taskIndex) => (taskIndex === index ? { ...item, dueDate: value } : item))
                );
              }}
              className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
            />
            <input
              type="email"
              value={task.assignee}
              onChange={(event) => {
                const value = event.target.value;
                setTasks((prev) =>
                  prev.map((item, taskIndex) => (taskIndex === index ? { ...item, assignee: value } : item))
                );
              }}
              placeholder="owner@nonprofit.org"
              className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
            />
            <button
              type="button"
              onClick={() => setTasks((prev) => prev.filter((_, taskIndex) => taskIndex !== index))}
              className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-rose-400 hover:text-white"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addEmptyTask}
          className="rounded-lg border border-dashed border-white/20 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-emerald-400 hover:text-white"
        >
          Add task
        </button>
      </section>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <button
          type="submit"
          className="rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30 hover:text-white"
        >
          Save grant
        </button>
        {status && <p className="text-xs text-slate-400">{status}</p>}
        {createdGrantId && (
          <Link
            href={`/grants/${encodeURIComponent(createdGrantId)}`}
            className="text-xs font-semibold text-emerald-200 underline"
          >
            View grant details
          </Link>
        )}
      </div>
    </form>
  );
}
