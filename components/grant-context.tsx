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

import { deleteOrgGrant, fetchOrgGrants, upsertOrgGrant } from "@/lib/supabase/org-grants";
import {
  fetchOrgPreferences,
  upsertOrgPreferences
} from "@/lib/supabase/org-preferences";

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

type TaskStatus = "pending" | "completed";

type Task = {
  id: string;
  label: string;
  dueDate: string | null;
  status: TaskStatus;
  assigneeId?: string | null;
  assigneeName?: string | null;
  assigneeEmail?: string | null;
  milestoneId?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  createdById?: string | null;
  createdByName?: string | null;
  createdByEmail?: string | null;
};

type TaskDraft = Omit<
  Task,
  "id" | "status" | "createdAt" | "updatedAt" | "completedAt"
> & { id?: string; status?: TaskStatus };

type ManualGrantInput = {
  id?: string;
  title: string;
  agency: string;
  summary?: string;
  closeDate?: string | null;
  postedDate?: string | null;
  url?: string;
  owner?: string;
  priority?: Priority;
  stage?: Stage;
  notes?: string;
  estimatedFunding?: number | null;
  awardFloor?: number | null;
  awardCeiling?: number | null;
  focusAreas?: string[];
  eligibilities?: string[];
  opportunityNumber?: string;
  tasks?: TaskDraft[];
  milestones?: Partial<Milestone>[];
  source?: SavedGrant["source"];
};

type ImportedGrantInput = ManualGrantInput;

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
  tasks: Task[];
  source?: "grants.gov" | "manual" | "imported";
  createdAt?: string;
  updatedAt?: string;
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
  addTask: (id: string, task: TaskDraft) => void;
  updateTask: (id: string, taskId: string, updates: Partial<Task>) => void;
  toggleTaskStatus: (id: string, taskId: string, completed: boolean) => void;
  removeTask: (id: string, taskId: string) => void;
  createManualGrant: (input: ManualGrantInput) => string;
  bulkImportGrants: (grants: ImportedGrantInput[]) => {
    imported: string[];
    skipped: string[];
  };
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
    }
  | { type: "add-task"; id: string; task: TaskDraft }
  | {
      type: "update-task";
      id: string;
      taskId: string;
      updates: Partial<Task>;
    }
  | { type: "remove-task"; id: string; taskId: string }
  | { type: "toggle-task"; id: string; taskId: string; completed: boolean }
  | {
      type: "upsert-grant";
      grant: ManualGrantInput & { id: string };
      timezone: string;
      reminderDefaults: ToggleSaveAction["reminderDefaults"];
    }
  | {
      type: "bulk-import";
      grants: (ManualGrantInput & { id: string })[];
      timezone: string;
      reminderDefaults: ToggleSaveAction["reminderDefaults"];
    };

type State = Record<string, SavedGrant>;

const GrantContext = createContext<GrantContextValue | undefined>(undefined);

const DEFAULT_REMINDER_OFFSETS = [30, 14, 7, 3, 1, 0];

