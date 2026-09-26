create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.platform_admins enable row level security;
revoke all on public.platform_admins from anon,authenticated;
grant select on public.platform_admins to authenticated;
create policy "platform admins see own platform role" on public.platform_admins for select to authenticated using (user_id=(select auth.uid()));

insert into public.platform_admins(user_id)
select id from public.staff_profiles where legacy_standalone_access=true
on conflict (user_id) do nothing;

create or replace function private.is_platform_admin()
returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.platform_admins p where p.user_id=auth.uid()); $$;
revoke all on function private.is_platform_admin() from public,anon,authenticated;

create or replace function private.platform_list_schools_impl()
returns table(organisation_id uuid,organisation_name text,access_mode text,subscription_status text,plan text,seat_limit integer,current_period_end timestamptz,domain_id uuid,domain text,domain_status text,domain_primary boolean)
language plpgsql security definer set search_path=''
as $$
begin
  if not private.is_platform_admin() then raise exception 'Platform administrator required'; end if;
  return query
  select o.id,o.name,o.access_mode,s.status,s.plan,s.seat_limit,s.current_period_end,d.id,d.domain,d.status,d.is_primary
  from public.organisations o left join public.school_subscriptions s on s.organisation_id=o.id left join public.organisation_domains d on d.organisation_id=o.id
  order by o.name,d.is_primary desc,d.domain;
end;
$$;

create or replace function private.platform_verify_domain_impl(p_domain_id uuid, p_verified boolean)
returns void language plpgsql security definer set search_path=''
as $$
begin
  if not private.is_platform_admin() then raise exception 'Platform administrator required'; end if;
  update public.organisation_domains set status=case when p_verified then 'verified' else 'disabled' end, verified_at=case when p_verified then now() else null end where id=p_domain_id;
  if not found then raise exception 'Domain not found'; end if;
end;
$$;

create or replace function private.platform_set_subscription_impl(p_org uuid,p_status text,p_plan text,p_seat_limit integer,p_period_end timestamptz,p_grace_until timestamptz)
returns void language plpgsql security definer set search_path=''
as $$
begin
  if not private.is_platform_admin() then raise exception 'Platform administrator required'; end if;
  if p_status not in ('trialing','active','past_due','cancelled','expired') then raise exception 'Invalid subscription status'; end if;
  if p_seat_limit is not null and p_seat_limit <= 0 then raise exception 'Seat limit must be positive'; end if;
  insert into public.school_subscriptions(organisation_id,plan,status,provider,seat_limit,current_period_start,current_period_end,grace_until,updated_at)
  values(p_org,coalesce(nullif(trim(p_plan),''),'school'),p_status,'manual',p_seat_limit,now(),p_period_end,p_grace_until,now())
  on conflict (organisation_id) do update set plan=excluded.plan,status=excluded.status,seat_limit=excluded.seat_limit,current_period_end=excluded.current_period_end,grace_until=excluded.grace_until,updated_at=now();
  update public.organisations set access_mode='domain_subscription',updated_at=now() where id=p_org;
end;
$$;

create or replace function public.platform_list_schools()
returns table(organisation_id uuid,organisation_name text,access_mode text,subscription_status text,plan text,seat_limit integer,current_period_end timestamptz,domain_id uuid,domain text,domain_status text,domain_primary boolean)
language sql set search_path='' as $$ select * from private.platform_list_schools_impl(); $$;
create or replace function public.platform_verify_domain(p_domain_id uuid,p_verified boolean)
returns void language sql set search_path='' as $$ select private.platform_verify_domain_impl(p_domain_id,p_verified); $$;
create or replace function public.platform_set_subscription(p_org uuid,p_status text,p_plan text,p_seat_limit integer default null,p_period_end timestamptz default null,p_grace_until timestamptz default null)
returns void language sql set search_path='' as $$ select private.platform_set_subscription_impl(p_org,p_status,p_plan,p_seat_limit,p_period_end,p_grace_until); $$;

revoke all on function public.platform_list_schools() from public,anon;
revoke all on function public.platform_verify_domain(uuid,boolean) from public,anon;
revoke all on function public.platform_set_subscription(uuid,text,text,integer,timestamptz,timestamptz) from public,anon;
grant execute on function public.platform_list_schools() to authenticated;
grant execute on function public.platform_verify_domain(uuid,boolean) to authenticated;
grant execute on function public.platform_set_subscription(uuid,text,text,integer,timestamptz,timestamptz) to authenticated;
revoke all on function private.platform_list_schools_impl() from public,anon,authenticated;
revoke all on function private.platform_verify_domain_impl(uuid,boolean) from public,anon,authenticated;
revoke all on function private.platform_set_subscription_impl(uuid,text,text,integer,timestamptz,timestamptz) from public,anon,authenticated;
