# Grant Application Tracker

A Next.js sandbox for exploring the workflow of a grants management product aimed at small and rural nonprofits. The focus of
this repository is the internal workspace: saving opportunities, organizing milestones, and coordinating task checklists.

## Current functionality

- **Next.js 14 + Mantine UI** with a shared `AppThemeProvider`, `AuthProvider`, and `GrantProvider` supplying Supabase auth
  state, mocked grant data, and workspace actions.
- **Email/password sign in** (`/login`) with Supabase client helpers, environment diagnostics, and quick links to the
  workspace once authenticated.
- **Grant workspace flows** including:
  - `/my-tasks` for a user-focused task list with completion toggles tied to grant assignments.
  - `/grants/new` to log manual opportunities with stages, priority, owners, notes, and initial checklist tasks.
  - `/grants/import` for CSV uploads that validate rows before seeding the pipeline.
  - `/grants/[id]` to manage milestones, reminders, attachments, and tasks for a specific opportunity via `GrantDetailView`.
- **Supporting components** for discovery (`GrantDiscovery`), pipeline visualization (`PipelineBoard`), organization
  settings, invites, and waitlist capture that can be embedded as the product grows.

## Available routes

| Path | Description |
| --- | --- |
| `/` | Simple index that links to each in-progress screen and points to Supabase setup steps. |
| `/login` | Email/password sign-in backed by Supabase client helpers. |
| `/my-tasks` | Personalized task table for the signed-in user. |
| `/grants/new` | Manual grant entry form. |
| `/grants/import` | CSV importer for existing opportunities. |
| `/grants/[id]` | Grant detail workspace (visit after saving or importing a grant). |

## Getting started

1. Install dependencies: `npm install` (or `pnpm install`).
2. Copy `.env.example` to `.env.local` and provide your Supabase credentials (URL, anon key, and optional service role).
3. Run the development server with `npm run dev` and open http://localhost:3000.

Without Supabase configured the grant provider falls back to mocked data so you can still explore the UI.

## Still to build

- **Production-ready data**: connect the grant discovery experience to real Grants.gov ingestion and persist saved grants in
  Supabase tables for multiple organizations.
- **Collaboration features**: complete invite flows, enforce role-based access in the UI, and surface org settings throughout
  the workspace.
- **Notifications & calendar sync**: schedule reminder jobs (email/SMS), generate ICS feeds, and implement Google Calendar
  push syncing.
- **Payments & billing**: integrate Stripe checkout, plan management, and seat limits.
- **Observability & polish**: add automated tests, error boundaries, analytics, and responsive styling refinements.

## Data model reference

The intended schema remains the same while the application code matures:

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
