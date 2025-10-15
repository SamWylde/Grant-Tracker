# Grant Application Tracker

*A lightweight SaaS for small and rural nonprofits to **discover** grants, **track** applications, and **never miss deadlines**.*

> MVP focus: federal grants (Grants.gov) + save/track pipeline + multi-deadline reminders + ICS/Google Calendar + light collaboration.

---

## ✨ Features (MVP)

* **Discover**: Filter federal opportunities by state, category, due date, amount.
* **Save & Track**: Pipeline stages (Researching → Drafting → Submitted → Awarded/Declined), notes, attachments (links).
* **Deadlines**: LOI / Application / Report milestones with **T-30/14/7/3/1 + day-of** reminders.
* **Calendar**: Org-level **ICS feed** (secret URL) + **Google Calendar push** (Pro).
* **Collaboration**: Supabase auth with org roles (admin/contributor), invites, assignees, and task checklists.
* **Import**: CSV importer from “existing spreadsheet” plus manual opportunity entry outside Grants.gov.

> Post-MVP ideas: recurring report RRULEs, templates (LOI/budget), private/foundation discovery partners, funder fit scoring, org analytics.

---

## 🧭 Project Goals

* **Audience**: Small nonprofits (<$1M budgets) with limited staff and no dedicated grant officer.
* **Outcome**: Reduce missed deadlines; increase submissions; centralize tracking.
* **North Star**: % deadlines met and # submissions/quarter per org.

---

## 🏗️ Architecture

Default stack (recommended):

* **Frontend**: Next.js (App Router, TypeScript)
* **Backend/DB**: Supabase (Postgres, Auth, Storage, RLS)
* **Jobs**: Vercel Cron / Supabase Scheduled Functions
* **Email**: Postmark (or SendGrid)
* **SMS**: Twilio (Pro plan)
* **Payments**: Stripe
* **Calendar**: ICS feed + Google Calendar API (push)
* **Observability**: Sentry (optional), PostHog/GA4

> Alternate: Django + DRF + Celery/Redis + HTMX/Next.js. The product spec is stack-agnostic.

### Frontend scaffold (current repo)

This repository now includes the initial marketing experience built with **Next.js 14**, **TypeScript**, and **Tailwind CSS**.
The goal is to provide a high-conversion landing page for early-access nonprofits while the full product is under active
development.

```
app/
  layout.tsx          // Global metadata, shell, and theme
  page.tsx            // Marketing homepage (hero, features, waitlist, FAQ)
  globals.css         // Tailwind + custom styles
components/
  waitlist-form.tsx   // Client component simulating waitlist capture
public/
  og-cover.svg        // Open Graph / social sharing artwork
```

Run `pnpm dev` to start the marketing site at http://localhost:3000.

### Environment variables

