-- Admin platform administrators mapping
create table if not exists platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  granted_by uuid references auth.users (id),
  created_at timestamptz default now(),
  notes text
);

comment on table platform_admins is 'Users with elevated platform-wide access to the admin panel.';
comment on column platform_admins.granted_by is 'User who granted the platform admin role.';

-- Admin audit log captures all actions from the admin panel
create table if not exists admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users (id),
  action_type text not null,
  action_details jsonb,
  target_table text,
  target_id uuid,
  ip_address inet,
  user_agent text,
  created_at timestamptz default now()
);

comment on table admin_audit_log is 'Immutable log of admin console actions and queries.';
comment on column admin_audit_log.action_details is 'JSON payload describing the action in detail.';

create index if not exists idx_audit_log_admin on admin_audit_log (admin_user_id);
create index if not exists idx_audit_log_created on admin_audit_log (created_at desc);
create index if not exists idx_audit_log_action on admin_audit_log (action_type);

-- Helper view summarising audit log entries with user metadata
create or replace view admin_audit_log_enriched as
select
  log.id,
  log.admin_user_id,
  auth_users.email,
  log.action_type,
  log.action_details,
  log.target_table,
  log.target_id,
  log.ip_address,
  log.user_agent,
  log.created_at
from admin_audit_log log
left join auth.users auth_users on auth_users.id = log.admin_user_id;
