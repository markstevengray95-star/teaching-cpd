-- Reviewed onboarding rollout. Apply once through the migration API; no school is auto-enabled.
begin;
alter table private.sen_workspace_schools add column approved_staff uuid[];
alter table private.sen_workspace_schools add column approved_by uuid references auth.users(id) on delete restrict;
create index sen_workspace_approver_idx on private.sen_workspace_schools(approved_by);
create table private.sen_activation_audit (
 id bigint generated always as identity primary key,
 organization_id uuid not null references public.school_organizations(id) on delete restrict,
 actor_id uuid not null references auth.users(id) on delete restrict,
 enabled boolean not null, approved_staff uuid[] not null,
 privacy_version text not null, occurred_at timestamptz not null default now()
);
create index sen_activation_org_idx on private.sen_activation_audit(organization_id,occurred_at desc);
create index sen_activation_actor_idx on private.sen_activation_audit(actor_id);
alter table private.sen_activation_audit enable row level security;
revoke all on private.sen_activation_audit from public,anon,authenticated;
create function private.sen_school_admin(org_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select (select auth.uid()) is not null and
 (exists(select 1 from public.school_organizations o where o.id=org_id and o.owner_user_id=(select auth.uid()))
 or exists(select 1 from public.school_organization_members m where m.organization_id=org_id and m.user_id=(select auth.uid()) and m.role in ('owner','admin')));
$$;
revoke all on function private.sen_school_admin(uuid) from public,anon,authenticated;
create function private.sen_onboarding_status_impl() returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object(
 'id',o.id,'name',o.name,'enabled',coalesce(s.enabled,false),'approved_at',s.approved_at,
 'approved_staff',coalesce(s.approved_staff,'{}'::uuid[]),
 'staff',coalesce((select jsonb_agg(jsonb_build_object('id',r.user_id,'name',coalesce(nullif(p.display_name,''),'Unnamed staff account'),'role',r.role) order by p.display_name,r.user_id)
 from public.staff_development_role_assignments r left join public.staff_development_profiles p on p.user_id=r.user_id
 where r.organization_id=o.id and r.role in ('send-eal','slt')
 and (r.user_id=o.owner_user_id or exists(select 1 from public.school_organization_members m where m.organization_id=o.id and m.user_id=r.user_id))), '[]'::jsonb)) order by o.name),'[]'::jsonb)
 from public.school_organizations o left join private.sen_workspace_schools s on s.organization_id=o.id
 where private.sen_school_admin(o.id);
$$;
revoke all on function private.sen_onboarding_status_impl() from public,anon;
grant execute on function private.sen_onboarding_status_impl() to authenticated;
create function public.sen_onboarding_status() returns jsonb
language sql stable security invoker set search_path='' as $$ select private.sen_onboarding_status_impl(); $$;
revoke all on function public.sen_onboarding_status() from public,anon;
grant execute on function public.sen_onboarding_status() to authenticated;
create function private.sen_onboarding_save_impl(org_id uuid,enable_storage boolean,staff_ids uuid[],privacy_approved boolean,privacy_version text) returns void
language plpgsql security definer set search_path='' as $$
begin
 -- Lock the school to serialise simultaneous setup changes.
 perform 1 from public.school_organizations where id=org_id for update;
 if not private.sen_school_admin(org_id) then raise exception 'School owner or administrator access required' using errcode='42501'; end if;
 if enable_storage is null or privacy_version is distinct from 'sen-privacy-v1' then raise exception 'Invalid approval version'; end if;
 if enable_storage then
  if privacy_approved is distinct from true or coalesce(cardinality(staff_ids),0) not between 1 and 100
   or array_position(staff_ids,null) is not null
   or cardinality(staff_ids)<>(select count(distinct v) from unnest(staff_ids) v)
  then raise exception 'Privacy approval and named authorised staff are required'; end if;
  if exists(select 1 from unnest(staff_ids) u where
   not exists(select 1 from public.staff_development_role_assignments r where r.organization_id=org_id and r.user_id=u and r.role in ('send-eal','slt'))
   or not (exists(select 1 from public.school_organization_members m where m.organization_id=org_id and m.user_id=u)
     or exists(select 1 from public.school_organizations o where o.id=org_id and o.owner_user_id=u)))
  then raise exception 'Every selected staff account must belong to this school and hold a SEN/SLT role'; end if;
 end if;
 insert into private.sen_workspace_schools(organization_id,enabled,approved_at,approved_staff,approved_by)
 values(org_id,enable_storage,case when enable_storage then now() end,case when enable_storage then staff_ids else '{}'::uuid[] end,auth.uid())
 on conflict(organization_id) do update set enabled=excluded.enabled,approved_at=excluded.approved_at,approved_staff=excluded.approved_staff,approved_by=excluded.approved_by;
 insert into private.sen_activation_audit(organization_id,actor_id,enabled,approved_staff,privacy_version)
 values(org_id,auth.uid(),enable_storage,case when enable_storage then staff_ids else '{}'::uuid[] end,privacy_version);
end; $$;
revoke all on function private.sen_onboarding_save_impl(uuid,boolean,uuid[],boolean,text) from public,anon;
grant execute on function private.sen_onboarding_save_impl(uuid,boolean,uuid[],boolean,text) to authenticated;
create function public.sen_onboarding_save(org_id uuid,enable_storage boolean,staff_ids uuid[],privacy_approved boolean,privacy_version text) returns void
language sql security invoker set search_path='' as $$ select private.sen_onboarding_save_impl(org_id,enable_storage,staff_ids,privacy_approved,privacy_version); $$;
revoke all on function public.sen_onboarding_save(uuid,boolean,uuid[],boolean,text) from public,anon;
grant execute on function public.sen_onboarding_save(uuid,boolean,uuid[],boolean,text) to authenticated;
create or replace function private.sen_can_access(org_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select (select auth.uid()) is not null
 and exists(select 1 from private.sen_workspace_schools s where s.organization_id=org_id and s.enabled
   and (select auth.uid())=any(s.approved_staff))
 and exists(select 1 from public.staff_development_role_assignments r where r.organization_id=org_id and r.user_id=(select auth.uid()) and r.role in ('send-eal','slt'))
 and (exists(select 1 from public.school_organization_members m where m.organization_id=org_id and m.user_id=(select auth.uid()))
   or exists(select 1 from public.school_organizations o where o.id=org_id and o.owner_user_id=(select auth.uid())));
$$;
revoke all on function private.sen_can_access(uuid) from public,anon;
grant execute on function private.sen_can_access(uuid) to authenticated;
commit;
