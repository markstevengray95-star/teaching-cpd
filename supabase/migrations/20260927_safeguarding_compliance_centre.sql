create table if not exists public.safeguarding_requirements (
  code text primary key,
  title text not null,
  audience text not null,
  requirement_kind text not null,
  frequency_months integer,
  guidance_source_id text references public.system_guidance_sources(id) on update cascade,
  guidance_version text not null,
  statutory_basis text not null default '',
  certificate_rule text not null default 'record_only',
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  check (audience in ('all_staff','dsl','deputy_dsl','governor_trustee','safer_recruitment_panel','prevent_lead','it_safeguarding')),
  check (requirement_kind in ('read_acknowledge','training','update','role_training','awareness')),
  check (certificate_rule in ('record_only','school_record_allowed','external_provider_expected','accredited_only_if_verified'))
);
alter table public.safeguarding_requirements enable row level security;
revoke all on public.safeguarding_requirements from anon;
grant select on public.safeguarding_requirements to authenticated;
drop policy if exists "authenticated read safeguarding requirements" on public.safeguarding_requirements;
create policy "authenticated read safeguarding requirements" on public.safeguarding_requirements for select to authenticated using (true);

create table if not exists public.safeguarding_role_assignments (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid not null references public.staff_profiles(id) on delete cascade,
  safeguarding_role text not null,
  active boolean not null default true,
  assigned_by uuid not null references public.staff_profiles(id),
  assigned_at timestamptz not null default now(),
  notes text not null default '',
  unique (organisation_id,user_id,safeguarding_role),
  check (safeguarding_role in ('dsl','deputy_dsl','governor_trustee','safer_recruitment_panel','prevent_lead','it_safeguarding'))
);
create index if not exists safeguarding_role_assignments_org_idx on public.safeguarding_role_assignments(organisation_id,active);
create index if not exists safeguarding_role_assignments_user_idx on public.safeguarding_role_assignments(user_id,active);
alter table public.safeguarding_role_assignments enable row level security;
revoke all on public.safeguarding_role_assignments from anon;
grant select,insert,update,delete on public.safeguarding_role_assignments to authenticated;
drop policy if exists "staff view own safeguarding roles" on public.safeguarding_role_assignments;
drop policy if exists "school admins manage safeguarding roles" on public.safeguarding_role_assignments;
create policy "staff view own safeguarding roles" on public.safeguarding_role_assignments for select to authenticated using (user_id=(select auth.uid()) or private.is_org_admin(organisation_id));
create policy "school admins manage safeguarding roles" on public.safeguarding_role_assignments for all to authenticated using (private.is_school_admin(organisation_id)) with check (private.is_school_admin(organisation_id) and assigned_by=(select auth.uid()));

create table if not exists public.safeguarding_evidence (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid not null references public.staff_profiles(id) on delete cascade,
  requirement_code text not null references public.safeguarding_requirements(code),
  completed_at timestamptz not null default now(),
  valid_until timestamptz,
  evidence_kind text not null default 'school_record',
  provider_name text not null default '',
  certificate_number text,
  accrediting_body text,
  evidence_url text,
  guidance_version text not null default '',
  verified_by uuid references public.staff_profiles(id),
  verified_at timestamptz,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (evidence_kind in ('acknowledgement','school_record','external_provider','externally_accredited'))
);
create index if not exists safeguarding_evidence_user_req_idx on public.safeguarding_evidence(user_id,requirement_code,completed_at desc);
create index if not exists safeguarding_evidence_org_req_idx on public.safeguarding_evidence(organisation_id,requirement_code,completed_at desc);
alter table public.safeguarding_evidence enable row level security;
revoke all on public.safeguarding_evidence from anon;
grant select,insert,update,delete on public.safeguarding_evidence to authenticated;
drop policy if exists "staff view own safeguarding evidence" on public.safeguarding_evidence;
drop policy if exists "staff add own safeguarding evidence" on public.safeguarding_evidence;
drop policy if exists "staff update own unverified safeguarding evidence" on public.safeguarding_evidence;
drop policy if exists "school admins manage safeguarding evidence" on public.safeguarding_evidence;
create policy "staff view own safeguarding evidence" on public.safeguarding_evidence for select to authenticated using (user_id=(select auth.uid()) or private.is_org_admin(organisation_id));
create policy "staff add own safeguarding evidence" on public.safeguarding_evidence for insert to authenticated with check (user_id=(select auth.uid()) and organisation_id=private.current_org_id() and verified_by is null and verified_at is null);
create policy "staff update own unverified safeguarding evidence" on public.safeguarding_evidence for update to authenticated using (user_id=(select auth.uid()) and verified_at is null) with check (user_id=(select auth.uid()) and organisation_id=private.current_org_id());
create policy "school admins manage safeguarding evidence" on public.safeguarding_evidence for all to authenticated using (private.is_org_admin(organisation_id)) with check (private.is_org_admin(organisation_id));

