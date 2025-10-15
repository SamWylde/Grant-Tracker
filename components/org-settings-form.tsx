"use client";

import { useMemo } from "react";

import { getUniqueFocusAreas, getUniqueStates } from "@/lib/grants";

import { useGrantContext } from "./grant-context";

const PRIORITY_FOCUS_OPTIONS = [
  { value: "Economic Development", label: "Economic Development" },
  { value: "Rural Development", label: "Rural Development" },
  { value: "Infrastructure", label: "Infrastructure" },
  { value: "Health", label: "Health" },
  { value: "Environment", label: "Environment" },
  { value: "Education", label: "Education" },
  { value: "Technology", label: "Technology" },
  { value: "Public Facilities", label: "Public Facilities" }
];

export function OrgSettingsForm() {
  const { allGrants, orgPreferences, updatePreferences } = useGrantContext();

  const states = useMemo(() => getUniqueStates(allGrants), [allGrants]);
  const focusAreas = useMemo(() => {
    const existing = new Set(getUniqueFocusAreas(allGrants));
    for (const option of PRIORITY_FOCUS_OPTIONS) {
      existing.add(option.value);
    }
    return Array.from(existing).sort((a, b) => a.localeCompare(b));
  }, [allGrants]);

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
      <header className="mb-6 flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-white">Org onboarding defaults</h2>
        <p className="text-sm text-slate-300">
          Choose the geographies and focus areas you care about most. We use these
          preferences to surface the most relevant grants by default whenever you revisit the app.
        </p>
      </header>
      <form className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-200">Focus geographies</label>
          <p className="mt-1 text-xs text-slate-400">Select up to five states that align with your programs.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {states.map((state) => {
              const selected = orgPreferences.states.includes(state);
              return (
                <button
                  key={state}
                  type="button"
                  onClick={() => {
                    const isSelected = orgPreferences.states.includes(state);
                    const nextStates = isSelected
                      ? orgPreferences.states.filter((item) => item !== state)
                      : [...orgPreferences.states, state].slice(0, 5);
                    updatePreferences({ ...orgPreferences, states: nextStates });
                  }}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    selected
                      ? "border-emerald-400 bg-emerald-500/10 text-emerald-200"
                      : "border-white/10 bg-white/5 text-slate-200 hover:border-emerald-400 hover:text-white"
                  }`}
                >
                  {state}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-200">Focus areas</label>
          <p className="mt-1 text-xs text-slate-400">We recommend grants that match at least one of these focus areas.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {focusAreas.map((focus) => {
              const selected = orgPreferences.focusAreas.includes(focus);
              return (
                <button
                  key={focus}
                  type="button"
                  onClick={() => {
                    const isSelected = orgPreferences.focusAreas.includes(focus);
                    const next = isSelected
                      ? orgPreferences.focusAreas.filter((item) => item !== focus)
                      : [...orgPreferences.focusAreas, focus].slice(0, 6);
                    updatePreferences({ ...orgPreferences, focusAreas: next });
                  }}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    selected
                      ? "border-sky-400 bg-sky-500/10 text-sky-100"
                      : "border-white/10 bg-white/5 text-slate-200 hover:border-sky-400 hover:text-white"
                  }`}
                >
                  {focus}
                </button>
              );
            })}
          </div>
        </div>
      </form>
    </section>
  );
}
