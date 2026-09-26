create table if not exists public.organisation_initial_admins (
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  email text not null,
  claimed_by uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (organisation_id,email),
  constraint organisation_initial_admins_email_lower check (email=lower(email) and email like '%@%')
);
alter table public.organisation_initial_admins enable row level security;
revoke all on public.organisation_initial_admins from anon,authenticated;
create index if not exists organisation_initial_admins_email_idx on public.organisation_initial_admins(email);
create index if not exists organisation_initial_admins_claimed_by_idx on public.organisation_initial_admins(claimed_by);

create or replace function private.claim_school_access_impl()
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid := auth.uid(); v_email text; v_email_confirmed_at timestamptz; v_domain text; v_org uuid; v_site uuid; v_current_org uuid;
  v_legacy_standalone boolean := false; v_initial_admin boolean := false; v_sub public.school_subscriptions%rowtype; v_members integer;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  select lower(u.email),u.email_confirmed_at,sp.organisation_id,coalesce(sp.legacy_standalone_access,false)
    into v_email,v_email_confirmed_at,v_current_org,v_legacy_standalone
  from auth.users u left join public.staff_profiles sp on sp.id=u.id where u.id=v_uid;
  if v_email is null or position('@' in v_email)=0 then return jsonb_build_object('allowed',false,'reason','missing_email'); end if;
  if v_email_confirmed_at is null and not v_legacy_standalone then return jsonb_build_object('allowed',false,'reason','email_not_verified'); end if;
  if v_current_org is not null then
    select exists(select 1 from public.organisation_initial_admins a where a.organisation_id=v_current_org and a.email=v_email and (a.claimed_by is null or a.claimed_by=v_uid)) into v_initial_admin;
    if v_initial_admin then
      update public.staff_profiles set role='CPD Lead',updated_at=now() where id=v_uid;
      update public.organisation_memberships set member_role='org_admin',active=true where organisation_id=v_current_org and user_id=v_uid;
      update public.organisation_initial_admins set claimed_by=v_uid,claimed_at=coalesce(claimed_at,now()) where organisation_id=v_current_org and email=v_email;
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
  select v_uid,coalesce(nullif(u.raw_user_meta_data->>'full_name',''),nullif(u.raw_user_meta_data->>'name',''),''),case when v_initial_admin then 'CPD Lead' else 'Staff' end,
    coalesce(u.raw_user_meta_data->>'department',''),v_org,v_site,false from auth.users u where u.id=v_uid
  on conflict(id) do update set organisation_id=coalesce(public.staff_profiles.organisation_id,excluded.organisation_id),site_id=coalesce(public.staff_profiles.site_id,excluded.site_id),
    role=case when v_initial_admin then 'CPD Lead' else public.staff_profiles.role end,legacy_standalone_access=false,updated_at=now();
  insert into public.organisation_memberships(organisation_id,user_id,site_id,member_role,active)
  values(v_org,v_uid,v_site,case when v_initial_admin then 'org_admin' else 'member' end,true)
  on conflict(organisation_id,user_id) do update set active=true,site_id=coalesce(public.organisation_memberships.site_id,excluded.site_id),member_role=case when v_initial_admin then 'org_admin' else public.organisation_memberships.member_role end;
  if v_initial_admin then update public.organisation_initial_admins set claimed_by=v_uid,claimed_at=now() where organisation_id=v_org and email=v_email and claimed_by is null; end if;
  return jsonb_build_object('allowed',true,'reason','domain_matched','organisation_id',v_org,'domain',v_domain,'initial_admin',v_initial_admin);
end;
$$;

create or replace function private.platform_create_school_impl(p_name text,p_academic_year text,p_domain text,p_admin_email text,p_plan text,p_seat_limit integer)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare v_uid uuid:=auth.uid(); v_org uuid; v_slug text; v_domain text:=lower(trim(p_domain)); v_email text:=lower(trim(p_admin_email));
begin
  if not private.is_platform_admin() then raise exception 'Platform administrator required'; end if;
  if trim(p_name)='' then raise exception 'School name required'; end if;
  if v_domain !~ '^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$' then raise exception 'Valid school domain required'; end if;
  if split_part(v_email,'@',2)<>v_domain then raise exception 'Initial CPD lead email must use the school domain'; end if;
  if p_seat_limit is not null and p_seat_limit<=0 then raise exception 'Seat limit must be positive'; end if;
  if exists(select 1 from public.organisation_domains where domain=v_domain) then raise exception 'Domain is already registered'; end if;
  v_slug:=lower(regexp_replace(trim(p_name),'[^a-zA-Z0-9-]+','-','g'))||'-'||substr(replace(gen_random_uuid()::text,'-',''),1,6);
  insert into public.organisations(name,slug,academic_year,created_by,access_mode) values(trim(p_name),v_slug,coalesce(nullif(trim(p_academic_year),''),'2026/27'),v_uid,'domain_subscription') returning id into v_org;
  insert into public.school_subscriptions(organisation_id,plan,status,provider,seat_limit,current_period_start,current_period_end) values(v_org,coalesce(nullif(trim(p_plan),''),'school'),'trialing','manual',p_seat_limit,now(),now()+interval '14 days');
  insert into public.school_sites(organisation_id,name,code,created_by) values(v_org,trim(p_name),'MAIN',v_uid);
  insert into public.organisation_domains(organisation_id,domain,status,is_primary,created_by) values(v_org,v_domain,'pending',true,v_uid);
  insert into public.organisation_initial_admins(organisation_id,email) values(v_org,v_email);
  perform private.seed_default_onboarding_programmes(v_org,v_uid);
  return v_org;
end;
$$;

create or replace function public.platform_create_school(p_name text,p_academic_year text,p_domain text,p_admin_email text,p_plan text default 'school',p_seat_limit integer default null)
returns uuid language sql set search_path='' as $$ select private.platform_create_school_impl(p_name,p_academic_year,p_domain,p_admin_email,p_plan,p_seat_limit); $$;
revoke all on function public.platform_create_school(text,text,text,text,text,integer) from public,anon;
grant execute on function public.platform_create_school(text,text,text,text,text,integer) to authenticated;
revoke all on function private.platform_create_school_impl(text,text,text,text,text,integer) from public,anon,authenticated;
