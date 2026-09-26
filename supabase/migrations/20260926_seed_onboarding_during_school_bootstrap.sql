create or replace function private.bootstrap_organisation_impl(p_name text, p_slug text, p_academic_year text, p_site_name text)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare v_uid uuid := auth.uid(); v_org uuid; v_site uuid;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if not exists(select 1 from public.staff_profiles where id=v_uid and role in ('CPD Lead','Admin')) then raise exception 'CPD Lead or Admin required'; end if;
  if exists(select 1 from public.staff_profiles where id=v_uid and organisation_id is not null) then raise exception 'Account already belongs to an organisation'; end if;
  insert into public.organisations(name,slug,academic_year,created_by,access_mode)
    values(trim(p_name),lower(regexp_replace(trim(p_slug),'[^a-zA-Z0-9-]+','-','g')),coalesce(nullif(trim(p_academic_year),''),'2026/27'),v_uid,'domain_subscription') returning id into v_org;
  insert into public.school_subscriptions(organisation_id,plan,status,provider,current_period_start,current_period_end)
    values(v_org,'school-trial','trialing','manual',now(),now()+interval '14 days');
  insert into public.school_sites(organisation_id,name,code,created_by)
    values(v_org,coalesce(nullif(trim(p_site_name),''),trim(p_name)),'MAIN',v_uid) returning id into v_site;
  insert into public.organisation_memberships(organisation_id,user_id,site_id,member_role) values(v_org,v_uid,v_site,'org_admin');
  update public.staff_profiles set organisation_id=v_org, site_id=v_site, legacy_standalone_access=false, updated_at=now() where id=v_uid;
  perform private.seed_default_onboarding_programmes(v_org,v_uid);
  return v_org;
end;
$$;
