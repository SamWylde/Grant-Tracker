"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { useGrantContext, type Priority, type Stage } from "./grant-context";

const PRIORITY_OPTIONS: Priority[] = ["High", "Medium", "Low"];
const STAGE_OPTIONS: Stage[] = ["Researching", "Drafting", "Submitted", "Awarded", "Declined"];

export function GrantDetailView({ grantId }: { grantId: string }) {
  const router = useRouter();
  const { savedGrants, updateGrantDetails, updateGrantStage } = useGrantContext();

  const grant = savedGrants[grantId];

  const [newAttachment, setNewAttachment] = useState("");

  const history = useMemo(() => grant?.history.slice().reverse() ?? [], [grant?.history]);

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
                  <Link
                    href={attachment}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-emerald-200 underline-offset-2 hover:underline"
                  >
                    {attachment}
                  </Link>
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
            <Link
              href={grant.url ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-slate-200 transition hover:border-white/40 hover:text-white"
            >
              View opportunity on Grants.gov
            </Link>
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
