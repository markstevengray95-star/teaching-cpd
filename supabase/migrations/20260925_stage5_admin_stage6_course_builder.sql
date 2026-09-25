create schema if not exists private;

grant usage on schema private to authenticated;

create or replace function private.is_cpd_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff_profiles sp
    where sp.id = (select auth.uid())
      and sp.role in ('CPD Lead', 'Admin')
  );
$$;
revoke execute on function private.is_cpd_admin() from public, anon;
grant execute on function private.is_cpd_admin() to authenticated;

drop policy if exists "cpd admins can view staff directory" on public.staff_profiles;
create policy "cpd admins can view staff directory"
on public.staff_profiles for select
to authenticated
using ((select private.is_cpd_admin()));

create table if not exists public.cpd_assignments (
  id uuid primary key default gen_random_uuid(),
  assigned_to uuid not null references auth.users(id) on delete cascade,
  assigned_by uuid not null references auth.users(id) on delete restrict,
  target_type text not null check (target_type in ('catalogue','custom','pathway')),
  target_id text not null,
  title_snapshot text not null,
  due_date date,
  mandatory boolean not null default false,
  status text not null default 'assigned' check (status in ('assigned','in_progress','completed','waived')),
  completed_at timestamptz,
  assignment_note text not null default '',
  assigned_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cpd_assignments_staff_due_idx on public.cpd_assignments(assigned_to, due_date);
create index if not exists cpd_assignments_target_idx on public.cpd_assignments(target_type, target_id);

create table if not exists public.training_requirements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  target_type text not null check (target_type in ('catalogue','custom')),
  target_id text not null,
  frequency_months integer check (frequency_months is null or (frequency_months >= 1 and frequency_months <= 120)),
  mandatory boolean not null default true,
  audience_type text not null default 'all' check (audience_type in ('all','role','department')),
  audience_value text,
  active boolean not null default true,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists training_requirements_target_idx on public.training_requirements(target_type, target_id);

create table if not exists public.training_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  requirement_id uuid not null references public.training_requirements(id) on delete cascade,
  completed_at timestamptz not null,
  expires_at timestamptz,
  source_course_id text,
  verified_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (user_id, requirement_id)
);
create index if not exists training_records_expiry_idx on public.training_records(expires_at);

create table if not exists public.cpd_calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text not null default '',
  audience text not null default 'All staff',
  event_type text not null default 'cpd' check (event_type in ('cpd','deadline','review','training')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);
create index if not exists cpd_calendar_events_starts_idx on public.cpd_calendar_events(starts_at);

create table if not exists public.custom_courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null default 'Teaching & Learning',
  summary text not null default '',
  duration_minutes integer not null default 30 check (duration_minutes >= 1 and duration_minutes <= 1440),
  level text not null default 'Foundation' check (level in ('Foundation','Developing','Advanced')),
  objectives text[] not null default '{}',
  recommended_for text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_by uuid not null references auth.users(id) on delete restrict,
  current_version_id uuid,
  current_version_number integer not null default 1 check (current_version_number >= 1),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.custom_course_versions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.custom_courses(id) on delete cascade,
  version_number integer not null check (version_number >= 1),
  title text not null,
  summary text not null default '',
  duration_minutes integer not null default 30 check (duration_minutes >= 1 and duration_minutes <= 1440),
  level text not null default 'Foundation' check (level in ('Foundation','Developing','Advanced')),
  objectives text[] not null default '{}',
  recommended_for text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','published','superseded')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique(course_id, version_number)
);

alter table public.custom_courses drop constraint if exists custom_courses_current_version_id_fkey;
alter table public.custom_courses add constraint custom_courses_current_version_id_fkey foreign key (current_version_id) references public.custom_course_versions(id) on delete set null;

