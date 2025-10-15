"use client";

import { useId, useState } from "react";

export function WaitlistForm() {
  const id = useId();
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-6 text-sm text-emerald-100">
        <p className="text-lg font-semibold text-white">You are on the list!</p>
        <p className="mt-2">
          Thanks for your interest. We will reach out within two business days with onboarding details.
        </p>
      </div>
    );
  }

  return (
    <form
      className="gradient-border rounded-3xl bg-slate-900/50 p-1"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
    >
      <div className="rounded-[26px] border border-white/10 bg-slate-950/80 p-6">
        <h3 className="text-lg font-semibold text-white">Join the early access waitlist</h3>
        <p className="mt-2 text-sm text-slate-300">
          Tell us about your organization and we will schedule a guided onboarding session.
        </p>
        <div className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-200" htmlFor={`${id}-email`}>
            Work email
          </label>
          <input
            id={`${id}-email`}
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@ruralnonprofit.org"
            className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-midnight-400 focus:outline-none focus:ring-2 focus:ring-midnight-500/60"
          />
          <label className="block text-sm font-medium text-slate-200" htmlFor={`${id}-org`}>
            Organization name
          </label>
          <input
            id={`${id}-org`}
            type="text"
            required
            value={org}
            onChange={(event) => setOrg(event.target.value)}
            placeholder="River County Development Coalition"
            className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-midnight-400 focus:outline-none focus:ring-2 focus:ring-midnight-500/60"
          />
        </div>
        <button
          type="submit"
          className="mt-6 w-full rounded-full bg-midnight-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-midnight-500/30 transition hover:-translate-y-0.5 hover:bg-midnight-400"
        >
          Request early access
        </button>
        <p className="mt-3 text-xs text-slate-400">
          We only email about onboarding. No spam, ever.
        </p>
      </div>
    </form>
  );
}
