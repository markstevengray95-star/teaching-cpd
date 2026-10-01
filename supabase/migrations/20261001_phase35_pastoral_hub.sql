-- Phase 35: pastoral and tutor-time hub.
-- This stores shared pastoral resources and weekly tutor-time planning only.
-- Safeguarding casework and detailed student notes remain in their dedicated systems.

create or replace function private.staff_development_can_manage_pastoral(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and (
    private.current_user_is_platform_admin()
    or exists (
      select 1 from public.school_organizations o
      where o.id = target_org and o.owner_user_id = (select auth.uid())
    )
    or exists (
      select 1 from public.staff_development_role_assignments r
      where r.organization_id = target_org
        and r.user_id = (select auth.uid())
        and r.role in ('pastoral','send-eal','slt','administrator','super-admin')
    )
    or exists (
      select 1 from public.school_organization_members m
      where m.organization_id = target_org
        and m.user_id = (select auth.uid())
        and m.role in ('owner','admin','leader','pastoral')
    )
    or exists (
      select 1 from public.staff_profiles p
      where p.id = (select auth.uid())
        and p.organisation_id = target_org
        and lower(coalesce(p.role,'')) in ('admin','cpd lead','pastoral','pastoral lead')
    )
  );
$$;

revoke all on function private.staff_development_can_manage_pastoral(uuid) from public, anon;
grant execute on function private.staff_development_can_manage_pastoral(uuid) to authenticated;

create or replace function private.staff_development_can_contribute_pastoral(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and (
    private.staff_development_can_manage_pastoral(target_org)
    or exists (
      select 1 from public.staff_development_role_assignments r
      where r.organization_id = target_org
        and r.user_id = (select auth.uid())
        and r.role in ('tutor','hod')
    )
    or exists (
      select 1 from public.school_organization_members m
      where m.organization_id = target_org
        and m.user_id = (select auth.uid())
        and m.role in ('tutor','department_lead','cpd_lead')
    )
    or exists (
      select 1 from public.staff_profiles p
      where p.id = (select auth.uid())
        and p.organisation_id = target_org
        and lower(coalesce(p.role,'')) in ('tutor','form tutor','department lead')
    )
  );
$$;

revoke all on function private.staff_development_can_contribute_pastoral(uuid) from public, anon;
grant execute on function private.staff_development_can_contribute_pastoral(uuid) to authenticated;

create table if not exists public.pastoral_hub_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.school_organizations(id) on delete cascade,
  item_type text not null check (item_type = any (array[
    'tutor_activity'::text,
    'assembly'::text,
    'mentoring'::text,
    'attendance'::text,
    'behaviour'::text,
    'reward'::text,
    'wellbeing'::text,
    'safeguarding'::text,
    'key_date'::text
  ])),
  title text not null,
  summary text not null default '',
  body text not null default '',
  year_group text not null default '',
  tutor_group text not null default '',
  week_start date,
  event_date date,
  resource_url text,
  priority text not null default 'normal' check (priority in ('normal','high')),
  tags text[] not null default '{}',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pastoral_hub_items_org_type_idx on public.pastoral_hub_items(organization_id, item_type, updated_at desc);
create index if not exists pastoral_hub_items_week_idx on public.pastoral_hub_items(organization_id, week_start, year_group, tutor_group);

alter table public.pastoral_hub_items enable row level security;
revoke all on public.pastoral_hub_items from anon, authenticated;
grant select, insert, update, delete on public.pastoral_hub_items to authenticated;

drop policy if exists pastoral_hub_items_read on public.pastoral_hub_items;
create policy pastoral_hub_items_read on public.pastoral_hub_items
for select to authenticated
using (private.staff_development_can_view_curriculum(organization_id));

drop policy if exists pastoral_hub_items_insert on public.pastoral_hub_items;
create policy pastoral_hub_items_insert on public.pastoral_hub_items
for insert to authenticated
with check (
  (select auth.uid()) = created_by
  and private.staff_development_can_contribute_pastoral(organization_id)
);

drop policy if exists pastoral_hub_items_update on public.pastoral_hub_items;
create policy pastoral_hub_items_update on public.pastoral_hub_items
for update to authenticated
using (
  private.staff_development_can_manage_pastoral(organization_id)
  or ((select auth.uid()) = created_by and private.staff_development_can_contribute_pastoral(organization_id))
)
with check (
  private.staff_development_can_manage_pastoral(organization_id)
  or ((select auth.uid()) = created_by and private.staff_development_can_contribute_pastoral(organization_id))
);

drop policy if exists pastoral_hub_items_delete on public.pastoral_hub_items;
create policy pastoral_hub_items_delete on public.pastoral_hub_items
for delete to authenticated
using (
  private.staff_development_can_manage_pastoral(organization_id)
  or ((select auth.uid()) = created_by and private.staff_development_can_contribute_pastoral(organization_id))
);
