-- School-improvement extension for the Stage 13/14 organisation model.
-- Individual observation/self-review notes remain private unless the user explicitly shares them.

create table if not exists public.improvement_priorities (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations(id) on delete cascade default private.current_org_id(),
  site_id uuid references public.school_sites(id) on delete set null,
  title text not null,
  description text not null default '',
  academic_year text not null default '',
  scope text not null default 'school' check (scope in ('school','department')),
  department text,
  active boolean not null default true,
  review_date date,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.professional_observation_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organisation_id uuid references public.organisations(id) on delete cascade default private.current_org_id(),
  site_id uuid references public.school_sites(id) on delete set null,
  observed_on date not null default current_date,
  source_type text not null default 'self_review' check (source_type in ('self_review','learning_walk','formal_observation','coaching','other')),
  focus text not null,
  strength text not null default '',
  development_area text not null default '',
  notes text not null default '',
  priority_id uuid references public.improvement_priorities(id) on delete set null,
  linked_course_id text,
  linked_pathway_id text,
  shared_with_leadership boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.development_targets add column if not exists priority_id uuid references public.improvement_priorities(id) on delete set null;

create index if not exists improvement_priorities_org_active_idx on public.improvement_priorities(organisation_id, active, scope, department);
create index if not exists professional_observation_links_user_date_idx on public.professional_observation_links(user_id, observed_on desc);
create index if not exists professional_observation_links_priority_idx on public.professional_observation_links(priority_id);
create index if not exists development_targets_priority_idx on public.development_targets(priority_id);

alter table public.improvement_priorities enable row level security;
alter table public.professional_observation_links enable row level security;
revoke all on public.improvement_priorities, public.professional_observation_links from anon;
grant select, insert, update, delete on public.improvement_priorities, public.professional_observation_links to authenticated;

drop policy if exists "members view org improvement priorities" on public.improvement_priorities;
drop policy if exists "org admins insert improvement priorities" on public.improvement_priorities;
drop policy if exists "org admins update improvement priorities" on public.improvement_priorities;
drop policy if exists "org admins delete improvement priorities" on public.improvement_priorities;
create policy "members view org improvement priorities" on public.improvement_priorities for select to authenticated
using (organisation_id = private.current_org_id() and (active or private.is_org_admin(organisation_id)));
create policy "org admins insert improvement priorities" on public.improvement_priorities for insert to authenticated
with check (private.is_org_admin(organisation_id) and created_by = (select auth.uid()));
create policy "org admins update improvement priorities" on public.improvement_priorities for update to authenticated
using (private.is_org_admin(organisation_id)) with check (private.is_org_admin(organisation_id));
create policy "org admins delete improvement priorities" on public.improvement_priorities for delete to authenticated
using (private.is_org_admin(organisation_id));

drop policy if exists "staff view own or explicitly shared org observation links" on public.professional_observation_links;
drop policy if exists "staff insert own observation links" on public.professional_observation_links;
drop policy if exists "staff update own observation links" on public.professional_observation_links;
drop policy if exists "staff delete own observation links" on public.professional_observation_links;
create policy "staff view own or explicitly shared org observation links" on public.professional_observation_links for select to authenticated
using (user_id = (select auth.uid()) or (shared_with_leadership and organisation_id = private.current_org_id() and private.is_org_admin(organisation_id)));
create policy "staff insert own observation links" on public.professional_observation_links for insert to authenticated
with check (user_id = (select auth.uid()) and organisation_id = private.current_org_id());
create policy "staff update own observation links" on public.professional_observation_links for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and organisation_id = private.current_org_id());
create policy "staff delete own observation links" on public.professional_observation_links for delete to authenticated
using (user_id = (select auth.uid()));

create or replace function private.priority_engagement_summary_impl()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare result jsonb; caller_role text; caller_org uuid; caller_department text;
begin
  select role, organisation_id, department into caller_role, caller_org, caller_department
  from public.staff_profiles where id=auth.uid();
  if caller_role not in ('Department Lead','CPD Lead','Admin') or caller_org is null then
    raise exception 'Leadership access required' using errcode='42501';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',p.id,'title',p.title,'scope',p.scope,'department',p.department,'active',p.active,
    'linked_targets',(select count(*) from public.development_targets d join public.staff_profiles sp on sp.id=d.user_id where d.priority_id=p.id and sp.organisation_id=caller_org and (caller_role in ('CPD Lead','Admin') or sp.department=caller_department)),
    'shared_observations',(select count(*) from public.professional_observation_links o join public.staff_profiles sp on sp.id=o.user_id where o.priority_id=p.id and o.shared_with_leadership and sp.organisation_id=caller_org and (caller_role in ('CPD Lead','Admin') or sp.department=caller_department))
  ) order by p.active desc,p.title),'[]'::jsonb)
  into result
  from public.improvement_priorities p
  where p.organisation_id=caller_org;
  return result;
end;
$$;
revoke all on function private.priority_engagement_summary_impl() from public, anon;
grant execute on function private.priority_engagement_summary_impl() to authenticated;

create or replace function public.priority_engagement_summary()
returns jsonb
language sql
security invoker
set search_path = private, public, pg_temp
as $$ select private.priority_engagement_summary_impl(); $$;
revoke all on function public.priority_engagement_summary() from public, anon;
grant execute on function public.priority_engagement_summary() to authenticated;

drop trigger if exists improvement_priorities_updated_at on public.improvement_priorities;
create trigger improvement_priorities_updated_at before update on public.improvement_priorities
for each row execute function private.set_updated_at();
drop trigger if exists professional_observation_links_updated_at on public.professional_observation_links;
create trigger professional_observation_links_updated_at before update on public.professional_observation_links
for each row execute function private.set_updated_at();
