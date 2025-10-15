"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { describeOffset, formatReminderDate } from "@/lib/reminders";

import {
  useGrantContext,
  type Milestone,
  type Priority,
  type Stage
} from "./grant-context";
import { TaskChecklist } from "./task-checklist";

const PRIORITY_OPTIONS: Priority[] = ["High", "Medium", "Low"];
const STAGE_OPTIONS: Stage[] = ["Researching", "Drafting", "Submitted", "Awarded", "Declined"];

export function GrantDetailView({ grantId }: { grantId: string }) {
  const router = useRouter();
  const {
    savedGrants,
    updateGrantDetails,
    updateGrantStage,
    updateMilestone,
    addMilestone,
    removeMilestone,
    orgPreferences
  } = useGrantContext();

  const grant = savedGrants[grantId];

  const [newAttachment, setNewAttachment] = useState("");
  const [newMilestoneLabel, setNewMilestoneLabel] = useState("");

  const history = useMemo(() => grant?.history.slice().reverse() ?? [], [grant?.history]);
  const milestones = useMemo(() => {
    const items = grant?.milestones ?? [];
    return items
      .slice()
      .sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return a.label.localeCompare(b.label);
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [grant?.milestones]);
  const timezone = orgPreferences.timezone ?? "UTC";

  if (!grant) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-white">We couldn&apos;t find that grant.</h1>
        <p className="text-sm text-slate-300">
          Save an opportunity from the discovery workspace first, then open it here to manage details.
        </p>
        <button
          onClick={() => router.push("/#workspace")}
          className="mx-auto rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-white/40 hover:text-white"
        >
          Go back to workspace
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">{grant.agency}</p>
          <h1 className="text-3xl font-semibold text-white">{grant.title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-300">{grant.summary}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-white/40 hover:text-white"
        >
          Back
        </button>
      </div>
      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5">
            <h2 className="text-lg font-semibold text-white">Pipeline settings</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Stage">
                <select
                  value={grant.stage}
                  onChange={(event) => updateGrantStage(grantId, event.target.value as Stage)}
                  className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white"
                >
                  {STAGE_OPTIONS.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Owner">
                <input
                  type="text"
                  value={grant.owner ?? ""}
                  onChange={(event) => updateGrantDetails(grantId, { owner: event.target.value })}
                  placeholder="Assign a teammate"
                  className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                />
              </Field>
              <Field label="Priority">
                <div className="flex gap-2">
                  {PRIORITY_OPTIONS.map((priority) => {
                    const isActive = grant.priority === priority;
                    return (
                      <button
                        key={priority}
                        type="button"
                        onClick={() => updateGrantDetails(grantId, { priority })}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                          isActive
                            ? "border-emerald-400 bg-emerald-500/10 text-emerald-100"
                            : "border-white/10 bg-white/5 text-slate-200 hover:border-emerald-400 hover:text-white"
                        }`}
                      >
                        {priority}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>
            <Field label="Notes">
              <textarea
                value={grant.notes ?? ""}
                onChange={(event) => updateGrantDetails(grantId, { notes: event.target.value })}
                className="mt-2 h-32 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                placeholder="Capture strategy, required attachments, or reminders"
              />
            </Field>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5">
            <header className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold text-white">Deadline management & reminders</h2>
              <p className="text-sm text-slate-300">
                Track LOI, application, report, and custom milestones. Set due dates once and
                Grant Tracker will schedule reminders at T-30/14/7/3/1 and day-of across email and SMS without duplicating alerts.
              </p>
            </header>
            <div className="mt-5 space-y-4">
              {milestones.map((milestone) => (
                <MilestoneEditor
                  key={milestone.id}
                  milestone={milestone}
                  timezone={timezone}
                  onUpdate={(updates) => updateMilestone(grantId, milestone.id, updates)}
                  onRemove={() => removeMilestone(grantId, milestone.id)}
                  isCustom={milestone.type === "Custom"}
                  defaultChannels={orgPreferences.reminderChannels}
                  grantTitle={grant.title}
                />
              ))}
            </div>
            <form
              className="mt-5 flex flex-col gap-3 rounded-2xl border border-dashed border-white/10 bg-slate-950/50 p-4 text-sm"
              onSubmit={(event) => {
                event.preventDefault();
                const trimmed = newMilestoneLabel.trim();
                if (!trimmed) return;
                addMilestone(grantId, { label: trimmed, type: "Custom" });
                setNewMilestoneLabel("");
              }}
            >
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Add custom milestone
              </label>
              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  value={newMilestoneLabel}
                  onChange={(event) => setNewMilestoneLabel(event.target.value)}
                  placeholder="Site visit, board review, etc."
                  className="flex-1 rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  className="rounded-lg border border-emerald-400/60 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-300 hover:text-white"
                >
                  Add milestone
                </button>
              </div>
            </form>
          </div>
          <TaskChecklist grantId={grantId} />
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5">
            <h2 className="text-lg font-semibold text-white">Attachments & links</h2>
            <p className="mt-2 text-sm text-slate-300">
              Store URLs for working documents, budgets, or support letters so the whole team can find them quickly.
            </p>
            <form
              className="mt-3 flex flex-col gap-3 md:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                const trimmed = newAttachment.trim();
                if (!trimmed) return;
                const existing = grant.attachments ?? [];
                updateGrantDetails(grantId, {
                  attachments: Array.from(new Set([...existing, trimmed]))
                });
                setNewAttachment("");
              }}
            >
              <input
                value={newAttachment}
                onChange={(event) => setNewAttachment(event.target.value)}
                placeholder="https://"
                className="flex-1 rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white placeholder:text-slate-500"
              />
              <button
                type="submit"
                className="rounded-lg border border-emerald-400/50 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-300 hover:text-white"
              >
                Add link
              </button>
            </form>
            <ul className="mt-4 space-y-2 text-sm text-slate-200">
              {(grant.attachments ?? []).map((attachment) => (
                <li key={attachment} className="flex items-center justify-between gap-2 rounded-lg border border-white/10 px-3 py-2">
                  <a
                    href={attachment}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-emerald-200 underline-offset-2 hover:underline"
                  >
                    {attachment}
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      const filtered = (grant.attachments ?? []).filter((item) => item !== attachment);
                      updateGrantDetails(grantId, { attachments: filtered });
                    }}
                    className="text-xs text-slate-400 transition hover:text-rose-300"
                  >
                    Remove
                  </button>
                </li>
              ))}
              {grant.attachments?.length === 0 && <li className="text-xs text-slate-400">No attachments saved yet.</li>}
            </ul>
          </div>
        </div>
        <aside className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 text-sm text-slate-300">
            <h2 className="text-lg font-semibold text-white">Key facts</h2>
            <dl className="mt-3 space-y-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Opportunity #</dt>
                <dd className="text-white">{grant.opportunityNumber}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Due date</dt>
                <dd className="text-white">{grant.closeDate ? new Date(grant.closeDate).toLocaleDateString() : "Rolling"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Award ceiling</dt>
                <dd className="text-white">
                  {grant.awardCeiling
                    ? new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 0
                      }).format(grant.awardCeiling)
                    : "Not specified"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Focus areas</dt>
                <dd className="text-white">{grant.focusAreas.join(", ")}</dd>
              </div>
            </dl>
            <a
              href={grant.url ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-slate-200 transition hover:border-white/40 hover:text-white"
            >
              View opportunity on Grants.gov
            </a>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 text-sm text-slate-300">
            <h2 className="text-lg font-semibold text-white">Stage history</h2>
            <ul className="mt-3 space-y-2">
              {history.map((entry, index) => (
                <li key={`${entry.stage}-${index}`} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-slate-400">{entry.stage}</p>
                  <p className="text-sm text-white">{new Date(entry.changedAt).toLocaleString()}</p>
                  {entry.note && <p className="text-xs text-slate-300">{entry.note}</p>}
                </li>
              ))}
              {history.length === 0 && <li className="text-xs text-slate-400">No movements recorded yet.</li>}
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}

function MilestoneEditor({
  milestone,
  timezone,
  onUpdate,
  onRemove,
  isCustom,
  defaultChannels,
  grantTitle
}: {
  milestone: Milestone;
  timezone: string;
  onUpdate: (updates: Partial<Milestone>) => void;
  onRemove: () => void;
  isCustom: boolean;
  defaultChannels: Milestone["reminderChannels"];
  grantTitle: string;
}) {
  const channelOptions: Milestone["reminderChannels"] = ["email", "sms"];
  return (
    <article className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-200">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          {isCustom ? (
            <input
              value={milestone.label}
              onChange={(event) => onUpdate({ label: event.target.value })}
              className="rounded-lg border border-white/10 bg-transparent px-2 py-1 text-base font-semibold text-white"
            />
          ) : (
            <p className="text-base font-semibold text-white">{milestone.label}</p>
          )}
          <p className="text-xs uppercase tracking-wide text-slate-400">
            {milestone.type === "Custom" ? "Custom milestone" : milestone.type}
          </p>
        </div>
        {isCustom && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs font-semibold text-rose-200 underline-offset-2 hover:underline"
          >
            Remove
          </button>
        )}
      </header>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Due date
          </span>
          <input
            type="date"
            value={milestone.dueDate ?? ""}
            onChange={(event) => onUpdate({ dueDate: event.target.value || null })}
            className="rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Reminders
            </span>
            <p className="text-xs text-slate-400">Email & SMS at T-30/14/7/3/1/day-of.</p>
          </div>
          <input
            type="checkbox"
            checked={milestone.remindersEnabled}
            onChange={(event) =>
              onUpdate({
                remindersEnabled: event.target.checked,
                reminderChannels:
                  milestone.reminderChannels.length > 0
                    ? milestone.reminderChannels
                    : defaultChannels.length > 0
                    ? defaultChannels
                    : (["email"] as Milestone["reminderChannels"])
              })
            }
            className="h-4 w-4"
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {channelOptions.map((channel) => {
          const active = milestone.reminderChannels.includes(channel);
          return (
            <button
              key={channel}
              type="button"
              onClick={() => {
                if (!milestone.remindersEnabled) {
                  onUpdate({ remindersEnabled: true });
                }
                const next = active
                  ? milestone.reminderChannels.filter((item) => item !== channel)
                  : [...milestone.reminderChannels, channel];
                onUpdate({
                  reminderChannels: next.length > 0 ? next : [channel]
                });
              }}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                active
                  ? "border-emerald-400 bg-emerald-500/10 text-emerald-200"
                  : "border-white/10 bg-white/5 text-slate-200 hover:border-emerald-400 hover:text-white"
              }`}
            >
              {channel.toUpperCase()}
            </button>
          );
        })}
      </div>
      <div className="space-y-2 text-xs text-slate-300">
        <p className="font-semibold text-slate-200">Scheduled notifications</p>
        {milestone.remindersEnabled && milestone.scheduledReminders.length > 0 ? (
          <ul className="space-y-2">
            {milestone.scheduledReminders.map((reminder) => (
              <li
                key={`${milestone.id}-${reminder.channel}-${reminder.offsetDays}`}
                className="rounded-lg border border-white/10 bg-slate-950/60 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="font-semibold text-white">
                    {reminder.channel === "email" ? "Email" : "SMS"} · {describeOffset(reminder.offsetDays)}
                  </span>
                  <span className="text-slate-400">
                    {formatReminderDate(reminder.sendAt, timezone)} ({timezone})
                  </span>
                </div>
                {reminder.subject && (
                  <p className="mt-1 text-[11px] text-slate-300">
                    <span className="font-semibold text-slate-200">Subject:</span> {reminder.subject}
                  </p>
                )}
                <p className="mt-1 text-[11px] text-slate-400">
                  {reminder.preview}…
                </p>
                <p className="mt-2 text-[10px] uppercase tracking-wide text-slate-500">
                  Template respects {grantTitle} timezone ({timezone}) and unsubscribe flow.
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed border-white/10 p-3 text-slate-500">
            {milestone.dueDate
              ? "Enable reminders to automatically queue notifications."
              : "Add a due date to generate reminders."}
          </p>
        )}
      </div>
    </article>
  );
}

type FieldProps = {
  label: string;
  children: React.ReactNode;
};

function Field({ label, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-300">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      {children}
    </label>
  );
}
