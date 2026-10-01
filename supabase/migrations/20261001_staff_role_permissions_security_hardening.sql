-- Phase 30 security follow-up.
-- Keep public compatibility helpers available for older RLS policies, but run
-- them as the caller so they are not privileged RPC endpoints. The sensitive
-- role-management decision stays in the private schema.

create or replace function public.staff_development_is_org_member(target_org uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.school_organizations o
    where o.id = target_org
      and o.owner_user_id = (select auth.uid())
  ) or exists (
    select 1
    from public.school_organization_members m
    where m.organization_id = target_org
      and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.staff_development_has_org_role(target_org uuid, allowed_roles text[])
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.school_organizations o
    where o.id = target_org
      and o.owner_user_id = (select auth.uid())
  ) or exists (
    select 1
    from public.school_organization_members m
    where m.organization_id = target_org
      and m.user_id = (select auth.uid())
      and m.role = any (allowed_roles)
  );
$$;

revoke all on function public.staff_development_is_org_member(uuid) from public, anon;
revoke all on function public.staff_development_has_org_role(uuid,text[]) from public, anon;
grant execute on function public.staff_development_is_org_member(uuid) to authenticated;
grant execute on function public.staff_development_has_org_role(uuid,text[]) to authenticated;

create or replace function private.staff_development_can_manage_roles(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.current_user_is_platform_admin()
    or exists (
      select 1
      from public.school_organizations o
      where o.id = target_org
        and o.owner_user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.school_organization_members m
      where m.organization_id = target_org
        and m.user_id = (select auth.uid())
        and m.role in ('owner','admin')
    );
$$;

revoke all on function private.staff_development_can_manage_roles(uuid) from public, anon;
grant execute on function private.staff_development_can_manage_roles(uuid) to authenticated;
