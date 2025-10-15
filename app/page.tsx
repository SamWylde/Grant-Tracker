import { CalendarDaysIcon, ClockIcon, InboxArrowDownIcon, UsersIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

import { WaitlistForm } from "@/components/waitlist-form";

const features = [
  {
    name: "Discover opportunities",
    description:
      "Filter federal grants by program area, geography, and due date. Save interesting opportunities directly into your pipeline.",
    icon: InboxArrowDownIcon
  },
  {
    name: "Collaborative pipeline",
    description:
      "Move grants through researching, drafting, and submission with clear owners, notes, and task checklists for each stage.",
    icon: UsersIcon
  },
  {
    name: "Multi-milestone reminders",
    description:
      "Automated notifications at T-30/14/7/3/1 keep LOIs, applications, and reports on track without duplicate alerts.",
    icon: ClockIcon
  },
  {
    name: "Calendar integrations",
    description:
      "Sync an org-wide ICS feed or push deadlines into Google Calendar so every stakeholder stays aligned.",
    icon: CalendarDaysIcon
  }
];

const steps = [
  {
    title: "Import your current spreadsheet",
    description: "Upload your CSV and we map deadlines and owners automatically.",
    number: "01"
  },
  {
    title: "Track grants with confidence",
    description: "Pipeline views, tasks, and reminders keep the team focused.",
    number: "02"
  },
  {
    title: "Celebrate more submissions",
    description: "Reporting shows wins per quarter and deadlines met across the org.",
    number: "03"
  }
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-white/5 bg-slate-950/70 backdrop-blur">
        <div className="container flex items-center justify-between py-5">
          <div className="flex items-center gap-3">
            <span className="gradient-border flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-lg font-semibold text-white">
              GT
            </span>
            <div>
              <p className="text-sm uppercase tracking-wide text-slate-400">Grant Tracker</p>
              <p className="text-base font-semibold">Never miss a funding deadline again</p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <Link href="#features" className="transition hover:text-white">
              Features
            </Link>
            <Link href="#steps" className="transition hover:text-white">
              How it works
            </Link>
            <Link href="#faq" className="transition hover:text-white">
              FAQ
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="#waitlist"
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-midnight-400 hover:text-white"
            >
              View demo
            </Link>
            <Link
              href="#waitlist"
              className="rounded-full bg-midnight-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-midnight-500/30 transition hover:bg-midnight-400"
            >
              Join waitlist
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="relative isolate overflow-hidden pb-20 pt-24 sm:pt-32">
          <div className="container grid gap-16 lg:grid-cols-[3fr,2fr] lg:items-center">
            <div className="flex flex-col gap-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
                Accepting early access nonprofits
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Discover, track, and win more grants with one shared workspace.
              </h1>
              <p className="max-w-xl text-lg text-slate-300">
                Grant Tracker helps small and rural nonprofits centralize every opportunity, deadline, and teammate update. Stop
                hunting through spreadsheets and email threads.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="#waitlist"
                  className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-100"
                >
                  Request onboarding call
                </Link>
                <Link
                  href="#learn-more"
                  className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
                >
                  Watch 2-min overview
                </Link>
              </div>
              <dl className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-6">
                  <dt className="text-sm font-semibold text-slate-300">Multi-stage deadlines</dt>
                  <dd className="mt-2 text-3xl font-bold text-white">LOI → Application → Report</dd>
                </div>
                <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-6">
                  <dt className="text-sm font-semibold text-slate-300">Automated reminders</dt>
                  <dd className="mt-2 text-3xl font-bold text-white">T-30 / 14 / 7 / 3 / 1</dd>
                </div>
              </dl>
            </div>
            <div className="relative">
              <div className="gradient-border rounded-3xl bg-slate-900/60 p-1">
                <div className="rounded-[22px] border border-white/5 bg-slate-950/80 p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">Pipeline overview</span>
                    <span className="text-xs text-slate-400">This quarter</span>
                  </div>
                  <div className="mt-6 grid gap-4 text-sm">
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                      <p className="text-xs uppercase tracking-wide text-emerald-300">Researching</p>
                      <p className="mt-2 text-base font-semibold text-white">USDA Rural Business Development</p>
                      <p className="text-xs text-emerald-200">Draft due in 14 days</p>
                    </div>
                    <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-4">
                      <p className="text-xs uppercase tracking-wide text-sky-300">Drafting</p>
                      <p className="mt-2 text-base font-semibold text-white">Community Facilities Grant</p>
                      <p className="text-xs text-sky-200">Tasks: Budget review, letters of support</p>
                    </div>
                    <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
                      <p className="text-xs uppercase tracking-wide text-violet-300">Submitted</p>
                      <p className="mt-2 text-base font-semibold text-white">EDA Build to Scale</p>
                      <p className="text-xs text-violet-200">Awaiting feedback</p>
                    </div>
                  </div>
                  <div className="mt-6 rounded-xl border border-white/5 bg-white/5 p-4 text-sm text-slate-200">
                    <p className="font-semibold text-white">Next reminder</p>
                    <p className="mt-1 text-xs uppercase tracking-wider text-slate-300">LOI due in 3 days · Email + SMS</p>
                  </div>
                </div>
              </div>
              <div className="absolute -right-8 -top-8 hidden rounded-2xl border border-white/10 bg-slate-900/80 p-5 text-xs text-slate-300 shadow-xl shadow-black/50 lg:block">
                <p className="text-[10px] uppercase tracking-widest text-midnight-200">Org pulse</p>
                <p className="mt-3 text-sm font-semibold text-white">92% deadlines met</p>
                <p className="mt-1 text-[13px] text-slate-300">+14% vs last quarter</p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-t border-white/5 bg-slate-950/60 py-20">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold text-white">Purpose-built for small and rural nonprofits</h2>
              <p className="mt-4 text-lg text-slate-300">
                Grant Tracker centralizes grant discovery, collaboration, and reporting so your team can focus on winning funding.
              </p>
            </div>
            <dl className="mt-16 grid gap-10 md:grid-cols-2">
              {features.map((feature) => (
                <div key={feature.name} className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
                  <feature.icon className="h-8 w-8 text-midnight-300" aria-hidden />
                  <dt className="mt-4 text-lg font-semibold text-white">{feature.name}</dt>
                  <dd className="mt-2 text-sm text-slate-300">{feature.description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="steps" className="py-20">
          <div className="container grid gap-12 lg:grid-cols-[2fr,3fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-white">Launch in an afternoon</h2>
              <p className="mt-4 text-lg text-slate-300">
                From data import to ICS calendar subscriptions, onboarding is guided end-to-end by our team so you are ready for the
                next funding cycle.
              </p>
              <div className="mt-8 flex flex-col gap-4 rounded-3xl border border-white/5 bg-slate-900/40 p-6 text-sm text-slate-300">
                <p className="flex items-center gap-2 text-slate-200">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-midnight-500 text-xs font-semibold text-white">Pro</span>
                  Google Calendar sync + SMS reminders
                </p>
                <p className="flex items-center gap-2 text-slate-200">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-emerald-950">Core</span>
                  Unlimited users per org & pipeline stages
                </p>
              </div>
            </div>
            <ol className="space-y-6">
              {steps.map((step) => (
                <li key={step.number} className="flex gap-6 rounded-3xl border border-white/5 bg-slate-900/40 p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
                    {step.number}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                    <p className="mt-2 text-sm text-slate-300">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="waitlist" className="border-y border-white/5 bg-slate-950/60 py-20">
          <div className="container grid gap-12 lg:grid-cols-[2fr,3fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-white">Get a guided walkthrough</h2>
              <p className="mt-4 text-lg text-slate-300">
                We are onboarding a limited number of small and rural nonprofits. Share a few details and we will set up an
                implementation call tailored to your grant pipeline.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-300">
                <li>• Import support for your existing spreadsheets</li>
                <li>• Deadline reminder configuration by LOI/Application/Report</li>
                <li>• Calendar integration set-up with ICS and Google Workspace</li>
              </ul>
            </div>
            <WaitlistForm />
          </div>
        </section>

        <section id="faq" className="py-20">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold text-white">Built for real grant teams</h2>
              <p className="mt-4 text-lg text-slate-300">
                We combine federal grant discovery with the collaboration features rural organizations asked for most.
              </p>
            </div>
            <div className="mt-16 grid gap-8 md:grid-cols-2">
              <article className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
                <h3 className="text-lg font-semibold text-white">Where does the grant data come from?</h3>
                <p className="mt-3 text-sm text-slate-300">
                  We integrate directly with Grants.gov and refresh opportunities every night. You can also add custom foundation
                  grants manually.
                </p>
              </article>
              <article className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
                <h3 className="text-lg font-semibold text-white">Can we keep our existing spreadsheets?</h3>
                <p className="mt-3 text-sm text-slate-300">
                  Absolutely—import them via CSV to seed your pipeline. Grant Tracker keeps the data in sync going forward so you
                  never start from scratch.
                </p>
              </article>
              <article className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
                <h3 className="text-lg font-semibold text-white">How do reminders work?</h3>
                <p className="mt-3 text-sm text-slate-300">
                  Add LOI, application, and report milestones for each grant and we send email (and SMS on the Pro plan) reminders at
                  T-30/14/7/3/1 and day-of automatically.
                </p>
              </article>
              <article className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
                <h3 className="text-lg font-semibold text-white">Do you support multiple organizations?</h3>
                <p className="mt-3 text-sm text-slate-300">
                  Yes. Org data is isolated with row-level security. Each nonprofit can invite unlimited teammates with admin or
                  contributor roles.
                </p>
              </article>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-950/80 py-12">
        <div className="container flex flex-col gap-6 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} Grant Tracker. Built to help small nonprofits win more funding.
          </p>
          <div className="flex gap-4">
            <Link href="#privacy" className="transition hover:text-white">
              Privacy
            </Link>
            <Link href="#security" className="transition hover:text-white">
              Security
            </Link>
            <Link href="#contact" className="transition hover:text-white">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
