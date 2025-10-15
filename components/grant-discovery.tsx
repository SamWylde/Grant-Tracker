"use client";

import { useEffect, useMemo, useState } from "react";

import {
  applyGrantFilters,
  getUniqueFocusAreas,
  getUniqueStates,
  type GrantOpportunity
} from "@/lib/grants";

import { useGrantContext } from "./grant-context";

const DUE_OPTIONS = [
  { label: "Any due date", value: null },
  { label: "Due within 30 days", value: 30 },
  { label: "Due within 60 days", value: 60 },
  { label: "Due within 90 days", value: 90 }
];

const AMOUNT_OPTIONS = [
  { label: "Any amount", min: null, max: null },
  { label: "Under $50k", min: null, max: 50000 },
  { label: "$50k - $250k", min: 50000, max: 250000 },
  { label: "$250k - $1M", min: 250000, max: 1000000 },
  { label: "$1M+", min: 1000000, max: null }
];

type FiltersState = {
  states: string[];
  focusAreas: string[];
  dueWithinDays: number | null;
  minAward: number | null;
  maxAward: number | null;
};

function formatCurrency(value: number | null | undefined) {
  if (value == null) return "Not specified";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Rolling";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  } catch (error) {
    return value;
  }
}

export function GrantDiscovery() {
  const { allGrants, orgPreferences, savedGrants, toggleSaveGrant } = useGrantContext();

  const [filters, setFilters] = useState<FiltersState>({
    states: orgPreferences.states,
    focusAreas: orgPreferences.focusAreas,
    dueWithinDays: 60,
    minAward: null,
    maxAward: null
  });

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      states: orgPreferences.states,
      focusAreas: orgPreferences.focusAreas
    }));
  }, [orgPreferences.states, orgPreferences.focusAreas]);

  const states = useMemo(() => getUniqueStates(allGrants), [allGrants]);
  const focusAreas = useMemo(() => getUniqueFocusAreas(allGrants), [allGrants]);

  const filteredGrants = useMemo(() => {
    return applyGrantFilters(allGrants, filters);
  }, [allGrants, filters]);

  const prioritizedGrants = useMemo(() => {
    if (filters.states.length === 0 && filters.focusAreas.length === 0) {
      return filteredGrants;
    }

    return filteredGrants.sort((a, b) => {
      const aMatches = countMatches(a, filters);
      const bMatches = countMatches(b, filters);
      return bMatches - aMatches;
    });
  }, [filteredGrants, filters]);

  const savedGrantIds = useMemo(() => new Set(Object.keys(savedGrants)), [savedGrants]);

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
      <header className="mb-6 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Grant discovery pipeline</h2>
            <p className="text-sm text-slate-300">
              We ingest the Grants.gov catalogue, normalize key fields, and filter to the opportunities that match your onboarding defaults.
            </p>
          </div>
          <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
            {prioritizedGrants.length} matches
          </span>
        </div>
      </header>
      <div className="grid gap-6 lg:grid-cols-[320px,1fr] lg:items-start">
        <aside className="space-y-6">
          <FilterGroup title="States">
            <div className="flex flex-wrap gap-2">
              {states.map((state) => {
                const active = filters.states.includes(state);
                return (
                  <button
                    key={state}
                    type="button"
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      active
                        ? "border-emerald-400 bg-emerald-500/10 text-emerald-100"
                        : "border-white/10 bg-white/5 text-slate-200 hover:border-emerald-400 hover:text-white"
                    }`}
                    onClick={() => {
                      setFilters((prev) => ({
                        ...prev,
                        states: toggleArrayValue(prev.states, state)
                      }));
                    }}
                  >
                    {state}
                  </button>
                );
              })}
            </div>
          </FilterGroup>
          <FilterGroup title="Focus areas">
            <div className="flex flex-wrap gap-2">
              {focusAreas.map((focus) => {
                const active = filters.focusAreas.includes(focus);
                return (
                  <button
                    key={focus}
                    type="button"
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      active
                        ? "border-sky-400 bg-sky-500/10 text-sky-100"
                        : "border-white/10 bg-white/5 text-slate-200 hover:border-sky-400 hover:text-white"
                    }`}
                    onClick={() => {
                      setFilters((prev) => ({
                        ...prev,
                        focusAreas: toggleArrayValue(prev.focusAreas, focus)
                      }));
                    }}
                  >
                    {focus}
                  </button>
                );
              })}
            </div>
          </FilterGroup>
          <FilterGroup title="Due window">
            <div className="flex flex-col gap-2">
              {DUE_OPTIONS.map((option) => (
                <label key={option.label} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    className="h-3.5 w-3.5"
                    checked={filters.dueWithinDays === option.value}
                    onChange={() =>
                      setFilters((prev) => ({
                        ...prev,
                        dueWithinDays: option.value
                      }))
                    }
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </FilterGroup>
          <FilterGroup title="Funding amount">
            <div className="flex flex-col gap-2">
              {AMOUNT_OPTIONS.map((option) => (
                <label key={option.label} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    className="h-3.5 w-3.5"
                    checked={filters.minAward === option.min && filters.maxAward === option.max}
                    onChange={() =>
                      setFilters((prev) => ({
                        ...prev,
                        minAward: option.min,
                        maxAward: option.max
                      }))
                    }
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </FilterGroup>
        </aside>
        <div className="space-y-4">
          {prioritizedGrants.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 text-sm text-slate-300">
              No grants match your filters yet. Try broadening your due date range or removing focus areas.
            </div>
          )}
          {prioritizedGrants.map((grant) => {
            const isSaved = savedGrantIds.has(grant.id);
            return (
              <GrantCard
                key={grant.id}
                grant={grant}
                isSaved={isSaved}
                onToggle={() => toggleSaveGrant(grant)}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

type FilterGroupProps = {
  title: string;
  children: React.ReactNode;
};

function FilterGroup({ title, children }: FilterGroupProps) {
  return (
    <fieldset className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <legend className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

type GrantCardProps = {
  grant: GrantOpportunity;
  isSaved: boolean;
  onToggle: () => void;
};

function GrantCard({ grant, isSaved, onToggle }: GrantCardProps) {
  const amount = grant.awardCeiling ?? grant.estimatedFunding ?? null;
  const dueLabel = formatDate(grant.closeDate);
  const focusAreas = grant.focusAreas.length > 0 ? grant.focusAreas : ["General"]; // fallback

  return (
    <article className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 transition hover:border-white/20">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">{grant.agency}</p>
          <h3 className="text-lg font-semibold text-white">{grant.title}</h3>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            isSaved
              ? "border border-emerald-400/50 bg-emerald-500/10 text-emerald-100"
              : "border border-white/10 bg-white/5 text-slate-100 hover:border-emerald-400 hover:text-white"
          }`}
        >
          {isSaved ? "Saved" : "Save to pipeline"}
        </button>
      </header>
      <div className="mt-4 grid gap-4 text-sm text-slate-300 md:grid-cols-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Opportunity #</p>
          <p className="mt-1 font-medium text-white">{grant.opportunityNumber}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Due</p>
          <p className="mt-1 font-medium text-white">{dueLabel}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Award ceiling</p>
          <p className="mt-1 font-medium text-white">{formatCurrency(amount)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Focus areas</p>
          <p className="mt-1 font-medium text-white">{focusAreas.join(", ")}</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-300">{grant.summary}</p>
      <footer className="mt-4 flex flex-wrap items-center gap-3 text-xs">
        <a
          href={grant.url}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-white/10 px-3 py-1 text-slate-200 transition hover:border-white/40 hover:text-white"
        >
          View on Grants.gov
        </a>
        {grant.eligibilities.some((eligibility) => eligibility.states.length > 0) && (
          <span className="rounded-full border border-white/10 px-3 py-1 text-slate-300">
            Eligible states: {grant.eligibilities.flatMap((eligibility) => eligibility.states).join(", ")}
          </span>
        )}
      </footer>
    </article>
  );
}

function toggleArrayValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function countMatches(grant: GrantOpportunity, filters: FiltersState) {
  let score = 0;
  if (filters.states.length > 0) {
    const states = new Set(grant.eligibilities.flatMap((eligibility) => eligibility.states));
    for (const state of filters.states) {
      if (states.has(state)) score += 1;
    }
  }
  if (filters.focusAreas.length > 0) {
    const focus = grant.focusAreas.map((item) => item.toLowerCase());
    for (const item of filters.focusAreas) {
      if (focus.includes(item.toLowerCase())) score += 1;
    }
  }
  return score;
}
