-- Phase 38: intervention tracking upgrade.
-- Extends the existing intervention table and adds structured review history.

create schema if not exists private;

create or replace function private.staff_development_can_manage_interventions(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and (
    private.current_user_is_platform_admin()
    or exists (select 1 from public.school_organizations o where o.id = target_org and o.owner_user_id = (select auth.uid()))
    or exists (
      select 1 from public.school_organization_members m
      where m.organization_id = target_org and m.user_id = (select auth.uid())
        and lower(coalesce(m.role,'')) in ('owner','admin','leader','pastoral','pastoral lead','send-eal','send_eal','senco','eal')
    )
    or exists (
      select 1 from public.staff_profiles p
      where p.id = (select auth.uid()) and p.organisation_id = target_org
        and lower(coalesce(p.role,'')) in ('admin','slt','leader','pastoral','pastoral lead','send-eal','send/eal','senco','eal lead')
    )
    or exists (
      select 1 from public.staff_development_profiles p
      where p.user_id = (select auth.uid()) and p.preferred_organization_id = target_org
        and lower(coalesce(p.platform_role,'')) = 'admin'
    )
  );
$$;

revoke all on function private.staff_development_can_manage_interventions(uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.staff_development_can_manage_interventions(uuid) to authenticated;

alter table public.staff_development_interventions
  add column if not exists student_id uuid references public.staff_development_students(id) on delete set null,
  add column if not exists intervention_type text not null default 'targeted_support' check (intervention_type in ('targeted_support','pastoral','attendance','behaviour','regulation','send','eal','academic','mentoring','other')),
  add column if not exists baseline_summary text not null default '',
  add column if not exists goal text not null default '',
  add column if not exists success_criteria text not null default '',
  add column if not exists start_date date not null default current_date,
  add column if not exists frequency text not null default '',
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null,
  add column if not exists review_interval_days integer not null default 28 check (review_interval_days between 1 and 365),
  add column if not exists outcome text not null default '',
  add column if not exists closed_at timestamptz,
  add column if not exists last_reviewed_at timestamptz;

create index if not exists staff_development_interventions_org_status_review_idx on public.staff_development_interventions(organization_id, status, review_date);
create index if not exists staff_development_interventions_student_idx on public.staff_development_interventions(student_id, status);

create table if not exists public.staff_development_intervention_reviews (
  id uuid primary key default gen_random_uuid(),
  intervention_id uuid not null references public.staff_development_interventions(id) on delete cascade,
  organization_id uuid references public.school_organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  reviewed_on date not null default current_date,
  progress_rating smallint check (progress_rating between 1 and 5),
  effectiveness text not null default 'not_yet' check (effectiveness in ('not_yet','limited','some','strong','sustained')),
  evidence text not null default '',
  barriers text not null default '',
  adaptations text not null default '',
  next_steps text not null default '',
  next_review_date date,
  status_after text not null default 'Active' check (status_after in ('Active','Review','Complete')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists staff_development_intervention_reviews_intervention_idx on public.staff_development_intervention_reviews(intervention_id, reviewed_on desc);
create index if not exists staff_development_intervention_reviews_org_idx on public.staff_development_intervention_reviews(organization_id, reviewed_on desc);

alter table public.staff_development_intervention_reviews enable row level security;
revoke all on public.staff_development_intervention_reviews from anon, authenticated;
grant select, insert, update, delete on public.staff_development_intervention_reviews to authenticated;

drop policy if exists interventions_read_scoped on public.staff_development_interventions;
create policy interventions_read_scoped on public.staff_development_interventions for select to authenticated
using (created_by = (select auth.uid()) or (organization_id is not null and private.staff_development_can_manage_interventions(organization_id)));

drop policy if exists interventions_insert_member on public.staff_development_interventions;
create policy interventions_insert_member on public.staff_development_interventions for insert to authenticated
with check (
  created_by = (select auth.uid()) and (
    organization_id is null
    or exists (select 1 from public.school_organizations o where o.id = organization_id and o.owner_user_id = (select auth.uid()))
    or exists (select 1 from public.school_organization_members m where m.organization_id = organization_id and m.user_id = (select auth.uid()))
    or exists (select 1 from public.staff_profiles p where p.id = (select auth.uid()) and p.organisation_id = organization_id)
    or exists (select 1 from public.staff_development_profiles p where p.user_id = (select auth.uid()) and p.preferred_organization_id = organization_id)
  )
);

drop policy if exists interventions_update_scoped on public.staff_development_interventions;
create policy interventions_update_scoped on public.staff_development_interventions for update to authenticated
using (created_by = (select auth.uid()) or (organization_id is not null and private.staff_development_can_manage_interventions(organization_id)))
with check (created_by = (select auth.uid()) or (organization_id is not null and private.staff_development_can_manage_interventions(organization_id)));

drop policy if exists interventions_delete_scoped on public.staff_development_interventions;
create policy interventions_delete_scoped on public.staff_development_interventions for delete to authenticated
using (created_by = (select auth.uid()) or (organization_id is not null and private.staff_development_can_manage_interventions(organization_id)));

drop policy if exists intervention_reviews_read_scoped on public.staff_development_intervention_reviews;
create policy intervention_reviews_read_scoped on public.staff_development_intervention_reviews for select to authenticated
using (
  created_by = (select auth.uid())
  or (organization_id is not null and private.staff_development_can_manage_interventions(organization_id))
  or exists (select 1 from public.staff_development_interventions i where i.id = intervention_id and i.created_by = (select auth.uid()))
);

drop policy if exists intervention_reviews_insert_scoped on public.staff_development_intervention_reviews;
create policy intervention_reviews_insert_scoped on public.staff_development_intervention_reviews for insert to authenticated
with check (
  created_by = (select auth.uid()) and exists (
    select 1 from public.staff_development_interventions i
    where i.id = intervention_id and organization_id is not distinct from i.organization_id
      and (i.created_by = (select auth.uid()) or (i.organization_id is not null and private.staff_development_can_manage_interventions(i.organization_id)))
  )
);

drop policy if exists intervention_reviews_update_scoped on public.staff_development_intervention_reviews;
create policy intervention_reviews_update_scoped on public.staff_development_intervention_reviews for update to authenticated
using (created_by = (select auth.uid()) or (organization_id is not null and private.staff_development_can_manage_interventions(organization_id)))
with check (created_by = (select auth.uid()) or (organization_id is not null and private.staff_development_can_manage_interventions(organization_id)));

drop policy if exists intervention_reviews_delete_scoped on public.staff_development_intervention_reviews;
create policy intervention_reviews_delete_scoped on public.staff_development_intervention_reviews for delete to authenticated
using (created_by = (select auth.uid()) or (organization_id is not null and private.staff_development_can_manage_interventions(organization_id)));
