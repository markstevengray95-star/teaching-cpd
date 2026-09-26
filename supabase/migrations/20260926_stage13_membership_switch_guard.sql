create or replace function private.join_organisation_impl(p_code text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=auth.uid();v_org uuid;v_site uuid;v_existing uuid;begin
 if v_uid is null then raise exception 'Authentication required';end if;
 select organisation_id into v_existing from public.staff_profiles where id=v_uid;
 select id into v_org from public.organisations where upper(join_code)=upper(trim(p_code));
 if v_org is null then raise exception 'Invalid organisation code';end if;
 if v_existing is not null and v_existing<>v_org then raise exception 'Account already belongs to another organisation';end if;
 select id into v_site from public.school_sites where organisation_id=v_org and active order by created_at limit 1;
 insert into public.organisation_memberships(organisation_id,user_id,site_id,member_role,active)
 values(v_org,v_uid,v_site,'member',true)
 on conflict(organisation_id,user_id) do update set active=true,site_id=excluded.site_id;
 update public.staff_profiles set organisation_id=v_org,site_id=v_site,updated_at=now() where id=v_uid;
 return v_org;end;$$;
