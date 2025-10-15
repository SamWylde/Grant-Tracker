"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { useAuth } from "@/components/auth-context";

export default function LoginPage() {
  const { signInWithPassword, signOut, user, membership, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    const result = await signInWithPassword(email, password);
    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage("Check your workspace for imported opportunities.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-3xl border border-white/10 bg-slate-900/60 p-6 text-sm text-slate-200">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-white">Sign in to Grant Tracker</h1>
          <p className="text-xs text-slate-400">
            Use your Supabase credentials. Admins can invite teammates from org settings.
          </p>
        </header>
        {isLoading ? (
          <p className="text-center text-sm text-slate-300">Loading…</p>
        ) : user ? (
          <div className="space-y-4 text-sm">
            <p className="font-semibold text-white">You&apos;re signed in as {user.email ?? user.fullName}</p>
            <p className="text-xs text-slate-400">
              Membership: {membership?.org?.name ?? "No organization"} ({membership?.role ?? ""})
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/my-tasks"
                className="rounded-lg bg-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/30 hover:text-white"
              >
                View my tasks
              </Link>
              <button
                type="button"
                onClick={() => signOut()}
                className="rounded-lg border border-white/15 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-rose-400 hover:text-white"
              >
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30 hover:text-white"
            >
              Sign in
            </button>
          </form>
        )}
        {message && <p className="text-center text-xs text-slate-400">{message}</p>}
        <Link
          href="/"
          className="text-center text-xs font-semibold text-slate-300 underline decoration-dotted underline-offset-4"
        >
          Return to marketing site
        </Link>
      </div>
    </div>
  );
}
