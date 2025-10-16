-- Row Level Security policies for organization scoped data
-- This script is idempotent: existing policies are dropped before recreation.

-- Enable RLS on all org scoped tables
alter table public.orgs enable row level security;
alter table public.org_memberships enable row level security;
alter table public.org_invites enable row level security;
alter table public.org_preferences enable row level security;
alter table public.org_grants enable row level security;
alter table public.integrations enable row level security;
alter table public.reminder_jobs enable row level security;

-- Helper policy: service role has unrestricted access
-- (drop & recreate so rerunning the script is safe)
drop policy if exists "service_role_full_access" on public.orgs;
create policy "service_role_full_access" on public.orgs
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "service_role_full_access" on public.org_memberships;
create policy "service_role_full_access" on public.org_memberships
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "service_role_full_access" on public.org_invites;
create policy "service_role_full_access" on public.org_invites
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "service_role_full_access" on public.org_preferences;
create policy "service_role_full_access" on public.org_preferences
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "service_role_full_access" on public.org_grants;
create policy "service_role_full_access" on public.org_grants
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "service_role_full_access" on public.integrations;
create policy "service_role_full_access" on public.integrations
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "service_role_full_access" on public.reminder_jobs;
create policy "service_role_full_access" on public.reminder_jobs
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================================
-- Organizations
-- ============================================================================