insert into public.system_guidance_sources(id,title,publisher,source_url,version_label,effective_date,last_verified_on,next_check_on,status)
values
('kcsie-2026','Keeping children safe in education','Department for Education','https://www.gov.uk/government/publications/keeping-children-safe-in-education--2','2026','2026-09-01','2026-09-27','2027-07-01','current'),
('working-together-2026','Working together to safeguard children','Department for Education','https://www.gov.uk/government/publications/working-together-to-safeguard-children--2','2026','2026-03-18','2026-09-27','2027-03-01','current'),
('prevent-duty-education-2026','The Prevent duty: safeguarding learners susceptible to radicalisation','Department for Education','https://www.gov.uk/government/publications/the-prevent-duty-safeguarding-learners-susceptible-to-radicalisation','Updated 24 September 2026','2026-09-24','2026-09-27','2027-03-01','current'),
('filtering-monitoring-2026','Filtering and monitoring: core standard','Department for Education','https://www.gov.uk/guidance/meeting-digital-and-technology-standards-in-schools-and-colleges/filtering-and-monitoring-core-standard','Updated 16 September 2026','2026-09-16','2026-09-27','2027-03-01','current'),
('info-sharing-2026','Information sharing to safeguard children and young people','Department for Education','https://www.gov.uk/government/publications/information-sharing-advice-for-safeguarding-practitioners','2026 statutory guidance','2026-09-10','2026-09-27','2027-03-01','current')
on conflict(id) do update set title=excluded.title,publisher=excluded.publisher,source_url=excluded.source_url,version_label=excluded.version_label,effective_date=excluded.effective_date,last_verified_on=excluded.last_verified_on,next_check_on=excluded.next_check_on,status=excluded.status;

insert into public.safeguarding_requirements(code,title,audience,requirement_kind,frequency_months,guidance_source_id,guidance_version,statutory_basis,certificate_rule)
values
('kcsie-part-one-2026','Read and acknowledge KCSIE 2026 Part One','all_staff','read_acknowledge',null,'kcsie-2026','KCSIE 2026','All staff must read Part One in full and follow school safeguarding policies and procedures.','record_only'),
('safeguarding-induction','Safeguarding and child protection training at induction','all_staff','training',null,'kcsie-2026','KCSIE 2026','All staff should receive appropriate safeguarding and child protection training, including online safety, at induction.','school_record_allowed'),
('safeguarding-annual-update','Safeguarding and child protection update','all_staff','update',12,'kcsie-2026','KCSIE 2026','Safeguarding and child protection updates, including online safety, should be provided as required and at least annually.','school_record_allowed'),
('online-safety-filtering-monitoring','Online safety, filtering and monitoring responsibilities','all_staff','awareness',12,'filtering-monitoring-2026','KCSIE 2026 / DfE core standard','Staff safeguarding training should include online safety and awareness of applicable filtering and monitoring responsibilities.','school_record_allowed'),
('dsl-core-training','DSL / Deputy DSL role training','dsl','role_training',24,'kcsie-2026','KCSIE 2026','DSLs and deputies should undergo role training and update that training at least every two years.','external_provider_expected'),
('deputy-dsl-core-training','Deputy DSL role training','deputy_dsl','role_training',24,'kcsie-2026','KCSIE 2026','DSLs and deputies should undergo role training and update that training at least every two years.','external_provider_expected'),
('dsl-annual-refresh','DSL / Deputy DSL knowledge and skills refresh','dsl','update',12,'kcsie-2026','KCSIE 2026','DSL knowledge and skills should be refreshed at regular intervals, as required, and at least annually.','record_only'),
('deputy-dsl-annual-refresh','Deputy DSL knowledge and skills refresh','deputy_dsl','update',12,'kcsie-2026','KCSIE 2026','DSL knowledge and skills should be refreshed at regular intervals, as required, and at least annually.','record_only'),
('prevent-awareness-dsl','Prevent awareness for DSL / Deputy DSL','dsl','awareness',24,'prevent-duty-education-2026','Prevent guidance updated 24 September 2026','DSLs should undertake Prevent awareness training; Prevent-specific lead training is recommended to be refreshed at least every two years.','external_provider_expected'),
('prevent-awareness-deputy','Prevent awareness for Deputy DSL','deputy_dsl','awareness',24,'prevent-duty-education-2026','Prevent guidance updated 24 September 2026','DSLs and deputies should have appropriate Prevent awareness and role-relevant training.','external_provider_expected'),
('governor-safeguarding-induction','Governor / Trustee safeguarding and child protection training','governor_trustee','role_training',null,'kcsie-2026','KCSIE 2026','Governors and trustees should receive appropriate safeguarding and child protection training at induction and it should be regularly updated.','external_provider_expected'),
('safer-recruitment-panel','Safer recruitment training for recruitment panel responsibilities','safer_recruitment_panel','role_training',null,'kcsie-2026','KCSIE 2026 / staffing guidance','Where required for recruitment panels, the school should evidence appropriate safer recruitment training.','external_provider_expected'),
('prevent-lead-refresh','Prevent lead role training / refresh','prevent_lead','role_training',24,'prevent-duty-education-2026','Prevent guidance updated 24 September 2026','Prevent-specific leads are recommended to refresh training at least every two years.','external_provider_expected'),
('it-filtering-monitoring-refresh','Filtering and monitoring safeguarding training','it_safeguarding','role_training',12,'filtering-monitoring-2026','DfE core standard updated 16 September 2026','Staff managing technical monitoring should receive training so their knowledge remains current.','external_provider_expected')
on conflict(code) do update set title=excluded.title,audience=excluded.audience,requirement_kind=excluded.requirement_kind,frequency_months=excluded.frequency_months,guidance_source_id=excluded.guidance_source_id,guidance_version=excluded.guidance_version,statutory_basis=excluded.statutory_basis,certificate_rule=excluded.certificate_rule,active=true,updated_at=now();

