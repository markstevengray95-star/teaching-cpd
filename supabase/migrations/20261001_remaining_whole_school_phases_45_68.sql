create schema if not exists private;

create or replace function private.whole_school_role(p_org uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when (select private.current_user_is_platform_admin()) then 'super-admin'
    when exists(select 1 from public.school_organizations o where o.id=p_org and o.owner_user_id=(select auth.uid())) then 'administrator'
    else coalesce(
      (select case lower(a.role)
        when 'teacher' then 'teacher' when 'tutor' then 'tutor' when 'hod' then 'hod'
        when 'pastoral' then 'pastoral' when 'send-eal' then 'send-eal' when 'slt' then 'slt'
        when 'administrator' then 'administrator' when 'support' then 'support' else lower(a.role)
      end from public.staff_development_role_assignments a
      where a.organization_id=p_org and a.user_id=(select auth.uid()) limit 1),
      (select case lower(m.role)
        when 'owner' then 'administrator' when 'admin' then 'administrator' when 'leader' then 'slt'
        when 'pastoral' then 'pastoral' when 'cpd_lead' then 'hod' when 'department_lead' then 'hod'
        when 'member' then 'teacher' else lower(m.role)
      end from public.school_organization_members m
      where m.organization_id=p_org and m.user_id=(select auth.uid()) limit 1),
      'teacher'
    )
  end;
$$;

create or replace function private.whole_school_department(p_org uuid)
returns text language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select nullif(trim(p.department),'') from public.staff_development_profiles p where p.user_id=(select auth.uid()) and (p.preferred_organization_id=p_org or p.preferred_organization_id is null) limit 1),
    (select nullif(trim(p.department),'') from public.staff_profiles p where p.id=(select auth.uid()) and (p.organisation_id=p_org or p.organisation_id is null) limit 1)
  );
$$;

create or replace function private.whole_school_is_member(p_org uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select private.current_user_is_platform_admin())
      or exists(select 1 from public.school_organizations o where o.id=p_org and o.owner_user_id=(select auth.uid()))
      or exists(select 1 from public.school_organization_members m where m.organization_id=p_org and m.user_id=(select auth.uid()))
      or exists(select 1 from public.staff_development_role_assignments a where a.organization_id=p_org and a.user_id=(select auth.uid()));
$$;

create or replace function private.whole_school_is_leader(p_org uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select private.whole_school_role(p_org)) in ('hod','pastoral','send-eal','slt','administrator','super-admin');
$$;

create or replace function private.whole_school_is_senior(p_org uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select private.whole_school_role(p_org)) in ('slt','administrator','super-admin');
$$;

create or replace function private.whole_school_audience_matches(p_org uuid, p_audience text, p_department text)
returns boolean language sql stable security definer set search_path = '' as $$
  select case coalesce(p_audience,'all-staff')
    when 'all-staff' then (select private.whole_school_is_member(p_org))
    when 'teaching' then (select private.whole_school_role(p_org)) in ('teacher','tutor','hod','pastoral','send-eal','slt','super-admin')
    when 'tutors' then (select private.whole_school_role(p_org)) in ('tutor','pastoral','slt','administrator','super-admin')
    when 'leadership' then (select private.whole_school_is_leader(p_org))
    when 'support' then (select private.whole_school_role(p_org)) in ('support','administrator','slt','super-admin')
    when 'department' then (select private.whole_school_is_senior(p_org)) or coalesce(lower((select private.whole_school_department(p_org))),'') = coalesce(lower(p_department),'')
    else (select private.whole_school_is_member(p_org))
  end;
$$;

revoke all on function private.whole_school_role(uuid) from public, anon;
revoke all on function private.whole_school_department(uuid) from public, anon;
revoke all on function private.whole_school_is_member(uuid) from public, anon;
revoke all on function private.whole_school_is_leader(uuid) from public, anon;
revoke all on function private.whole_school_is_senior(uuid) from public, anon;
revoke all on function private.whole_school_audience_matches(uuid,text,text) from public, anon;
grant execute on function private.whole_school_role(uuid) to authenticated;
grant execute on function private.whole_school_department(uuid) to authenticated;
grant execute on function private.whole_school_is_member(uuid) to authenticated;
grant execute on function private.whole_school_is_leader(uuid) to authenticated;
grant execute on function private.whole_school_is_senior(uuid) to authenticated;
grant execute on function private.whole_school_audience_matches(uuid,text,text) to authenticated;

