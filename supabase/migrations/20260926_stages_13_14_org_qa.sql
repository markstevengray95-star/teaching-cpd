-- Stage 13: organisation / school-site administration
create table if not exists public.organisations (
  id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique,
  trust_name text not null default '', academic_year text not null default '2026/27', timezone text not null default 'Europe/London',
  default_cpd_hours numeric(6,2) not null default 20 check(default_cpd_hours between 0 and 999.99),
  join_code text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.school_sites (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  name text not null, code text not null, active boolean not null default true, created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), unique(organisation_id,code)
);
create table if not exists public.organisation_memberships (
  organisation_id uuid not null references public.organisations(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade,
  site_id uuid null references public.school_sites(id) on delete set null, member_role text not null default 'member' check(member_role in ('member','site_lead','org_admin')),
  active boolean not null default true, joined_at timestamptz not null default now(), primary key(organisation_id,user_id)
);
alter table public.staff_profiles add column if not exists organisation_id uuid null references public.organisations(id) on delete set null;
alter table public.staff_profiles add column if not exists site_id uuid null references public.school_sites(id) on delete set null;
alter table public.cpd_assignments add column if not exists organisation_id uuid null references public.organisations(id) on delete cascade;
alter table public.training_requirements add column if not exists organisation_id uuid null references public.organisations(id) on delete cascade;
alter table public.training_requirements add column if not exists site_id uuid null references public.school_sites(id) on delete set null;
alter table public.cpd_calendar_events add column if not exists organisation_id uuid null references public.organisations(id) on delete cascade;
alter table public.cpd_calendar_events add column if not exists site_id uuid null references public.school_sites(id) on delete set null;
alter table public.custom_courses add column if not exists organisation_id uuid null references public.organisations(id) on delete cascade;
alter table public.custom_courses add column if not exists site_id uuid null references public.school_sites(id) on delete set null;
alter table public.live_sessions add column if not exists organisation_id uuid null references public.organisations(id) on delete cascade;
alter table public.live_sessions add column if not exists site_id uuid null references public.school_sites(id) on delete set null;

create or replace function private.current_org_id() returns uuid language sql stable security definer set search_path='' as $$
 select organisation_id from public.staff_profiles where id=(select auth.uid()); $$;
create or replace function private.is_org_admin(p_org uuid default null) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.staff_profiles sp where sp.id=(select auth.uid()) and sp.role in ('CPD Lead','Admin') and sp.organisation_id is not null and (p_org is null or sp.organisation_id=p_org)); $$;
create or replace function private.bootstrap_organisation_impl(p_name text,p_slug text,p_academic_year text,p_site_name text) returns uuid language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=auth.uid();v_org uuid;v_site uuid;begin
 if v_uid is null then raise exception 'Authentication required';end if;
 if not exists(select 1 from public.staff_profiles where id=v_uid and role in ('CPD Lead','Admin')) then raise exception 'CPD Lead or Admin required';end if;
 if exists(select 1 from public.staff_profiles where id=v_uid and organisation_id is not null) then raise exception 'Account already belongs to an organisation';end if;
 insert into public.organisations(name,slug,academic_year,created_by) values(trim(p_name),lower(regexp_replace(trim(p_slug),'[^a-zA-Z0-9-]+','-','g')),coalesce(nullif(trim(p_academic_year),''),'2026/27'),v_uid) returning id into v_org;
 insert into public.school_sites(organisation_id,name,code,created_by) values(v_org,coalesce(nullif(trim(p_site_name),''),trim(p_name)),'MAIN',v_uid) returning id into v_site;
 insert into public.organisation_memberships(organisation_id,user_id,site_id,member_role) values(v_org,v_uid,v_site,'org_admin');
 update public.staff_profiles set organisation_id=v_org,site_id=v_site,updated_at=now() where id=v_uid;return v_org;end;$$;
