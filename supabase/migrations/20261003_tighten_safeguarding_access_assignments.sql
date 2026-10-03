create or replace function private.safeguarding_can_access(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and (
    private.is_school_admin(target_org)
    or exists (
      select 1 from public.safeguarding_role_assignments r
      where r.organisation_id = target_org
        and r.user_id = (select auth.uid())
        and r.active
    )
  );
$$;

revoke all on function private.safeguarding_can_access(uuid) from public, anon;
grant execute on function private.safeguarding_can_access(uuid) to authenticated;

drop policy if exists "read safeguarding evidence" on public.safeguarding_evidence;
create policy "read safeguarding evidence"
on public.safeguarding_evidence for select to authenticated
using (
  user_id = (select auth.uid())
  or private.safeguarding_can_access(organisation_id)
);

drop policy if exists "insert safeguarding evidence" on public.safeguarding_evidence;
create policy "insert safeguarding evidence"
on public.safeguarding_evidence for insert to authenticated
with check (
  (
    user_id = (select auth.uid())
    and organisation_id = private.current_org_id()
    and verified_by is null
    and verified_at is null
  )
  or private.safeguarding_can_access(organisation_id)
);

drop policy if exists "update safeguarding evidence" on public.safeguarding_evidence;
create policy "update safeguarding evidence"
on public.safeguarding_evidence for update to authenticated
using (
  (user_id = (select auth.uid()) and verified_at is null)
  or private.safeguarding_can_access(organisation_id)
)
with check (
  (user_id = (select auth.uid()) and organisation_id = private.current_org_id())
  or private.safeguarding_can_access(organisation_id)
);

drop policy if exists "delete safeguarding evidence" on public.safeguarding_evidence;
create policy "delete safeguarding evidence"
on public.safeguarding_evidence for delete to authenticated
using (private.safeguarding_can_access(organisation_id));

drop policy if exists "read safeguarding role assignments" on public.safeguarding_role_assignments;
create policy "read safeguarding role assignments"
on public.safeguarding_role_assignments for select to authenticated
using (
  user_id = (select auth.uid())
  or private.is_school_admin(organisation_id)
);

create or replace function private.safeguarding_school_summary_impl()
returns table(requirement_code text, title text, required_count bigint, current_count bigint, overdue_count bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare v_org uuid:=private.current_org_id();
begin
  if v_org is null or not private.safeguarding_can_access(v_org) then raise exception 'Safeguarding access required'; end if;
  return query
  with members as (
    select sp.id from public.staff_profiles sp
    join public.organisation_memberships om on om.organisation_id=sp.organisation_id and om.user_id=sp.id and om.active
    where sp.organisation_id=v_org
  ), req as (
    select r.* from public.safeguarding_requirements r where r.active and r.audience='all_staff'
  ), latest as (
    select distinct on (e.user_id,e.requirement_code) e.user_id,e.requirement_code,e.completed_at,e.valid_until
    from public.safeguarding_evidence e where e.organisation_id=v_org order by e.user_id,e.requirement_code,e.completed_at desc
  )
  select req.code,req.title,(select count(*) from members),
    count(*) filter(where latest.user_id is not null and (latest.valid_until is null or latest.valid_until>=now())),
    count(*) filter(where latest.user_id is null or (latest.valid_until is not null and latest.valid_until<now()))
  from req cross join members m left join latest on latest.user_id=m.id and latest.requirement_code=req.code
  group by req.code,req.title order by req.title;
end;
$$;
