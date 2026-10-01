-- Make the 14-day trial use the same School entitlement as a paid School plan.
-- Trial state belongs in `status = 'trialing'`; the plan remains `school` so all
-- school-level feature gates behave identically during the trial.
update public.school_subscriptions
set plan = 'school', seat_limit = null, updated_at = now()
where lower(plan) in ('school-trial', 'school_trial');

create or replace function private.bootstrap_organisation_impl(
  p_name text,
  p_slug text,
  p_academic_year text,
  p_site_name text
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid := auth.uid();
  v_org uuid;
  v_site uuid;
  v_email text;
  v_email_confirmed_at timestamptz;
  v_slug text;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;

  select lower(u.email), u.email_confirmed_at
    into v_email, v_email_confirmed_at
  from auth.users u
  where u.id = v_uid;

  if v_email is null or position('@' in v_email) = 0 then
    raise exception 'A verified email address is required to start a school trial';
  end if;
  if v_email_confirmed_at is null then
    raise exception 'Confirm your email address before starting a school trial';
  end if;

  insert into public.staff_profiles(id, full_name, role, department)
  select
    v_uid,
    coalesce(nullif(u.raw_user_meta_data->>'full_name',''), nullif(u.raw_user_meta_data->>'name',''), ''),
    'Staff',
    coalesce(u.raw_user_meta_data->>'department','')
  from auth.users u
  where u.id = v_uid
  on conflict (id) do nothing;

  if exists(select 1 from public.staff_profiles where id=v_uid and organisation_id is not null) then
    raise exception 'Account already belongs to an organisation';
  end if;

  if trim(coalesce(p_name,'')) = '' then raise exception 'School name required'; end if;

  v_slug := lower(regexp_replace(coalesce(nullif(trim(p_slug),''), trim(p_name)), '[^a-zA-Z0-9-]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  if v_slug = '' then v_slug := 'school'; end if;
  if exists(select 1 from public.organisations where slug=v_slug) then
    v_slug := v_slug || '-' || substr(replace(gen_random_uuid()::text,'-',''),1,6);
  end if;

  insert into public.organisations(name,slug,academic_year,created_by,access_mode)
  values(
    trim(p_name),
    v_slug,
    coalesce(nullif(trim(p_academic_year),''),'2026/27'),
    v_uid,
    'domain_subscription'
  ) returning id into v_org;

  insert into public.school_subscriptions(
    organisation_id, plan, status, provider, seat_limit, current_period_start, current_period_end
  ) values(
    v_org, 'school', 'trialing', 'manual', null, now(), now()+interval '14 days'
  );

  insert into public.school_sites(organisation_id,name,code,created_by)
  values(v_org,coalesce(nullif(trim(p_site_name),''),trim(p_name)),'MAIN',v_uid)
  returning id into v_site;

  insert into public.organisation_memberships(organisation_id,user_id,site_id,member_role,active)
  values(v_org,v_uid,v_site,'org_admin',true)
  on conflict(organisation_id,user_id) do update
    set site_id=excluded.site_id, member_role='org_admin', active=true;

  update public.staff_profiles
  set organisation_id=v_org,
      site_id=v_site,
      role='Admin',
      legacy_standalone_access=false,
      updated_at=now()
  where id=v_uid;

  return v_org;
end;
$$;

-- A platform-provisioned school's nominated initial Admin can enter the active
-- trial immediately after confirming their email. Domain verification is still
-- required before any other staff on that domain can auto-join.
create or replace function private.claim_school_access_impl()
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_email_confirmed_at timestamptz;
  v_domain text;
  v_org uuid;
  v_site uuid;
  v_current_org uuid;
  v_legacy_standalone boolean := false;
  v_initial_admin boolean := false;
  v_membership_active boolean := false;
  v_sub public.school_subscriptions%rowtype;
  v_members integer;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  select lower(u.email),u.email_confirmed_at,sp.organisation_id,coalesce(sp.legacy_standalone_access,false)
    into v_email,v_email_confirmed_at,v_current_org,v_legacy_standalone
  from auth.users u left join public.staff_profiles sp on sp.id=u.id where u.id=v_uid;
  if v_email is null or position('@' in v_email)=0 then return jsonb_build_object('allowed',false,'reason','missing_email'); end if;
  if v_email_confirmed_at is null and not v_legacy_standalone then return jsonb_build_object('allowed',false,'reason','email_not_verified'); end if;

  if v_current_org is not null then
    select coalesce((select om.active from public.organisation_memberships om where om.organisation_id=v_current_org and om.user_id=v_uid limit 1),false)
      into v_membership_active;
    if not v_membership_active then
      return jsonb_build_object('allowed',false,'reason','access_disabled','organisation_id',v_current_org);
    end if;
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

  -- Permit only the specifically nominated initial School Admin to claim an
  -- active trial before the school domain has been verified.
  select a.organisation_id into v_org
  from public.organisation_initial_admins a
  join public.organisations o on o.id=a.organisation_id
  where a.email=v_email
    and (a.claimed_by is null or a.claimed_by=v_uid)
    and o.access_mode='domain_subscription'
    and private.subscription_allows_access(a.organisation_id)
  order by a.created_at desc
  limit 1;

  if v_org is not null then
    select id into v_site from public.school_sites where organisation_id=v_org and active order by created_at limit 1;
    insert into public.staff_profiles(id,full_name,role,department,organisation_id,site_id,legacy_standalone_access)
    select v_uid,coalesce(nullif(u.raw_user_meta_data->>'full_name',''),nullif(u.raw_user_meta_data->>'name',''),''),'Admin',
      coalesce(u.raw_user_meta_data->>'department',''),v_org,v_site,false from auth.users u where u.id=v_uid
    on conflict(id) do update set organisation_id=v_org,site_id=coalesce(public.staff_profiles.site_id,v_site),role='Admin',legacy_standalone_access=false,updated_at=now();
    insert into public.organisation_memberships(organisation_id,user_id,site_id,member_role,active)
    values(v_org,v_uid,v_site,'org_admin',true)
    on conflict(organisation_id,user_id) do update set active=true,site_id=coalesce(public.organisation_memberships.site_id,excluded.site_id),member_role='org_admin';
    update public.organisation_initial_admins
      set claimed_by=v_uid,claimed_at=coalesce(claimed_at,now())
      where organisation_id=v_org and email=v_email and (claimed_by is null or claimed_by=v_uid);
    return jsonb_build_object('allowed',true,'reason','initial_admin','organisation_id',v_org,'initial_admin',true);
  end if;

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

create or replace function private.platform_create_school_impl(p_name text, p_academic_year text, p_domain text, p_admin_email text, p_plan text, p_seat_limit integer)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_org uuid;
  v_slug text;
  v_domain text:=lower(trim(p_domain));
  v_email text:=lower(trim(p_admin_email));
  v_plan text:=coalesce(nullif(trim(p_plan),''),'school');
  v_seat_limit integer;
begin
  if not private.is_platform_admin() then raise exception 'Platform administrator required'; end if;
  if trim(p_name)='' then raise exception 'School name required'; end if;
  if v_domain !~ '^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$' then raise exception 'Valid school domain required'; end if;
  if split_part(v_email,'@',2)<>v_domain then raise exception 'Initial School Admin email must use the school domain'; end if;
  if lower(v_plan) in ('school-trial','school_trial') then v_plan:='school'; end if;
  v_seat_limit:=case when lower(v_plan)='school' then null else p_seat_limit end;
  if v_seat_limit is not null and v_seat_limit<=0 then raise exception 'Seat limit must be positive'; end if;
  if exists(select 1 from public.organisation_domains where domain=v_domain) then raise exception 'Domain is already registered'; end if;
  v_slug:=lower(regexp_replace(trim(p_name),'[^a-zA-Z0-9-]+','-','g'))||'-'||substr(replace(gen_random_uuid()::text,'-',''),1,6);
  insert into public.organisations(name,slug,academic_year,created_by,access_mode)
  values(trim(p_name),v_slug,coalesce(nullif(trim(p_academic_year),''),'2026/27'),v_uid,'domain_subscription') returning id into v_org;
  insert into public.school_subscriptions(organisation_id,plan,status,provider,seat_limit,current_period_start,current_period_end)
  values(v_org,v_plan,'trialing','manual',v_seat_limit,now(),now()+interval '14 days');
  insert into public.school_sites(organisation_id,name,code,created_by) values(v_org,trim(p_name),'MAIN',v_uid);
  insert into public.organisation_domains(organisation_id,domain,status,is_primary,created_by) values(v_org,v_domain,'pending',true,v_uid);
  insert into public.organisation_initial_admins(organisation_id,email) values(v_org,v_email);
  perform private.seed_default_onboarding_programmes(v_org,v_uid);
  return v_org;
end;
$$;

create or replace function private.platform_set_subscription_impl(p_org uuid, p_status text, p_plan text, p_seat_limit integer, p_period_end timestamptz, p_grace_until timestamptz)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_plan text:=coalesce(nullif(trim(p_plan),''),'school');
  v_seat_limit integer;
begin
  if not private.is_platform_admin() then raise exception 'Platform administrator required'; end if;
  if p_status not in ('trialing','active','past_due','cancelled','expired') then raise exception 'Invalid subscription status'; end if;
  if lower(v_plan) in ('school-trial','school_trial') then v_plan:='school'; end if;
  v_seat_limit:=case when lower(v_plan)='school' then null else p_seat_limit end;
  if v_seat_limit is not null and v_seat_limit<=0 then raise exception 'Seat limit must be positive'; end if;
  insert into public.school_subscriptions(organisation_id,plan,status,provider,seat_limit,current_period_start,current_period_end,grace_until,updated_at)
  values(p_org,v_plan,p_status,'manual',v_seat_limit,now(),p_period_end,p_grace_until,now())
  on conflict (organisation_id) do update set
    plan=excluded.plan,status=excluded.status,seat_limit=excluded.seat_limit,current_period_end=excluded.current_period_end,
    grace_until=excluded.grace_until,updated_at=now();
  update public.organisations set access_mode='domain_subscription',updated_at=now() where id=p_org;
end;
$$;
