alter table public.organisations
  add column if not exists access_mode text not null default 'legacy';
alter table public.organisations drop constraint if exists organisations_access_mode_check;
alter table public.organisations add constraint organisations_access_mode_check check (access_mode in ('legacy','domain_subscription'));
alter table public.organisations alter column access_mode set default 'domain_subscription';

create table if not exists public.school_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null unique references public.organisations(id) on delete cascade,
  plan text not null default 'school',
  status text not null default 'trialing' check (status in ('trialing','active','past_due','cancelled','expired')),
  provider text not null default 'manual',
  external_customer_id text,
  external_subscription_id text,
  seat_limit integer check (seat_limit is null or seat_limit > 0),
  current_period_start timestamptz,
  current_period_end timestamptz,
  grace_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organisation_domains (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  domain text not null,
  status text not null default 'pending' check (status in ('pending','verified','disabled')),
  is_primary boolean not null default false,
  verified_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint organisation_domains_domain_format check (
    domain = lower(domain)
    and domain !~ '@'
    and domain ~ '^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$'
  )
);

create unique index if not exists organisation_domains_domain_unique on public.organisation_domains (lower(domain));
create index if not exists organisation_domains_org_idx on public.organisation_domains (organisation_id);
create index if not exists school_subscriptions_org_status_idx on public.school_subscriptions (organisation_id,status);

alter table public.school_subscriptions enable row level security;
alter table public.organisation_domains enable row level security;

revoke all on public.school_subscriptions from anon, authenticated;
revoke all on public.organisation_domains from anon, authenticated;
grant select on public.school_subscriptions to authenticated;
grant select on public.organisation_domains to authenticated;
grant insert (organisation_id, domain, is_primary, created_by) on public.organisation_domains to authenticated;
grant delete on public.organisation_domains to authenticated;

create policy "members view school subscription" on public.school_subscriptions for select to authenticated using (organisation_id = private.current_org_id());
create policy "members view school domains" on public.organisation_domains for select to authenticated using (organisation_id = private.current_org_id());
create policy "org admins request school domains" on public.organisation_domains for insert to authenticated with check (private.is_org_admin(organisation_id) and status = 'pending' and created_by = (select auth.uid()));
create policy "org admins remove unverified domains" on public.organisation_domains for delete to authenticated using (private.is_org_admin(organisation_id) and status <> 'verified');

create or replace function private.subscription_allows_access(p_org uuid)
returns boolean language sql stable security definer set search_path=''
as $$
  select coalesce((
    select case
      when o.access_mode = 'legacy' then true
      else exists (
        select 1 from public.school_subscriptions s
        where s.organisation_id = o.id
          and ((s.status in ('trialing','active') and (s.current_period_end is null or s.current_period_end >= now()))
            or (s.status = 'past_due' and s.grace_until is not null and s.grace_until >= now()))
      )
    end
    from public.organisations o where o.id = p_org
  ), false);
$$;

create or replace function private.claim_school_access_impl()
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  v_uid uuid := auth.uid(); v_email text; v_domain text; v_org uuid; v_site uuid;
  v_current_org uuid; v_sub public.school_subscriptions%rowtype; v_members integer;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  select lower(email) into v_email from auth.users where id = v_uid;
  if v_email is null or position('@' in v_email) = 0 then return jsonb_build_object('allowed', false, 'reason', 'missing_email'); end if;
  select organisation_id into v_current_org from public.staff_profiles where id = v_uid;
  if v_current_org is not null then
    return jsonb_build_object('allowed', private.subscription_allows_access(v_current_org), 'organisation_id', v_current_org,
      'reason', case when private.subscription_allows_access(v_current_org) then 'existing_membership' else 'subscription_inactive' end);
  end if;
  v_domain := lower(split_part(v_email, '@', 2));
  select d.organisation_id into v_org
  from public.organisation_domains d join public.organisations o on o.id = d.organisation_id
  where d.domain = v_domain and d.status = 'verified' and o.access_mode = 'domain_subscription'
    and private.subscription_allows_access(d.organisation_id) limit 1;
  if v_org is null then return jsonb_build_object('allowed', false, 'reason', 'school_not_licensed', 'domain', v_domain); end if;
  select * into v_sub from public.school_subscriptions where organisation_id = v_org;
  if v_sub.seat_limit is not null then
    select count(*) into v_members from public.organisation_memberships where organisation_id = v_org and active;
    if v_members >= v_sub.seat_limit then return jsonb_build_object('allowed', false, 'reason', 'seat_limit_reached', 'organisation_id', v_org); end if;
  end if;
  select id into v_site from public.school_sites where organisation_id = v_org and active order by created_at limit 1;
  insert into public.staff_profiles (id, full_name, role, department, organisation_id, site_id)
  select v_uid, coalesce(nullif(u.raw_user_meta_data ->> 'full_name',''), nullif(u.raw_user_meta_data ->> 'name',''), ''),
         'Staff', coalesce(u.raw_user_meta_data ->> 'department',''), v_org, v_site
  from auth.users u where u.id = v_uid
  on conflict (id) do update set organisation_id = coalesce(public.staff_profiles.organisation_id, excluded.organisation_id),
    site_id = coalesce(public.staff_profiles.site_id, excluded.site_id), updated_at = now();
  insert into public.organisation_memberships (organisation_id,user_id,site_id,member_role,active)
  values (v_org,v_uid,v_site,'member',true)
  on conflict (organisation_id,user_id) do update set active=true, site_id=coalesce(public.organisation_memberships.site_id, excluded.site_id);
  return jsonb_build_object('allowed', true, 'reason', 'domain_matched', 'organisation_id', v_org, 'domain', v_domain);
end;
$$;

create or replace function public.claim_school_access()
returns jsonb language sql set search_path='' as $$ select private.claim_school_access_impl(); $$;
revoke all on function public.claim_school_access() from public, anon;
grant execute on function public.claim_school_access() to authenticated;
revoke all on function private.claim_school_access_impl() from public, anon, authenticated;
revoke all on function private.subscription_allows_access(uuid) from public, anon, authenticated;

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path=''
as $$
declare v_domain text; v_org uuid; v_site uuid;
begin
  v_domain := lower(split_part(coalesce(new.email,''), '@', 2));
  if v_domain <> '' then
    select d.organisation_id into v_org
    from public.organisation_domains d join public.organisations o on o.id=d.organisation_id
    where d.domain=v_domain and d.status='verified' and o.access_mode='domain_subscription'
      and private.subscription_allows_access(d.organisation_id) limit 1;
  end if;
  if v_org is not null then select id into v_site from public.school_sites where organisation_id=v_org and active order by created_at limit 1; end if;
  insert into public.staff_profiles (id,full_name,role,department,organisation_id,site_id)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'full_name',''), nullif(new.raw_user_meta_data ->> 'name',''), ''),
    'Staff', coalesce(new.raw_user_meta_data ->> 'department',''), v_org, v_site)
  on conflict (id) do nothing;
  if v_org is not null then
    insert into public.organisation_memberships (organisation_id,user_id,site_id,member_role,active)
    values (v_org,new.id,v_site,'member',true) on conflict (organisation_id,user_id) do nothing;
  end if;
  return new;
end;
$$;

comment on table public.school_subscriptions is 'Commercial entitlement for a school or trust organisation. Browser users can read only their own organisation subscription; activation is backend-managed.';
comment on table public.organisation_domains is 'School email domains. Only verified domains can auto-enrol staff; school admins can request domains but cannot self-verify them.';
