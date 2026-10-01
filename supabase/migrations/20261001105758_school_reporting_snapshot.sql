create or replace function private.school_reporting_snapshot_impl()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_org uuid; result jsonb;
begin
  if (select auth.uid()) is null then raise exception 'School administrator access required' using errcode='42501'; end if;
  v_org := private.current_org_id();
  if v_org is null or not private.is_org_admin(v_org) then raise exception 'School administrator access required' using errcode='42501'; end if;
  with staff as (
    select sp.id, sp.full_name, sp.role, sp.department
    from public.staff_profiles sp
    where sp.organisation_id=v_org and exists (
      select 1 from public.organisation_memberships om
      where om.organisation_id=v_org and om.user_id=sp.id and om.active
    )
  )
  select jsonb_build_object(
    'generated_at', now(),
    'organisation', (select jsonb_build_object('id',o.id,'name',o.name,'academic_year',o.academic_year,'timezone',o.timezone) from public.organisations o where o.id=v_org),
    'staff', coalesce((select jsonb_agg(to_jsonb(s) order by s.full_name,s.id) from staff s),'[]'::jsonb),
    'progress', coalesce((select jsonb_agg(jsonb_build_object('user_id',p.user_id,'course_id',p.course_id,'completed_modules',p.completed_modules,'completed_at',p.completed_at) order by p.user_id,p.course_id) from public.course_progress p join staff s on s.id=p.user_id),'[]'::jsonb),
    'requirements', coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'title',r.title,'target_type',r.target_type,'target_id',r.target_id,'frequency_months',r.frequency_months,'mandatory',r.mandatory,'audience_type',r.audience_type,'audience_value',r.audience_value,'active',r.active) order by r.title,r.id) from public.training_requirements r where r.organisation_id=v_org),'[]'::jsonb),
    'records', coalesce((select jsonb_agg(jsonb_build_object('user_id',r.user_id,'requirement_id',r.requirement_id,'completed_at',r.completed_at,'expires_at',r.expires_at) order by r.user_id,r.requirement_id) from public.training_records r join staff s on s.id=r.user_id join public.training_requirements tr on tr.id=r.requirement_id and tr.organisation_id=v_org),'[]'::jsonb),
    'assignments', coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'assigned_to',a.assigned_to,'target_type',a.target_type,'target_id',a.target_id,'title_snapshot',a.title_snapshot,'due_date',a.due_date,'mandatory',a.mandatory,'status',a.status) order by a.assigned_to,a.id) from public.cpd_assignments a join staff s on s.id=a.assigned_to where a.organisation_id=v_org),'[]'::jsonb)
  ) into result;
  return result;
end;
$$;
revoke all on function private.school_reporting_snapshot_impl() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.school_reporting_snapshot_impl() to authenticated;
create or replace function public.school_reporting_snapshot()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select private.school_reporting_snapshot_impl();
$$;
revoke all on function public.school_reporting_snapshot() from public, anon;
grant execute on function public.school_reporting_snapshot() to authenticated;
comment on function public.school_reporting_snapshot() is 'Active school administrators only. Completion metadata, no private reflections, answers or evidence notes. School scope is derived from the authenticated membership.';
