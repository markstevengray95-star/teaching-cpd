create or replace function private.current_org_id()
returns uuid language sql stable security definer set search_path=''
as $$
  select sp.organisation_id
  from public.staff_profiles sp
  where sp.id=(select auth.uid())
    and (coalesce(sp.legacy_standalone_access,false) or exists(
      select 1 from public.organisation_memberships om
      where om.organisation_id=sp.organisation_id and om.user_id=sp.id and om.active
    ));
$$;

create or replace function private.is_org_admin(p_org uuid default null)
returns boolean language sql stable security definer set search_path=''
as $$
  select exists(
    select 1 from public.staff_profiles sp
    join public.organisation_memberships om on om.organisation_id=sp.organisation_id and om.user_id=sp.id and om.active
    where sp.id=(select auth.uid()) and sp.role in ('CPD Lead','Admin') and sp.organisation_id is not null
      and (p_org is null or sp.organisation_id=p_org)
  );
$$;

create or replace function private.is_school_admin(p_org uuid default null)
returns boolean language sql stable security definer set search_path=''
as $$
  select exists(
    select 1 from public.staff_profiles sp
    join public.organisation_memberships om on om.organisation_id=sp.organisation_id and om.user_id=sp.id and om.active
    where sp.id=(select auth.uid()) and sp.role='Admin' and sp.organisation_id is not null
      and (p_org is null or sp.organisation_id=p_org)
  );
$$;
revoke all on function private.is_school_admin(uuid) from public, anon;
grant execute on function private.is_school_admin(uuid) to authenticated;

create or replace function private.claim_school_access_impl()
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  v_uid uuid:=auth.uid(); v_email text; v_email_confirmed_at timestamptz; v_domain text; v_org uuid; v_site uuid; v_current_org uuid;
  v_legacy_standalone boolean:=false; v_initial_admin boolean:=false; v_membership_active boolean:=false;
  v_sub public.school_subscriptions%rowtype; v_members integer;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  select lower(u.email),u.email_confirmed_at,sp.organisation_id,coalesce(sp.legacy_standalone_access,false)
    into v_email,v_email_confirmed_at,v_current_org,v_legacy_standalone
  from auth.users u left join public.staff_profiles sp on sp.id=u.id where u.id=v_uid;
  if v_email is null or position('@' in v_email)=0 then return jsonb_build_object('allowed',false,'reason','missing_email'); end if;
  if v_email_confirmed_at is null and not v_legacy_standalone then return jsonb_build_object('allowed',false,'reason','email_not_verified'); end if;

  if v_current_org is not null then
    select coalesce((select om.active from public.organisation_memberships om where om.organisation_id=v_current_org and om.user_id=v_uid limit 1),false) into v_membership_active;
    if not v_membership_active then return jsonb_build_object('allowed',false,'reason','access_disabled','organisation_id',v_current_org); end if;
    select exists(select 1 from public.organisation_initial_admins a where a.organisation_id=v_current_org and a.email=v_email and (a.claimed_by is null or a.claimed_by=v_uid)) into v_initial_admin;
    if v_initial_admin then
      update public.staff_profiles set role='Admin',updated_at=now() where id=v_uid;
      update public.organisation_memberships set member_role='org_admin',active=true where organisation_id=v_current_org and user_id=v_uid;
      update public.organisation_initial_admins set claimed_by=v_uid,claimed_at=coalesce(claimed_at,now()) where organisation_id=v_current_org and email=v_email;
    else
      perform private.apply_staff_directory_profile(v_uid,v_current_org,v_email);
    end if;
    return jsonb_build_object('allowed',private.subscription_allows_access(v_current_org),'organisation_id',v_current_org,
      'reason',case when private.subscription_allows_access(v_current_org) then 'existing_membership' else 'subscription_inactive' end,'initial_admin',v_initial_admin);
  end if;

  if v_legacy_standalone then return jsonb_build_object('allowed',true,'reason','legacy_standalone'); end if;
  v_domain:=lower(split_part(v_email,'@',2));
  select d.organisation_id into v_org from public.organisation_domains d join public.organisations o on o.id=d.organisation_id
  where d.domain=v_domain and d.status='verified' and o.access_mode='domain_subscription' and private.subscription_allows_access(d.organisation_id) limit 1;
  if v_org is null then return jsonb_build_object('allowed',false,'reason','school_not_licensed','domain',v_domain); end if;
  select * into v_sub from public.school_subscriptions where organisation_id=v_org for update;
  if v_sub.organisation_id is null then return jsonb_build_object('allowed',false,'reason','subscription_inactive','organisation_id',v_org); end if;
  if v_sub.seat_limit is not null then
    select count(*) into v_members from public.organisation_memberships where organisation_id=v_org and active;
    if v_members>=v_sub.seat_limit then return jsonb_build_object('allowed',false,'reason','seat_limit_reached','organisation_id',v_org); end if;
  end if;
  select exists(select 1 from public.organisation_initial_admins a where a.organisation_id=v_org and a.email=v_email and a.claimed_by is null) into v_initial_admin;
  select id into v_site from public.school_sites where organisation_id=v_org and active order by created_at limit 1;
  insert into public.staff_profiles(id,full_name,role,department,organisation_id,site_id,legacy_standalone_access)
  select v_uid,coalesce(nullif(u.raw_user_meta_data->>'full_name',''),nullif(u.raw_user_meta_data->>'name',''),''),case when v_initial_admin then 'Admin' else 'Staff' end,
    coalesce(u.raw_user_meta_data->>'department',''),v_org,v_site,false from auth.users u where u.id=v_uid
  on conflict(id) do update set organisation_id=coalesce(public.staff_profiles.organisation_id,excluded.organisation_id),site_id=coalesce(public.staff_profiles.site_id,excluded.site_id),
    role=case when v_initial_admin then 'Admin' else public.staff_profiles.role end,legacy_standalone_access=false,updated_at=now();
  insert into public.organisation_memberships(organisation_id,user_id,site_id,member_role,active)
  values(v_org,v_uid,v_site,case when v_initial_admin then 'org_admin' else 'member' end,true)
  on conflict(organisation_id,user_id) do update set active=true,site_id=coalesce(public.organisation_memberships.site_id,excluded.site_id),member_role=case when v_initial_admin then 'org_admin' else public.organisation_memberships.member_role end;
  if v_initial_admin then
    update public.organisation_initial_admins set claimed_by=v_uid,claimed_at=now() where organisation_id=v_org and email=v_email and claimed_by is null;
  else
    perform private.apply_staff_directory_profile(v_uid,v_org,v_email);
  end if;
  return jsonb_build_object('allowed',true,'reason','domain_matched','organisation_id',v_org,'domain',v_domain,'initial_admin',v_initial_admin);