create or replace function private.safeguarding_school_summary_impl()
returns table(requirement_code text,title text,required_count bigint,current_count bigint,overdue_count bigint)
language plpgsql security definer set search_path=''
as $$
declare v_org uuid:=private.current_org_id();
begin
  if v_org is null or not private.is_org_admin(v_org) then raise exception 'CPD Lead or Admin access required'; end if;
  return query
  with members as (
    select sp.id from public.staff_profiles sp
    join public.organisation_memberships om on om.organisation_id=sp.organisation_id and om.user_id=sp.id and om.active
    where sp.organisation_id=v_org
  ), req as (
    select r.* from public.safeguarding_requirements r where r.active and r.audience='all_staff'
  ), latest as (
    select distinct on (e.user_id,e.requirement_code) e.user_id,e.requirement_code,e.completed_at,e.valid_until
    from public.safeguarding_evidence e where e.organisation_id=v_org order by e.user_id,e.requirement_code,e.completed_at desc
  )
  select req.code,req.title,(select count(*) from members),
    count(*) filter(where latest.user_id is not null and (latest.valid_until is null or latest.valid_until>=now())),
    count(*) filter(where latest.user_id is null or (latest.valid_until is not null and latest.valid_until<now()))
  from req cross join members m left join latest on latest.user_id=m.id and latest.requirement_code=req.code
  group by req.code,req.title order by req.title;
end;
$$;
create or replace function public.safeguarding_school_summary()
returns table(requirement_code text,title text,required_count bigint,current_count bigint,overdue_count bigint)
language sql set search_path='' as $$ select * from private.safeguarding_school_summary_impl(); $$;
revoke all on function private.safeguarding_school_summary_impl() from public,anon;
grant execute on function private.safeguarding_school_summary_impl() to authenticated;
revoke all on function public.safeguarding_school_summary() from public,anon;
grant execute on function public.safeguarding_school_summary() to authenticated;

create or replace function private.validate_safeguarding_evidence()
returns trigger language plpgsql set search_path=''
as $$
declare v_rule text;
begin
  select certificate_rule into v_rule from public.safeguarding_requirements where code=new.requirement_code and active;
  if v_rule is null then raise exception 'Unknown or inactive safeguarding requirement'; end if;
  if new.evidence_kind='acknowledgement' and new.requirement_code<>'kcsie-part-one-2026' then raise exception 'Acknowledgement evidence is reserved for the KCSIE Part One reading requirement'; end if;
  if v_rule='record_only' and new.evidence_kind not in ('acknowledgement','school_record') then raise exception 'This requirement is recorded as an acknowledgement or school compliance record, not an accredited certificate'; end if;
  if v_rule='external_provider_expected' and new.evidence_kind not in ('external_provider','externally_accredited') then raise exception 'This role-specific requirement expects evidence from an external training provider'; end if;
  if v_rule='accredited_only_if_verified' and new.evidence_kind<>'externally_accredited' then raise exception 'This requirement must use verified externally accredited evidence'; end if;
  if new.evidence_kind in ('external_provider','externally_accredited') and btrim(coalesce(new.provider_name,''))='' then raise exception 'Training provider name is required for external safeguarding evidence'; end if;
  if new.evidence_kind='externally_accredited' and btrim(coalesce(new.accrediting_body,''))='' then raise exception 'Accrediting body is required before evidence can be labelled externally accredited'; end if;
  new.updated_at:=now(); return new;
end;
$$;
drop trigger if exists safeguarding_evidence_provenance_guard on public.safeguarding_evidence;
create trigger safeguarding_evidence_provenance_guard before insert or update on public.safeguarding_evidence for each row execute function private.validate_safeguarding_evidence();
