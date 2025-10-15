"use client";

import { useEffect, useMemo, useState } from "react";

import { getUniqueFocusAreas, getUniqueStates } from "@/lib/grants";
import { describeOffset } from "@/lib/reminders";
import { generateIcsFeed } from "@/lib/calendar";

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

const REMINDER_CHANNEL_OPTIONS = [
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" }
] as const;

const TIMEZONE_OPTIONS = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "UTC"
];

export function OrgSettingsForm() {
  const { allGrants, orgPreferences, savedGrants, updatePreferences } = useGrantContext();
  const [icsDownloading, setIcsDownloading] = useState(false);
  const [icsCopied, setIcsCopied] = useState(false);

  const states = useMemo(() => getUniqueStates(allGrants), [allGrants]);
  const focusAreas = useMemo(() => {
    const existing = new Set(getUniqueFocusAreas(allGrants));
    for (const option of PRIORITY_FOCUS_OPTIONS) {
      existing.add(option.value);
    }
    return Array.from(existing).sort((a, b) => a.localeCompare(b));
  }, [allGrants]);

  useEffect(() => {
    if (!orgPreferences.timezone) {
      updatePreferences({
        ...orgPreferences,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC"
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const icsFeedUrl = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.grant-tracker.local";
    return `${base}/api/calendar/${orgPreferences.calendar.icsSecret}.ics`;
  }, [orgPreferences.calendar.icsSecret]);

  const milestonesWithReminders = useMemo(() => {
    const offsets = new Set<number>();
    for (const grant of Object.values(savedGrants)) {
      for (const milestone of grant.milestones ?? []) {
        for (const reminder of milestone.scheduledReminders ?? []) {
          offsets.add(reminder.offsetDays);
        }
      }
    }
    return Array.from(offsets).sort((a, b) => a - b).map((offset) => describeOffset(offset));
  }, [savedGrants]);

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
      <header className="mb-6 flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-white">Org onboarding defaults</h2>
        <p className="text-sm text-slate-300">
          Choose the geographies and focus areas you care about most. We use these
          preferences to surface the most relevant grants by default whenever you revisit the app.
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-2">
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
        <div className="md:col-span-2 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
              Deadline reminders
            </h3>
            <p className="mt-2 text-sm text-slate-300">
              Choose default channels and timezone for grant milestone reminders.
            </p>
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Timezone
                </label>
                <select
                  value={orgPreferences.timezone}
                  onChange={(event) =>
                    updatePreferences({
                      ...orgPreferences,
                      timezone: event.target.value
                    })
                  }
                  className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white"
                >
                  {TIMEZONE_OPTIONS.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Default channels
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {REMINDER_CHANNEL_OPTIONS.map((option) => {
                    const active = orgPreferences.reminderChannels.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          const next = active
                            ? orgPreferences.reminderChannels.filter((channel) => channel !== option.value)
                            : [...orgPreferences.reminderChannels, option.value];
                          updatePreferences({
                            ...orgPreferences,
                            reminderChannels: next.length > 0 ? next : [option.value]
                          });
                        }}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                          active
                            ? "border-emerald-400 bg-emerald-500/10 text-emerald-200"
                            : "border-white/10 bg-white/5 text-slate-200 hover:border-emerald-400 hover:text-white"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Reminders currently scheduled: {milestonesWithReminders.join(", ") || "None yet"}.
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Unsubscribe URL
                </label>
                <input
                  type="url"
                  value={orgPreferences.unsubscribeUrl}
                  onChange={(event) =>
                    updatePreferences({
                      ...orgPreferences,
                      unsubscribeUrl: event.target.value
                    })
                  }
                  className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                  placeholder="https://example.org/unsubscribe"
                />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
              Calendar sync
            </h3>
            <p className="mt-2 text-sm text-slate-300">
              Share deadlines through an ICS feed or sync a Google Calendar with bidirectional updates.
            </p>
            <div className="mt-4 space-y-4 text-sm">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Secure ICS feed
                </p>
                <div className="flex flex-col gap-2">
                  <code className="truncate rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-slate-200">
                    {icsFeedUrl}
                  </code>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <button
                      type="button"
                      className="rounded-full border border-emerald-400/60 bg-emerald-500/10 px-3 py-1 font-semibold text-emerald-100 transition hover:border-emerald-300 hover:text-white"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(icsFeedUrl);
                          setIcsCopied(true);
                          setTimeout(() => setIcsCopied(false), 2000);
                        } catch (error) {
                          console.error("Failed to copy ICS URL", error);
                        }
                      }}
                    >
                      {icsCopied ? "Copied" : "Copy link"}
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-white/10 px-3 py-1 font-semibold text-slate-200 transition hover:border-white/40 hover:text-white"
                      onClick={() => {
                        updatePreferences({
                          ...orgPreferences,
                          calendar: {
                            ...orgPreferences.calendar,
                            icsSecret:
                              globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 10)
                          }
                        });
                      }}
                    >
                      Regenerate link
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-white/10 px-3 py-1 font-semibold text-slate-200 transition hover:border-white/40 hover:text-white"
                      onClick={() => {
                        if (icsDownloading) return;
                        setIcsDownloading(true);
                        try {
                          const grants = Object.values(savedGrants).map((grant) => ({
                            id: grant.id,
                            title: grant.title,
                            milestones: (grant.milestones ?? []).map((milestone) => ({
                              label: milestone.label,
                              dueDate: milestone.dueDate
                            }))
                          }));
                          const ics = generateIcsFeed({
                            grants,
                            timezone: orgPreferences.timezone,
                            orgName: "Grant Tracker"
                          });
                          const blob = new Blob([ics], { type: "text/calendar" });
                          const url = URL.createObjectURL(blob);
                          const anchor = document.createElement("a");
                          anchor.href = url;
                          anchor.download = `grant-tracker-${orgPreferences.calendar.icsSecret}.ics`;
                          document.body.appendChild(anchor);
                          anchor.click();
                          document.body.removeChild(anchor);
                          URL.revokeObjectURL(url);
                        } catch (error) {
                          console.error("Failed to generate ICS feed", error);
                        } finally {
                          setIcsDownloading(false);
                        }
                      }}
                    >
                      {icsDownloading ? "Preparing…" : "Download ICS"}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  Last refreshed {orgPreferences.calendar.lastGeneratedAt ? new Date(orgPreferences.calendar.lastGeneratedAt).toLocaleString() : "never"}.
                </p>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Google Calendar (Pro)
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      orgPreferences.calendar.googleOAuthStatus === "connected"
                        ? "bg-emerald-500/10 text-emerald-200"
                        : orgPreferences.calendar.googleOAuthStatus === "expired"
                        ? "bg-amber-500/10 text-amber-200"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {orgPreferences.calendar.googleOAuthStatus === "connected"
                      ? "Connected"
                      : orgPreferences.calendar.googleOAuthStatus === "expired"
                      ? "Token expired"
                      : "Not connected"}
                  </span>
                  {orgPreferences.calendar.googleOAuthStatus !== "connected" ? (
                    <button
                      type="button"
                      className="rounded-full border border-emerald-400/60 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100 transition hover:border-emerald-300 hover:text-white"
                      onClick={() =>
                        updatePreferences({
                          ...orgPreferences,
                          calendar: {
                            ...orgPreferences.calendar,
                            googleOAuthStatus: "connected",
                            googleSyncEnabled: true,
                            googleCalendarId: "primary"
                          }
                        })
                      }
                    >
                      Connect Google
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="rounded-full border border-rose-400/60 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-100 transition hover:border-rose-300 hover:text-white"
                      onClick={() =>
                        updatePreferences({
                          ...orgPreferences,
                          calendar: {
                            ...orgPreferences.calendar,
                            googleOAuthStatus: "disconnected",
                            googleSyncEnabled: false,
                            googleCalendarId: null
                          }
                        })
                      }
                    >
                      Disconnect
                    </button>
                  )}
                </div>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={orgPreferences.calendar.googleSyncEnabled}
                    onChange={(event) =>
                      updatePreferences({
                        ...orgPreferences,
                        calendar: {
                          ...orgPreferences.calendar,
                          googleSyncEnabled: event.target.checked
                        }
                      })
                    }
                  />
                  Enable bidirectional sync
                </label>
                <div className="grid gap-2 text-xs text-slate-300">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={orgPreferences.calendar.syncCreate}
                      onChange={(event) =>
                        updatePreferences({
                          ...orgPreferences,
                          calendar: {
                            ...orgPreferences.calendar,
                            syncCreate: event.target.checked
                          }
                        })
                      }
                      disabled={!orgPreferences.calendar.googleSyncEnabled}
                    />
                    Create new events for milestone deadlines
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={orgPreferences.calendar.syncUpdate}
                      onChange={(event) =>
                        updatePreferences({
                          ...orgPreferences,
                          calendar: {
                            ...orgPreferences.calendar,
                            syncUpdate: event.target.checked
                          }
                        })
                      }
                      disabled={!orgPreferences.calendar.googleSyncEnabled}
                    />
                    Update events when milestones shift
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={orgPreferences.calendar.syncDelete}
                      onChange={(event) =>
                        updatePreferences({
                          ...orgPreferences,
                          calendar: {
                            ...orgPreferences.calendar,
                            syncDelete: event.target.checked
                          }
                        })
                      }
                      disabled={!orgPreferences.calendar.googleSyncEnabled}
                    />
                    Remove events if a milestone is cancelled
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
