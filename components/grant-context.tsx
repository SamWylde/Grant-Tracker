"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState
} from "react";

import type { GrantOpportunity } from "@/lib/grants";
import {
  buildReminderSchedule,
  type ReminderChannel,
  type ReminderScheduleEntry
} from "@/lib/reminders";

type Stage = "Researching" | "Drafting" | "Submitted" | "Awarded" | "Declined";

type Priority = "High" | "Medium" | "Low";

type StageHistoryEntry = {
  stage: Stage;
  changedAt: string;
  note?: string;
};

type MilestoneType = "LOI" | "Application" | "Report" | "Custom";

type Milestone = {
  id: string;
  label: string;
  type: MilestoneType;
  dueDate: string | null;
  remindersEnabled: boolean;
  reminderChannels: ReminderChannel[];
  reminderOffsets: number[];
  scheduledReminders: ReminderScheduleEntry[];
  lastUpdatedAt: string;
};

type CalendarSettings = {
  icsSecret: string;
  lastGeneratedAt: string | null;
  googleSyncEnabled: boolean;
  googleCalendarId: string | null;
  googleOAuthStatus: "disconnected" | "connected" | "expired";
  syncCreate: boolean;
  syncUpdate: boolean;
  syncDelete: boolean;
};

type OrgPreferences = {
  states: string[];
  focusAreas: string[];
  timezone: string;
  reminderChannels: ReminderChannel[];
  unsubscribeUrl: string;
  calendar: CalendarSettings;
  smsFromNumber?: string | null;
};

type SavedGrant = GrantOpportunity & {
  stage: Stage;
  owner?: string;
  priority: Priority;
  notes: string;
  attachments: string[];
  history: StageHistoryEntry[];
  milestones: Milestone[];
};

type GrantContextValue = {
  allGrants: GrantOpportunity[];
  orgPreferences: OrgPreferences;
  savedGrants: Record<string, SavedGrant>;
  updatePreferences: (prefs: OrgPreferences) => void;
  toggleSaveGrant: (grant: GrantOpportunity) => void;
  updateGrantStage: (id: string, stage: Stage, note?: string) => void;
  updateGrantDetails: (
    id: string,
    updates: Partial<Pick<SavedGrant, "owner" | "priority" | "notes" | "attachments">>
  ) => void;
  updateMilestone: (
    id: string,
    milestoneId: string,
    updates: Partial<Milestone>
  ) => void;
  addMilestone: (id: string, milestone: Pick<Milestone, "label" | "type">) => void;
  removeMilestone: (id: string, milestoneId: string) => void;
};

type GrantProviderProps = {
  initialGrants: GrantOpportunity[];
  children: React.ReactNode;
};

type ToggleSaveAction = {
  type: "toggle-save";
  grant: GrantOpportunity;
  timezone: string;
  reminderDefaults: {
    channels: ReminderChannel[];
    unsubscribeUrl: string;
  };
};

type Action =
  | {
      type: "initialize";
      grants: Partial<SavedGrant>[];
      timezone: string;
      reminderDefaults: ToggleSaveAction["reminderDefaults"];
    }
  | ToggleSaveAction
  | { type: "update-stage"; id: string; stage: Stage; note?: string }
  | { type: "update-details"; id: string; updates: Partial<SavedGrant> }
  | {
      type: "update-milestone";
      id: string;
      milestoneId: string;
      updates: Partial<Milestone>;
      timezone: string;
      reminderDefaults: ToggleSaveAction["reminderDefaults"];
    }
  | {
      type: "add-milestone";
      id: string;
      milestone: Pick<Milestone, "label" | "type">;
      timezone: string;
      reminderDefaults: ToggleSaveAction["reminderDefaults"];
    }
  | {
      type: "remove-milestone";
      id: string;
      milestoneId: string;
    }
  | {
      type: "refresh-schedules";
      timezone: string;
      reminderDefaults: ToggleSaveAction["reminderDefaults"];
    };

type State = Record<string, SavedGrant>;

const GrantContext = createContext<GrantContextValue | undefined>(undefined);

const STORAGE_KEYS = {
  savedGrants: "grant-tracker:saved-grants",
  orgPreferences: "grant-tracker:org-preferences"
};

const DEFAULT_REMINDER_OFFSETS = [30, 14, 7, 3, 1, 0];

function generateId(prefix: string) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function ensureReminderChannels(
  channels: ReminderChannel[],
  defaults: ReminderChannel[]
) {
  if (channels.length > 0) return channels;
  if (defaults.length > 0) return defaults;
  return ["email"];
}

