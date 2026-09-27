create or replace function private.cpd_impact_aggregate_impl()
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
security definer
set search_path=''
as $$
  with me as (
    select sp.organisation_id as org_id, sp.department, sp.role,
           (sp.role in ('CPD Lead','Admin')) as whole_org
    from public.staff_profiles sp
    where sp.id=auth.uid()
      and sp.role in ('Department Lead','CPD Lead','Admin')
      and sp.organisation_id is not null
  ), cohort as (
    select r.*
    from public.cpd_impact_reviews r
    join public.staff_profiles sp on sp.id=r.user_id
    join me on me.org_id=r.organisation_id
    where me.whole_org or sp.department=me.department
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
revoke all on function private.cpd_impact_aggregate_impl() from public,anon,authenticated;

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
as $$ select * from private.cpd_impact_aggregate_impl(); $$;
revoke all on function public.cpd_impact_aggregate() from public,anon;
grant execute on function public.cpd_impact_aggregate() to authenticated;
