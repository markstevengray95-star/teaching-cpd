-- SEN/EAL secure workspace backing tables.
-- Applied to the linked Supabase project on 2026-10-02.

create or replace function public.sen_workspace_access(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (select auth.uid()) is not null and (
    exists (
      select 1 from public.school_organizations o
      where o.id = org_id and o.owner_user_id = (select auth.uid())
    )
    or exists (
      select 1 from public.staff_development_profiles p
      where p.user_id = (select auth.uid())
        and lower(coalesce(p.platform_role,'')) = 'admin'
    )
    or exists (
      select 1 from public.school_organization_members m
      where m.organization_id = org_id
        and m.user_id = (select auth.uid())
        and lower(coalesce(m.role,'')) in (
          'owner','admin','administrator','leader','slt','pastoral','pastoral lead','pastoral_lead',
          'send-eal','send_eal','send/eal','senco','eal','eal lead','eal_lead'
        )
    )
  );
$$;

revoke all on function public.sen_workspace_access(uuid) from public, anon;
grant execute on function public.sen_workspace_access(uuid) to authenticated;

create table if not exists public.sen_department_cases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.school_organizations(id) on delete cascade,
  body jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  archived_at timestamptz,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_sen_department_case()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.version := old.version + 1;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists sen_department_cases_touch on public.sen_department_cases;
create trigger sen_department_cases_touch
before update on public.sen_department_cases
for each row execute function public.touch_sen_department_case();

create index if not exists sen_department_cases_org_updated_idx
  on public.sen_department_cases(organization_id, updated_at desc);
create index if not exists sen_department_cases_org_archive_idx
  on public.sen_department_cases(organization_id, archived_at);

alter table public.sen_department_cases enable row level security;
revoke all on public.sen_department_cases from anon, authenticated;
grant select, insert, update, delete on public.sen_department_cases to authenticated;

drop policy if exists sen_department_cases_select on public.sen_department_cases;
create policy sen_department_cases_select on public.sen_department_cases
for select to authenticated using (public.sen_workspace_access(organization_id));

drop policy if exists sen_department_cases_insert on public.sen_department_cases;
create policy sen_department_cases_insert on public.sen_department_cases
for insert to authenticated
with check (public.sen_workspace_access(organization_id) and created_by = (select auth.uid()));

drop policy if exists sen_department_cases_update on public.sen_department_cases;
create policy sen_department_cases_update on public.sen_department_cases
for update to authenticated
using (public.sen_workspace_access(organization_id))
with check (public.sen_workspace_access(organization_id));

drop policy if exists sen_department_cases_delete on public.sen_department_cases;
create policy sen_department_cases_delete on public.sen_department_cases
for delete to authenticated using (public.sen_workspace_access(organization_id));

create table if not exists public.eal_student_tests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.school_organizations(id) on delete cascade,
  pupil_case_id uuid references public.sen_department_cases(id) on delete set null,
  code text not null unique check (code ~ '^[0-9]{6}$'),
  title text not null default 'EAL language assessment',
  status text not null default 'open' check (status in ('open','submitted','reviewed','closed')),
  prompts jsonb not null default '{}'::jsonb,
  responses jsonb not null default '{}'::jsonb,
  scores jsonb not null default '{}'::jsonb,
  teacher_notes text not null default '',
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  expires_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists eal_student_tests_org_status_idx
  on public.eal_student_tests(organization_id,status,created_at desc);
create index if not exists eal_student_tests_pupil_idx
  on public.eal_student_tests(pupil_case_id,created_at desc);

alter table public.eal_student_tests enable row level security;
revoke all on public.eal_student_tests from anon, authenticated;
grant select, insert, update, delete on public.eal_student_tests to authenticated;

drop policy if exists eal_student_tests_select on public.eal_student_tests;
create policy eal_student_tests_select on public.eal_student_tests
for select to authenticated using (public.sen_workspace_access(organization_id));

drop policy if exists eal_student_tests_insert on public.eal_student_tests;
create policy eal_student_tests_insert on public.eal_student_tests
for insert to authenticated
with check (public.sen_workspace_access(organization_id) and created_by = (select auth.uid()));

drop policy if exists eal_student_tests_update on public.eal_student_tests;
create policy eal_student_tests_update on public.eal_student_tests
for update to authenticated
using (public.sen_workspace_access(organization_id))
with check (public.sen_workspace_access(organization_id));

drop policy if exists eal_student_tests_delete on public.eal_student_tests;
create policy eal_student_tests_delete on public.eal_student_tests
for delete to authenticated using (public.sen_workspace_access(organization_id));

create table if not exists public.eal_audit_log (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.school_organizations(id) on delete cascade,
  actor_user_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
  pupil_case_id uuid references public.sen_department_cases(id) on delete set null,
  action text not null,
  detail text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists eal_audit_log_org_created_idx
  on public.eal_audit_log(organization_id,created_at desc);

alter table public.eal_audit_log enable row level security;
revoke all on public.eal_audit_log from anon, authenticated;
grant select, insert on public.eal_audit_log to authenticated;

drop policy if exists eal_audit_log_select on public.eal_audit_log;
create policy eal_audit_log_select on public.eal_audit_log
for select to authenticated using (public.sen_workspace_access(organization_id));

drop policy if exists eal_audit_log_insert on public.eal_audit_log;
create policy eal_audit_log_insert on public.eal_audit_log
for insert to authenticated
with check (public.sen_workspace_access(organization_id) and actor_user_id = (select auth.uid()));