end;
$$;

update public.staff_profiles sp set role='Admin',updated_at=now()
from public.organisation_initial_admins a
where a.claimed_by=sp.id and a.organisation_id=sp.organisation_id and sp.role='CPD Lead';
update public.organisation_memberships om set member_role='org_admin',active=true
from public.organisation_initial_admins a where a.claimed_by=om.user_id and a.organisation_id=om.organisation_id;

create or replace function private.school_admin_list_staff_impl()
returns table(user_id uuid,email text,full_name text,role text,department text,site_id uuid,site_name text,active boolean,joined_at timestamptz)
language plpgsql security definer set search_path=''
as $$
declare v_org uuid:=private.current_org_id();
begin
  if v_org is null or not private.is_school_admin(v_org) then raise exception 'School Admin access required'; end if;
  return query
  select sp.id,lower(u.email),sp.full_name,sp.role,sp.department,sp.site_id,ss.name,coalesce(om.active,false),sp.created_at
  from public.staff_profiles sp join auth.users u on u.id=sp.id
  left join public.organisation_memberships om on om.organisation_id=sp.organisation_id and om.user_id=sp.id
  left join public.school_sites ss on ss.id=sp.site_id
  where sp.organisation_id=v_org order by coalesce(nullif(sp.full_name,''),u.email),u.email;
end;
$$;
create or replace function public.school_admin_list_staff()
returns table(user_id uuid,email text,full_name text,role text,department text,site_id uuid,site_name text,active boolean,joined_at timestamptz)
language sql set search_path='' as $$ select * from private.school_admin_list_staff_impl(); $$;
revoke all on function private.school_admin_list_staff_impl() from public,anon;
grant execute on function private.school_admin_list_staff_impl() to authenticated;
revoke all on function public.school_admin_list_staff() from public,anon;
grant execute on function public.school_admin_list_staff() to authenticated;

