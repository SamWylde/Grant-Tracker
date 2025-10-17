-- Initial database schema for Grant Tracker
-- Creates core organization, grant, reminder, and admin audit tables referenced in the application code.

-- Enable extensions required for UUID generation
create extension if not exists "pgcrypto";

-- Helper trigger to keep updated_at columns in sync
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ============================================================================
-- Organizations and memberships
-- ============================================================================

create table if not exists public.orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  timezone text default 'UTC',
  state_codes text[] default '{}',
  focus_areas text[] default '{}',
  calendar_ics_secret text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_updated_at_before_update_orgs
before update on public.orgs
for each row execute function public.set_updated_at();

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.org_memberships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'contributor' check (role in ('admin', 'contributor')),
  status text not null default 'invited' check (status in ('invited', 'active', 'inactive')),
  invited_at timestamptz default timezone('utc', now()),
  invited_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (org_id, user_id)
);

create trigger set_updated_at_before_update_org_memberships
before update on public.org_memberships
for each row execute function public.set_updated_at();

create index if not exists org_memberships_org_id_idx on public.org_memberships (org_id);
create index if not exists org_memberships_user_id_idx on public.org_memberships (user_id);

create table if not exists public.org_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  email text not null,
  role text not null default 'contributor' check (role in ('admin', 'contributor')),
  status text not null default 'invited' check (status in ('invited', 'accepted', 'revoked', 'expired')),
  token text unique,
  invited_by uuid references auth.users(id),
  invited_at timestamptz not null default timezone('utc', now()),
  accepted_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_updated_at_before_update_org_invites
before update on public.org_invites
for each row execute function public.set_updated_at();

create unique index if not exists org_invites_org_email_unique on public.org_invites (org_id, lower(email));
create index if not exists org_invites_token_idx on public.org_invites (token);

create table if not exists public.org_preferences (
  org_id uuid primary key references public.orgs(id) on delete cascade,
  states text[] default '{}',
  focus_areas text[] default '{}',
  timezone text,
  reminder_channels jsonb default '[]'::jsonb,
  unsubscribe_url text,
  calendar jsonb default '{}'::jsonb,
  sms_from_number text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_updated_at_before_update_org_preferences
before update on public.org_preferences
for each row execute function public.set_updated_at();

create table if not exists public.integrations (
  org_id uuid primary key references public.orgs(id) on delete cascade,
  google_refresh_token text,
  google_access_token text,
  google_calendar_id text,
  google_token_expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_updated_at_before_update_integrations
before update on public.integrations
for each row execute function public.set_updated_at();

-- ============================================================================
-- Grants (external opportunities and organization-specific tracking)
-- ============================================================================

create table if not exists public.grants (
  id uuid primary key default gen_random_uuid(),
  external_id text not null,
  grants_gov_id text,
  title text not null,
  agency text not null,
  agency_code text,
  opportunity_number text,
  opportunity_category text,
  opp_status text not null,
  summary text,
  synopsis_desc text,
  funding_instrument text,
  estimated_funding numeric,
  award_floor numeric,
  award_ceiling numeric,
  expected_number_of_awards numeric,
  cost_sharing text,
  posted_date date,
  close_date date,
  archive_date date,
  eligibilities jsonb default '[]'::jsonb,
  focus_areas text[] default '{}',
  funding_categories text[] default '{}',
  states text[] default '{}',
  url text,
  agency_contact_name text,
  agency_contact_email text,
  agency_contact_phone text,
  last_synced_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint grants_external_id_unique unique (external_id)
);

create index if not exists grants_opp_status_idx on public.grants (opp_status);
create index if not exists grants_close_date_idx on public.grants (close_date);
create index if not exists grants_award_ceiling_idx on public.grants (award_ceiling);
create index if not exists grants_focus_areas_idx on public.grants using gin (focus_areas);
create index if not exists grants_states_idx on public.grants using gin (states);

create trigger set_updated_at_before_update_grants
before update on public.grants
for each row execute function public.set_updated_at();

alter table public.grants
  add column if not exists opp_status text default 'posted';

update public.grants
set opp_status = coalesce(opp_status, 'posted');

alter table public.grants
  alter column opp_status set not null;

alter table public.grants
  alter column opp_status drop default;

create table if not exists public.org_grants (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  grant_id uuid references public.grants(id) on delete set null,
  title text not null,
  agency text not null,
  summary text,
  close_date date,
  posted_date date,
  url text,
  stage text not null default 'Researching' check (stage in ('Researching', 'Drafting', 'Submitted', 'Awarded', 'Declined')),
  priority text not null default 'Medium' check (priority in ('High', 'Medium', 'Low')),
  notes text,
  owner text,
  attachments text[] default '{}',
  history jsonb default '[]'::jsonb,
  milestones jsonb default '[]'::jsonb,
  tasks jsonb default '[]'::jsonb,
  source text not null default 'manual' check (source in ('grants.gov', 'manual', 'imported')),
  opportunity_number text,
  opportunity_category text,
  funding_instrument text,
  focus_areas text[] default '{}',
  eligibilities jsonb default '[]'::jsonb,
  estimated_funding numeric,
  award_floor numeric,
  award_ceiling numeric,
  expected_number_of_awards numeric,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (org_id, grant_id)
);

create index if not exists org_grants_org_id_idx on public.org_grants (org_id);
create index if not exists org_grants_grant_id_idx on public.org_grants (grant_id);
create index if not exists org_grants_stage_idx on public.org_grants (stage);
create index if not exists org_grants_updated_at_idx on public.org_grants (updated_at desc);

create trigger set_updated_at_before_update_org_grants
before update on public.org_grants
for each row execute function public.set_updated_at();

-- ============================================================================
-- Reminder jobs and admin audit log
-- ============================================================================

create table if not exists public.reminder_jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  org_grant_id uuid references public.org_grants(id) on delete cascade,
  milestone_id uuid,
  channel text not null,
  send_at timestamptz not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'sent', 'cancelled', 'failed')),
  dedupe_key text,
  processed_at timestamptz,
  error text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists reminder_jobs_org_id_idx on public.reminder_jobs (org_id);
create index if not exists reminder_jobs_status_send_at_idx on public.reminder_jobs (status, send_at);
create unique index if not exists reminder_jobs_dedupe_key_unique on public.reminder_jobs (dedupe_key) where dedupe_key is not null;

create trigger set_updated_at_before_update_reminder_jobs
before update on public.reminder_jobs
for each row execute function public.set_updated_at();

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  admin_user_id uuid references auth.users(id),
  action_type text not null,
  action_details jsonb,
  target_table text,
  target_id text,
  ip_address text,
  user_agent text
);

create index if not exists admin_audit_log_created_at_idx on public.admin_audit_log (created_at desc);
create index if not exists admin_audit_log_action_type_idx on public.admin_audit_log (action_type);
