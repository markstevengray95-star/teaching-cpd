create table if not exists public.staff_timetable_curriculum_summaries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.school_organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  class_name text not null,
  subject text not null default '',
  year_group text not null default '',
  course_id text not null default '',
  coverage_percent smallint not null default 0 check (coverage_percent between 0 and 100),
  completed_lessons integer not null default 0 check (completed_lessons >= 0),
  planned_lessons integer not null default 0 check (planned_lessons >= 0),
  sequence_length integer not null default 0 check (sequence_length >= 0),
  current_unit text not null default '',
  next_unit text not null default '',
  next_assessment_title text not null default '',
  next_assessment_date date,
  gap_flags text[] not null default '{}'::text[],
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id, class_name)
);

create index if not exists staff_timetable_curriculum_summaries_org_idx
  on public.staff_timetable_curriculum_summaries (organization_id, updated_at desc);
create index if not exists staff_timetable_curriculum_summaries_subject_idx
  on public.staff_timetable_curriculum_summaries (organization_id, subject, year_group);

create schema if not exists private;

create or replace function private.staff_timetable_can_view_leadership(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and (
      exists (select 1 from public.platform_admins pa where pa.user_id = (select auth.uid()))
      or exists (select 1 from public.staff_development_profiles p where p.user_id = (select auth.uid()) and p.platform_role = 'admin')
      or exists (select 1 from public.school_organizations o where o.id = target_org and o.owner_user_id = (select auth.uid()))
      or exists (
        select 1 from public.staff_development_role_assignments r
        where r.organization_id = target_org
          and r.user_id = (select auth.uid())
          and lower(r.role) in ('hod','head of department','department lead','department_lead','slt','leader','senior leader','senior_leader','administrator','admin','super-admin','super_admin')
      )
      or exists (
        select 1 from public.school_organization_members m
        where m.organization_id = target_org
          and m.user_id = (select auth.uid())
          and lower(coalesce(m.role,'')) in ('owner','admin','administrator','leader','slt','hod','head of department','department lead','department_lead')
      )
    );
$$;

create or replace function private.staff_timetable_can_write_summary(target_org uuid, target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and (select auth.uid()) = target_user
    and (
      exists (select 1 from public.school_organizations o where o.id = target_org and o.owner_user_id = (select auth.uid()))
      or exists (select 1 from public.school_organization_members m where m.organization_id = target_org and m.user_id = (select auth.uid()))
      or exists (select 1 from public.staff_development_profiles p where p.user_id = (select auth.uid()) and p.preferred_organization_id = target_org)
    );
$$;

revoke all on function private.staff_timetable_can_view_leadership(uuid) from public, anon;
revoke all on function private.staff_timetable_can_write_summary(uuid, uuid) from public, anon;
grant execute on function private.staff_timetable_can_view_leadership(uuid) to authenticated;
grant execute on function private.staff_timetable_can_write_summary(uuid, uuid) to authenticated;

alter table public.staff_timetable_curriculum_summaries enable row level security;
revoke all on table public.staff_timetable_curriculum_summaries from anon;
grant select, insert, update, delete on table public.staff_timetable_curriculum_summaries to authenticated;

drop policy if exists "staff timetable summaries read" on public.staff_timetable_curriculum_summaries;
create policy "staff timetable summaries read"
on public.staff_timetable_curriculum_summaries
for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select private.staff_timetable_can_view_leadership(organization_id))
);

drop policy if exists "staff timetable summaries insert own" on public.staff_timetable_curriculum_summaries;
create policy "staff timetable summaries insert own"
on public.staff_timetable_curriculum_summaries
for insert
to authenticated
with check ((select private.staff_timetable_can_write_summary(organization_id, user_id)));

drop policy if exists "staff timetable summaries update own" on public.staff_timetable_curriculum_summaries;
create policy "staff timetable summaries update own"
on public.staff_timetable_curriculum_summaries
for update
to authenticated
using ((select private.staff_timetable_can_write_summary(organization_id, user_id)))
with check ((select private.staff_timetable_can_write_summary(organization_id, user_id)));

drop policy if exists "staff timetable summaries delete own" on public.staff_timetable_curriculum_summaries;
create policy "staff timetable summaries delete own"
on public.staff_timetable_curriculum_summaries
for delete
to authenticated
using ((select private.staff_timetable_can_write_summary(organization_id, user_id)));