create or replace function private.join_organisation_impl(p_code text) returns uuid language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=auth.uid();v_org uuid;v_site uuid;begin
 if v_uid is null then raise exception 'Authentication required';end if;
 select id into v_org from public.organisations where upper(join_code)=upper(trim(p_code));if v_org is null then raise exception 'Invalid organisation code';end if;
 select id into v_site from public.school_sites where organisation_id=v_org and active order by created_at limit 1;
 insert into public.organisation_memberships(organisation_id,user_id,site_id,member_role,active) values(v_org,v_uid,v_site,'member',true) on conflict(organisation_id,user_id) do update set active=true,site_id=excluded.site_id;
 update public.staff_profiles set organisation_id=v_org,site_id=v_site,updated_at=now() where id=v_uid;return v_org;end;$$;
create or replace function public.bootstrap_organisation(p_name text,p_slug text,p_academic_year text default '2026/27',p_site_name text default '') returns uuid language sql security invoker set search_path='' as $$select private.bootstrap_organisation_impl(p_name,p_slug,p_academic_year,p_site_name);$$;
create or replace function public.join_organisation(p_code text) returns uuid language sql security invoker set search_path='' as $$select private.join_organisation_impl(p_code);$$;
revoke all on function public.bootstrap_organisation(text,text,text,text) from public,anon;revoke all on function public.join_organisation(text) from public,anon;
grant execute on function public.bootstrap_organisation(text,text,text,text) to authenticated;grant execute on function public.join_organisation(text) to authenticated;
grant usage on schema private to authenticated;grant execute on function private.bootstrap_organisation_impl(text,text,text,text) to authenticated;grant execute on function private.join_organisation_impl(text) to authenticated;

create or replace function private.fill_org_scope() returns trigger language plpgsql security definer set search_path='' as $$begin if new.organisation_id is null then new.organisation_id:=private.current_org_id();end if;return new;end;$$;
create trigger cpd_assignments_fill_org before insert on public.cpd_assignments for each row execute function private.fill_org_scope();
create trigger training_requirements_fill_org before insert on public.training_requirements for each row execute function private.fill_org_scope();
create trigger calendar_fill_org before insert on public.cpd_calendar_events for each row execute function private.fill_org_scope();
create trigger custom_courses_fill_org before insert on public.custom_courses for each row execute function private.fill_org_scope();
create trigger live_sessions_fill_org before insert on public.live_sessions for each row execute function private.fill_org_scope();

alter table public.organisations enable row level security;alter table public.school_sites enable row level security;alter table public.organisation_memberships enable row level security;
create policy "members view organisation" on public.organisations for select to authenticated using(id=private.current_org_id());
create policy "org admins update organisation" on public.organisations for update to authenticated using(private.is_org_admin(id)) with check(private.is_org_admin(id));
create policy "members view sites" on public.school_sites for select to authenticated using(organisation_id=private.current_org_id());
create policy "org admins manage sites insert" on public.school_sites for insert to authenticated with check(private.is_org_admin(organisation_id) and created_by=(select auth.uid()));
create policy "org admins manage sites update" on public.school_sites for update to authenticated using(private.is_org_admin(organisation_id)) with check(private.is_org_admin(organisation_id));
create policy "org admins manage sites delete" on public.school_sites for delete to authenticated using(private.is_org_admin(organisation_id));
create policy "members view own or org admin memberships" on public.organisation_memberships for select to authenticated using(user_id=(select auth.uid()) or private.is_org_admin(organisation_id));
create policy "org admins update memberships" on public.organisation_memberships for update to authenticated using(private.is_org_admin(organisation_id)) with check(private.is_org_admin(organisation_id));
grant select,update on public.organisations to authenticated;grant select,insert,update,delete on public.school_sites to authenticated;grant select,update on public.organisation_memberships to authenticated;