function createDefaultMilestones(
  reminderDefaults: ToggleSaveAction["reminderDefaults"],
  timezone: string,
  grant: GrantOpportunity
): Milestone[] {
  const now = new Date().toISOString();
  const baseMilestones: Pick<Milestone, "label" | "type">[] = [
    { label: "Letter of Intent", type: "LOI" },
    { label: "Application", type: "Application" },
    { label: "Report", type: "Report" }
  ];
  return baseMilestones.map(({ label, type }) =>
    applySchedule(
      {
        id: generateId("milestone"),
        label,
        type,
        dueDate: null,
        remindersEnabled: true,
        reminderChannels: ensureReminderChannels(
          reminderDefaults.channels,
          reminderDefaults.channels
        ),
        reminderOffsets: DEFAULT_REMINDER_OFFSETS,
        scheduledReminders: [],
        lastUpdatedAt: now
      },
      reminderDefaults,
      timezone,
      grant
    )
  );
}

function applySchedule(
  milestone: Milestone,
  reminderDefaults: ToggleSaveAction["reminderDefaults"],
  timezone: string,
  grant: GrantOpportunity
): Milestone {
  const nextMilestone: Milestone = {
    ...milestone,
    reminderChannels: ensureReminderChannels(
      milestone.reminderChannels,
      reminderDefaults.channels
    )
  };

  if (!nextMilestone.remindersEnabled || !nextMilestone.dueDate) {
    return {
      ...nextMilestone,
      scheduledReminders: []
    };
  }

  try {
    const schedule = buildReminderSchedule({
      grantTitle: grant.title,
      milestoneLabel: nextMilestone.label,
      dueDate: nextMilestone.dueDate,
      channels: nextMilestone.reminderChannels,
      offsets: nextMilestone.reminderOffsets,
      timezone,
      unsubscribeUrl: reminderDefaults.unsubscribeUrl
    });
    return {
      ...nextMilestone,
      scheduledReminders: schedule
    };
  } catch (error) {
    console.error("Failed to build reminder schedule", error);
    return {
      ...nextMilestone,
      scheduledReminders: []
    };
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "initialize": {
      const nextState: State = {};
      for (const grant of action.grants) {
        if (!grant.id) continue;
        const hydratedHistory = grant.history ?? [];
        const baseGrant: SavedGrant = {
          ...grant,
          id: grant.id,
          title: grant.title ?? "",
          agency: grant.agency ?? "",
          opportunityNumber: grant.opportunityNumber ?? "",
          opportunityCategory: grant.opportunityCategory ?? "",
          summary: grant.summary ?? "",
          fundingInstrument: grant.fundingInstrument ?? "",
          estimatedFunding: grant.estimatedFunding ?? null,
          awardFloor: grant.awardFloor ?? null,
          awardCeiling: grant.awardCeiling ?? null,
          expectedNumberOfAwards: grant.expectedNumberOfAwards ?? null,
          closeDate: grant.closeDate ?? null,
          postedDate: grant.postedDate ?? null,
          eligibilities: grant.eligibilities ?? [],
          focusAreas: grant.focusAreas ?? [],
          url: grant.url ?? "",
          stage: grant.stage ?? "Researching",
          priority: grant.priority ?? "Medium",
          notes: grant.notes ?? "",
          attachments: grant.attachments ?? [],
          owner: grant.owner,
          history: hydratedHistory,
          milestones: (grant.milestones ?? createDefaultMilestones(action.reminderDefaults, action.timezone, grant as GrantOpportunity)).map(
            (milestone) =>
              applySchedule(
                {
                  ...milestone,
                  reminderOffsets: milestone.reminderOffsets ?? DEFAULT_REMINDER_OFFSETS,
                  reminderChannels: ensureReminderChannels(
                    milestone.reminderChannels ?? [],
                    action.reminderDefaults.channels
                  ),
                  lastUpdatedAt: milestone.lastUpdatedAt ?? new Date().toISOString()
                },
                action.reminderDefaults,
                action.timezone,
                grant as GrantOpportunity
              )
          )
        } as SavedGrant;
        nextState[baseGrant.id] = baseGrant;
      }
      return nextState;
    }
    case "toggle-save": {
      if (state[action.grant.id]) {
        const nextState = { ...state };
        delete nextState[action.grant.id];
        return nextState;
      }

      const now = new Date().toISOString();
      return {
        ...state,
        [action.grant.id]: {
          ...action.grant,
          stage: "Researching",
          priority: "Medium",
          notes: "",
          attachments: [],
          history: [
            {
              stage: "Researching",
              changedAt: now,
              note: "Added to pipeline"
            }
          ],
          milestones: createDefaultMilestones(
            action.reminderDefaults,
            action.timezone,
            action.grant
          )
        }
      };
    }
    case "update-stage": {
      const existing = state[action.id];
      if (!existing) return state;
      const now = new Date().toISOString();
      const historyEntry: StageHistoryEntry = {
        stage: action.stage,
        changedAt: now,
        note: action.note
      };
      return {
        ...state,
        [action.id]: {
          ...existing,
          stage: action.stage,
          history: [...existing.history, historyEntry]
        }
      };
    }
    case "update-details": {
      const existing = state[action.id];
      if (!existing) return state;
      return {
        ...state,
        [action.id]: {
          ...existing,
          ...action.updates
        }
      };
    }
    case "update-milestone": {
      const existing = state[action.id];
      if (!existing) return state;
      const milestones = existing.milestones ?? [];
      const index = milestones.findIndex((item) => item.id === action.milestoneId);
      if (index === -1) return state;
      const target = milestones[index];
      const updated = applySchedule(
        {
          ...target,
          ...action.updates,
          lastUpdatedAt: new Date().toISOString()
        },
        action.reminderDefaults,
        action.timezone,
        existing
      );
      const nextMilestones = [...milestones];
      nextMilestones[index] = updated;
      return {
        ...state,
        [action.id]: {
          ...existing,
          milestones: nextMilestones
        }
      };
    }
    case "add-milestone": {
      const existing = state[action.id];
      if (!existing) return state;
      const base: Milestone = {
        id: generateId("milestone"),
        label: action.milestone.label,
        type: action.milestone.type,
        dueDate: null,
        remindersEnabled: true,
        reminderChannels: ensureReminderChannels(
          action.reminderDefaults.channels,
          action.reminderDefaults.channels
        ),
        reminderOffsets: DEFAULT_REMINDER_OFFSETS,
        scheduledReminders: [],
        lastUpdatedAt: new Date().toISOString()
      };
      const withSchedule = applySchedule(
        base,
        action.reminderDefaults,
        action.timezone,
        existing
      );
      return {
        ...state,
        [action.id]: {
          ...existing,
          milestones: [...(existing.milestones ?? []), withSchedule]
        }
      };
    }
    case "remove-milestone": {
      const existing = state[action.id];
      if (!existing) return state;
      return {
        ...state,
        [action.id]: {
          ...existing,
          milestones: (existing.milestones ?? []).filter(
            (milestone) => milestone.id !== action.milestoneId
          )
        }
      };
    }
    case "refresh-schedules": {
      const nextState: State = {};
      for (const [grantId, grant] of Object.entries(state)) {
        const milestones = (grant.milestones ?? []).map((milestone) =>
          applySchedule(
            milestone,
            action.reminderDefaults,
            action.timezone,
            grant
          )
        );
        nextState[grantId] = {
          ...grant,
          milestones
        };
      }
      return nextState;
    }
    default:
      return state;
  }
}