function generateId(prefix: string) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function mergeOrgPreferences(
  base: OrgPreferences,
  patch: Partial<OrgPreferences>
): OrgPreferences {
  const next: OrgPreferences = {
    ...base,
    ...(patch.states !== undefined ? { states: patch.states } : {}),
    ...(patch.focusAreas !== undefined ? { focusAreas: patch.focusAreas } : {}),
    ...(patch.timezone !== undefined ? { timezone: patch.timezone } : {}),
    ...(patch.reminderChannels !== undefined
      ? { reminderChannels: patch.reminderChannels }
      : {}),
    ...(patch.unsubscribeUrl !== undefined ? { unsubscribeUrl: patch.unsubscribeUrl } : {}),
    ...(patch.smsFromNumber !== undefined ? { smsFromNumber: patch.smsFromNumber } : {})
  };

  if (patch.calendar) {
    next.calendar = {
      ...base.calendar,
      ...patch.calendar
    };
  }

  return next;
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

function hydrateTask(task: Partial<Task>): Task {
  const now = new Date().toISOString();
  const baseStatus = task.status ?? (task.completedAt ? "completed" : "pending");
  const completedAt =
    baseStatus === "completed"
      ? task.completedAt ?? now
      : null;
  return {
    id: task.id ?? generateId("task"),
    label: task.label ?? "Untitled task",
    dueDate: task.dueDate ?? null,
    status: baseStatus,
    assigneeId: task.assigneeId ?? null,
    assigneeName: task.assigneeName ?? null,
    assigneeEmail: task.assigneeEmail ?? null,
    milestoneId: task.milestoneId ?? null,
    notes: task.notes ?? null,
    createdAt: task.createdAt ?? now,
    updatedAt: task.updatedAt ?? now,
    completedAt,
    createdById: task.createdById ?? null,
    createdByName: task.createdByName ?? null,
    createdByEmail: task.createdByEmail ?? null
  } satisfies Task;
}

function hydrateTasks(tasks?: Partial<Task>[]): Task[] {
  return (tasks ?? []).map((task) => hydrateTask(task));
}

function buildManualGrant(
  input: ManualGrantInput & { id: string },
  timezone: string,
  reminderDefaults: ToggleSaveAction["reminderDefaults"],
  existing?: SavedGrant
): SavedGrant {
  const now = new Date().toISOString();
  const stage = input.stage ?? existing?.stage ?? "Researching";
  const priority = input.priority ?? existing?.priority ?? "Medium";
  const baseOpportunity: GrantOpportunity = {
    ...(existing ?? {}),
    ...(input as GrantOpportunity),
    id: input.id,
    title: input.title,
    agency: input.agency,
    summary: input.summary ?? existing?.summary ?? "",
    closeDate: input.closeDate ?? existing?.closeDate ?? null,
    postedDate: input.postedDate ?? existing?.postedDate ?? null,
    url: input.url ?? existing?.url ?? "",
    opportunityNumber: input.opportunityNumber ?? existing?.opportunityNumber ?? "",
    focusAreas: input.focusAreas ?? existing?.focusAreas ?? [],
    eligibilities: input.eligibilities ?? existing?.eligibilities ?? []
  } as GrantOpportunity;

  const milestonesSource =
    input.milestones ?? existing?.milestones ?? createDefaultMilestones(reminderDefaults, timezone, baseOpportunity);

  const milestones = milestonesSource.map((milestone) =>
    applySchedule(
      {
        id: milestone.id ?? generateId("milestone"),
        label: milestone.label ?? "Milestone",
        type: milestone.type ?? "Custom",
        dueDate: milestone.dueDate ?? null,
        remindersEnabled: milestone.remindersEnabled ?? true,
        reminderChannels: ensureReminderChannels(
          milestone.reminderChannels ?? [],
          reminderDefaults.channels
        ),
        reminderOffsets: milestone.reminderOffsets ?? DEFAULT_REMINDER_OFFSETS,
        scheduledReminders: milestone.scheduledReminders ?? [],
        lastUpdatedAt: milestone.lastUpdatedAt ?? now
      },
      reminderDefaults,
      timezone,
      baseOpportunity
    )
  );

  let baseHistory = existing?.history?.length
    ? existing.history
    : [
        {
          stage,
          changedAt: now,
          note: input.source === "imported" ? "Imported from CSV" : "Created manually"
        }
      ];

  if (existing && existing.stage !== stage) {
    baseHistory = [
      ...baseHistory,
      {
        stage,
        changedAt: now,
        note: input.source === "imported" ? "Stage updated during import" : "Stage updated"
      }
    ];
  }

  return {
    ...baseOpportunity,
    stage,
    owner: input.owner ?? existing?.owner,
    priority,
    notes: input.notes ?? existing?.notes ?? "",
    attachments: existing?.attachments ?? [],
    history: baseHistory,
    milestones,
    tasks: hydrateTasks(input.tasks ?? existing?.tasks),
    source: input.source ?? existing?.source ?? "manual",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    estimatedFunding: input.estimatedFunding ?? existing?.estimatedFunding ?? null,
    awardFloor: input.awardFloor ?? existing?.awardFloor ?? null,
    awardCeiling: input.awardCeiling ?? existing?.awardCeiling ?? null,
    expectedNumberOfAwards: existing?.expectedNumberOfAwards ?? null
  } as SavedGrant;
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
        const now = new Date().toISOString();
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
          ),
          tasks: hydrateTasks(grant.tasks as Partial<Task>[]),
          source: grant.source ?? "grants.gov",
          createdAt: grant.createdAt ?? now,
          updatedAt: grant.updatedAt ?? now
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
          ),
          tasks: [],
          source: "grants.gov",
          createdAt: now,
          updatedAt: now
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
          history: [...existing.history, historyEntry],
          updatedAt: now
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
          ...action.updates,
          updatedAt: new Date().toISOString()
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
          milestones: nextMilestones,
          updatedAt: new Date().toISOString()
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
          milestones: [...(existing.milestones ?? []), withSchedule],
          updatedAt: new Date().toISOString()
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
          ),
          updatedAt: new Date().toISOString()
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
          milestones,
          updatedAt: new Date().toISOString()
        };
      }
      return nextState;
    }
    case "add-task": {
      const existing = state[action.id];
      if (!existing) return state;
      const task = hydrateTask(action.task);
      const now = new Date().toISOString();
      return {
        ...state,
        [action.id]: {
          ...existing,
          tasks: [...(existing.tasks ?? []), task],
          updatedAt: now
        }
      };
    }
    case "update-task": {
      const existing = state[action.id];
      if (!existing) return state;
      const index = (existing.tasks ?? []).findIndex((task) => task.id === action.taskId);
      if (index === -1) return state;
      const now = new Date().toISOString();
      const nextTasks = [...existing.tasks];
      nextTasks[index] = {
        ...nextTasks[index],
        ...action.updates,
        updatedAt: now
      };
      return {
        ...state,
        [action.id]: {
          ...existing,
          tasks: nextTasks,
          updatedAt: now
        }
      };
    }
    case "remove-task": {
      const existing = state[action.id];
      if (!existing) return state;
      const nextTasks = (existing.tasks ?? []).filter((task) => task.id !== action.taskId);
      return {
        ...state,
        [action.id]: {
          ...existing,
          tasks: nextTasks,
          updatedAt: new Date().toISOString()
        }
      };
    }
    case "toggle-task": {
      const existing = state[action.id];
      if (!existing) return state;
      const index = (existing.tasks ?? []).findIndex((task) => task.id === action.taskId);
      if (index === -1) return state;
      const now = new Date().toISOString();
      const nextTasks = [...existing.tasks];
      nextTasks[index] = {
        ...nextTasks[index],
        status: action.completed ? "completed" : "pending",
        completedAt: action.completed ? now : null,
        updatedAt: now
      };
      return {
        ...state,
        [action.id]: {
          ...existing,
          tasks: nextTasks,
          updatedAt: now
        }
      };
    }
    case "upsert-grant": {
      const existing = state[action.grant.id];
      const nextGrant = buildManualGrant(
        action.grant,
        action.timezone,
        action.reminderDefaults,
        existing
      );
      return {
        ...state,
        [nextGrant.id]: nextGrant
      };
    }
    case "bulk-import": {
      const nextState = { ...state };
      for (const grant of action.grants) {
        const existing = nextState[grant.id];
        const nextGrant = buildManualGrant(
          grant,
          action.timezone,
          action.reminderDefaults,
          existing
        );
        nextState[nextGrant.id] = nextGrant;
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
  const savedGrantsRef = useRef(savedGrants);
  const [orgPreferences, setOrgPreferencesState] = useState<OrgPreferences>(() => ({
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
  const orgPreferencesRef = useRef(orgPreferences);
  const shouldPersistPreferences = useRef(false);
  const pendingGrantSync = useRef(new Set<string>());
  const hasHydratedGrants = useRef(false);

  useEffect(() => {
    savedGrantsRef.current = savedGrants;
    if (!hasHydratedGrants.current) return;
    if (pendingGrantSync.current.size === 0) return;
    const ids = Array.from(pendingGrantSync.current);
    pendingGrantSync.current.clear();

    void (async () => {
      await Promise.all(
        ids.map(async (id) => {
          const grant = savedGrants[id];
          if (!grant) return;
          try {
            await upsertOrgGrant(grant);
          } catch (error) {
            console.error(`Failed to sync grant ${id}`, error);
          }
        })
      );
    })();
  }, [savedGrants]);

  useEffect(() => {
    orgPreferencesRef.current = orgPreferences;
  }, [orgPreferences]);

  const queueGrantSync = useCallback((id: string) => {
    pendingGrantSync.current.add(id);
  }, []);

  const persistPreferences = useCallback(async (prefs: OrgPreferences) => {
    try {
      await upsertOrgPreferences(prefs);
    } catch (error) {
      console.error("Failed to persist org preferences", error);
    }
  }, []);

  const applyOrgPreferences = useCallback(
    (updater: OrgPreferences | ((prev: OrgPreferences) => OrgPreferences)) => {
      setOrgPreferencesState((prev) => {
        const next =
          typeof updater === "function"
            ? (updater as (prev: OrgPreferences) => OrgPreferences)(prev)
            : updater;
        if (shouldPersistPreferences.current) {
          void persistPreferences(next);
        }
        return next;
      });
    },
    [persistPreferences]
  );

  useEffect(() => {
    let active = true;

    async function hydrate() {
      try {
        const [grants, preferencePatch] = await Promise.all([
          fetchOrgGrants(),
          fetchOrgPreferences()
        ]);
        if (!active) return;

        let resolvedPreferences = orgPreferencesRef.current;
        if (preferencePatch) {
          const nextPreferences = mergeOrgPreferences(resolvedPreferences, preferencePatch);
          resolvedPreferences = nextPreferences;
          setOrgPreferencesState(nextPreferences);
        }

        if (grants.length > 0) {
          dispatch({
            type: "initialize",
            grants,
            timezone: resolvedPreferences.timezone ?? "UTC",
            reminderDefaults: {
              channels: resolvedPreferences.reminderChannels,
              unsubscribeUrl: resolvedPreferences.unsubscribeUrl
            }
          });
        }
      } catch (error) {
        console.error("Failed to hydrate workspace data from Supabase", error);
      } finally {
        if (!active) return;
        hasHydratedGrants.current = true;
        shouldPersistPreferences.current = true;
        if (pendingGrantSync.current.size > 0) {
          const ids = Array.from(pendingGrantSync.current);
          pendingGrantSync.current.clear();
          void (async () => {
            await Promise.all(
              ids.map(async (id) => {
                const grant = savedGrantsRef.current[id];
                if (!grant) return;
                try {
                  await upsertOrgGrant(grant);
                } catch (error) {
                  console.error(`Failed to sync grant ${id}`, error);
                }
              })
            );
          })();
        }
      }
    }

    void hydrate();

    return () => {
      active = false;
    };
  }, [dispatch]);

  // refresh reminder schedules whenever timezone or unsubscribe URL changes
  useEffect(() => {
    if (!hasHydratedGrants.current) return;
    dispatch({
      type: "refresh-schedules",
      timezone: orgPreferences.timezone ?? "UTC",
      reminderDefaults: {
        channels: orgPreferences.reminderChannels,
        unsubscribeUrl: orgPreferences.unsubscribeUrl
      }
    });
    for (const id of Object.keys(savedGrantsRef.current)) {
      pendingGrantSync.current.add(id);
    }
  }, [
    orgPreferences.timezone,
    orgPreferences.unsubscribeUrl,
    orgPreferences.reminderChannels,
    dispatch
  ]);

  // update calendar refresh timestamp when grants change
  useEffect(() => {
    if (!hasHydratedGrants.current) return;
    applyOrgPreferences((prev) => ({
      ...prev,
      calendar: {
        ...prev.calendar,
        lastGeneratedAt: new Date().toISOString()
      }
    }));
  }, [savedGrants, applyOrgPreferences]);

  const toggleSaveGrant = useCallback(
    (grant: GrantOpportunity) => {
      const exists = Boolean(savedGrants[grant.id]);
      dispatch({
        type: "toggle-save",
        grant,
        timezone: orgPreferences.timezone ?? "UTC",
        reminderDefaults: {
          channels: orgPreferences.reminderChannels,
          unsubscribeUrl: orgPreferences.unsubscribeUrl
        }
      });
      if (exists) {
        void deleteOrgGrant(grant.id).catch((error) => {
          console.error(`Failed to delete org grant ${grant.id}`, error);
        });
      } else {
        queueGrantSync(grant.id);
      }
    },
    [
      savedGrants,
      orgPreferences.reminderChannels,
      orgPreferences.timezone,
      orgPreferences.unsubscribeUrl,
      queueGrantSync
    ]
  );

  const updateGrantStage = useCallback(
    (id: string, stage: Stage, note?: string) => {
      dispatch({ type: "update-stage", id, stage, note });
      queueGrantSync(id);
    },
    [queueGrantSync]
  );

  const updateGrantDetails = useCallback(
    (
      id: string,
      updates: Partial<Pick<SavedGrant, "owner" | "priority" | "notes" | "attachments">>
    ) => {
      dispatch({ type: "update-details", id, updates: updates as Partial<SavedGrant> });
      queueGrantSync(id);
    },
    [queueGrantSync]
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
      queueGrantSync(id);
    },
    [
      orgPreferences.reminderChannels,
      orgPreferences.timezone,
      orgPreferences.unsubscribeUrl,
      queueGrantSync
    ]
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
      queueGrantSync(id);
    },
    [
      orgPreferences.reminderChannels,
      orgPreferences.timezone,
      orgPreferences.unsubscribeUrl,
      queueGrantSync
    ]
  );

  const removeMilestone = useCallback(
    (id: string, milestoneId: string) => {
      dispatch({ type: "remove-milestone", id, milestoneId });
      queueGrantSync(id);
    },
    [queueGrantSync]
  );

  const addTask = useCallback(
    (id: string, task: TaskDraft) => {
      dispatch({ type: "add-task", id, task });
      queueGrantSync(id);
    },
    [queueGrantSync]
  );

  const updateTask = useCallback((id: string, taskId: string, updates: Partial<Task>) => {
    dispatch({ type: "update-task", id, taskId, updates });
    queueGrantSync(id);
  }, [queueGrantSync]);

  const toggleTaskStatus = useCallback((id: string, taskId: string, completed: boolean) => {
    dispatch({ type: "toggle-task", id, taskId, completed });
    queueGrantSync(id);
  }, [queueGrantSync]);

  const removeTask = useCallback((id: string, taskId: string) => {
    dispatch({ type: "remove-task", id, taskId });
    queueGrantSync(id);
  }, [queueGrantSync]);

  const createManualGrant = useCallback(
    (input: ManualGrantInput) => {
      const id = input.id ?? generateId("manual-grant");
      dispatch({
        type: "upsert-grant",
        grant: { ...input, id, source: input.source ?? "manual" },
        timezone: orgPreferences.timezone ?? "UTC",
        reminderDefaults: {
          channels: orgPreferences.reminderChannels,
          unsubscribeUrl: orgPreferences.unsubscribeUrl
        }
      });
      queueGrantSync(id);
      return id;
    },
    [
      orgPreferences.reminderChannels,
      orgPreferences.timezone,
      orgPreferences.unsubscribeUrl,
      queueGrantSync
    ]
  );

  const bulkImportGrants = useCallback(
    (grants: ImportedGrantInput[]) => {
      const timezone = orgPreferences.timezone ?? "UTC";
      const reminderDefaults = {
        channels: orgPreferences.reminderChannels,
        unsubscribeUrl: orgPreferences.unsubscribeUrl
      };
      const existing = Object.values(savedGrants);
      const normalized = new Map<string, ManualGrantInput & { id: string }>();
      const importedIds = new Set<string>();
      const duplicateIds = new Set<string>();
      const invalidIds = new Set<string>();

      for (const grant of grants) {
        const title = grant.title?.trim();
        const agency = grant.agency?.trim();
        if (!title || !agency) {
          const identifier =
            grant.id ?? grant.opportunityNumber ?? `row-${invalidIds.size + duplicateIds.size + 1}`;
          invalidIds.add(identifier);
          continue;
        }
        const closeDate = grant.closeDate ?? null;
        const opportunityNumber = grant.opportunityNumber?.trim();
        const duplicate = existing.find((item) => {
          const normalizedTitle = item.title?.trim().toLowerCase();
          const normalizedGrantTitle = title.toLowerCase();
          const sameTitle = normalizedTitle === normalizedGrantTitle;
          const sameDeadline = item.closeDate && closeDate ? item.closeDate === closeDate : false;
          const sameOpportunity =
            opportunityNumber && item.opportunityNumber
              ? item.opportunityNumber === opportunityNumber
              : false;
          return sameOpportunity || (sameTitle && sameDeadline);
        });
        const baseId = grant.id ?? generateId("imported-grant");
        const targetId = duplicate?.id ?? baseId;
        if (duplicate) {
          duplicateIds.add(targetId);
        }
        importedIds.add(targetId);
        const nextStage = (grant.stage ?? duplicate?.stage ?? "Researching") as Stage;
        const nextPriority = (grant.priority ?? duplicate?.priority ?? "Medium") as Priority;
        normalized.set(targetId, {
          ...grant,
          id: targetId,
          title,
          agency,
          source: grant.source ?? "imported",
          stage: nextStage,
          priority: nextPriority,
          owner: grant.owner ?? duplicate?.owner,
          notes: grant.notes ?? duplicate?.notes ?? "",
          closeDate,
          postedDate: grant.postedDate ?? duplicate?.postedDate ?? null,
          focusAreas: grant.focusAreas ?? duplicate?.focusAreas ?? [],
          eligibilities: grant.eligibilities ?? duplicate?.eligibilities ?? [],
          opportunityNumber: opportunityNumber ?? duplicate?.opportunityNumber
        });
      }

      const payload = Array.from(normalized.values());
      if (payload.length > 0) {
        dispatch({
          type: "bulk-import",
          grants: payload,
          timezone,
          reminderDefaults
        });
        for (const grant of payload) {
          queueGrantSync(grant.id);
        }
      }

      return {
        imported: Array.from(importedIds),
        skipped: Array.from(new Set([...duplicateIds, ...invalidIds]))
      };
    },
    [
      dispatch,
      orgPreferences.reminderChannels,
      orgPreferences.timezone,
      orgPreferences.unsubscribeUrl,
      savedGrants,
      queueGrantSync
    ]
  );

  const updatePreferences = useCallback(
    (prefs: OrgPreferences) => {
      applyOrgPreferences(prefs);
    },
    [applyOrgPreferences]
  );

  const value: GrantContextValue = useMemo(
    () => ({
      allGrants,
      orgPreferences,
      savedGrants,
      updatePreferences,
      toggleSaveGrant,
      updateGrantStage,
      updateGrantDetails,
      updateMilestone,
      addMilestone,
      removeMilestone,
      addTask,
      updateTask,
      toggleTaskStatus,
      removeTask,
      createManualGrant,
      bulkImportGrants
    }),
    [
      allGrants,
      orgPreferences,
      savedGrants,
      updatePreferences,
      toggleSaveGrant,
      updateGrantStage,
      updateGrantDetails,
      updateMilestone,
      addMilestone,
      removeMilestone,
      addTask,
      updateTask,
      toggleTaskStatus,
      removeTask,
      createManualGrant,
      bulkImportGrants
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
  ReminderScheduleEntry,
  Task,
  TaskStatus,
  TaskDraft,
  ManualGrantInput,
  ImportedGrantInput
};