-- Stage 14: annual plan, QA reviews and audit trail
create table if not exists public.annual_cpd_plans(id uuid primary key default gen_random_uuid(),organisation_id uuid not null references public.organisations(id) on delete cascade,academic_year text not null,title text not null,priorities text[] not null default '{}',target_hours numeric(6,2) not null default 20,status text not null default 'draft' check(status in ('draft','active','closed')),created_by uuid not null references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(organisation_id,academic_year));
create table if not exists public.annual_cpd_actions(id uuid primary key default gen_random_uuid(),plan_id uuid not null references public.annual_cpd_plans(id) on delete cascade,title text not null,owner_label text not null default '',due_date date null,status text not null default 'planned' check(status in ('planned','in_progress','completed','cancelled')),linked_course_id text null,evidence_expected text not null default '',notes text not null default '',created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.course_quality_reviews(id uuid primary key default gen_random_uuid(),organisation_id uuid not null references public.organisations(id) on delete cascade,course_id text not null,course_title text not null,quality_rating int null check(quality_rating between 1 and 5),accuracy_status text not null default 'review_due' check(accuracy_status in ('review_due','checked','needs_update')),accessibility_status text not null default 'review_due' check(accessibility_status in ('review_due','checked','needs_update')),notes text not null default '',reviewed_by uuid not null references auth.users(id),reviewed_at timestamptz not null default now(),next_review_date date null,unique(organisation_id,course_id));
create table if not exists public.cpd_audit_log(id bigint generated by default as identity primary key,organisation_id uuid null references public.organisations(id) on delete set null,actor_id uuid null references auth.users(id) on delete set null,entity_type text not null,entity_id text not null,action text not null,summary jsonb not null default '{}'::jsonb,occurred_at timestamptz not null default now());
alter table public.annual_cpd_plans enable row level security;alter table public.annual_cpd_actions enable row level security;alter table public.course_quality_reviews enable row level security;alter table public.cpd_audit_log enable row level security;
create policy "org members view annual plans" on public.annual_cpd_plans for select to authenticated using(organisation_id=private.current_org_id());
create policy "org admins insert annual plans" on public.annual_cpd_plans for insert to authenticated with check(private.is_org_admin(organisation_id) and created_by=(select auth.uid()));
create policy "org admins update annual plans" on public.annual_cpd_plans for update to authenticated using(private.is_org_admin(organisation_id)) with check(private.is_org_admin(organisation_id));
create policy "org admins delete annual plans" on public.annual_cpd_plans for delete to authenticated using(private.is_org_admin(organisation_id));
create policy "org members view plan actions" on public.annual_cpd_actions for select to authenticated using(exists(select 1 from public.annual_cpd_plans p where p.id=plan_id and p.organisation_id=private.current_org_id()));
create policy "org admins insert plan actions" on public.annual_cpd_actions for insert to authenticated with check(exists(select 1 from public.annual_cpd_plans p where p.id=plan_id and private.is_org_admin(p.organisation_id)));
create policy "org admins update plan actions" on public.annual_cpd_actions for update to authenticated using(exists(select 1 from public.annual_cpd_plans p where p.id=plan_id and private.is_org_admin(p.organisation_id))) with check(exists(select 1 from public.annual_cpd_plans p where p.id=plan_id and private.is_org_admin(p.organisation_id)));
create policy "org admins delete plan actions" on public.annual_cpd_actions for delete to authenticated using(exists(select 1 from public.annual_cpd_plans p where p.id=plan_id and private.is_org_admin(p.organisation_id)));
create policy "org members view quality reviews" on public.course_quality_reviews for select to authenticated using(organisation_id=private.current_org_id());
create policy "org admins manage quality reviews insert" on public.course_quality_reviews for insert to authenticated with check(private.is_org_admin(organisation_id) and reviewed_by=(select auth.uid()));
create policy "org admins manage quality reviews update" on public.course_quality_reviews for update to authenticated using(private.is_org_admin(organisation_id)) with check(private.is_org_admin(organisation_id));
create policy "org admins view audit log" on public.cpd_audit_log for select to authenticated using(private.is_org_admin(organisation_id));
grant select,insert,update,delete on public.annual_cpd_plans,public.annual_cpd_actions,public.course_quality_reviews to authenticated;grant select on public.cpd_audit_log to authenticated;
