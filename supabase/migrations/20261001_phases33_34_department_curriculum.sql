-- Phases 33-34: department hubs and curriculum hierarchy.
-- Department operational content is scoped to a department; curriculum is readable
-- across the organisation but editable only by authorised department/whole-school leads.

create or replace function private.staff_development_can_manage_department(target_org uuid, target_department text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.current_user_is_platform_admin()
    or exists (
      select 1 from public.school_organizations o
      where o.id = target_org and o.owner_user_id = (select auth.uid())
    )
    or exists (
      select 1 from public.staff_development_role_assignments r
      where r.organization_id = target_org
        and r.user_id = (select auth.uid())
        and r.role in ('slt','administrator','super-admin')
    )
    or exists (
      select 1
      from public.staff_development_role_assignments r
      join public.staff_development_profiles p on p.user_id = r.user_id
      where r.organization_id = target_org
        and r.user_id = (select auth.uid())
        and r.role = 'hod'
        and lower(coalesce(p.department,'')) = lower(coalesce(target_department,''))
    )
    or exists (
      select 1 from public.staff_profiles p
      where p.id = (select auth.uid())
        and p.organisation_id = target_org
        and p.role in ('Admin','CPD Lead')
    )
    or exists (
      select 1 from public.staff_profiles p
      where p.id = (select auth.uid())
        and p.organisation_id = target_org
        and p.role = 'Department Lead'
        and lower(coalesce(p.department,'')) = lower(coalesce(target_department,''))
    );
$$;

revoke all on function private.staff_development_can_manage_department(uuid,text) from public, anon;
grant execute on function private.staff_development_can_manage_department(uuid,text) to authenticated;

create or replace function private.staff_development_can_view_department(target_org uuid, target_department text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.staff_development_can_manage_department(target_org, target_department)
    or exists (
      select 1 from public.staff_development_profiles p
      where p.user_id = (select auth.uid())
        and p.preferred_organization_id = target_org
        and lower(coalesce(p.department,'')) = lower(coalesce(target_department,''))
    )
    or exists (
      select 1 from public.staff_profiles p
      where p.id = (select auth.uid())
        and p.organisation_id = target_org
        and lower(coalesce(p.department,'')) = lower(coalesce(target_department,''))
    );
$$;

revoke all on function private.staff_development_can_view_department(uuid,text) from public, anon;
grant execute on function private.staff_development_can_view_department(uuid,text) to authenticated;

create or replace function private.staff_development_can_view_curriculum(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.current_user_is_platform_admin()
    or exists (
      select 1 from public.school_organizations o
      where o.id = target_org and o.owner_user_id = (select auth.uid())
    )
    or exists (
      select 1 from public.school_organization_members m
      where m.organization_id = target_org and m.user_id = (select auth.uid())
    )
    or exists (
      select 1 from public.staff_development_profiles p
      where p.user_id = (select auth.uid()) and p.preferred_organization_id = target_org
    )
    or exists (
      select 1 from public.staff_profiles p
      where p.id = (select auth.uid()) and p.organisation_id = target_org
    );
$$;

revoke all on function private.staff_development_can_view_curriculum(uuid) from public, anon;
grant execute on function private.staff_development_can_view_curriculum(uuid) to authenticated;

create table if not exists public.department_hub_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.school_organizations(id) on delete cascade,
  department text not null,
  item_type text not null check (item_type = any (array['notice'::text,'resource'::text,'assessment'::text,'meeting_note'::text,'key_date'::text])),
  title text not null,
  summary text not null default '',
  body text not null default '',
  resource_url text,
  event_date date,
  tags text[] not null default '{}',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists department_hub_items_scope_idx on public.department_hub_items(organization_id, department, item_type, updated_at desc);
alter table public.department_hub_items enable row level security;
revoke all on public.department_hub_items from anon, authenticated;
grant select, insert, update, delete on public.department_hub_items to authenticated;

drop policy if exists department_hub_items_read on public.department_hub_items;
create policy department_hub_items_read on public.department_hub_items
for select to authenticated
using (private.staff_development_can_view_department(organization_id, department));

drop policy if exists department_hub_items_insert on public.department_hub_items;
create policy department_hub_items_insert on public.department_hub_items
for insert to authenticated
with check ((select auth.uid()) = created_by and private.staff_development_can_manage_department(organization_id, department));

drop policy if exists department_hub_items_update on public.department_hub_items;
create policy department_hub_items_update on public.department_hub_items
for update to authenticated
using (private.staff_development_can_manage_department(organization_id, department))
with check (private.staff_development_can_manage_department(organization_id, department));

drop policy if exists department_hub_items_delete on public.department_hub_items;
create policy department_hub_items_delete on public.department_hub_items
for delete to authenticated
using (private.staff_development_can_manage_department(organization_id, department));

create table if not exists public.school_curriculum_units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.school_organizations(id) on delete cascade,
  department text not null,
  subject text not null,
  year_group text not null,
  title text not null,
  sequence_order integer not null default 1,
  overview text not null default '',
  objectives text[] not null default '{}',
  vocabulary text[] not null default '{}',
  knowledge_organiser text not null default '',
  assessment_notes text not null default '',
  resource_links jsonb not null default '[]'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists school_curriculum_units_scope_idx on public.school_curriculum_units(organization_id, subject, year_group, sequence_order);
alter table public.school_curriculum_units enable row level security;
revoke all on public.school_curriculum_units from anon, authenticated;
grant select, insert, update, delete on public.school_curriculum_units to authenticated;

drop policy if exists curriculum_units_read on public.school_curriculum_units;
create policy curriculum_units_read on public.school_curriculum_units
for select to authenticated using (private.staff_development_can_view_curriculum(organization_id));

drop policy if exists curriculum_units_insert on public.school_curriculum_units;
create policy curriculum_units_insert on public.school_curriculum_units
for insert to authenticated
with check ((select auth.uid()) = created_by and private.staff_development_can_manage_department(organization_id, department));

drop policy if exists curriculum_units_update on public.school_curriculum_units;
create policy curriculum_units_update on public.school_curriculum_units
for update to authenticated
using (private.staff_development_can_manage_department(organization_id, department))
with check (private.staff_development_can_manage_department(organization_id, department));

drop policy if exists curriculum_units_delete on public.school_curriculum_units;
create policy curriculum_units_delete on public.school_curriculum_units
for delete to authenticated
using (private.staff_development_can_manage_department(organization_id, department));

create table if not exists public.school_curriculum_lessons (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.school_curriculum_units(id) on delete cascade,
  title text not null,
  sequence_order integer not null default 1,
  objectives text[] not null default '{}',
  key_knowledge text not null default '',
  lesson_outline text not null default '',
  assessment text not null default '',
  resource_links jsonb not null default '[]'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists school_curriculum_lessons_unit_idx on public.school_curriculum_lessons(unit_id, sequence_order);
alter table public.school_curriculum_lessons enable row level security;
revoke all on public.school_curriculum_lessons from anon, authenticated;
grant select, insert, update, delete on public.school_curriculum_lessons to authenticated;

drop policy if exists curriculum_lessons_read on public.school_curriculum_lessons;
create policy curriculum_lessons_read on public.school_curriculum_lessons
for select to authenticated
using (exists (
  select 1 from public.school_curriculum_units u
  where u.id = unit_id and private.staff_development_can_view_curriculum(u.organization_id)
));

drop policy if exists curriculum_lessons_insert on public.school_curriculum_lessons;
create policy curriculum_lessons_insert on public.school_curriculum_lessons
for insert to authenticated
with check ((select auth.uid()) = created_by and exists (
  select 1 from public.school_curriculum_units u
  where u.id = unit_id and private.staff_development_can_manage_department(u.organization_id, u.department)
));

drop policy if exists curriculum_lessons_update on public.school_curriculum_lessons;
create policy curriculum_lessons_update on public.school_curriculum_lessons
for update to authenticated
using (exists (
  select 1 from public.school_curriculum_units u
  where u.id = unit_id and private.staff_development_can_manage_department(u.organization_id, u.department)
))
with check (exists (
  select 1 from public.school_curriculum_units u
  where u.id = unit_id and private.staff_development_can_manage_department(u.organization_id, u.department)
));

drop policy if exists curriculum_lessons_delete on public.school_curriculum_lessons;
create policy curriculum_lessons_delete on public.school_curriculum_lessons
for delete to authenticated
using (exists (
  select 1 from public.school_curriculum_units u
  where u.id = unit_id and private.staff_development_can_manage_department(u.organization_id, u.department)
));
