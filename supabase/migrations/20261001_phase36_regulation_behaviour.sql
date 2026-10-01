-- Phase 36: regulation and behaviour support library.
-- This stores shared school guidance/playbooks only. Student-specific safeguarding casework
-- and detailed intervention tracking remain in their dedicated systems.

create table if not exists public.regulation_behaviour_resources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.school_organizations(id) on delete cascade,
  category text not null check (category = any (array[
    'regulation'::text,
    'classroom_routine'::text,
    'de_escalation'::text,
    'restorative'::text,
    'return_to_learning'::text,
    'behaviour_policy'::text,
    'staff_script'::text
  ])),
  title text not null,
  summary text not null default '',
  when_to_use text not null default '',
  steps text[] not null default '{}',
  avoid text[] not null default '{}',
  resource_url text,
  priority text not null default 'normal' check (priority in ('normal','high')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists regulation_behaviour_resources_org_category_idx
  on public.regulation_behaviour_resources(organization_id, category, updated_at desc);

alter table public.regulation_behaviour_resources enable row level security;
revoke all on public.regulation_behaviour_resources from anon, authenticated;
grant select, insert, update, delete on public.regulation_behaviour_resources to authenticated;

drop policy if exists regulation_behaviour_resources_read on public.regulation_behaviour_resources;
create policy regulation_behaviour_resources_read
on public.regulation_behaviour_resources
for select to authenticated
using (private.staff_development_can_view_curriculum(organization_id));

drop policy if exists regulation_behaviour_resources_insert on public.regulation_behaviour_resources;
create policy regulation_behaviour_resources_insert
on public.regulation_behaviour_resources
for insert to authenticated
with check (
  (select auth.uid()) = created_by
  and private.staff_development_can_manage_pastoral(organization_id)
);

drop policy if exists regulation_behaviour_resources_update on public.regulation_behaviour_resources;
create policy regulation_behaviour_resources_update
on public.regulation_behaviour_resources
for update to authenticated
using (private.staff_development_can_manage_pastoral(organization_id))
with check (private.staff_development_can_manage_pastoral(organization_id));

drop policy if exists regulation_behaviour_resources_delete on public.regulation_behaviour_resources;
create policy regulation_behaviour_resources_delete
on public.regulation_behaviour_resources
for delete to authenticated
using (private.staff_development_can_manage_pastoral(organization_id));