Create a `.env.local` file with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=... # optional, used for server actions
```

For convenience during local testing you can use the project shared in this exercise (URL + anon key) or provision your own Supabase project with the tables `org_memberships` and `org_invites`.

---

## 🗃️ Data Model (ER overview)

```mermaid
erDiagram
  ORGS ||--o{ USERS : has
  ORGS ||--o{ ORG_GRANTS : owns
  USERS ||--o{ TASKS : assigned_to
  GRANTS ||--o{ ORG_GRANTS : tracked_as
  ORG_GRANTS ||--o{ TASKS : includes
  ORGS ||--|| INTEGRATIONS : has

  ORGS {
    uuid id PK
    text name
    text[] state_codes
    text[] focus_areas
    text ics_secret
    timestamptz created_at
  }

  USERS {
    uuid id PK
    uuid org_id FK
    text role  // admin|contributor
    text email
    text name
    timestamptz created_at
  }

  GRANTS {
    uuid id PK
    text source   // grants_gov|manual
    text external_id
    text title
    text sponsor
    text url
    text summary
    numeric amount_min
    numeric amount_max
    text[] geography
    text[] category
    date close_date
    jsonb deadlines_json
    timestamptz created_at
  }

  ORG_GRANTS {
    uuid id PK
    uuid org_id FK
    uuid grant_id FK
    text stage // researching|drafting|submitted|awarded|declined
    int priority
    uuid owner_user_id FK
    text notes
    jsonb custom_deadlines
    timestamptz created_at
  }

  TASKS {
    uuid id PK
    uuid org_grant_id FK
    text title
    timestamptz due_at
    uuid assignee_id FK
    text status // todo|doing|done
    timestamptz created_at
  }

  INTEGRATIONS {
    uuid org_id PK FK
    text google_refresh_token
  }
```

---

## ✅ Acceptance Criteria (MVP)

* **Discover**: Users can filter and view open federal grants and **Save** them.
* **Track**: Saved grants appear on a pipeline board; stage changes persist.
* **Deadlines**: Each grant supports multiple milestones; reminders are scheduled at T-30/14/7/3/1 + T0 and are **not duplicated** after edits.
* **Calendar**: ICS feed subscribes in Google/Outlook; Google push (Pro) mirrors create/update/delete.
* **Collaboration**: Invite teammates; assign owners; create tasks; “My Tasks” shows due this week.
* **Import**: CSV rows map correctly to org_grants (+ deadlines).
* **Security**: Org data isolation via RLS; ICS URLs are revocable.

---

## 🚀 Quickstart

### 1) Prerequisites

* Node 20+, pnpm or npm
* Supabase project (or Postgres 14+)
* Accounts & API keys (see **Environment** below)

### 2) Clone & install

```bash
git clone https://github.com/your-org/grant-application-tracker.git
cd grant-application-tracker
pnpm install
```

### 3) Environment

Create `.env.local` (frontend) and `.env` (server functions) from this template:

```bash
# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Email
POSTMARK_API_KEY=...        # or SENDGRID_API_KEY=...

# SMS (Pro)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+1...

# Payments
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
NEXT_PUBLIC_STRIPE_PRICE_FREE=price_xxx
NEXT_PUBLIC_STRIPE_PRICE_STARTER=price_xxx
NEXT_PUBLIC_STRIPE_PRICE_PRO=price_xxx

# Google Calendar Push (Pro)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/api/integrations/google/callback

# Misc
SENTRY_DSN=
ICS_SECRET_SALT=change-me
ENCRYPTION_KEY=32-bytes-hex-or-base64
TIMEZONE_DEFAULT=America/New_York
```

### 4) Database & migrations

* If using Supabase: run SQL in `/supabase/migrations` via Supabase Studio or CLI.
* Enable **RLS** and apply policies (see `/supabase/policies.sql`).
* Seed data:

```bash
pnpm db:seed   # runs /supabase/seed/*.sql or a seed script
```

### 5) Start dev

```bash
pnpm dev
# Frontend: http://localhost:3000
```

### 6) Background jobs (reminders)

* **Vercel Cron** (preferred): set schedules for `/api/jobs/reminders`.
* Or **Supabase Scheduled Functions**: run reminder job every 15 minutes.
* Configure timezone (default: `America/New_York`).

### 7) Webhooks

* **Stripe** → `/api/webhooks/stripe`
* **(Optional) Email provider events** → `/api/webhooks/postmark`

---

## 🔌 Integrations

### Grants.gov ingest (federal discovery)

* Scheduled job fetches opportunities (keyword/category/state/due date).
* Maps to `grants` table; idempotent upsert by `(source, external_id)`.
* Config: `/config/grants-gov.json` (filters, categories, state allowlist).

### ICS feed

* Endpoint: `/api/orgs/:orgId/calendar.ics?key={ics_secret}`
* Each milestone becomes a `VEVENT` with a stable `UID`.
* Regenerate & revoke `ics_secret` in **Settings**.

### Google Calendar (Pro)

* OAuth consent screen (external); scopes: calendar.events
* Store `google_refresh_token` in `integrations` (encrypted).
* De-dupe by consistent event `UID`.

### Email & SMS

* Templates in `/templates/emails` and `/templates/sms`.
* Subject: `Due in {{days}}: {{grant_title}} — {{milestone}}`
* Unsubscribe/prefs link embedded per org/user.

---

## 🔐 Security

* **RLS** on all org-scoped tables (`org_id = auth.org_id()`).
* Service-role operations only in server code/jobs.
* ICS links use unguessable secrets; allow **revoke/regenerate**.
* Secrets in platform vault (Vercel/Supabase); never commit `.env*`.
* Backups: nightly DB snapshots; retention ≥14 days.
* Compliance: CAN-SPAM/TCPA; easy email/SMS opt-out.

> See `/supabase/policies.sql` and `/docs/security-checklist.md`.

---

## 📦 Import (CSV mapping)

**Expected columns** (header can vary; map in UI):

```
Title,Funder,URL,Stage,Priority,Owner Email,LOI Due,Application Due,Report Due,Notes
```

* Unrecognized stages default to `researching`.
* Dates parsed in org timezone; on failure, flagged for user edit.
* Duplicate rows (same URL/title within org) prompt merge.

---

## 🛠️ API (example routes)

```
GET  /api/grants?state=PA&focus=Youth&dueWithin=60
POST /api/org-grants                  {grantId, stage, ownerUserId}
PATCH /api/org-grants/:id             {stage, notes, priority}
POST /api/org-grants/:id/deadlines    [{type,date}]         // LOI, Application, Report
POST /api/org-grants/:id/tasks        {title,dueAt,assigneeId}
GET  /api/orgs/:id/calendar.ics?key=...
POST /api/integrations/google/callback
POST /api/checkout/session
POST /api/webhooks/stripe
```

> Authentication: Supabase Auth (JWT). All org routes validate membership + role.

---

## ⏰ Reminder Engine

* Scheduling: **T-30/14/7/3/1 + T0** per milestone.
* Edits re-schedule; duplicates prevented by `(org_grant_id, milestone_type, send_at)` unique constraint in a job table.
* Cron frequency: 15 minutes.
* Batching with provider rate limits and retry (exponential backoff).

---

## 💳 Plans & Limits (example)

| Plan    | Saved Grants | Users     | Reminders | Calendar | Google Push | SMS | Price  |
| ------- | ------------ | --------- | --------- | -------- | ----------- | --- | ------ |
| Free    | 3            | 1         | Email     | ICS      | —           | —   | $0     |
| Starter | 20           | Unlimited | Email     | ICS      | —           | —   | $19/mo |
| Pro     | Unlimited    | Unlimited | Email/SMS | ICS      | ✅           | ✅   | $49/mo |

> Configure Stripe product/price IDs in `.env`.

---

## 🗺️ Roadmap (short)

* Recurring report deadlines (RRULE editor)
* Grant templates (LOI/budget/checklist kits)
* Private/foundation data partners (licensing)
* Basic analytics: submissions, hit rate, $ requested vs won
* Admin tools for support & content moderation

---

## 🤝 Contributing

1. Fork & branch from `main`.
2. Write tests for new logic (API, jobs).
3. Lint (`pnpm lint`) & typecheck.
4. Open PR with a concise description and screenshots.

---

## 🧪 QA Script (happy path)

1. Create org → invite 2 teammates.
2. Discover grants → apply filters → Save 3 grants.
3. Set LOI & Application deadlines → verify scheduled reminders.
4. Subscribe to ICS in Google Calendar.
5. (Pro) Connect Google → verify events pushed.
6. Change a deadline → verify updates in calendar & reminders.
7. Import CSV → de-dup prompt appears.
8. Upgrade plan via Stripe → plan gates unlock.

---

## 📄 License

Choose one: MIT / Apache-2.0 / Proprietary.
*Add your license file in `/LICENSE` and update this section.*

---

## 🧰 Maintainer Setup Checklist

* [ ] Domain + DNS (SPF/DKIM/DMARC for email)
* [ ] Supabase RLS policies enabled & tested
* [ ] Stripe products/prices & webhooks
* [ ] Vercel Cron or Supabase Scheduler for reminders
* [ ] Google OAuth app (Calendar) verified for production
* [ ] Sentry/PostHog configured
* [ ] Backups tested & restore runbook documented

---

## 📬 Support

* Product owner: **Thomas Darby**
* Contact: *add email / support portal*
* Status page: *optional*

---

### Appendix: Example `.sql` Unique Constraint for Reminder De-dupe

```sql
create table reminder_jobs (
  id uuid primary key default gen_random_uuid(),
  org_grant_id uuid not null references org_grants(id) on delete cascade,
  milestone text not null, -- LOI|Application|Report
  send_at timestamptz not null,
  channel text not null,   -- email|sms
  payload jsonb not null,
  status text not null default 'queued' -- queued|sent|failed
);

create unique index ux_reminder_dedupe
  on reminder_jobs(org_grant_id, milestone, send_at, channel);
```

---

If you want this scaffolded, I can generate:

* `/supabase` migrations & policies,
* Next.js routes for ICS, webhooks, ingest,
* Email/SMS templates,
* A tiny seed dataset + CSV importer.
