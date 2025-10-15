"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useGrantContext, type SavedGrant, type Stage } from "./grant-context";

const STAGES: Stage[] = ["Researching", "Drafting", "Submitted", "Awarded", "Declined"];

const PRIORITY_COLORS: Record<string, string> = {
  High: "bg-rose-500/20 text-rose-200 border-rose-400/50",
  Medium: "bg-amber-500/20 text-amber-100 border-amber-400/50",
  Low: "bg-emerald-500/20 text-emerald-100 border-emerald-400/50"
};

export function PipelineBoard() {
  const { savedGrants, updateGrantStage } = useGrantContext();
  const [noteByGrant, setNoteByGrant] = useState<Record<string, string>>({});

  const grantsByStage = useMemo(() => {
    const grouped: Record<Stage, SavedGrant[]> = {
      Researching: [],
      Drafting: [],
      Submitted: [],
      Awarded: [],
      Declined: []
    };

    for (const grant of Object.values(savedGrants)) {
      grouped[grant.stage]?.push(grant);
    }

    for (const stage of STAGES) {
      grouped[stage].sort((a, b) => {
        const dueA = a.closeDate ? new Date(a.closeDate).getTime() : Number.MAX_SAFE_INTEGER;
        const dueB = b.closeDate ? new Date(b.closeDate).getTime() : Number.MAX_SAFE_INTEGER;
        return dueA - dueB;
      });
    }

    return grouped;
  }, [savedGrants]);

  if (Object.keys(savedGrants).length === 0) {
    return (
      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 text-center text-sm text-slate-300">
        Save a grant from the discovery list to start tracking it in your pipeline.
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Pipeline board</h2>
          <p className="text-sm text-slate-300">
            Drag-free column updates: change the stage from the dropdown and we will log the move instantly.
          </p>
        </div>
      </header>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {STAGES.map((stage) => {
          const grants = grantsByStage[stage] ?? [];
          return (
            <div key={stage} className="flex min-h-[260px] flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <header className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                  {stage}
                </h3>
                <span className="text-xs text-slate-400">{grants.length}</span>
              </header>
              <div className="flex flex-1 flex-col gap-3">
                {grants.length === 0 && (
                  <p className="rounded-xl border border-dashed border-white/10 p-3 text-xs text-slate-500">
                    No grants here yet.
                  </p>
                )}
                {grants.map((grant) => {
                  const note = noteByGrant[grant.id] ?? "";
                  return (
                    <article key={grant.id} className="space-y-3 rounded-xl border border-white/10 bg-slate-900/70 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">{grant.agency}</p>
                          <p className="text-sm font-semibold text-white">{grant.title}</p>
                        </div>
                        <Link
                          href={`/grants/${encodeURIComponent(grant.id)}`}
                          className="text-xs font-medium text-emerald-300 underline-offset-2 hover:underline"
                        >
                          Details
                        </Link>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                        <span className={`rounded-full border px-2 py-0.5 ${PRIORITY_COLORS[grant.priority]}`}>
                          {grant.priority} priority
                        </span>
                        {grant.owner && (
                          <span className="rounded-full border border-white/10 px-2 py-0.5 text-slate-200">
                            Owner: {grant.owner}
                          </span>
                        )}
                        {grant.closeDate && (
                          <span className="rounded-full border border-white/10 px-2 py-0.5 text-slate-200">
                            Due {new Date(grant.closeDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <label className="text-slate-300">Move to:</label>
                        <select
                          value={grant.stage}
                          onChange={(event) => {
                            const nextStage = event.target.value as Stage;
                            updateGrantStage(grant.id, nextStage, note ? `Note: ${note}` : undefined);
                            setNoteByGrant((prev) => ({ ...prev, [grant.id]: "" }));
                          }}
                          className="flex-1 rounded-lg border border-white/10 bg-slate-950/70 px-2 py-1 text-xs text-white"
                        >
                          {STAGES.map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </div>
                      <textarea
                        placeholder="Add context for this move"
                        value={note}
                        onChange={(event) =>
                          setNoteByGrant((prev) => ({ ...prev, [grant.id]: event.target.value }))
                        }
                        className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-2 py-1 text-xs text-white placeholder:text-slate-500"
                      />
                      <div className="rounded-lg border border-white/5 bg-white/5 p-2 text-xs text-slate-300">
                        <p className="font-semibold text-slate-200">Stage history</p>
                        <ul className="mt-1 space-y-1">
                          {grant.history
                            .slice()
                            .reverse()
                            .map((entry, index) => (
                              <li key={`${grant.id}-history-${index}`}>
                                <span className="font-medium text-white">{entry.stage}</span> on{" "}
                                {new Date(entry.changedAt).toLocaleString()} {entry.note && `— ${entry.note}`}
                              </li>
                            ))}
                        </ul>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