create table if not exists public.staff_directory_entries (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.school_organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, display_name text not null, role text, department text,
  job_title text, email text, phone text, location text, expertise text[] not null default '{}', bio text,
  directory_visible boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(organization_id,user_id)
);
create index if not exists staff_directory_entries_org_idx on public.staff_directory_entries(organization_id);
create index if not exists staff_directory_entries_department_idx on public.staff_directory_entries(organization_id,department);
alter table public.staff_directory_entries enable row level security;
grant select,insert,update,delete on public.staff_directory_entries to authenticated;
create policy directory_read on public.staff_directory_entries for select to authenticated using ((select private.whole_school_is_member(organization_id)) and (directory_visible or user_id=(select auth.uid()) or (select private.whole_school_is_leader(organization_id))));
create policy directory_insert on public.staff_directory_entries for insert to authenticated with check ((select private.whole_school_is_member(organization_id)) and (user_id=(select auth.uid()) or (select private.whole_school_is_leader(organization_id))));
create policy directory_update on public.staff_directory_entries for update to authenticated using (user_id=(select auth.uid()) or (select private.whole_school_is_leader(organization_id))) with check (user_id=(select auth.uid()) or (select private.whole_school_is_leader(organization_id)));
create policy directory_delete on public.staff_directory_entries for delete to authenticated using (user_id=(select auth.uid()) or (select private.whole_school_is_leader(organization_id)));