create table if not exists public.custom_course_blocks (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.custom_course_versions(id) on delete cascade,
  sort_order integer not null default 0 check (sort_order >= 0),
  block_type text not null check (block_type in ('text','image','video','quiz','scenario','poll','reflection','action_plan','download')),
  title text not null default '',
  content jsonb not null default '{}'::jsonb,
  required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists custom_course_versions_course_idx on public.custom_course_versions(course_id, version_number desc);
create index if not exists custom_course_blocks_version_order_idx on public.custom_course_blocks(version_id, sort_order);

alter table public.cpd_assignments enable row level security;
alter table public.training_requirements enable row level security;
alter table public.training_records enable row level security;
alter table public.cpd_calendar_events enable row level security;
alter table public.custom_courses enable row level security;
alter table public.custom_course_versions enable row level security;
alter table public.custom_course_blocks enable row level security;

revoke all on public.cpd_assignments, public.training_requirements, public.training_records, public.cpd_calendar_events, public.custom_courses, public.custom_course_versions, public.custom_course_blocks from anon;
grant select, insert, update, delete on public.cpd_assignments, public.training_requirements, public.training_records, public.cpd_calendar_events, public.custom_courses, public.custom_course_versions, public.custom_course_blocks to authenticated;

create policy "staff view own assignments" on public.cpd_assignments for select to authenticated using ((select auth.uid()) = assigned_to or (select private.is_cpd_admin()));
create policy "cpd admins insert assignments" on public.cpd_assignments for insert to authenticated with check ((select private.is_cpd_admin()) and assigned_by = (select auth.uid()));
create policy "cpd admins update assignments" on public.cpd_assignments for update to authenticated using ((select private.is_cpd_admin())) with check ((select private.is_cpd_admin()));
create policy "cpd admins delete assignments" on public.cpd_assignments for delete to authenticated using ((select private.is_cpd_admin()));

create policy "staff view active requirements" on public.training_requirements for select to authenticated using (active or (select private.is_cpd_admin()));
create policy "cpd admins insert requirements" on public.training_requirements for insert to authenticated with check ((select private.is_cpd_admin()) and created_by = (select auth.uid()));
create policy "cpd admins update requirements" on public.training_requirements for update to authenticated using ((select private.is_cpd_admin())) with check ((select private.is_cpd_admin()));
create policy "cpd admins delete requirements" on public.training_requirements for delete to authenticated using ((select private.is_cpd_admin()));

create policy "staff view own training records" on public.training_records for select to authenticated using ((select auth.uid()) = user_id or (select private.is_cpd_admin()));
create policy "cpd admins insert training records" on public.training_records for insert to authenticated with check ((select private.is_cpd_admin()));
create policy "cpd admins update training records" on public.training_records for update to authenticated using ((select private.is_cpd_admin())) with check ((select private.is_cpd_admin()));
create policy "cpd admins delete training records" on public.training_records for delete to authenticated using ((select private.is_cpd_admin()));

create policy "authenticated view cpd calendar" on public.cpd_calendar_events for select to authenticated using (true);
create policy "cpd admins insert calendar" on public.cpd_calendar_events for insert to authenticated with check ((select private.is_cpd_admin()) and created_by = (select auth.uid()));
create policy "cpd admins update calendar" on public.cpd_calendar_events for update to authenticated using ((select private.is_cpd_admin())) with check ((select private.is_cpd_admin()));
create policy "cpd admins delete calendar" on public.cpd_calendar_events for delete to authenticated using ((select private.is_cpd_admin()));

create policy "staff view published custom courses" on public.custom_courses for select to authenticated using (status = 'published' or (select private.is_cpd_admin()));
create policy "cpd admins insert custom courses" on public.custom_courses for insert to authenticated with check ((select private.is_cpd_admin()) and created_by = (select auth.uid()));
create policy "cpd admins update custom courses" on public.custom_courses for update to authenticated using ((select private.is_cpd_admin())) with check ((select private.is_cpd_admin()));
create policy "cpd admins delete custom courses" on public.custom_courses for delete to authenticated using ((select private.is_cpd_admin()));

create policy "staff view published course versions" on public.custom_course_versions for select to authenticated using (status = 'published' or (select private.is_cpd_admin()));
create policy "cpd admins insert course versions" on public.custom_course_versions for insert to authenticated with check ((select private.is_cpd_admin()) and created_by = (select auth.uid()));
create policy "cpd admins update course versions" on public.custom_course_versions for update to authenticated using ((select private.is_cpd_admin())) with check ((select private.is_cpd_admin()));
create policy "cpd admins delete course versions" on public.custom_course_versions for delete to authenticated using ((select private.is_cpd_admin()));

create policy "staff view blocks for published versions" on public.custom_course_blocks for select to authenticated using ((select private.is_cpd_admin()) or exists (select 1 from public.custom_course_versions v where v.id = custom_course_blocks.version_id and v.status = 'published'));
create policy "cpd admins insert course blocks" on public.custom_course_blocks for insert to authenticated with check ((select private.is_cpd_admin()));
create policy "cpd admins update course blocks" on public.custom_course_blocks for update to authenticated using ((select private.is_cpd_admin())) with check ((select private.is_cpd_admin()));
create policy "cpd admins delete course blocks" on public.custom_course_blocks for delete to authenticated using ((select private.is_cpd_admin()));

create or replace function private.sync_cpd_completion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_kind text;
  staff_role text;
  staff_department text;
begin
  target_kind := case when new.course_id like 'custom:%' then 'custom' else 'catalogue' end;
  if new.completed_at is null then
    update public.cpd_assignments set status = case when status = 'assigned' then 'in_progress' else status end, updated_at = now()
    where assigned_to = new.user_id and target_type = target_kind and target_id = new.course_id and status in ('assigned','in_progress');
    return new;
  end if;

  update public.cpd_assignments set status = 'completed', completed_at = coalesce(completed_at, new.completed_at), updated_at = now()
  where assigned_to = new.user_id and target_type = target_kind and target_id = new.course_id and status <> 'waived';

  select role, department into staff_role, staff_department from public.staff_profiles where id = new.user_id;
  insert into public.training_records(user_id, requirement_id, completed_at, expires_at, source_course_id, updated_at)
  select new.user_id, r.id, new.completed_at,
         case when r.frequency_months is null then null else new.completed_at + make_interval(months => r.frequency_months) end,
         new.course_id, now()
  from public.training_requirements r
  where r.active and r.target_type = target_kind and r.target_id = new.course_id
    and (r.audience_type = 'all' or (r.audience_type = 'role' and r.audience_value = staff_role) or (r.audience_type = 'department' and r.audience_value = staff_department))
  on conflict (user_id, requirement_id) do update set completed_at = excluded.completed_at, expires_at = excluded.expires_at, source_course_id = excluded.source_course_id, updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_sync_cpd_completion on public.course_progress;
create trigger trg_sync_cpd_completion after insert or update of completed_modules, completed_at on public.course_progress for each row execute function private.sync_cpd_completion();

create or replace function public.publish_custom_course(p_course_id uuid, p_version_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not (select private.is_cpd_admin()) then raise exception 'CPD Lead or Admin permission required' using errcode = '42501'; end if;
  if not exists (select 1 from public.custom_course_versions v where v.id = p_version_id and v.course_id = p_course_id) then raise exception 'Version does not belong to course'; end if;
  update public.custom_course_versions set status = 'superseded' where course_id = p_course_id and status = 'published' and id <> p_version_id;
  update public.custom_course_versions set status = 'published', published_at = coalesce(published_at, now()) where id = p_version_id;
  update public.custom_courses c set title = v.title, summary = v.summary, duration_minutes = v.duration_minutes, level = v.level, objectives = v.objectives, recommended_for = v.recommended_for, current_version_id = v.id, current_version_number = v.version_number, status = 'published', published_at = coalesce(c.published_at, now()), updated_at = now()
  from public.custom_course_versions v where c.id = p_course_id and v.id = p_version_id;
end;
$$;
revoke execute on function public.publish_custom_course(uuid, uuid) from public, anon;
grant execute on function public.publish_custom_course(uuid, uuid) to authenticated;
