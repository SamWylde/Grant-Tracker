-- Enable required extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- Organizations
create table if not exists public.orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  timezone text not null default 'UTC',
  calendar_ics_secret text not null default encode(extensions.gen_random_bytes(24), 'hex'),
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
  id uuid not null default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'contributor' check (role in ('admin','contributor')),
  status text not null default 'invited' check (status in ('invited','active','inactive')),
  invited_by uuid references auth.users(id),
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (org_id, user_id),
  unique (id)
);

alter table if exists public.org_memberships
  add column if not exists id uuid not null default gen_random_uuid();

alter table if exists public.org_memberships
  add column if not exists status text;

alter table if exists public.org_memberships
  alter column status set default 'invited';

update public.org_memberships set status = coalesce(status, 'invited') where status is null;

alter table if exists public.org_memberships
  alter column status set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'org_memberships_status_check'
  ) then
    alter table public.org_memberships
      add constraint org_memberships_status_check
      check (status in ('invited','active','inactive'));
  end if;
end;
$$;

alter table if exists public.org_memberships
  add column if not exists invited_at timestamptz default now();

alter table if exists public.org_memberships
  alter column invited_at set default now();

update public.org_memberships set invited_at = coalesce(invited_at, created_at) where invited_at is null;

alter table if exists public.org_memberships
  alter column invited_at set not null;

alter table if exists public.org_memberships
  add column if not exists accepted_at timestamptz;

alter table if exists public.org_memberships
  add column if not exists revoked_at timestamptz;

alter table if exists public.org_memberships
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.org_memberships
  alter column updated_at set default now();

update public.org_memberships set updated_at = coalesce(updated_at, now()) where updated_at is null;

alter table if exists public.org_memberships
  alter column updated_at set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'org_memberships_id_key'
  ) then
    alter table public.org_memberships
      add constraint org_memberships_id_key unique (id);
  end if;
end;
$$;

create index if not exists org_memberships_status_idx on public.org_memberships(status);

drop trigger if exists set_org_memberships_updated_at on public.org_memberships;
create trigger set_org_memberships_updated_at
  before update on public.org_memberships
  for each row
  execute function public.set_updated_at();

create index if not exists org_memberships_user_id_idx on public.org_memberships(user_id);

create table if not exists public.org_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  email text not null,
  role text not null default 'contributor' check (role in ('admin','contributor')),
  token text not null unique default encode(extensions.gen_random_bytes(24), 'hex'),
  status text not null default 'invited' check (status in ('invited','accepted','revoked','expired')),
  accepted_at timestamptz,
  revoked_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  invited_by uuid references auth.users(id)
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'org_invites'
      and column_name = 'created_by'
  )
  and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'org_invites'
      and column_name = 'invited_by'
  ) then
    alter table public.org_invites rename column created_by to invited_by;
  end if;
end;
$$;

alter table if exists public.org_invites
  add column if not exists status text;

alter table if exists public.org_invites
  alter column status set default 'invited';

update public.org_invites set status = coalesce(status, 'invited') where status is null;

alter table if exists public.org_invites
  alter column status set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'org_invites_status_check'
  ) then
    alter table public.org_invites
      add constraint org_invites_status_check
      check (status in ('invited','accepted','revoked','expired'));
  end if;
end;
$$;

alter table if exists public.org_invites
  add column if not exists revoked_at timestamptz;

alter table if exists public.org_invites
  add column if not exists accepted_at timestamptz;

alter table if exists public.org_invites
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.org_invites
  alter column updated_at set default now();

update public.org_invites set updated_at = coalesce(updated_at, now()) where updated_at is null;

alter table if exists public.org_invites
  alter column updated_at set not null;

alter table if exists public.org_invites
  add column if not exists invited_by uuid references auth.users(id);

create index if not exists org_invites_status_idx on public.org_invites(status);

drop trigger if exists set_org_invites_updated_at on public.org_invites;
create trigger set_org_invites_updated_at
  before update on public.org_invites
  for each row
  execute function public.set_updated_at();

create index if not exists org_invites_org_id_idx on public.org_invites(org_id);
create index if not exists org_invites_email_idx on public.org_invites(lower(email));

-- Invitation acceptance helper function
create or replace function public.accept_org_invite(invite_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_invite public.org_invites%rowtype;
  current_user_id uuid;
  invite_email text;
begin
  if invite_token is null or length(trim(invite_token)) = 0 then
    raise exception 'Invite token is required.';
  end if;

  current_user_id := auth.uid();
  if current_user_id is null then
    raise exception 'Authentication is required to accept an invite.';
  end if;

  select *
  into target_invite
  from public.org_invites
  where token = invite_token
    and status in ('invited','accepted')
    and (expires_at is null or expires_at > now())
  limit 1;

  if not found then
    raise exception 'Invite not found, expired, or already revoked.';
  end if;

  invite_email := lower(target_invite.email);
  if invite_email is distinct from lower(coalesce(auth.jwt() ->> 'email', '')) then
    raise exception 'Invite email does not match the authenticated user.';
  end if;

  insert into public.org_memberships (
    org_id,
    user_id,
    role,
    status,
    invited_by,
    invited_at,
    accepted_at,
    updated_at
  )
  values (
    target_invite.org_id,
    current_user_id,
    target_invite.role,
    'active',
    target_invite.invited_by,
    coalesce(target_invite.created_at, now()),
    now(),
    now()
  )
  on conflict (org_id, user_id) do update
  set
    role = excluded.role,
    status = 'active',
    invited_by = coalesce(excluded.invited_by, public.org_memberships.invited_by),
    invited_at = coalesce(public.org_memberships.invited_at, excluded.invited_at),
    accepted_at = now(),
    updated_at = now();

  update public.org_invites
  set
    status = 'accepted',
    accepted_at = now(),
    updated_at = now()
  where id = target_invite.id;
end;
$$;

grant execute on function public.accept_org_invite(text) to authenticated;
grant execute on function public.accept_org_invite(text) to service_role;

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

