"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";

import {
  getSupabaseBrowserClient,
  isSupabaseBrowserConfigured
} from "@/lib/supabase/client";

export type OrgMembershipRole = "admin" | "contributor";
export type OrgMembershipStatus = "active" | "invited" | "inactive";

type OrgSummary = {
  id: string;
  name?: string | null;
};

type OrgMembership = {
  membershipId?: string;
  orgId: string;
  org?: OrgSummary | null;
  role: OrgMembershipRole;
  status: OrgMembershipStatus;
  invitedAt?: string | null;
  invitedBy?: string | null;
};

type OrgInvite = {
  id: string;
  email: string;
  role: OrgMembershipRole;
  createdAt: string;
  invitedBy?: string | null;
  status?: OrgMembershipStatus;
  token?: string | null;
};

type AuthUser = {
  id: string;
  email?: string;
  fullName?: string | null;
};

type AuthContextValue = {
  supabase: SupabaseClient | null;
  session: Session | null;
  user: AuthUser | null;
  isLoading: boolean;
  membership: OrgMembership | null;
  invites: OrgInvite[];
  refreshMembership: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  inviteMember: (email: string, role: OrgMembershipRole) => Promise<{ error?: string }>;
  revokeInvite: (inviteId: string) => Promise<{ error?: string }>;
  acceptInvite: (token: string) => Promise<{ error?: string }>;
  hasRole: (role: OrgMembershipRole) => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchMembershipForUser(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("org_memberships")
    .select(
      `id, org_id, role, status, invited_at, invited_by, orgs:org_id(id, name)`
    )
    .eq("user_id", userId)
    .neq("status", "inactive")
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  const orgSummary = Array.isArray(data.orgs)
    ? (data.orgs[0] as OrgSummary | undefined) ?? null
    : (data.orgs as OrgSummary | null | undefined) ?? null;
  return {
    membershipId: data.id,
    orgId: data.org_id,
    org: orgSummary,
    role: (data.role ?? "contributor") as OrgMembershipRole,
    status: (data.status ?? "invited") as OrgMembershipStatus,
    invitedAt: data.invited_at ?? null,
    invitedBy: data.invited_by ?? null
  } satisfies OrgMembership;
}

async function fetchInvitesForOrg(
  supabase: SupabaseClient,
  orgId: string
): Promise<OrgInvite[]> {
  const { data, error } = await supabase
    .from("org_invites")
    .select("id, email, role, invited_by, status, token, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((invite) => ({
    id: invite.id,
    email: invite.email,
    role: (invite.role ?? "contributor") as OrgMembershipRole,
    createdAt: invite.created_at ?? new Date().toISOString(),
    invitedBy: invite.invited_by ?? null,
    status: (invite.status ?? "invited") as OrgMembershipStatus,
    token: invite.token ?? null
  }));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => {
    if (!isSupabaseBrowserConfigured()) {
      console.warn("Supabase credentials are not configured; auth features are disabled.");
      return null;
    }
    try {
      return getSupabaseBrowserClient();
    } catch (error) {
      console.error("Failed to initialize Supabase client", error);
      return null;
    }
  }, []);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const userRef = useRef<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [membership, setMembership] = useState<OrgMembership | null>(null);
  const [invites, setInvites] = useState<OrgInvite[]>([]);

  const refreshMembership = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser || !supabase) {
      setMembership(null);
      setInvites([]);
      return;
    }
    try {
      const result = await fetchMembershipForUser(supabase, currentUser.id);
      setMembership(result);
      if (result?.orgId && result.role === "admin") {
        const nextInvites = await fetchInvitesForOrg(supabase, result.orgId);
        setInvites(nextInvites);
      } else {
        setInvites([]);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error while loading membership details.";
      console.error("Failed to load membership", error);
      setMembership((prev) => prev);
      setInvites((prev) => prev);
      console.error(`Unable to refresh membership: ${message}`);
    }
  }, [supabase]);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }
    let isMounted = true;
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          console.error("Failed to fetch session", error);
          return;
        }
        setSession(data.session);
        const nextUser = data.session?.user;
        const normalizedUser = nextUser
          ? {
              id: nextUser.id,
              email: nextUser.email ?? undefined,
              fullName: nextUser.user_metadata?.full_name ?? nextUser.user_metadata?.name ?? null
            }
          : null;
        userRef.current = normalizedUser;
        setUser(normalizedUser);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      const nextUser = nextSession?.user ?? null;
      const normalizedUser = nextUser
        ? {
            id: nextUser.id,
            email: nextUser.email ?? undefined,
            fullName: nextUser.user_metadata?.full_name ?? nextUser.user_metadata?.name ?? null
          }
        : null;
      userRef.current = normalizedUser;
      setUser(normalizedUser);
      if (event === "SIGNED_OUT") {
        setMembership(null);
        setInvites([]);
      }
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    userRef.current = user;
    if (!user) {
      setMembership(null);
      setInvites([]);
      return;
    }
    void refreshMembership();
  }, [user, refreshMembership]);

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      if (!supabase) {
        return { error: "Authentication is not available." };
      }
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          return { error: error.message };
        }
        await refreshMembership();
        return {};
      } catch (error) {
        console.error("Failed to sign in", error);
        const message =
          error instanceof Error
            ? error.message
            : "Unexpected error while signing in. Please verify your credentials and try again.";
        return { error: message };
      }
    },
    [refreshMembership, supabase]
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setMembership(null);
    setInvites([]);
  }, [supabase]);

  const inviteMember = useCallback(
    async (email: string, role: OrgMembershipRole) => {
      if (!supabase) {
        return { error: "Invitations are unavailable without Supabase." };
      }
      if (!membership?.orgId) {
        return { error: "You need an active organization before inviting teammates." };
      }
      try {
        const { data, error } = await supabase
          .from("org_invites")
          .insert({
            email,
            role,
            org_id: membership.orgId,
            invited_by: user?.id
          })
          .select()
          .single();
        if (error) {
          return { error: error.message };
        }
        setInvites((prev) => [
          {
            id: data.id,
            email: data.email,
            role: (data.role ?? "contributor") as OrgMembershipRole,
            createdAt: data.created_at ?? new Date().toISOString(),
            invitedBy: data.invited_by ?? null,
            status: (data.status ?? "invited") as OrgMembershipStatus,
            token: data.token ?? null
          },
          ...prev
        ]);
        return {};
      } catch (error) {
        console.error("Failed to invite member", error);
        const message =
          error instanceof Error
            ? `Unable to send invite: ${error.message}`
            : "Unable to send invite due to an unexpected error.";
        return { error: `${message} Please verify the email address and try again.` };
      }
    },
    [membership?.orgId, supabase, user?.id]
  );

  const revokeInvite = useCallback(
    async (inviteId: string) => {
      if (!supabase) {
        return { error: "Invitations are unavailable without Supabase." };
      }
      try {
        const { error } = await supabase.from("org_invites").delete().eq("id", inviteId);
        if (error) {
          return { error: error.message };
        }
        setInvites((prev) => prev.filter((invite) => invite.id !== inviteId));
        return {};
      } catch (error) {
        console.error("Failed to revoke invite", error);
        const message =
          error instanceof Error
            ? `Unable to revoke invite: ${error.message}`
            : "Unable to revoke invite due to an unexpected error.";
        return { error: `${message} Please refresh and try again.` };
      }
    },
    [supabase]
  );

  const acceptInvite = useCallback(
    async (token: string) => {
      if (!supabase) {
        return { error: "Invitations are unavailable without Supabase." };
      }
      try {
        const { error } = await supabase.rpc("accept_org_invite", { invite_token: token });
        if (error) {
          return { error: error.message };
        }
      } catch (error) {
        console.warn("accept_org_invite RPC missing, falling back to status update", error);
        try {
          const { error: fallbackError } = await supabase
            .from("org_invites")
            .update({ status: "accepted" })
            .eq("token", token);
          if (fallbackError) {
            return { error: fallbackError.message };
          }
        } catch (nestedError) {
          console.error("Failed to accept invite", nestedError);
          const message =
            nestedError instanceof Error
              ? `Unable to accept invite: ${nestedError.message}`
              : "Unable to accept invite due to an unexpected error.";
          return { error: `${message} Please confirm the link has not expired and try again.` };
        }
      }

      try {
        await refreshMembership();
        return {};
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to refresh membership details after accepting invite.";
        console.error("Failed to refresh membership after accepting invite", error);
        return { error: `${message} Please refresh the page to confirm your access.` };
      }
    },
    [refreshMembership, supabase]
  );

  const hasRole = useCallback(
    (role: OrgMembershipRole) => {
      if (!membership) return false;
      if (membership.role === "admin") return true;
      return membership.role === role;
    },
    [membership]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      supabase,
      session,
      user,
      isLoading,
      membership,
      invites,
      refreshMembership,
      signInWithPassword,
      signOut,
      inviteMember,
      revokeInvite,
      acceptInvite,
      hasRole
    }),
    [
      supabase,
      session,
      user,
      isLoading,
      membership,
      invites,
      refreshMembership,
      signInWithPassword,
      signOut,
      inviteMember,
      revokeInvite,
      acceptInvite,
      hasRole
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export type { OrgInvite, OrgMembership };
