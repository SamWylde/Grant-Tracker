"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState
} from "react";

import type { GrantOpportunity } from "@/lib/grants";

type Stage = "Researching" | "Drafting" | "Submitted" | "Awarded" | "Declined";

type Priority = "High" | "Medium" | "Low";

type StageHistoryEntry = {
  stage: Stage;
  changedAt: string;
  note?: string;
};

type OrgPreferences = {
  states: string[];
  focusAreas: string[];
};

type SavedGrant = GrantOpportunity & {
  stage: Stage;
  owner?: string;
  priority: Priority;
  notes: string;
  attachments: string[];
  history: StageHistoryEntry[];
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
};

type GrantProviderProps = {
  initialGrants: GrantOpportunity[];
  children: React.ReactNode;
};

type Action =
  | { type: "initialize"; grants: SavedGrant[] }
  | { type: "toggle-save"; grant: GrantOpportunity }
  | { type: "update-stage"; id: string; stage: Stage; note?: string }
  | { type: "update-details"; id: string; updates: Partial<SavedGrant> };

type State = Record<string, SavedGrant>;

const GrantContext = createContext<GrantContextValue | undefined>(undefined);

const STORAGE_KEYS = {
  savedGrants: "grant-tracker:saved-grants",
  orgPreferences: "grant-tracker:org-preferences"
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "initialize": {
      const nextState: State = {};
      for (const grant of action.grants) {
        nextState[grant.id] = grant;
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
          ]
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
    default:
      return state;
  }
}

export function GrantProvider({ initialGrants, children }: GrantProviderProps) {
  const [allGrants] = useState(initialGrants);
  const [savedGrants, dispatch] = useReducer(reducer, {});
  const [orgPreferences, setOrgPreferences] = useState<OrgPreferences>({
    states: [],
    focusAreas: []
  });

  // hydrate saved grants from localStorage
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEYS.savedGrants);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as SavedGrant[];
        dispatch({ type: "initialize", grants: parsed });
      } catch (error) {
        console.error("Failed to parse saved grants", error);
      }
    }
  }, []);

  // hydrate org preferences
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEYS.orgPreferences);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as OrgPreferences;
        setOrgPreferences(parsed);
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

  const toggleSaveGrant = useCallback((grant: GrantOpportunity) => {
    dispatch({ type: "toggle-save", grant });
  }, []);

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

  const value: GrantContextValue = useMemo(
    () => ({
      allGrants,
      orgPreferences,
      savedGrants,
      updatePreferences: setOrgPreferences,
      toggleSaveGrant,
      updateGrantStage,
      updateGrantDetails
    }),
    [allGrants, orgPreferences, savedGrants, toggleSaveGrant, updateGrantStage, updateGrantDetails]
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

export type { OrgPreferences, SavedGrant, Stage, StageHistoryEntry, Priority };
