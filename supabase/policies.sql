-- Enable row level security on key tables
alter table public.orgs enable row level security;
alter table public.org_memberships enable row level security;
alter table public.org_invites enable row level security;
alter table public.org_preferences enable row level security;
alter table public.org_grants enable row level security;
alter table public.integrations enable row level security;
alter table public.reminder_jobs enable row level security;

-- Helper policy: service role has unrestricted access
create policy "service_role_full_access" on public.orgs
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "service_role_full_access" on public.org_memberships
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "service_role_full_access" on public.org_invites
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "service_role_full_access" on public.org_preferences
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "service_role_full_access" on public.org_grants
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "service_role_full_access" on public.integrations
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "service_role_full_access" on public.reminder_jobs
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Org member read access
create policy "members_read_org" on public.orgs
  for select
  using (
    exists (
      select 1
      from public.org_memberships m
      where m.org_id = orgs.id and m.user_id = auth.uid()
    )
  );

create policy "members_manage_org_grants" on public.org_grants
  for all
  using (
    exists (
      select 1
      from public.org_memberships m
      where m.org_id = org_grants.org_id and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.org_memberships m
      where m.org_id = org_grants.org_id and m.user_id = auth.uid()
    )
  );

create policy "members_read_preferences" on public.org_preferences
  for select
  using (
    exists (
      select 1
      from public.org_memberships m
      where m.org_id = org_preferences.org_id and m.user_id = auth.uid()
    )
  );

create policy "admins_update_preferences" on public.org_preferences
  for all
  using (
    exists (
      select 1
      from public.org_memberships m
      where m.org_id = org_preferences.org_id and m.user_id = auth.uid() and m.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.org_memberships m
      where m.org_id = org_preferences.org_id and m.user_id = auth.uid() and m.role = 'admin'
    )
  );

create policy "members_view_invites" on public.org_invites
  for select
  using (
    exists (
      select 1 from public.org_memberships m
      where m.org_id = org_invites.org_id and m.user_id = auth.uid()
    )
  );

create policy "admins_manage_invites" on public.org_invites
  for all
  using (
    exists (
      select 1 from public.org_memberships m
      where m.org_id = org_invites.org_id and m.user_id = auth.uid() and m.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.org_memberships m
      where m.org_id = org_invites.org_id and m.user_id = auth.uid() and m.role = 'admin'
    )
  );

create policy "members_view_integrations" on public.integrations
  for select
  using (
    exists (
      select 1 from public.org_memberships m
      where m.org_id = integrations.org_id and m.user_id = auth.uid()
    )
  );

create policy "admins_manage_integrations" on public.integrations
  for all
  using (
    exists (
      select 1 from public.org_memberships m
      where m.org_id = integrations.org_id and m.user_id = auth.uid() and m.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.org_memberships m
      where m.org_id = integrations.org_id and m.user_id = auth.uid() and m.role = 'admin'
    )
  );

create policy "admins_manage_reminder_jobs" on public.reminder_jobs
  for all
  using (
    exists (
      select 1 from public.org_memberships m
      where m.org_id = reminder_jobs.org_id and m.user_id = auth.uid() and m.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.org_memberships m
      where m.org_id = reminder_jobs.org_id and m.user_id = auth.uid() and m.role = 'admin'
    )
  );

create policy "members_read_reminder_jobs" on public.reminder_jobs
  for select
  using (
    exists (
      select 1 from public.org_memberships m
      where m.org_id = reminder_jobs.org_id and m.user_id = auth.uid()
    )
  );

create policy "members_self_membership" on public.org_memberships
  for select
  using (auth.uid() = user_id);

