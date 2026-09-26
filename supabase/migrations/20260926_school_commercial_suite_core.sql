alter table public.organisations
  add column if not exists brand_name text,
  add column if not exists logo_url text,
  add column if not exists accent_color text,
  add column if not exists secondary_color text,
  add column if not exists support_email text;

alter table public.organisations drop constraint if exists organisations_accent_color_check;
alter table public.organisations add constraint organisations_accent_color_check check (accent_color is null or accent_color ~ '^#[0-9A-Fa-f]{6}$');
alter table public.organisations drop constraint if exists organisations_secondary_color_check;
alter table public.organisations add constraint organisations_secondary_color_check check (secondary_color is null or secondary_color ~ '^#[0-9A-Fa-f]{6}$');

create table if not exists public.school_policies (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  title text not null, category text not null default 'School policy', version text not null default '1.0', summary text not null default '',
  document_url text, effective_date date, review_date date, mandatory boolean not null default true, active boolean not null default true,
  created_by uuid not null references auth.users(id) on delete restrict, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (organisation_id,title,version)
);
create table if not exists public.policy_acknowledgements (
  policy_id uuid not null references public.school_policies(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade,
  policy_version text not null, acknowledged_at timestamptz not null default now(), primary key (policy_id,user_id)
);
create table if not exists public.professional_standards (
  code text primary key, framework text not null, title text not null, summary text not null, source_title text not null, source_url text not null,
  sort_order integer not null default 0, active boolean not null default true
);
create table if not exists public.course_standard_links (
  organisation_id uuid not null references public.organisations(id) on delete cascade, course_id text not null,
  standard_code text not null references public.professional_standards(code) on delete cascade, created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(), primary key (organisation_id,course_id,standard_code)
);
create table if not exists public.appraisal_objectives (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, title text not null, description text not null default '', success_criteria text not null default '',
  standard_codes text[] not null default '{}', linked_course_ids text[] not null default '{}', review_date date,
  status text not null default 'active' check (status in ('planned','active','review_due','achieved','closed')),
  shared_with_leadership boolean not null default false, created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.appraisal_evidence (
  id uuid primary key default gen_random_uuid(), objective_id uuid not null references public.appraisal_objectives(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, evidence_type text not null default 'reflection', evidence_reference text,
  note text not null default '', shared_with_leadership boolean not null default false, created_at timestamptz not null default now()
);
create table if not exists public.inset_days (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  site_id uuid references public.school_sites(id) on delete set null, title text not null, inset_date date not null, theme text not null default '',
  status text not null default 'draft' check (status in ('draft','open','closed','completed')),
  created_by uuid not null references auth.users(id) on delete restrict, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.inset_sessions (
  id uuid primary key default gen_random_uuid(), inset_day_id uuid not null references public.inset_days(id) on delete cascade,
  title text not null, description text not null default '', starts_at timestamptz not null, ends_at timestamptz, location text not null default '',
  capacity integer check (capacity is null or capacity > 0), audience text not null default 'All staff', facilitator text not null default '', linked_course_id text,
  live_session_id uuid references public.live_sessions(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.inset_bookings (
  session_id uuid not null references public.inset_sessions(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'booked' check (status in ('booked','cancelled','waitlist')),
  attendance_status text not null default 'not_recorded' check (attendance_status in ('not_recorded','attended','absent','excused')),
  booked_at timestamptz not null default now(), primary key (session_id,user_id)
);
create table if not exists public.cpd_budgets (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  academic_year text not null, name text not null, department text, amount numeric(12,2) not null default 0 check (amount >= 0),
  created_by uuid not null references auth.users(id) on delete restrict, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (organisation_id,academic_year,name)
);
create table if not exists public.cpd_expenses (
  id uuid primary key default gen_random_uuid(), budget_id uuid not null references public.cpd_budgets(id) on delete cascade, title text not null, provider text not null default '',
  training_cost numeric(12,2) not null default 0 check (training_cost >= 0), cover_cost numeric(12,2) not null default 0 check (cover_cost >= 0),
  travel_cost numeric(12,2) not null default 0 check (travel_cost >= 0), other_cost numeric(12,2) not null default 0 check (other_cost >= 0),
  occurred_on date, status text not null default 'planned' check (status in ('planned','approved','spent','cancelled')),
  created_by uuid not null references auth.users(id) on delete restrict, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.onboarding_programmes (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade, title text not null,
  audience_role text not null default 'All staff', description text not null default '', course_ids text[] not null default '{}', mandatory_course_ids text[] not null default '{}',
  checklist text[] not null default '{}', active boolean not null default true, created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (organisation_id,title)
);
create table if not exists public.onboarding_assignments (
  programme_id uuid not null references public.onboarding_programmes(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade,
  checklist_complete text[] not null default '{}', status text not null default 'active' check (status in ('active','completed','paused')),
  assigned_by uuid not null references auth.users(id) on delete restrict, assigned_at timestamptz not null default now(), completed_at timestamptz,
  primary key (programme_id,user_id)
);
create table if not exists public.system_guidance_sources (
  id text primary key, title text not null, publisher text not null, source_url text not null, version_label text not null,
  effective_date date, last_verified_on date not null, next_check_on date, status text not null default 'current' check (status in ('current','review_due','superseded'))
);
create table if not exists public.school_resource_library (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade, title text not null,
  description text not null default '', resource_url text, category text not null default 'CPD resource', linked_course_id text,
  status text not null default 'published' check (status in ('draft','published','archived')), created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

insert into public.professional_standards(code,framework,title,summary,source_title,source_url,sort_order) values
('TS1','Teachers Standards','High expectations','Create a safe, stimulating climate with ambitious expectations for pupils.','Teachers standards','https://www.gov.uk/government/publications/teachers-standards',1),
('TS2','Teachers Standards','Progress and outcomes','Take responsibility for pupil progress, prior attainment and effective learning habits.','Teachers standards','https://www.gov.uk/government/publications/teachers-standards',2),
('TS3','Teachers Standards','Subject and curriculum knowledge','Demonstrate secure subject/curriculum knowledge and address misunderstanding.','Teachers standards','https://www.gov.uk/government/publications/teachers-standards',3),
('TS4','Teachers Standards','Well-structured teaching','Plan and teach coherent learning that uses time and resources effectively.','Teachers standards','https://www.gov.uk/government/publications/teachers-standards',4),
('TS5','Teachers Standards','Adapt teaching','Respond to pupils strengths and needs while maintaining appropriate ambition.','Teachers standards','https://www.gov.uk/government/publications/teachers-standards',5),
('TS6','Teachers Standards','Assessment','Use assessment accurately and productively to support teaching and pupil progress.','Teachers standards','https://www.gov.uk/government/publications/teachers-standards',6),
('TS7','Teachers Standards','Behaviour','Manage behaviour effectively to support a safe and productive learning environment.','Teachers standards','https://www.gov.uk/government/publications/teachers-standards',7),
('TS8','Teachers Standards','Wider professional responsibilities','Contribute professionally beyond individual lessons, including collaboration and development.','Teachers standards','https://www.gov.uk/government/publications/teachers-standards',8),
('TS-P2','Teachers Standards','Personal and professional conduct','Maintain high standards of ethics, behaviour and professional conduct.','Teachers standards','https://www.gov.uk/government/publications/teachers-standards',9),
('CPD1','DfE Professional Development Standard','Focus on pupil outcomes','Professional development should connect clearly to improving and evaluating pupil outcomes.','Standard for teachers professional development','https://www.gov.uk/government/publications/standard-for-teachers-professional-development',101),
('CPD2','DfE Professional Development Standard','Evidence and expertise','Professional development should be informed by robust evidence and relevant expertise.','Standard for teachers professional development','https://www.gov.uk/government/publications/standard-for-teachers-professional-development',102),
('CPD3','DfE Professional Development Standard','Collaboration and challenge','Professional learning should include collaboration and appropriate expert challenge.','Standard for teachers professional development','https://www.gov.uk/government/publications/standard-for-teachers-professional-development',103),
('CPD4','DfE Professional Development Standard','Sustained over time','Professional development should be designed as sustained learning rather than isolated activity.','Standard for teachers professional development','https://www.gov.uk/government/publications/standard-for-teachers-professional-development',104),
('CPD5','DfE Professional Development Standard','Leadership priority','Effective professional development requires active prioritisation and support from school leadership.','Standard for teachers professional development','https://www.gov.uk/government/publications/standard-for-teachers-professional-development',105)
on conflict (code) do update set framework=excluded.framework,title=excluded.title,summary=excluded.summary,source_title=excluded.source_title,source_url=excluded.source_url,sort_order=excluded.sort_order,active=true;

insert into public.system_guidance_sources(id,title,publisher,source_url,version_label,effective_date,last_verified_on,next_check_on,status) values
('kcsie','Keeping children safe in education','Department for Education','https://www.gov.uk/government/publications/keeping-children-safe-in-education--2','KCSIE 2026',date '2026-09-01',date '2026-09-26',date '2026-12-01','current'),
('teachers-standards','Teachers standards','Department for Education','https://www.gov.uk/government/publications/teachers-standards','Current GOV.UK publication',null,date '2026-09-26',date '2027-01-15','current'),
('teacher-cpd-standard','Standard for teachers professional development','Department for Education','https://www.gov.uk/government/publications/standard-for-teachers-professional-development','2016 standard',date '2016-07-12',date '2026-09-26',date '2027-01-15','current')
on conflict (id) do update set title=excluded.title,publisher=excluded.publisher,source_url=excluded.source_url,version_label=excluded.version_label,effective_date=excluded.effective_date,last_verified_on=excluded.last_verified_on,next_check_on=excluded.next_check_on,status=excluded.status;

alter table public.school_policies enable row level security;
alter table public.policy_acknowledgements enable row level security;
alter table public.professional_standards enable row level security;
alter table public.course_standard_links enable row level security;
alter table public.appraisal_objectives enable row level security;
alter table public.appraisal_evidence enable row level security;
alter table public.inset_days enable row level security;
alter table public.inset_sessions enable row level security;
alter table public.inset_bookings enable row level security;
alter table public.cpd_budgets enable row level security;
alter table public.cpd_expenses enable row level security;
alter table public.onboarding_programmes enable row level security;
alter table public.onboarding_assignments enable row level security;
alter table public.system_guidance_sources enable row level security;
alter table public.school_resource_library enable row level security;

grant select,insert,update,delete on public.school_policies to authenticated;
grant select,insert,update on public.policy_acknowledgements to authenticated;
grant select on public.professional_standards to authenticated;
grant select,insert,delete on public.course_standard_links to authenticated;
grant select,insert,update,delete on public.appraisal_objectives to authenticated;
grant select,insert,update,delete on public.appraisal_evidence to authenticated;
grant select,insert,update,delete on public.inset_days to authenticated;
grant select,insert,update,delete on public.inset_sessions to authenticated;
grant select,insert,update,delete on public.inset_bookings to authenticated;
grant select,insert,update,delete on public.cpd_budgets to authenticated;
grant select,insert,update,delete on public.cpd_expenses to authenticated;
grant select,insert,update,delete on public.onboarding_programmes to authenticated;
grant select,insert,update on public.onboarding_assignments to authenticated;
grant select on public.system_guidance_sources to authenticated;
grant select,insert,update,delete on public.school_resource_library to authenticated;

create policy "org members read policies" on public.school_policies for select to authenticated using (organisation_id=private.current_org_id());
create policy "org admins manage policies" on public.school_policies for all to authenticated using (private.is_org_admin(organisation_id)) with check (private.is_org_admin(organisation_id));
create policy "own or admins read policy acknowledgements" on public.policy_acknowledgements for select to authenticated using (user_id=(select auth.uid()) or exists(select 1 from public.school_policies p where p.id=policy_id and private.is_org_admin(p.organisation_id)));
create policy "staff acknowledge own policies" on public.policy_acknowledgements for insert to authenticated with check (user_id=(select auth.uid()) and exists(select 1 from public.school_policies p where p.id=policy_id and p.organisation_id=private.current_org_id() and p.active));
create policy "staff refresh own acknowledgements" on public.policy_acknowledgements for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy "authenticated read professional standards" on public.professional_standards for select to authenticated using (active);
create policy "org members read course standards" on public.course_standard_links for select to authenticated using (organisation_id=private.current_org_id());
create policy "org admins manage course standards" on public.course_standard_links for all to authenticated using (private.is_org_admin(organisation_id)) with check (private.is_org_admin(organisation_id));
create policy "staff read own or shared appraisal" on public.appraisal_objectives for select to authenticated using (user_id=(select auth.uid()) or (shared_with_leadership and private.is_org_admin(organisation_id)));
create policy "staff create own appraisal" on public.appraisal_objectives for insert to authenticated with check (organisation_id=private.current_org_id() and (user_id=(select auth.uid()) or private.is_org_admin(organisation_id)) and created_by=(select auth.uid()));
create policy "staff update own appraisal" on public.appraisal_objectives for update to authenticated using (user_id=(select auth.uid()) or private.is_org_admin(organisation_id)) with check (organisation_id=private.current_org_id());
create policy "staff delete own appraisal" on public.appraisal_objectives for delete to authenticated using (user_id=(select auth.uid()) or private.is_org_admin(organisation_id));
create policy "staff read own or shared appraisal evidence" on public.appraisal_evidence for select to authenticated using (user_id=(select auth.uid()) or (shared_with_leadership and exists(select 1 from public.appraisal_objectives o where o.id=objective_id and private.is_org_admin(o.organisation_id))));
create policy "staff create own appraisal evidence" on public.appraisal_evidence for insert to authenticated with check (user_id=(select auth.uid()) and exists(select 1 from public.appraisal_objectives o where o.id=objective_id and o.user_id=(select auth.uid())));
create policy "staff update own appraisal evidence" on public.appraisal_evidence for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy "staff delete own appraisal evidence" on public.appraisal_evidence for delete to authenticated using (user_id=(select auth.uid()));
create policy "org members read inset days" on public.inset_days for select to authenticated using (organisation_id=private.current_org_id());
create policy "org admins manage inset days" on public.inset_days for all to authenticated using (private.is_org_admin(organisation_id)) with check (private.is_org_admin(organisation_id));
create policy "org members read inset sessions" on public.inset_sessions for select to authenticated using (exists(select 1 from public.inset_days d where d.id=inset_day_id and d.organisation_id=private.current_org_id()));
create policy "org admins manage inset sessions" on public.inset_sessions for all to authenticated using (exists(select 1 from public.inset_days d where d.id=inset_day_id and private.is_org_admin(d.organisation_id))) with check (exists(select 1 from public.inset_days d where d.id=inset_day_id and private.is_org_admin(d.organisation_id)));
create policy "own or admins read inset bookings" on public.inset_bookings for select to authenticated using (user_id=(select auth.uid()) or exists(select 1 from public.inset_sessions s join public.inset_days d on d.id=s.inset_day_id where s.id=session_id and private.is_org_admin(d.organisation_id)));
create policy "staff book own inset sessions" on public.inset_bookings for insert to authenticated with check (user_id=(select auth.uid()) and exists(select 1 from public.inset_sessions s join public.inset_days d on d.id=s.inset_day_id where s.id=session_id and d.organisation_id=private.current_org_id()));
create policy "staff or admins update inset bookings" on public.inset_bookings for update to authenticated using (user_id=(select auth.uid()) or exists(select 1 from public.inset_sessions s join public.inset_days d on d.id=s.inset_day_id where s.id=session_id and private.is_org_admin(d.organisation_id))) with check (user_id=(select auth.uid()) or exists(select 1 from public.inset_sessions s join public.inset_days d on d.id=s.inset_day_id where s.id=session_id and private.is_org_admin(d.organisation_id)));
create policy "staff cancel own inset bookings" on public.inset_bookings for delete to authenticated using (user_id=(select auth.uid()));
create policy "org admins manage budgets" on public.cpd_budgets for all to authenticated using (private.is_org_admin(organisation_id)) with check (private.is_org_admin(organisation_id));
create policy "org admins manage expenses" on public.cpd_expenses for all to authenticated using (exists(select 1 from public.cpd_budgets b where b.id=budget_id and private.is_org_admin(b.organisation_id))) with check (exists(select 1 from public.cpd_budgets b where b.id=budget_id and private.is_org_admin(b.organisation_id)));
create policy "org members read onboarding programmes" on public.onboarding_programmes for select to authenticated using (organisation_id=private.current_org_id() and active);
create policy "org admins manage onboarding programmes" on public.onboarding_programmes for all to authenticated using (private.is_org_admin(organisation_id)) with check (private.is_org_admin(organisation_id));
create policy "own or admins read onboarding assignments" on public.onboarding_assignments for select to authenticated using (user_id=(select auth.uid()) or exists(select 1 from public.onboarding_programmes p where p.id=programme_id and private.is_org_admin(p.organisation_id)));
create policy "org admins assign onboarding" on public.onboarding_assignments for insert to authenticated with check (exists(select 1 from public.onboarding_programmes p where p.id=programme_id and private.is_org_admin(p.organisation_id)) and assigned_by=(select auth.uid()));
create policy "staff or admins update onboarding" on public.onboarding_assignments for update to authenticated using (user_id=(select auth.uid()) or exists(select 1 from public.onboarding_programmes p where p.id=programme_id and private.is_org_admin(p.organisation_id))) with check (user_id=(select auth.uid()) or exists(select 1 from public.onboarding_programmes p where p.id=programme_id and private.is_org_admin(p.organisation_id)));
create policy "authenticated read system guidance" on public.system_guidance_sources for select to authenticated using (true);
create policy "org members read resources" on public.school_resource_library for select to authenticated using ((organisation_id=private.current_org_id() and status='published') or private.is_org_admin(organisation_id));
create policy "org admins manage resources" on public.school_resource_library for all to authenticated using (private.is_org_admin(organisation_id)) with check (private.is_org_admin(organisation_id));

create index if not exists school_policies_org_active_idx on public.school_policies(organisation_id,active);
create index if not exists policy_ack_user_idx on public.policy_acknowledgements(user_id);
create index if not exists appraisal_objectives_org_user_idx on public.appraisal_objectives(organisation_id,user_id,status);
create index if not exists appraisal_evidence_objective_idx on public.appraisal_evidence(objective_id);
create index if not exists appraisal_evidence_user_idx on public.appraisal_evidence(user_id);
create index if not exists inset_days_org_date_idx on public.inset_days(organisation_id,inset_date);
create index if not exists inset_sessions_day_start_idx on public.inset_sessions(inset_day_id,starts_at);
create index if not exists inset_bookings_user_idx on public.inset_bookings(user_id);
create index if not exists cpd_budgets_org_year_idx on public.cpd_budgets(organisation_id,academic_year);
create index if not exists cpd_expenses_budget_idx on public.cpd_expenses(budget_id);
create index if not exists onboarding_programmes_org_idx on public.onboarding_programmes(organisation_id,active);
create index if not exists onboarding_assignments_user_idx on public.onboarding_assignments(user_id);
create index if not exists school_resource_library_org_idx on public.school_resource_library(organisation_id,status);

create or replace function private.seed_default_onboarding_programmes(p_org uuid, p_creator uuid)
returns void language plpgsql security definer set search_path=''
as $$
begin
  insert into public.onboarding_programmes(organisation_id,title,audience_role,description,course_ids,mandatory_course_ids,checklist,created_by)
  values
    (p_org,'New staff induction','All staff','A structured introduction to core school CPD expectations and professional systems.',array['staff-induction','professional-boundaries','gdpr-data-protection-schools','cybersecurity-schools'],array['staff-induction','professional-boundaries'],array['Read key school policies','Confirm safeguarding reporting route','Meet line manager / mentor','Complete required mandatory training','Review role-specific CPD pathway'],p_creator),
    (p_org,'ECT development pathway','ECT','A guided professional-learning pathway with classroom practice, mentor discussion and review.',array['rosenshine-principles','effective-questioning','behaviour-management','send-inclusive-practice','metacognition-self-regulation'],array['staff-induction'],array['Agree mentor meeting cycle','Choose first classroom implementation target','Review diagnostic results','Collect proportionate evidence of practice','Complete termly impact reflection'],p_creator),
    (p_org,'Teaching assistant development pathway','Teaching assistant','A role-specific pathway focused on inclusive support, communication and pupil independence.',array['send-inclusive-practice','speech-language-communication','sensory-needs-classroom','professional-boundaries'],array['professional-boundaries'],array['Clarify classroom support expectations','Agree communication routine with class teachers','Identify strategies that build independence','Review SEND/pastoral procedures relevant to role'],p_creator)
  on conflict (organisation_id,title) do nothing;
end;
$$;
revoke all on function private.seed_default_onboarding_programmes(uuid,uuid) from public,anon,authenticated;
