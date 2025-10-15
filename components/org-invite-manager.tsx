"use client";

import { FormEvent, useMemo, useState } from "react";

import { RoleGate } from "./role-gate";
import { useAuth } from "./auth-context";

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "contributor", label: "Contributor" }
] as const;

export function OrgInviteManager() {
  const { invites, inviteMember, revokeInvite, membership, user } = useAuth();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof ROLE_OPTIONS)[number]["value"]>("contributor");
  const [status, setStatus] = useState<string | null>(null);

  const activeInvites = useMemo(() => invites.filter((invite) => invite.status !== "inactive"), [invites]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setStatus("Enter an email to invite.");
      return;
    }
    const result = await inviteMember(trimmed, role);
    if (result.error) {
      setStatus(result.error);
    } else {
      setEmail("");
      setRole("contributor");
      setStatus("Invite sent.");
    }
  }

  return (
    <RoleGate
      role="admin"
      fallback={
        <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4 text-sm text-slate-300">
          Only admins can manage organization invites.
        </div>
      }
    >
      <section className="space-y-4">
        <header>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
            Invite teammates
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Send an email invite so teammates can join {membership?.org?.name ?? "your organization"}.
          </p>
        </header>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
          <div className="grid gap-3 md:grid-cols-[2fr,1fr]">
            <label className="flex flex-col text-sm font-medium text-slate-200">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
                placeholder="teammate@nonprofit.org"
                required
              />
            </label>
            <label className="flex flex-col text-sm font-medium text-slate-200">
              Role
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as typeof role)}
                className="mt-2 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <button
              type="submit"
              className="rounded-lg bg-emerald-500/10 px-4 py-2 font-semibold text-emerald-200 transition hover:bg-emerald-500/20 hover:text-white"
            >
              Send invite
            </button>
            {status && <p className="text-xs text-slate-400">{status}</p>}
          </div>
        </form>
        <div className="rounded-2xl border border-white/10 bg-slate-950/50">
          <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-sm font-semibold text-slate-200">
            <span>Pending invites</span>
            <span>{activeInvites.length}</span>
          </header>
          <ul className="divide-y divide-white/5">
            {activeInvites.length === 0 ? (
              <li className="px-4 py-5 text-sm text-slate-400">No outstanding invites.</li>
            ) : (
              activeInvites.map((invite) => (
                <li key={invite.id} className="flex flex-col gap-2 px-4 py-4 text-sm text-slate-200 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-white">{invite.email}</p>
                    <p className="text-xs text-slate-400">
                      Role: {invite.role} • Invited by {invite.invitedBy || user?.email || "unknown"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    {invite.token && (
                      <code className="rounded bg-slate-900 px-2 py-1 font-mono text-[11px] text-slate-300">
                        {invite.token}
                      </code>
                    )}
                    <button
                      onClick={async () => {
                        const result = await revokeInvite(invite.id);
                        if (result.error) {
                          setStatus(result.error);
                        }
                      }}
                      type="button"
                      className="rounded-lg border border-white/15 px-3 py-1 font-semibold text-slate-200 transition hover:border-rose-400 hover:text-white"
                    >
                      Revoke
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>
    </RoleGate>
  );
}