export function GrantProvider({ initialGrants, children }: GrantProviderProps) {
  const [allGrants] = useState(initialGrants);
  const [savedGrants, dispatch] = useReducer(reducer, {});
  const [orgPreferences, setOrgPreferences] = useState<OrgPreferences>(() => ({
    states: [],
    focusAreas: [],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC",
    reminderChannels: ["email"],
    unsubscribeUrl: "https://example.org/unsubscribe",
    calendar: {
      icsSecret: generateId("ics"),
      lastGeneratedAt: null,
      googleSyncEnabled: false,
      googleCalendarId: null,
      googleOAuthStatus: "disconnected",
      syncCreate: true,
      syncUpdate: true,
      syncDelete: true
    },
    smsFromNumber: null
  }));
  const hasHydratedGrants = useRef(false);

  // hydrate saved grants from localStorage
  useEffect(() => {
    if (hasHydratedGrants.current) return;
    const stored = window.localStorage.getItem(STORAGE_KEYS.savedGrants);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<SavedGrant>[];
        dispatch({
          type: "initialize",
          grants: parsed,
          timezone: orgPreferences.timezone ?? "UTC",
          reminderDefaults: {
            channels: orgPreferences.reminderChannels,
            unsubscribeUrl: orgPreferences.unsubscribeUrl
          }
        });
      } catch (error) {
        console.error("Failed to parse saved grants", error);
      }
    }
    hasHydratedGrants.current = true;
  }, [orgPreferences.reminderChannels, orgPreferences.timezone, orgPreferences.unsubscribeUrl]);

  // hydrate org preferences
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEYS.orgPreferences);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as OrgPreferences;
        setOrgPreferences((prev) => ({
          ...prev,
          ...parsed,
          calendar: {
            icsSecret: parsed.calendar?.icsSecret ?? prev.calendar.icsSecret,
            lastGeneratedAt: parsed.calendar?.lastGeneratedAt ?? prev.calendar.lastGeneratedAt,
            googleSyncEnabled:
              parsed.calendar?.googleSyncEnabled ?? prev.calendar.googleSyncEnabled,
            googleCalendarId:
              parsed.calendar?.googleCalendarId ?? prev.calendar.googleCalendarId,
            googleOAuthStatus:
              parsed.calendar?.googleOAuthStatus ?? prev.calendar.googleOAuthStatus,
            syncCreate: parsed.calendar?.syncCreate ?? prev.calendar.syncCreate,
            syncUpdate: parsed.calendar?.syncUpdate ?? prev.calendar.syncUpdate,
            syncDelete: parsed.calendar?.syncDelete ?? prev.calendar.syncDelete
          }
        }));
      } catch (error) {
        console.error("Failed to parse org preferences", error);
      }
    }
  }, []);

  // persist saved grants
  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEYS.savedGrants,
      JSON.stringify(Object.values(savedGrants))
    );
  }, [savedGrants]);

  // persist org preferences
  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEYS.orgPreferences,
      JSON.stringify(orgPreferences)
    );
  }, [orgPreferences]);

  // refresh reminder schedules whenever timezone or unsubscribe URL changes
  useEffect(() => {
    dispatch({
      type: "refresh-schedules",
      timezone: orgPreferences.timezone ?? "UTC",
      reminderDefaults: {
        channels: orgPreferences.reminderChannels,
        unsubscribeUrl: orgPreferences.unsubscribeUrl
      }
    });
  }, [orgPreferences.timezone, orgPreferences.unsubscribeUrl, orgPreferences.reminderChannels]);

  // update calendar refresh timestamp when grants change
  useEffect(() => {
    setOrgPreferences((prev) => ({
      ...prev,
      calendar: {
        ...prev.calendar,
        lastGeneratedAt: new Date().toISOString()
      }
    }));
  }, [savedGrants]);

  const toggleSaveGrant = useCallback((grant: GrantOpportunity) => {
    dispatch({
      type: "toggle-save",
      grant,
      timezone: orgPreferences.timezone ?? "UTC",
      reminderDefaults: {
        channels: orgPreferences.reminderChannels,
        unsubscribeUrl: orgPreferences.unsubscribeUrl
      }
    });
  }, [orgPreferences.reminderChannels, orgPreferences.timezone, orgPreferences.unsubscribeUrl]);

  const updateGrantStage = useCallback((id: string, stage: Stage, note?: string) => {
    dispatch({ type: "update-stage", id, stage, note });
  }, []);

  const updateGrantDetails = useCallback(
    (
      id: string,
      updates: Partial<Pick<SavedGrant, "owner" | "priority" | "notes" | "attachments">>
    ) => {
      dispatch({ type: "update-details", id, updates: updates as Partial<SavedGrant> });
    },
    []
  );

  const updateMilestone = useCallback(
    (id: string, milestoneId: string, updates: Partial<Milestone>) => {
      dispatch({
        type: "update-milestone",
        id,
        milestoneId,
        updates,
        timezone: orgPreferences.timezone ?? "UTC",
        reminderDefaults: {
          channels: orgPreferences.reminderChannels,
          unsubscribeUrl: orgPreferences.unsubscribeUrl
        }
      });
    },
    [orgPreferences.reminderChannels, orgPreferences.timezone, orgPreferences.unsubscribeUrl]
  );

  const addMilestone = useCallback(
    (id: string, milestone: Pick<Milestone, "label" | "type">) => {
      dispatch({
        type: "add-milestone",
        id,
        milestone,
        timezone: orgPreferences.timezone ?? "UTC",
        reminderDefaults: {
          channels: orgPreferences.reminderChannels,
          unsubscribeUrl: orgPreferences.unsubscribeUrl
        }
      });
    },
    [orgPreferences.reminderChannels, orgPreferences.timezone, orgPreferences.unsubscribeUrl]
  );

  const removeMilestone = useCallback(
    (id: string, milestoneId: string) => {
      dispatch({ type: "remove-milestone", id, milestoneId });
    },
    []
  );

  const value: GrantContextValue = useMemo(
    () => ({
      allGrants,
      orgPreferences,
      savedGrants,
      updatePreferences: setOrgPreferences,
      toggleSaveGrant,
      updateGrantStage,
      updateGrantDetails,
      updateMilestone,
      addMilestone,
      removeMilestone
    }),
    [
      allGrants,
      orgPreferences,
      savedGrants,
      toggleSaveGrant,
      updateGrantStage,
      updateGrantDetails,
      updateMilestone,
      addMilestone,
      removeMilestone
    ]
  );

  return <GrantContext.Provider value={value}>{children}</GrantContext.Provider>;
}

export function useGrantContext(): GrantContextValue {
  const context = useContext(GrantContext);
  if (!context) {
    throw new Error("useGrantContext must be used within a GrantProvider");
  }
  return context;
}

export type {
  OrgPreferences,
  SavedGrant,
  Stage,
  StageHistoryEntry,
  Priority,
  ReminderChannel,
  Milestone,
  ReminderScheduleEntry
};
