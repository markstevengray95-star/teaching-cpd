-- Phase 44: School Calendar
-- Shared organisation calendar plus private personal staff events.

create table if not exists public.school_calendar_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.school_organizations(id) on delete cascade,
  title text not null,
  description text not null default '',
  category text not null default 'event' check (category = any (array[
    'meeting'::text,'deadline'::text,'cpd'::text,'trip'::text,'assessment'::text,
    'school-event'::text,'pastoral'::text,'department'::text,'duty'::text,
    'personal'::text,'event'::text
  ])),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  all_day boolean not null default false,
  location text not null default '',
  audience text not null default 'all_staff' check (audience = any (array[
    'all_staff'::text,'teaching'::text,'tutors'::text,'leadership'::text,
    'support'::text,'department'::text,'personal'::text
  ])),
  target_department text not null default '',
  external_url text not null default '',
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint school_calendar_events_valid_time check (ends_at >= starts_at),
  constraint school_calendar_department_target check (
    audience <> 'department' or length(trim(target_department)) > 0
  )
);

create index if not exists school_calendar_events_org_start_idx
  on public.school_calendar_events(organization_id, starts_at);
create index if not exists school_calendar_events_creator_idx
  on public.school_calendar_events(created_by, starts_at);
create index if not exists school_calendar_events_audience_idx
  on public.school_calendar_events(organization_id, audience, starts_at);

create or replace function private.staff_calendar_role(target_org uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select 'super-admin'::text where private.sd_is_admin()),
    (select r.role
       from public.staff_development_role_assignments r
      where r.organization_id = target_org
        and r.user_id = (select auth.uid())
      limit 1),
    (select 'administrator'::text
       from public.school_organizations o
      where o.id = target_org
        and o.owner_user_id = (select auth.uid())
      limit 1),
    (select case m.role
       when 'admin' then 'administrator'
       when 'owner' then 'administrator'
       when 'leader' then 'slt'
       when 'cpd_lead' then 'hod'
       when 'pastoral' then 'pastoral'
       else 'teacher'
     end
       from public.school_organization_members m
      where m.organization_id = target_org
        and m.user_id = (select auth.uid())
      limit 1),
    'teacher'::text
  );
$$;

create or replace function private.staff_calendar_department(target_org uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select s.department
      from public.staff_profiles s
     where s.id = (select auth.uid())
       and s.organisation_id = target_org
     limit 1
  ), '');
$$;

create or replace function private.staff_calendar_can_view(
  target_org uuid,
  event_audience text,
  event_department text,
  event_creator uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and (
    event_creator = (select auth.uid())
    or (
      private.sd_is_org_member(target_org)
      and case event_audience
        when 'all_staff' then true
        when 'personal' then false
        when 'leadership' then private.staff_calendar_role(target_org) = any (
          array['hod','pastoral','send-eal','slt','administrator','super-admin']
        )
        when 'teaching' then private.staff_calendar_role(target_org) = any (
          array['teacher','tutor','hod','pastoral','send-eal','slt','administrator','super-admin']
        )
        when 'tutors' then private.staff_calendar_role(target_org) = any (
          array['tutor','pastoral','slt','administrator','super-admin']
        )
        when 'support' then private.staff_calendar_role(target_org) = any (
          array['support','send-eal','pastoral','slt','administrator','super-admin']
        )
        when 'department' then lower(trim(private.staff_calendar_department(target_org))) = lower(trim(event_department))
        else false
      end
    )
  );
$$;

create or replace function private.staff_calendar_can_manage(
  target_org uuid,
  event_audience text,
  event_department text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.sd_is_org_member(target_org) and (
    private.staff_calendar_role(target_org) = any (
      array['pastoral','send-eal','slt','administrator','super-admin']
    )
    or (
      private.staff_calendar_role(target_org) = 'hod'
      and event_audience = 'department'
      and lower(trim(private.staff_calendar_department(target_org))) = lower(trim(event_department))
    )
  );
$$;

revoke all on function private.staff_calendar_role(uuid) from public;
revoke all on function private.staff_calendar_department(uuid) from public;
revoke all on function private.staff_calendar_can_view(uuid,text,text,uuid) from public;
revoke all on function private.staff_calendar_can_manage(uuid,text,text) from public;
grant execute on function private.staff_calendar_role(uuid) to authenticated;
grant execute on function private.staff_calendar_department(uuid) to authenticated;
grant execute on function private.staff_calendar_can_view(uuid,text,text,uuid) to authenticated;
grant execute on function private.staff_calendar_can_manage(uuid,text,text) to authenticated;

alter table public.school_calendar_events enable row level security;
revoke all on public.school_calendar_events from anon, authenticated;
grant select, insert, update, delete on public.school_calendar_events to authenticated;

drop policy if exists calendar_events_read on public.school_calendar_events;
create policy calendar_events_read
on public.school_calendar_events
for select to authenticated
using ((select private.staff_calendar_can_view(
  organization_id, audience, target_department, created_by
)));

drop policy if exists calendar_events_insert on public.school_calendar_events;
create policy calendar_events_insert
on public.school_calendar_events
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and private.sd_is_org_member(organization_id)
  and (
    audience = 'personal'
    or (select private.staff_calendar_can_manage(
      organization_id, audience, target_department
    ))
  )
);

drop policy if exists calendar_events_update on public.school_calendar_events;
create policy calendar_events_update
on public.school_calendar_events
for update to authenticated
using (
  (created_by = (select auth.uid()) and audience = 'personal')
  or (select private.staff_calendar_can_manage(
    organization_id, audience, target_department
  ))
)
with check (
  private.sd_is_org_member(organization_id)
  and (
    (created_by = (select auth.uid()) and audience = 'personal')
    or (select private.staff_calendar_can_manage(
      organization_id, audience, target_department
    ))
  )
);

drop policy if exists calendar_events_delete on public.school_calendar_events;
create policy calendar_events_delete
on public.school_calendar_events
for delete to authenticated
using (
  (created_by = (select auth.uid()) and audience = 'personal')
  or (select private.staff_calendar_can_manage(
    organization_id, audience, target_department
  ))
);