create or replace function private.school_admin_update_staff_access_impl(p_user_id uuid,p_role text,p_department text,p_site_id uuid,p_active boolean)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  v_actor uuid:=auth.uid(); v_org uuid:=private.current_org_id(); v_target public.staff_profiles%rowtype; v_email text; v_other_admins integer;
begin
  if v_actor is null or v_org is null or not private.is_school_admin(v_org) then raise exception 'School Admin access required'; end if;
  if p_role not in ('Staff','Department Lead','CPD Lead','Admin') then raise exception 'Invalid staff access level'; end if;
  select * into v_target from public.staff_profiles where id=p_user_id and organisation_id=v_org for update;
  if v_target.id is null then raise exception 'Staff member is not part of this school'; end if;
  if p_site_id is not null and not exists(select 1 from public.school_sites s where s.id=p_site_id and s.organisation_id=v_org and s.active) then raise exception 'Site does not belong to this school'; end if;
  if p_user_id=v_actor and (not p_active or p_role<>'Admin') then raise exception 'You cannot remove your own School Admin access'; end if;
  if v_target.role='Admin' and (not p_active or p_role<>'Admin') then
    select count(*) into v_other_admins from public.staff_profiles sp
    join public.organisation_memberships om on om.organisation_id=sp.organisation_id and om.user_id=sp.id and om.active
    where sp.organisation_id=v_org and sp.role='Admin' and sp.id<>p_user_id;
    if v_other_admins=0 then raise exception 'At least one active School Admin must remain'; end if;
  end if;
  select lower(email) into v_email from auth.users where id=p_user_id;
  update public.staff_profiles set role=p_role,department=coalesce(p_department,''),site_id=p_site_id,updated_at=now() where id=p_user_id and organisation_id=v_org;
  insert into public.organisation_memberships(organisation_id,user_id,site_id,member_role,active)
  values(v_org,p_user_id,p_site_id,case when p_role in ('CPD Lead','Admin') then 'org_admin' else 'member' end,p_active)
  on conflict(organisation_id,user_id) do update set site_id=excluded.site_id,member_role=excluded.member_role,active=excluded.active;
  if v_email is not null then
    insert into public.organisation_staff_directory(organisation_id,email,full_name,department,role,site_id,active,source,created_by,updated_at)
    values(v_org,v_email,v_target.full_name,coalesce(p_department,''),p_role,p_site_id,p_active,'admin_access',v_actor,now())
    on conflict(organisation_id,email) do update set full_name=case when excluded.full_name<>'' then excluded.full_name else public.organisation_staff_directory.full_name end,
      department=excluded.department,role=excluded.role,site_id=excluded.site_id,active=excluded.active,source='admin_access',updated_at=now();
  end if;
  insert into public.cpd_audit_log(organisation_id,actor_id,entity_type,entity_id,action,summary)
  values(v_org,v_actor,'staff_access',p_user_id::text,'update_access',jsonb_build_object('role',p_role,'department',coalesce(p_department,''),'site_id',p_site_id,'active',p_active));
  return jsonb_build_object('updated',true,'user_id',p_user_id,'role',p_role,'active',p_active);
end;
$$;
create or replace function public.school_admin_update_staff_access(p_user_id uuid,p_role text,p_department text default '',p_site_id uuid default null,p_active boolean default true)
returns jsonb language sql set search_path=''
as $$ select private.school_admin_update_staff_access_impl(p_user_id,p_role,p_department,p_site_id,p_active); $$;
revoke all on function private.school_admin_update_staff_access_impl(uuid,text,text,uuid,boolean) from public,anon;
grant execute on function private.school_admin_update_staff_access_impl(uuid,text,text,uuid,boolean) to authenticated;
revoke all on function public.school_admin_update_staff_access(uuid,text,text,uuid,boolean) from public,anon;
grant execute on function public.school_admin_update_staff_access(uuid,text,text,uuid,boolean) to authenticated;
