create or replace function private.leadership_summary_impl()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  result jsonb;
begin
  if auth.uid() is null or not exists (
    select 1 from public.staff_profiles p
    where p.id = auth.uid()
      and p.role in ('Department Lead','CPD Lead','Admin')
  ) then
    raise exception 'Leadership access required' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'staff_count', (select count(*) from public.staff_profiles),
    'completed_courses', (select count(*) from public.course_progress where completed_at is not null),
    'courses_in_progress', (select count(*) from public.course_progress where completed_at is null and coalesce(array_length(completed_modules, 1), 0) > 0),
    'live_cpd_completions', (select count(*) from public.live_participants where status = 'completed'),
    'active_pathways', (select count(*) from public.pathway_enrolments where status = 'active'),
    'completed_pathways', (select count(*) from public.pathway_enrolments where status = 'completed'),
    'active_action_plans', (select count(*) from public.action_plans where status in ('planned','in_progress','review_due')),
    'impact_reviews', (select count(*) from public.action_followups),
    'average_impact_rating', (select round(avg(impact_rating)::numeric, 2) from public.action_followups where impact_rating is not null),
    'department_activity', coalesce((
      select jsonb_agg(jsonb_build_object(
        'department', d.department,
        'staff', d.staff_count,
        'completed_courses', d.completed_courses,
        'active_course_records', d.active_course_records
      ) order by d.department)
      from (
        select
          coalesce(nullif(p.department,''), 'Unassigned') as department,
          count(distinct p.id) as staff_count,
          count(cp.*) filter (where cp.completed_at is not null) as completed_courses,
          count(cp.*) filter (where cp.completed_at is null and coalesce(array_length(cp.completed_modules,1),0) > 0) as active_course_records
        from public.staff_profiles p
        left join public.course_progress cp on cp.user_id = p.id
        group by coalesce(nullif(p.department,''), 'Unassigned')
      ) d
    ), '[]'::jsonb),
    'course_completion_counts', coalesce((
      select jsonb_agg(jsonb_build_object('course_id', c.course_id, 'completions', c.completions) order by c.completions desc, c.course_id)
      from (
        select course_id, count(*) as completions
        from public.course_progress
        where completed_at is not null
        group by course_id
        order by count(*) desc
        limit 12
      ) c
    ), '[]'::jsonb),
    'monthly_completions', coalesce((
      select jsonb_agg(jsonb_build_object('month', m.month_label, 'completions', m.completions) order by m.month_start)
      from (
        select date_trunc('month', completed_at) as month_start,
               to_char(date_trunc('month', completed_at), 'Mon YYYY') as month_label,
               count(*) as completions
        from public.course_progress
        where completed_at is not null
          and completed_at >= date_trunc('month', now()) - interval '5 months'
        group by date_trunc('month', completed_at)
      ) m
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function private.leadership_summary_impl() from public, anon;
grant execute on function private.leadership_summary_impl() to authenticated;

create or replace function public.leadership_summary()
returns jsonb
language sql
security invoker
set search_path = private, public, pg_temp
as $$
  select private.leadership_summary_impl();
$$;

revoke all on function public.leadership_summary() from public, anon;
grant execute on function public.leadership_summary() to authenticated;
