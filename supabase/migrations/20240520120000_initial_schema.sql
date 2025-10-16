-- Enable required extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- Organizations
create table if not exists public.orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  timezone text not null default 'UTC',
  calendar_ics_secret text not null default encode(gen_random_bytes(24), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_orgs_updated_at
  before update on public.orgs
  for each row
  execute function public.set_updated_at();

-- Members and roles
create table if not exists public.org_memberships (
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'contributor' check (role in ('admin','contributor')),
  invited_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create index if not exists org_memberships_user_id_idx on public.org_memberships(user_id);

create table if not exists public.org_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  email text not null,
  role text not null default 'contributor' check (role in ('admin','contributor')),
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  accepted_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create index if not exists org_invites_org_id_idx on public.org_invites(org_id);
create index if not exists org_invites_email_idx on public.org_invites(lower(email));

-- Organization preferences
create table if not exists public.org_preferences (
  org_id uuid primary key references public.orgs(id) on delete cascade,
  states text[] not null default '{}',
  focus_areas text[] not null default '{}',
  timezone text not null default 'UTC',
  reminder_channels jsonb not null default '[]'::jsonb,
  unsubscribe_url text,
  calendar jsonb not null default '{}'::jsonb,
  sms_from_number text,
  updated_at timestamptz not null default now()
);

create trigger set_org_preferences_updated_at
  before update on public.org_preferences
  for each row
  execute function public.set_updated_at();

-- Grants catalog
create table if not exists public.grants (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'grants.gov',
  external_id text,
  title text not null,
  agency text not null,
  url text,
  summary text,
  opportunity_number text,
  opportunity_category text,
  funding_instrument text,
  estimated_funding numeric,
  award_floor numeric,
  award_ceiling numeric,
  expected_number_of_awards integer,
  focus_areas text[] not null default '{}',
  eligibilities jsonb not null default '[]'::jsonb,
  posted_date date,
  close_date date,
  created_at timestamptz not null default now()
);

create unique index if not exists grants_external_idx on public.grants(source, external_id);

-- Org specific grants
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
  stage text not null default 'Researching',
  priority text not null default 'Medium',
  notes text,
  owner text,
  attachments text[] not null default '{}',
  history jsonb not null default '[]'::jsonb,
  milestones jsonb not null default '[]'::jsonb,
  tasks jsonb not null default '[]'::jsonb,
  source text not null default 'manual',
  opportunity_number text,
  opportunity_category text,
  funding_instrument text,
  focus_areas text[] not null default '{}',
  eligibilities jsonb not null default '[]'::jsonb,
  estimated_funding numeric,
  award_floor numeric,
  award_ceiling numeric,
  expected_number_of_awards integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists org_grants_org_id_idx on public.org_grants(org_id);
create index if not exists org_grants_stage_idx on public.org_grants(stage);

create trigger set_org_grants_updated_at
  before update on public.org_grants
  for each row
  execute function public.set_updated_at();

-- Integrations (Google, etc)
create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  provider text not null,
  provider_account_id text,
  access_token text,
  refresh_token text,
  scope text,
  token_expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists integrations_org_provider_idx on public.integrations(org_id, provider);

create trigger set_integrations_updated_at
  before update on public.integrations
  for each row
  execute function public.set_updated_at();

-- Reminder jobs queue
create table if not exists public.reminder_jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  org_grant_id uuid references public.org_grants(id) on delete cascade,
  milestone_id text,
  channel text not null,
  send_at timestamptz not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','sent','cancelled','failed')),
  dedupe_key text unique,
  processed_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists reminder_jobs_org_idx on public.reminder_jobs(org_id);
create index if not exists reminder_jobs_send_at_idx on public.reminder_jobs(send_at);
create index if not exists reminder_jobs_status_idx on public.reminder_jobs(status);

