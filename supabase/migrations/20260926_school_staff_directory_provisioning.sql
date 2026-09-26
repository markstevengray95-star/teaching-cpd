create table if not exists public.organisation_staff_directory (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  department text not null default '',
  role text not null default 'Staff' check (role in ('Staff','Department Lead','CPD Lead','Admin')),
  site_id uuid references public.school_sites(id) on delete set null,
  active boolean not null default true,
  source text not null default 'manual' check (source in ('manual','csv','mis','api')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id,email),
  constraint organisation_staff_directory_email_lower check (email=lower(email) and email like '%@%')
);
alter table public.organisation_staff_directory enable row level security;
revoke all on public.organisation_staff_directory from anon,authenticated;
grant select,insert,update,delete on public.organisation_staff_directory to authenticated;
create policy "staff read own directory row" on public.organisation_staff_directory for select to authenticated using (organisation_id=private.current_org_id() and (email=(select lower(email) from auth.users where id=auth.uid()) or private.is_org_admin(organisation_id)));
create policy "org admins insert directory rows" on public.organisation_staff_directory for insert to authenticated with check (private.is_org_admin(organisation_id) and created_by=(select auth.uid()));
create policy "org admins update directory rows" on public.organisation_staff_directory for update to authenticated using (private.is_org_admin(organisation_id)) with check (private.is_org_admin(organisation_id));
create policy "org admins delete directory rows" on public.organisation_staff_directory for delete to authenticated using (private.is_org_admin(organisation_id));
create index if not exists organisation_staff_directory_email_idx on public.organisation_staff_directory(email);
create index if not exists organisation_staff_directory_org_active_idx on public.organisation_staff_directory(organisation_id,active);
create index if not exists organisation_staff_directory_site_idx on public.organisation_staff_directory(site_id);
create index if not exists organisation_staff_directory_created_by_idx on public.organisation_staff_directory(created_by);

create or replace function private.apply_staff_directory_profile(p_uid uuid,p_org uuid,p_email text)
returns void language plpgsql security definer set search_path=''
as $$
declare v_row public.organisation_staff_directory%rowtype;
begin
  select * into v_row from public.organisation_staff_directory where organisation_id=p_org and email=lower(p_email) and active limit 1;
  if v_row.id is null then return; end if;
  update public.staff_profiles set full_name=case when trim(v_row.full_name)<>'' then v_row.full_name else full_name end,department=v_row.department,role=v_row.role,site_id=coalesce(v_row.site_id,site_id),updated_at=now() where id=p_uid and organisation_id=p_org;
  update public.organisation_memberships set site_id=coalesce(v_row.site_id,site_id),member_role=case when v_row.role in ('CPD Lead','Admin') then 'org_admin' else 'member' end,active=true where organisation_id=p_org and user_id=p_uid;
end;
$$;
revoke all on function private.apply_staff_directory_profile(uuid,uuid,text) from public,anon,authenticated;

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
  select lower(u.email),u.email_confirmed_at,sp.organisation_id,coalesce(sp.legacy_standalone_access,false) into v_email,v_email_confirmed_at,v_current_org,v_legacy_standalone from auth.users u left join public.staff_profiles sp on sp.id=u.id where u.id=v_uid;
  if v_email is null or position('@' in v_email)=0 then return jsonb_build_object('allowed',false,'reason','missing_email'); end if;
  if v_email_confirmed_at is null and not v_legacy_standalone then return jsonb_build_object('allowed',false,'reason','email_not_verified'); end if;
  if v_current_org is not null then
    select exists(select 1 from public.organisation_initial_admins a where a.organisation_id=v_current_org and a.email=v_email and (a.claimed_by is null or a.claimed_by=v_uid)) into v_initial_admin;
    if v_initial_admin then
      update public.staff_profiles set role='CPD Lead',updated_at=now() where id=v_uid;
      update public.organisation_memberships set member_role='org_admin',active=true where organisation_id=v_current_org and user_id=v_uid;
      update public.organisation_initial_admins set claimed_by=v_uid,claimed_at=coalesce(claimed_at,now()) where organisation_id=v_current_org and email=v_email;
    else
      perform private.apply_staff_directory_profile(v_uid,v_current_org,v_email);
    end if;
    return jsonb_build_object('allowed',private.subscription_allows_access(v_current_org),'organisation_id',v_current_org,'reason',case when private.subscription_allows_access(v_current_org) then 'existing_membership' else 'subscription_inactive' end,'initial_admin',v_initial_admin);
  end if;
  if v_legacy_standalone then return jsonb_build_object('allowed',true,'reason','legacy_standalone'); end if;
  v_domain:=lower(split_part(v_email,'@',2));
  select d.organisation_id into v_org from public.organisation_domains d join public.organisations o on o.id=d.organisation_id where d.domain=v_domain and d.status='verified' and o.access_mode='domain_subscription' and private.subscription_allows_access(d.organisation_id) limit 1;
  if v_org is null then return jsonb_build_object('allowed',false,'reason','school_not_licensed','domain',v_domain); end if;
  select * into v_sub from public.school_subscriptions where organisation_id=v_org for update;
  if v_sub.organisation_id is null then return jsonb_build_object('allowed',false,'reason','subscription_inactive','organisation_id',v_org); end if;
  if v_sub.seat_limit is not null then select count(*) into v_members from public.organisation_memberships where organisation_id=v_org and active; if v_members>=v_sub.seat_limit then return jsonb_build_object('allowed',false,'reason','seat_limit_reached','organisation_id',v_org); end if; end if;
  select exists(select 1 from public.organisation_initial_admins a where a.organisation_id=v_org and a.email=v_email and a.claimed_by is null) into v_initial_admin;
  select id into v_site from public.school_sites where organisation_id=v_org and active order by created_at limit 1;
  insert into public.staff_profiles(id,full_name,role,department,organisation_id,site_id,legacy_standalone_access)
  select v_uid,coalesce(nullif(u.raw_user_meta_data->>'full_name',''),nullif(u.raw_user_meta_data->>'name',''),''),case when v_initial_admin then 'CPD Lead' else 'Staff' end,coalesce(u.raw_user_meta_data->>'department',''),v_org,v_site,false from auth.users u where u.id=v_uid
  on conflict(id) do update set organisation_id=coalesce(public.staff_profiles.organisation_id,excluded.organisation_id),site_id=coalesce(public.staff_profiles.site_id,excluded.site_id),role=case when v_initial_admin then 'CPD Lead' else public.staff_profiles.role end,legacy_standalone_access=false,updated_at=now();
  insert into public.organisation_memberships(organisation_id,user_id,site_id,member_role,active) values(v_org,v_uid,v_site,case when v_initial_admin then 'org_admin' else 'member' end,true)
  on conflict(organisation_id,user_id) do update set active=true,site_id=coalesce(public.organisation_memberships.site_id,excluded.site_id),member_role=case when v_initial_admin then 'org_admin' else public.organisation_memberships.member_role end;
  if v_initial_admin then update public.organisation_initial_admins set claimed_by=v_uid,claimed_at=now() where organisation_id=v_org and email=v_email and claimed_by is null; else perform private.apply_staff_directory_profile(v_uid,v_org,v_email); end if;
  return jsonb_build_object('allowed',true,'reason','domain_matched','organisation_id',v_org,'domain',v_domain,'initial_admin',v_initial_admin);
end;
$$;
