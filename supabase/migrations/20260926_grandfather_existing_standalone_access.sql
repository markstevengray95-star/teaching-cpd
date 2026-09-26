alter table public.staff_profiles
  add column if not exists legacy_standalone_access boolean not null default false;

update public.staff_profiles
set legacy_standalone_access = true
where organisation_id is null;

create or replace function private.claim_school_access_impl()
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_domain text;
  v_org uuid;
  v_site uuid;
  v_current_org uuid;
  v_legacy_standalone boolean := false;
  v_sub public.school_subscriptions%rowtype;
  v_members integer;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;

  select lower(u.email), sp.organisation_id, coalesce(sp.legacy_standalone_access, false)
    into v_email, v_current_org, v_legacy_standalone
  from auth.users u
  left join public.staff_profiles sp on sp.id = u.id
  where u.id = v_uid;

  if v_email is null or position('@' in v_email) = 0 then
    return jsonb_build_object('allowed', false, 'reason', 'missing_email');
  end if;

  if v_current_org is not null then
    return jsonb_build_object(
      'allowed', private.subscription_allows_access(v_current_org),
      'organisation_id', v_current_org,
      'reason', case when private.subscription_allows_access(v_current_org) then 'existing_membership' else 'subscription_inactive' end
    );
  end if;

  if v_legacy_standalone then
    return jsonb_build_object('allowed', true, 'reason', 'legacy_standalone');
  end if;

  v_domain := lower(split_part(v_email, '@', 2));
  select d.organisation_id into v_org
  from public.organisation_domains d
  join public.organisations o on o.id = d.organisation_id
  where d.domain = v_domain
    and d.status = 'verified'
    and o.access_mode = 'domain_subscription'
    and private.subscription_allows_access(d.organisation_id)
  limit 1;

  if v_org is null then
    return jsonb_build_object('allowed', false, 'reason', 'school_not_licensed', 'domain', v_domain);
  end if;

  select * into v_sub from public.school_subscriptions where organisation_id = v_org;
  if v_sub.seat_limit is not null then
    select count(*) into v_members from public.organisation_memberships where organisation_id = v_org and active;
    if v_members >= v_sub.seat_limit then
      return jsonb_build_object('allowed', false, 'reason', 'seat_limit_reached', 'organisation_id', v_org);
    end if;
  end if;

  select id into v_site from public.school_sites where organisation_id = v_org and active order by created_at limit 1;

  insert into public.staff_profiles (id, full_name, role, department, organisation_id, site_id, legacy_standalone_access)
  select v_uid,
         coalesce(nullif(u.raw_user_meta_data ->> 'full_name',''), nullif(u.raw_user_meta_data ->> 'name',''), ''),
         'Staff',
         coalesce(u.raw_user_meta_data ->> 'department',''),
         v_org,
         v_site,
         false
  from auth.users u where u.id = v_uid
  on conflict (id) do update
    set organisation_id = coalesce(public.staff_profiles.organisation_id, excluded.organisation_id),
        site_id = coalesce(public.staff_profiles.site_id, excluded.site_id),
        legacy_standalone_access = false,
        updated_at = now();

  insert into public.organisation_memberships (organisation_id,user_id,site_id,member_role,active)
  values (v_org,v_uid,v_site,'member',true)
  on conflict (organisation_id,user_id) do update
    set active=true,
        site_id=coalesce(public.organisation_memberships.site_id, excluded.site_id);

  return jsonb_build_object('allowed', true, 'reason', 'domain_matched', 'organisation_id', v_org, 'domain', v_domain);
end;
$$;

revoke update (legacy_standalone_access) on public.staff_profiles from authenticated, anon;