create table if not exists public.school_improvement_items (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.school_organizations(id) on delete cascade,
  scope text not null check (scope in ('school','department')), department text, title text not null, strand text, description text,
  success_criteria text, owner_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'planned' check (status in ('planned','active','at-risk','complete','paused')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  start_date date, due_date date, progress integer not null default 0 check (progress between 0 and 100), evidence text, impact text,
  created_by uuid not null references auth.users(id) on delete restrict, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists school_improvement_items_org_idx on public.school_improvement_items(organization_id,scope,status);
create index if not exists school_improvement_items_department_idx on public.school_improvement_items(organization_id,department);
alter table public.school_improvement_items enable row level security;
grant select,insert,update,delete on public.school_improvement_items to authenticated;
create policy improvement_read on public.school_improvement_items for select to authenticated using ((select private.whole_school_is_member(organization_id)));
create policy improvement_insert on public.school_improvement_items for insert to authenticated with check ((select private.whole_school_is_leader(organization_id)) and created_by=(select auth.uid()));
create policy improvement_update on public.school_improvement_items for update to authenticated using ((select private.whole_school_is_leader(organization_id))) with check ((select private.whole_school_is_leader(organization_id)));
create policy improvement_delete on public.school_improvement_items for delete to authenticated using ((select private.whole_school_is_leader(organization_id)));

create table if not exists public.school_requests (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.school_organizations(id) on delete cascade,
  request_type text not null check (request_type in ('form','trip')), title text not null, description text,
  requester_user_id uuid not null references auth.users(id) on delete cascade, department text,
  status text not null default 'draft' check (status in ('draft','submitted','approved','changes-requested','rejected','complete','cancelled')),
  approver_user_id uuid references auth.users(id) on delete set null, due_date date, event_date date, metadata jsonb not null default '{}'::jsonb,
  approval_note text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists school_requests_org_idx on public.school_requests(organization_id,request_type,status);
create index if not exists school_requests_requester_idx on public.school_requests(requester_user_id,updated_at desc);
alter table public.school_requests enable row level security;
grant select,insert,update,delete on public.school_requests to authenticated;
create policy requests_read on public.school_requests for select to authenticated using (requester_user_id=(select auth.uid()) or (select private.whole_school_is_leader(organization_id)));
create policy requests_insert on public.school_requests for insert to authenticated with check ((select private.whole_school_is_member(organization_id)) and requester_user_id=(select auth.uid()));
create policy requests_update on public.school_requests for update to authenticated using (requester_user_id=(select auth.uid()) or (select private.whole_school_is_leader(organization_id))) with check (requester_user_id=(select auth.uid()) or (select private.whole_school_is_leader(organization_id)));
create policy requests_delete on public.school_requests for delete to authenticated using ((requester_user_id=(select auth.uid()) and status='draft') or (select private.whole_school_is_leader(organization_id)));

create table if not exists public.school_content_items (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.school_organizations(id) on delete cascade,
  content_type text not null check (content_type in ('resource','policy')), title text not null, description text, category text, department text,
  audience text not null default 'all-staff', version text, review_date date, link_url text, storage_path text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_by uuid not null references auth.users(id) on delete restrict, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists school_content_items_org_idx on public.school_content_items(organization_id,content_type,status);
create index if not exists school_content_items_category_idx on public.school_content_items(organization_id,category);
alter table public.school_content_items enable row level security;
grant select,insert,update,delete on public.school_content_items to authenticated;
create policy content_read on public.school_content_items for select to authenticated using ((select private.whole_school_is_member(organization_id)) and (status='published' or created_by=(select auth.uid()) or (select private.whole_school_is_leader(organization_id))));
create policy content_insert on public.school_content_items for insert to authenticated with check ((select private.whole_school_is_member(organization_id)) and created_by=(select auth.uid()) and (content_type='resource' or (select private.whole_school_is_leader(organization_id))));
create policy content_update on public.school_content_items for update to authenticated using (((content_type='resource' and created_by=(select auth.uid())) or (select private.whole_school_is_leader(organization_id)))) with check (((content_type='resource' and created_by=(select auth.uid())) or (select private.whole_school_is_leader(organization_id))));
create policy content_delete on public.school_content_items for delete to authenticated using (((content_type='resource' and created_by=(select auth.uid())) or (select private.whole_school_is_leader(organization_id))));

create table if not exists public.staff_voice_entries (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.school_organizations(id) on delete cascade,
  kind text not null check (kind in ('recognition','voice')), title text not null, body text not null, category text,
  subject_user_id uuid references auth.users(id) on delete set null, anonymous boolean not null default false,
  status text not null default 'submitted' check (status in ('submitted','reviewing','actioned','published','archived')),
  created_by uuid references auth.users(id) on delete set null, response text, responded_by uuid references auth.users(id) on delete set null,
  responded_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists staff_voice_entries_org_idx on public.staff_voice_entries(organization_id,kind,status,created_at desc);
alter table public.staff_voice_entries enable row level security;
grant select,insert,update,delete on public.staff_voice_entries to authenticated;
create policy voice_read on public.staff_voice_entries for select to authenticated using ((kind='recognition' and status='published' and (select private.whole_school_is_member(organization_id))) or created_by=(select auth.uid()) or (select private.whole_school_is_leader(organization_id)));
create policy voice_insert on public.staff_voice_entries for insert to authenticated with check ((select private.whole_school_is_member(organization_id)) and ((anonymous and kind='voice' and created_by is null) or ((not anonymous) and created_by=(select auth.uid()))));
create policy voice_update on public.staff_voice_entries for update to authenticated using ((created_by=(select auth.uid()) and status='submitted') or (select private.whole_school_is_leader(organization_id))) with check ((created_by=(select auth.uid()) and status='submitted') or (select private.whole_school_is_leader(organization_id)));
create policy voice_delete on public.staff_voice_entries for delete to authenticated using ((created_by=(select auth.uid()) and status='submitted') or (select private.whole_school_is_leader(organization_id)));

create table if not exists public.school_notifications (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.school_organizations(id) on delete cascade,
  title text not null, body text, category text, priority text not null default 'normal' check (priority in ('normal','high','urgent')),
  audience text not null default 'all-staff', department text, action_url text, starts_at timestamptz not null default now(), expires_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict, created_at timestamptz not null default now()
);
create index if not exists school_notifications_org_idx on public.school_notifications(organization_id,starts_at desc);
alter table public.school_notifications enable row level security;
grant select,insert,update,delete on public.school_notifications to authenticated;
create policy notifications_read on public.school_notifications for select to authenticated using ((select private.whole_school_audience_matches(organization_id,audience,department)) and starts_at<=now() and (expires_at is null or expires_at>now()));
create policy notifications_insert on public.school_notifications for insert to authenticated with check ((select private.whole_school_is_leader(organization_id)) and created_by=(select auth.uid()));
create policy notifications_update on public.school_notifications for update to authenticated using ((select private.whole_school_is_leader(organization_id))) with check ((select private.whole_school_is_leader(organization_id)));
create policy notifications_delete on public.school_notifications for delete to authenticated using ((select private.whole_school_is_leader(organization_id)));

create table if not exists public.school_notification_reads (
  notification_id uuid not null references public.school_notifications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key(notification_id,user_id)
);
alter table public.school_notification_reads enable row level security;
grant select,insert,update,delete on public.school_notification_reads to authenticated;
create policy notification_reads_select on public.school_notification_reads for select to authenticated using (user_id=(select auth.uid()));
create policy notification_reads_insert on public.school_notification_reads for insert to authenticated with check (user_id=(select auth.uid()));
create policy notification_reads_update on public.school_notification_reads for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy notification_reads_delete on public.school_notification_reads for delete to authenticated using (user_id=(select auth.uid()));