drop policy if exists "members_read_org" on public.orgs;
create policy "members_read_org" on public.orgs
  for select
  using (
    exists (
      select 1
      from public.org_memberships m
      where m.org_id = orgs.id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "admins_update_org" on public.orgs;
create policy "admins_update_org" on public.orgs
  for update
  using (
    exists (
      select 1
      from public.org_memberships m
      where m.org_id = orgs.id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.org_memberships m
      where m.org_id = orgs.id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  );

drop policy if exists "admins_delete_org" on public.orgs;
create policy "admins_delete_org" on public.orgs
  for delete
  using (
    exists (
      select 1
      from public.org_memberships m
      where m.org_id = orgs.id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  );

-- ============================================================================
-- Organization memberships
-- ============================================================================

drop policy if exists "members_self_membership" on public.org_memberships;
create policy "members_self_membership" on public.org_memberships
  for select
  using (auth.uid() = user_id);

drop policy if exists "invitees_create_membership" on public.org_memberships;
create policy "invitees_create_membership" on public.org_memberships
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.org_invites i
      where i.org_id = org_memberships.org_id
        and lower(i.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and i.status in ('invited','accepted')
        and i.role = org_memberships.role
    )
  );

drop policy if exists "invitees_update_membership" on public.org_memberships;
create policy "invitees_update_membership" on public.org_memberships
  for update
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.org_invites i
      where i.org_id = org_memberships.org_id
        and lower(i.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and i.status in ('invited','accepted')
        and i.role = org_memberships.role
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.org_invites i
      where i.org_id = org_memberships.org_id
        and lower(i.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and i.status in ('invited','accepted')
        and i.role = org_memberships.role
    )
  );

drop policy if exists "admins_view_org_memberships" on public.org_memberships;
create policy "admins_view_org_memberships" on public.org_memberships
  for select
  using (
    exists (
      select 1
      from public.org_memberships m
      where m.org_id = org_memberships.org_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  );

drop policy if exists "admins_insert_org_memberships" on public.org_memberships;
create policy "admins_insert_org_memberships" on public.org_memberships
  for insert
  with check (
    exists (
      select 1
      from public.org_memberships m
      where m.org_id = org_memberships.org_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  );

drop policy if exists "admins_update_org_memberships" on public.org_memberships;
create policy "admins_update_org_memberships" on public.org_memberships
  for update
  using (
    exists (
      select 1
      from public.org_memberships m
      where m.org_id = org_memberships.org_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.org_memberships m
      where m.org_id = org_memberships.org_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  );

drop policy if exists "admins_delete_org_memberships" on public.org_memberships;
create policy "admins_delete_org_memberships" on public.org_memberships
  for delete
  using (
    exists (
      select 1
      from public.org_memberships m
      where m.org_id = org_memberships.org_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  );

-- ============================================================================
-- Organization invites
-- ============================================================================

drop policy if exists "members_view_invites" on public.org_invites;
create policy "members_view_invites" on public.org_invites
  for select
  using (
    exists (
      select 1
      from public.org_memberships m
      where m.org_id = org_invites.org_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "admins_manage_invites" on public.org_invites;
create policy "admins_manage_invites" on public.org_invites
  for all
  using (
    exists (
      select 1
      from public.org_memberships m
      where m.org_id = org_invites.org_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.org_memberships m
      where m.org_id = org_invites.org_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  );

drop policy if exists "invitees_accept_invite" on public.org_invites;
create policy "invitees_accept_invite" on public.org_invites
  for update
  using (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  with check (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- ============================================================================
-- Organization preferences
-- ============================================================================

drop policy if exists "members_read_preferences" on public.org_preferences;
create policy "members_read_preferences" on public.org_preferences
  for select
  using (
    exists (
      select 1
      from public.org_memberships m
      where m.org_id = org_preferences.org_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "admins_update_preferences" on public.org_preferences;
create policy "admins_update_preferences" on public.org_preferences
  for all
  using (
    exists (
      select 1
      from public.org_memberships m
      where m.org_id = org_preferences.org_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.org_memberships m
      where m.org_id = org_preferences.org_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  );

-- ============================================================================
-- Organization grants
-- ============================================================================

drop policy if exists "members_manage_org_grants" on public.org_grants;
create policy "members_read_org_grants" on public.org_grants
  for select
  using (
    exists (
      select 1
      from public.org_memberships m
      where m.org_id = org_grants.org_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "admins_insert_org_grants" on public.org_grants;
create policy "admins_insert_org_grants" on public.org_grants
  for insert
  with check (
    exists (
      select 1
      from public.org_memberships m
      where m.org_id = org_grants.org_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  );

drop policy if exists "members_update_org_grants" on public.org_grants;
create policy "members_update_org_grants" on public.org_grants
  for update
  using (
    exists (
      select 1
      from public.org_memberships m
      where m.org_id = org_grants.org_id
        and m.user_id = auth.uid()
        and m.role in ('admin', 'contributor')
    )
  )
  with check (
    exists (
      select 1
      from public.org_memberships m
      where m.org_id = org_grants.org_id
        and m.user_id = auth.uid()
        and m.role in ('admin', 'contributor')
    )
  );

drop policy if exists "admins_delete_org_grants" on public.org_grants;
create policy "admins_delete_org_grants" on public.org_grants
  for delete
  using (
    exists (
      select 1
      from public.org_memberships m
      where m.org_id = org_grants.org_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  );

-- ============================================================================
-- Integrations
-- ============================================================================

drop policy if exists "members_view_integrations" on public.integrations;
create policy "members_view_integrations" on public.integrations
  for select
  using (
    exists (
      select 1
      from public.org_memberships m
      where m.org_id = integrations.org_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "admins_manage_integrations" on public.integrations;
create policy "admins_manage_integrations" on public.integrations
  for all
  using (
    exists (
      select 1
      from public.org_memberships m
      where m.org_id = integrations.org_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.org_memberships m
      where m.org_id = integrations.org_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  );

-- ============================================================================
-- Reminder jobs
-- ============================================================================

drop policy if exists "members_read_reminder_jobs" on public.reminder_jobs;
create policy "members_read_reminder_jobs" on public.reminder_jobs
  for select
  using (
    exists (
      select 1
      from public.org_memberships m
      where m.org_id = reminder_jobs.org_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "admins_manage_reminder_jobs" on public.reminder_jobs;
create policy "admins_manage_reminder_jobs" on public.reminder_jobs
  for all
  using (
    exists (
      select 1
      from public.org_memberships m
      where m.org_id = reminder_jobs.org_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.org_memberships m
      where m.org_id = reminder_jobs.org_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  );
