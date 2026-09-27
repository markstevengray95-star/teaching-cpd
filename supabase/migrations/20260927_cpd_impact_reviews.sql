create table if not exists public.cpd_impact_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organisation_id uuid references public.organisations(id) on delete set null default private.current_org_id(),
  source_type text not null check (source_type in ('course','micro_cpd','external_cpd','action_plan')),
  source_id text not null,
  source_title text not null,
  review_stage text not null check (review_stage in ('4_week','8_week','12_week','custom')),
  due_on date not null,
  reviewed_at timestamptz,
  implementation_status text check (implementation_status in ('not_started','trying','embedded','adapted','stopped')),
  confidence smallint check (confidence between 1 and 5),
  evidence_type text not null default 'none' check (evidence_type in ('none','pupil_work','assessment','observation','feedback','self_reflection','other')),
  impact_note text not null default '',
  next_step text not null default '',
  shared_with_leadership boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, source_type, source_id, review_stage)
);

create index if not exists cpd_impact_reviews_user_due_idx on public.cpd_impact_reviews(user_id,due_on);
create index if not exists cpd_impact_reviews_org_stage_idx on public.cpd_impact_reviews(organisation_id,review_stage,due_on);
create index if not exists cpd_impact_reviews_org_status_idx on public.cpd_impact_reviews(organisation_id,implementation_status) where reviewed_at is not null;

alter table public.cpd_impact_reviews enable row level security;
revoke all on table public.cpd_impact_reviews from anon;
grant select,insert,update,delete on table public.cpd_impact_reviews to authenticated;

create policy "staff read own impact reviews" on public.cpd_impact_reviews for select to authenticated using (user_id=(select auth.uid()));
create policy "staff insert own impact reviews" on public.cpd_impact_reviews for insert to authenticated with check (user_id=(select auth.uid()) and (organisation_id is null or organisation_id=private.current_org_id()));
create policy "staff update own impact reviews" on public.cpd_impact_reviews for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()) and (organisation_id is null or organisation_id=private.current_org_id()));
create policy "staff delete own impact reviews" on public.cpd_impact_reviews for delete to authenticated using (user_id=(select auth.uid()));

create or replace function private.impact_leadership_scope()
returns table(org_id uuid, department text, whole_org boolean)
language sql
stable
security definer
set search_path=''
as $$
  select sp.organisation_id,
         sp.department,
         (sp.role in ('CPD Lead','Admin')) as whole_org
  from public.staff_profiles sp
  where sp.id=auth.uid()
    and sp.role in ('Department Lead','CPD Lead','Admin')
    and sp.organisation_id is not null;
$$;
revoke all on function private.impact_leadership_scope() from public,anon,authenticated;

create or replace function public.cpd_impact_aggregate()
returns table(
  eligible boolean,
  distinct_staff bigint,
  total_reviews bigint,
  reviewed bigint,
  due_or_overdue bigint,
  not_started bigint,
  trying bigint,
  embedded bigint,
  adapted bigint,
  stopped bigint,
  average_confidence numeric
)
language sql
stable
security invoker
set search_path=''
as $$
  with scope as (
    select * from private.impact_leadership_scope()
  ), cohort as (
    select r.*
    from public.cpd_impact_reviews r
    join public.staff_profiles sp on sp.id=r.user_id
    join scope s on s.org_id=r.organisation_id
    where s.whole_org or sp.department=s.department
  ), stats as (
    select count(distinct user_id)::bigint as staff_count,
           count(*)::bigint as review_count,
           count(*) filter(where reviewed_at is not null)::bigint as reviewed_count,
           count(*) filter(where reviewed_at is null and due_on<=current_date)::bigint as due_count,
           count(*) filter(where implementation_status='not_started')::bigint as not_started_count,
           count(*) filter(where implementation_status='trying')::bigint as trying_count,
           count(*) filter(where implementation_status='embedded')::bigint as embedded_count,
           count(*) filter(where implementation_status='adapted')::bigint as adapted_count,
           count(*) filter(where implementation_status='stopped')::bigint as stopped_count,
           round(avg(confidence)::numeric,2) as avg_confidence
    from cohort
  )
  select (staff_count>=3), staff_count,
         case when staff_count>=3 then review_count else 0 end,
         case when staff_count>=3 then reviewed_count else 0 end,
         case when staff_count>=3 then due_count else 0 end,
         case when staff_count>=3 then not_started_count else 0 end,
         case when staff_count>=3 then trying_count else 0 end,
         case when staff_count>=3 then embedded_count else 0 end,
         case when staff_count>=3 then adapted_count else 0 end,
         case when staff_count>=3 then stopped_count else 0 end,
         case when staff_count>=3 then avg_confidence else null end
  from stats;
$$;
revoke all on function public.cpd_impact_aggregate() from public,anon;
grant execute on function public.cpd_impact_aggregate() to authenticated;
