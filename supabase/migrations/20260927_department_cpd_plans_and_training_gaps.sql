create table if not exists public.department_cpd_plans (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade default private.current_org_id(),
  department text not null,
  academic_year text not null,
  title text not null,
  priorities text[] not null default '{}',
  target_hours numeric not null default 10 check (target_hours>=0),
  status text not null default 'draft' check (status in ('draft','active','complete','archived')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organisation_id,department,academic_year,title)
);

create table if not exists public.department_cpd_actions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.department_cpd_plans(id) on delete cascade,
  title text not null,
  owner_label text not null default '',
  due_date date,
  linked_course_id text,
  evidence_expected text not null default '',
  status text not null default 'planned' check (status in ('planned','in_progress','complete','cancelled')),
  notes text not null default '',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists department_cpd_plans_org_dept_idx on public.department_cpd_plans(organisation_id,department,academic_year);
create index if not exists department_cpd_plans_created_by_idx on public.department_cpd_plans(created_by);
create index if not exists department_cpd_actions_plan_idx on public.department_cpd_actions(plan_id,status);
create index if not exists department_cpd_actions_created_by_idx on public.department_cpd_actions(created_by);

alter table public.department_cpd_plans enable row level security;
alter table public.department_cpd_actions enable row level security;
revoke all on table public.department_cpd_plans, public.department_cpd_actions from anon;
grant select,insert,update,delete on table public.department_cpd_plans, public.department_cpd_actions to authenticated;

create or replace function private.can_read_department_cpd(p_org uuid,p_department text)
returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.staff_profiles sp where sp.id=auth.uid() and sp.organisation_id=p_org and (sp.role in ('CPD Lead','Admin') or sp.department=p_department)); $$;
create or replace function private.can_manage_department_cpd(p_org uuid,p_department text)
returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.staff_profiles sp where sp.id=auth.uid() and sp.organisation_id=p_org and (sp.role in ('CPD Lead','Admin') or (sp.role='Department Lead' and sp.department=p_department))); $$;
revoke all on function private.can_read_department_cpd(uuid,text), private.can_manage_department_cpd(uuid,text) from public,anon,authenticated;

create policy "department staff read department cpd plans" on public.department_cpd_plans for select to authenticated using (private.can_read_department_cpd(organisation_id,department));
create policy "department leaders insert department cpd plans" on public.department_cpd_plans for insert to authenticated with check (private.can_manage_department_cpd(organisation_id,department) and created_by=(select auth.uid()));
create policy "department leaders update department cpd plans" on public.department_cpd_plans for update to authenticated using (private.can_manage_department_cpd(organisation_id,department)) with check (private.can_manage_department_cpd(organisation_id,department));
create policy "department leaders delete department cpd plans" on public.department_cpd_plans for delete to authenticated using (private.can_manage_department_cpd(organisation_id,department));

create policy "department staff read department cpd actions" on public.department_cpd_actions for select to authenticated using (exists(select 1 from public.department_cpd_plans p where p.id=department_cpd_actions.plan_id and private.can_read_department_cpd(p.organisation_id,p.department)));
create policy "department leaders insert department cpd actions" on public.department_cpd_actions for insert to authenticated with check (created_by=(select auth.uid()) and exists(select 1 from public.department_cpd_plans p where p.id=department_cpd_actions.plan_id and private.can_manage_department_cpd(p.organisation_id,p.department)));
create policy "department leaders update department cpd actions" on public.department_cpd_actions for update to authenticated using (exists(select 1 from public.department_cpd_plans p where p.id=department_cpd_actions.plan_id and private.can_manage_department_cpd(p.organisation_id,p.department))) with check (exists(select 1 from public.department_cpd_plans p where p.id=department_cpd_actions.plan_id and private.can_manage_department_cpd(p.organisation_id,p.department)));
create policy "department leaders delete department cpd actions" on public.department_cpd_actions for delete to authenticated using (exists(select 1 from public.department_cpd_plans p where p.id=department_cpd_actions.plan_id and private.can_manage_department_cpd(p.organisation_id,p.department)));

create or replace function private.department_training_gap_impl()
returns table(department text, requirement_id uuid, requirement_title text, required_staff bigint, current_staff bigint, due_soon bigint, expired bigint, missing bigint)
language sql stable security definer set search_path=''
as $$
with me as (
  select sp.organisation_id org_id,sp.department my_department,sp.role
  from public.staff_profiles sp where sp.id=auth.uid() and sp.role in ('Department Lead','CPD Lead','Admin') and sp.organisation_id is not null
), org_staff as (
  select sp.id,coalesce(nullif(sp.department,''),'No department') department,sp.role
  from public.staff_profiles sp join me on me.org_id=sp.organisation_id
  where me.role in ('CPD Lead','Admin') or coalesce(nullif(sp.department,''),'No department')=coalesce(nullif(me.my_department,''),'No department')
), req as (
  select r.*
  from public.training_requirements r
  left join public.staff_profiles creator on creator.id=r.created_by
  join me on (r.organisation_id=me.org_id or (r.organisation_id is null and creator.organisation_id=me.org_id))
  where r.active and r.mandatory
), applicable as (
  select s.department,s.id user_id,r.id requirement_id,r.title requirement_title
  from org_staff s cross join req r
  where r.audience_type='all'
     or (r.audience_type='role' and r.audience_value=s.role)
     or (r.audience_type='department' and coalesce(nullif(r.audience_value,''),'No department')=s.department)
), joined as (
  select a.*,tr.completed_at,tr.expires_at
  from applicable a left join public.training_records tr on tr.user_id=a.user_id and tr.requirement_id=a.requirement_id
)
select department,requirement_id,requirement_title,
       count(*)::bigint required_staff,
       count(*) filter(where completed_at is not null and (expires_at is null or expires_at>=now()))::bigint current_staff,
       count(*) filter(where expires_at is not null and expires_at>=now() and expires_at<=now()+interval '60 days')::bigint due_soon,
       count(*) filter(where expires_at is not null and expires_at<now())::bigint expired,
       count(*) filter(where completed_at is null or (expires_at is not null and expires_at<now()))::bigint missing
from joined
group by department,requirement_id,requirement_title
order by department,requirement_title;
$$;
revoke all on function private.department_training_gap_impl() from public,anon,authenticated;

create or replace function public.department_training_gap()
returns table(department text, requirement_id uuid, requirement_title text, required_staff bigint, current_staff bigint, due_soon bigint, expired bigint, missing bigint)
language sql stable security invoker set search_path=''
as $$ select * from private.department_training_gap_impl(); $$;
revoke all on function public.department_training_gap() from public,anon;
grant execute on function public.department_training_gap() to authenticated;
