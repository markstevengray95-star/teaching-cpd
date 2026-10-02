-- Reviewed rollout SQL, NOT an automatically generated migration.
-- Generate a migration with `supabase migration new sen_department_workspace`,
-- copy this SQL into it, and apply ONLY to the confirmed Teaching CPD project.
-- No school is enabled by this script. Activation requires an approved access/
-- retention/privacy review; do not insert identifiable pupils during testing.
begin;
create schema if not exists private;
create table if not exists private.sen_workspace_schools (
 organization_id uuid primary key references public.school_organizations(id) on delete restrict,
 enabled boolean not null default false,
 approved_at timestamptz,
 check (not enabled or approved_at is not null)
);
revoke all on private.sen_workspace_schools from public, anon, authenticated;

-- Intentionally no administrator/platform/legacy role or creator override.
-- Both a real school membership and a canonical SEND/EAL or SLT assignment
-- are required, including for the organisation owner.
create or replace function private.sen_can_access(org_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select (select auth.uid()) is not null
 and exists (select 1 from private.sen_workspace_schools s where s.organization_id=org_id and s.enabled)
 and exists (select 1 from public.staff_development_role_assignments r
   where r.organization_id=org_id and r.user_id=(select auth.uid()) and r.role in ('send-eal','slt'))
 and (exists (select 1 from public.school_organization_members m where m.organization_id=org_id and m.user_id=(select auth.uid()))
   or exists (select 1 from public.school_organizations o where o.id=org_id and o.owner_user_id=(select auth.uid())));
$$;
revoke all on function private.sen_can_access(uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.sen_can_access(uuid) to authenticated;
create or replace function public.sen_workspace_access(org_id uuid) returns boolean
language sql stable security invoker set search_path = '' as $$ select private.sen_can_access(org_id); $$;
revoke all on function public.sen_workspace_access(uuid) from public, anon;
grant execute on function public.sen_workspace_access(uuid) to authenticated;

create or replace function private.sen_valid_date(value text) returns boolean
language plpgsql immutable set search_path = '' as $$
begin
 if value='' then return true; end if;
 return value ~ '^\d{4}-\d{2}-\d{2}$' and to_char(value::date,'YYYY-MM-DD')=value;
exception when others then return false;
end; $$;
create or replace function private.sen_valid_body(b jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
declare k text; item jsonb; i jsonb; s jsonb; v jsonb; scores jsonb; field text;
begin
 if jsonb_typeof(b) is distinct from 'object' or b->>'schemaVersion' is distinct from '1' or octet_length(b::text)>200000 then return false; end if;
 foreach k in array array['reference','name','year','className','status','strengths','languages','dob','arrival'] loop
  if jsonb_typeof(b->k) is distinct from 'string' or length(b->>k)>5000 then return false; end if;
 end loop;
 if length(trim(b->>'reference'))=0 or length(trim(b->>'name'))=0 or length(b->>'reference')>250 or length(b->>'name')>250
 or b->>'status' not in ('Referral','Monitoring','SEN support','EHCP','No SEN identified') then return false; end if;
 if not private.sen_valid_date(b->>'dob') or not private.sen_valid_date(b->>'arrival') then return false; end if;
 if jsonb_typeof(b->'needs') is distinct from 'array' then return false; end if;
 for item in select value from jsonb_array_elements(b->'needs') loop
  if item #>> '{}' not in ('Communication and interaction','Cognition and learning','Social, emotional and mental health','Sensory and physical') then return false; end if;
 end loop;
 if jsonb_typeof(b->'plan') is distinct from 'object' then return false; end if;
 foreach k in array array['baseline','outcome','measure','adjustments','provision','owner','reviewDate','pupilVoice','familyVoice','transition','externalAdvice','ehcpReviewDate'] loop
  if jsonb_typeof(b->'plan'->k) is distinct from 'string' or length(b->'plan'->>k)>5000 then return false; end if;
 end loop;
 if not private.sen_valid_date(b->'plan'->>'reviewDate') or not private.sen_valid_date(b->'plan'->>'ehcpReviewDate') then return false; end if;
 foreach k in array array['interventions','reviews','assessments','reading','checkIns','contacts'] loop
  if jsonb_typeof(b->k) is distinct from 'array' or jsonb_array_length(b->k)>500 then return false; end if;
  for item in select value from jsonb_array_elements(b->k) loop
   if jsonb_typeof(item) is distinct from 'object' or jsonb_typeof(item->'id') is distinct from 'string' or length(item->>'id') not between 1 and 100 then return false; end if;
   if k<>'interventions' and (coalesce(item->>'date','')='' or not private.sen_valid_date(item->>'date')) then return false; end if;
   foreach field in array case k
     when 'interventions' then array['title','owner','baseline','goal','measure','strategy','frequency','startDate','reviewDate','status']
     when 'reviews' then array['attendees','evidence','pupilVoice','familyVoice','decision','actions','nextDate']
     when 'assessments' then array['assessor','task','band','confidence','evidence','adjustments','nextSteps']
     when 'reading' then array['tool','notes']
     when 'checkIns' then array['before','after','signals','strategy','nextStep']
     else array['type','participants','summary','actions'] end loop
    if jsonb_typeof(item->field) is distinct from 'string' or length(item->>field)>5000 then return false; end if;
   end loop;
   if k='reading' and (length(trim(item->>'tool'))=0 or jsonb_typeof(item->'ageMonths') is distinct from 'number' or (item->>'ageMonths')::numeric not between 12 and 300 or (item->>'ageMonths')::numeric<>trunc((item->>'ageMonths')::numeric)) then return false; end if;
   if k='reviews' and (length(trim(item->>'evidence'))=0 or length(trim(item->>'actions'))=0 or not private.sen_valid_date(item->>'nextDate')) then return false; end if;
   if k='contacts' and length(trim(item->>'summary'))=0 then return false; end if;
   if k='checkIns' and (jsonb_typeof(item->'usefulness') is distinct from 'number' or item->>'usefulness' not in ('0','1','2','3','4') or length(trim(item->>'nextStep'))=0) then return false; end if;
   if k='assessments' then
    if item->>'band' not in ('A','B','C','D','E') or length(trim(item->>'assessor'))=0 or length(trim(item->>'evidence'))=0 or jsonb_typeof(item->'scores') is distinct from 'object' then return false; end if;
    scores=item->'scores';
    if (select count(*) from jsonb_object_keys(scores))<>4 then return false; end if;
    foreach field in array array['listening','speaking','reading','writing'] loop
     if jsonb_typeof(scores->field) is distinct from 'array' or jsonb_array_length(scores->field)<>5 then return false; end if;
     for v in select value from jsonb_array_elements(scores->field) loop
      if v<>'null'::jsonb and (jsonb_typeof(v)<>'number' or v #>> '{}' not in ('1','2','3','4','5')) then return false; end if;
     end loop;
    end loop;
    if not exists (select 1 from jsonb_each(scores) x cross join lateral jsonb_array_elements(x.value) y where y.value<>'null'::jsonb) then return false; end if;
   end if;
   if k='interventions' then
    i=item;
    if length(trim(i->>'title'))=0 or length(trim(i->>'owner'))=0 or length(trim(i->>'goal'))=0 or i->>'status' not in ('Active','Adjust','Fade','Closed') or not private.sen_valid_date(i->>'startDate') or not private.sen_valid_date(i->>'reviewDate') then return false; end if;
    foreach field in array array['minutes','weeklySessions','hourlyCost'] loop if jsonb_typeof(i->field) is distinct from 'number' then return false; end if; end loop;
    if (i->>'minutes')::numeric not between 0 and 480 or (i->>'weeklySessions')::numeric not between 0 and 35 or (i->>'hourlyCost')::numeric not between 0 and 1000 or (i->>'startDate'<>'' and i->>'reviewDate'<>'' and i->>'reviewDate'<i->>'startDate') then return false; end if;
    if jsonb_typeof(i->'sessions') is distinct from 'array' or jsonb_array_length(i->'sessions')>500 then return false; end if;
    for s in select value from jsonb_array_elements(i->'sessions') loop
     if coalesce(s->>'date','')='' or not private.sen_valid_date(s->>'date') or jsonb_typeof(s->'evidence') is distinct from 'string' or length(trim(s->>'evidence'))=0 or length(s->>'evidence')>5000
      or jsonb_typeof(s->'minutes') is distinct from 'number' or (s->>'minutes')::numeric not between 0 and 480
      or jsonb_typeof(s->'outcome') is distinct from 'number' or s->>'outcome' not in ('0','1','2','3','4')
      or jsonb_typeof(s->'fidelity') is distinct from 'number' or (s->>'fidelity')::numeric not between 0 and 100
      or not (s ? 'usefulness') or (s->'usefulness'<>'null'::jsonb and (jsonb_typeof(s->'usefulness')<>'number' or s->>'usefulness' not in ('0','1','2','3','4'))) then return false; end if;
    end loop;
   end if;
  end loop;
 end loop;
 return true;
exception when others then return false;
end; $$;
revoke all on function private.sen_valid_date(text), private.sen_valid_body(jsonb) from public, anon, authenticated;

create table public.sen_department_cases (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.school_organizations(id) on delete restrict,
 body jsonb not null,
 version integer not null default 1,
 archived_at timestamptz,
 created_by uuid not null references auth.users(id) on delete restrict,
 updated_by uuid not null references auth.users(id) on delete restrict,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index sen_cases_org_id_idx on public.sen_department_cases(organization_id,id);
create index sen_cases_creator_idx on public.sen_department_cases(created_by);
create index sen_cases_updater_idx on public.sen_department_cases(updated_by);
create unique index sen_cases_active_reference_idx on public.sen_department_cases(organization_id,lower(trim(body->>'reference'))) where archived_at is null;
create table public.sen_department_audit (
 id bigint generated always as identity primary key,
 organization_id uuid not null references public.school_organizations(id) on delete restrict,
 case_id uuid not null references public.sen_department_cases(id) on delete restrict,
 actor_id uuid not null references auth.users(id) on delete restrict,
 event text not null check(event in ('created','updated','archived','restored')),
 record_version integer not null,
 occurred_at timestamptz not null default now()
);
create index sen_audit_org_time_idx on public.sen_department_audit(organization_id,occurred_at desc);
create index sen_audit_case_idx on public.sen_department_audit(case_id);
create index sen_audit_actor_idx on public.sen_department_audit(actor_id);
alter table public.sen_department_cases enable row level security;
alter table public.sen_department_audit enable row level security;
create policy sen_cases_read on public.sen_department_cases for select to authenticated using(private.sen_can_access(organization_id));
create policy sen_cases_insert on public.sen_department_cases for insert to authenticated with check(private.sen_can_access(organization_id));
create policy sen_cases_update on public.sen_department_cases for update to authenticated using(private.sen_can_access(organization_id)) with check(private.sen_can_access(organization_id));
create policy sen_audit_read on public.sen_department_audit for select to authenticated using(private.sen_can_access(organization_id));
revoke all on public.sen_department_cases, public.sen_department_audit from public,anon,authenticated;
grant select,insert,update on public.sen_department_cases to authenticated;
grant select on public.sen_department_audit to authenticated;

create or replace function private.sen_case_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 if not private.sen_can_access(new.organization_id) then raise exception 'SEN access denied'; end if;
 if not private.sen_valid_body(new.body) then raise exception 'Invalid SEN record'; end if;
 if tg_op='UPDATE' then
  if new.organization_id<>old.organization_id or new.id<>old.id then raise exception 'Record identity and school are immutable'; end if;
  if old.archived_at is not null and new.body is distinct from old.body then raise exception 'Restore archived record before editing'; end if;
  new.created_by=old.created_by;new.created_at=old.created_at;new.version=old.version+1;
 else new.created_by=auth.uid();new.created_at=now();new.version=1;
 end if;
 new.updated_by=auth.uid();new.updated_at=now();return new;
end; $$;
create or replace function private.sen_case_audit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 if not private.sen_can_access(new.organization_id) then raise exception 'SEN audit access denied'; end if;
 insert into public.sen_department_audit(organization_id,case_id,actor_id,event,record_version)
 values(new.organization_id,new.id,auth.uid(),case when tg_op='INSERT' then 'created' when old.archived_at is null and new.archived_at is not null then 'archived' when old.archived_at is not null and new.archived_at is null then 'restored' else 'updated' end,new.version);
 return new;
end; $$;
revoke all on function private.sen_case_guard(), private.sen_case_audit() from public,anon,authenticated;
create trigger sen_case_guard before insert or update on public.sen_department_cases for each row execute function private.sen_case_guard();
create trigger sen_case_audit after insert or update on public.sen_department_cases for each row execute function private.sen_case_audit();
comment on table public.sen_department_cases is 'Restricted school SEN workspace. No browser persistence, automatic diagnosis or safeguarding casework.';
comment on table public.sen_department_audit is 'Append-only mutation metadata. No pupil names, record bodies or safeguarding narratives.';
commit;
