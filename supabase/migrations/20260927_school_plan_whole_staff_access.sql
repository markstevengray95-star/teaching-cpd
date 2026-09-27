update public.school_subscriptions
set seat_limit=null,updated_at=now()
where lower(plan)='school' and seat_limit is not null;

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
