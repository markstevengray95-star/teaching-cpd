-- Phase 37: SEND & EAL staff resource hub.
-- Stores organisation-level inclusive teaching guidance only; no identifiable pupil records.
-- This migration is self-contained for the current production schema.

create table if not exists public.send_eal_resources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.school_organizations(id) on delete cascade,
  area text not null check (area in ('universal','send','eal')),
  category text not null check (category = any (array[
    'communication_interaction'::text,
    'cognition_learning'::text,
    'social_emotional_regulation'::text,
    'sensory_physical'::text,
    'executive_independence'::text,
    'new_to_english'::text,
    'spoken_language'::text,
    'vocabulary'::text,
    'reading_writing'::text,
    'academic_language'::text,
    'assessment_access'::text,
    'transition'::text,
    'inclusive_classroom'::text
  ])),
  phase text not null default 'all' check (phase in ('all','ks3','ks4','sixth_form')),
  title text not null,
  summary text not null default '',
  barrier text not null default '',
  strategies text[] not null default '{}',
  check_understanding text not null default '',
  avoid text[] not null default '{}',
  resource_url text,
  priority text not null default 'normal' check (priority in ('normal','high')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists send_eal_resources_org_area_category_idx
  on public.send_eal_resources(organization_id, area, category, updated_at desc);

alter table public.send_eal_resources enable row level security;
revoke all on public.send_eal_resources from anon, authenticated;
grant select, insert, update, delete on public.send_eal_resources to authenticated;

drop policy if exists send_eal_resources_read on public.send_eal_resources;
create policy send_eal_resources_read
on public.send_eal_resources
for select to authenticated
using (
  (select auth.uid()) is not null
  and (
    exists (
      select 1 from public.school_organizations o
      where o.id = send_eal_resources.organization_id
        and o.owner_user_id = (select auth.uid())
    )
    or exists (
      select 1 from public.school_organization_members m
      where m.organization_id = send_eal_resources.organization_id
        and m.user_id = (select auth.uid())
    )
    or exists (
      select 1 from public.staff_profiles p
      where p.id = (select auth.uid())
        and p.organisation_id = send_eal_resources.organization_id
    )
    or exists (
      select 1 from public.staff_development_profiles p
      where p.user_id = (select auth.uid())
        and p.preferred_organization_id = send_eal_resources.organization_id
    )
  )
);

drop policy if exists send_eal_resources_insert on public.send_eal_resources;
create policy send_eal_resources_insert
on public.send_eal_resources
for insert to authenticated
with check (
  (select auth.uid()) = created_by
  and (
    exists (
      select 1 from public.school_organizations o
      where o.id = send_eal_resources.organization_id
        and o.owner_user_id = (select auth.uid())
    )
    or exists (
      select 1 from public.staff_development_profiles p
      where p.user_id = (select auth.uid())
        and lower(coalesce(p.platform_role,'')) = 'admin'
    )
    or exists (
      select 1 from public.school_organization_members m
      where m.organization_id = send_eal_resources.organization_id
        and m.user_id = (select auth.uid())
        and lower(coalesce(m.role,'')) in ('owner','admin','leader','pastoral','pastoral lead','send-eal','send_eal','senco','eal')
    )
    or exists (
      select 1 from public.staff_profiles p
      where p.id = (select auth.uid())
        and p.organisation_id = send_eal_resources.organization_id
        and lower(coalesce(p.role,'')) in ('admin','slt','leader','pastoral','pastoral lead','send-eal','send/eal','senco','eal lead')
    )
  )
);

drop policy if exists send_eal_resources_update on public.send_eal_resources;
create policy send_eal_resources_update
on public.send_eal_resources
for update to authenticated
using (
  exists (select 1 from public.school_organizations o where o.id = send_eal_resources.organization_id and o.owner_user_id = (select auth.uid()))
  or exists (select 1 from public.staff_development_profiles p where p.user_id = (select auth.uid()) and lower(coalesce(p.platform_role,'')) = 'admin')
  or exists (select 1 from public.school_organization_members m where m.organization_id = send_eal_resources.organization_id and m.user_id = (select auth.uid()) and lower(coalesce(m.role,'')) in ('owner','admin','leader','pastoral','pastoral lead','send-eal','send_eal','senco','eal'))
  or exists (select 1 from public.staff_profiles p where p.id = (select auth.uid()) and p.organisation_id = send_eal_resources.organization_id and lower(coalesce(p.role,'')) in ('admin','slt','leader','pastoral','pastoral lead','send-eal','send/eal','senco','eal lead'))
)
with check (
  exists (select 1 from public.school_organizations o where o.id = send_eal_resources.organization_id and o.owner_user_id = (select auth.uid()))
  or exists (select 1 from public.staff_development_profiles p where p.user_id = (select auth.uid()) and lower(coalesce(p.platform_role,'')) = 'admin')
  or exists (select 1 from public.school_organization_members m where m.organization_id = send_eal_resources.organization_id and m.user_id = (select auth.uid()) and lower(coalesce(m.role,'')) in ('owner','admin','leader','pastoral','pastoral lead','send-eal','send_eal','senco','eal'))
  or exists (select 1 from public.staff_profiles p where p.id = (select auth.uid()) and p.organisation_id = send_eal_resources.organization_id and lower(coalesce(p.role,'')) in ('admin','slt','leader','pastoral','pastoral lead','send-eal','send/eal','senco','eal lead'))
);

drop policy if exists send_eal_resources_delete on public.send_eal_resources;
create policy send_eal_resources_delete
on public.send_eal_resources
for delete to authenticated
using (
  exists (select 1 from public.school_organizations o where o.id = send_eal_resources.organization_id and o.owner_user_id = (select auth.uid()))
  or exists (select 1 from public.staff_development_profiles p where p.user_id = (select auth.uid()) and lower(coalesce(p.platform_role,'')) = 'admin')
  or exists (select 1 from public.school_organization_members m where m.organization_id = send_eal_resources.organization_id and m.user_id = (select auth.uid()) and lower(coalesce(m.role,'')) in ('owner','admin','leader','pastoral','pastoral lead','send-eal','send_eal','senco','eal'))
  or exists (select 1 from public.staff_profiles p where p.id = (select auth.uid()) and p.organisation_id = send_eal_resources.organization_id and lower(coalesce(p.role,'')) in ('admin','slt','leader','pastoral','pastoral lead','send-eal','send/eal','senco','eal lead'))
);
