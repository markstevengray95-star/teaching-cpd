alter table public.onboarding_assignments alter column assigned_by drop not null;

create or replace function private.seed_default_onboarding_programmes(p_org uuid, p_creator uuid)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare v_new_staff_program uuid;
begin
  insert into public.onboarding_programmes(organisation_id,title,audience_role,description,course_ids,mandatory_course_ids,checklist,created_by)
  values
    (p_org,'New staff induction','All staff','A structured introduction to core school CPD expectations and professional systems.',array['staff-induction','professional-boundaries','gdpr-data-protection-schools','cybersecurity-schools'],array['staff-induction','professional-boundaries'],array['Read key school policies','Confirm safeguarding reporting route','Meet line manager / mentor','Complete required mandatory training','Review role-specific CPD pathway'],p_creator),
    (p_org,'ECT development pathway','ECT','A guided professional-learning pathway with classroom practice, mentor discussion and review.',array['rosenshine-principles','effective-questioning','behaviour-management','send-inclusive-practice','metacognition-self-regulation'],array['staff-induction'],array['Agree mentor meeting cycle','Choose first classroom implementation target','Review diagnostic results','Collect proportionate evidence of practice','Complete termly impact reflection'],p_creator),
    (p_org,'Teaching assistant development pathway','Teaching assistant','A role-specific pathway focused on inclusive support, communication and pupil independence.',array['send-inclusive-practice','speech-language-communication','sensory-needs-classroom','professional-boundaries'],array['professional-boundaries'],array['Clarify classroom support expectations','Agree communication routine with class teachers','Identify strategies that build independence','Review SEND/pastoral procedures relevant to role'],p_creator)
  on conflict (organisation_id,title) do nothing;

  insert into public.school_policies(organisation_id,title,category,version,summary,document_url,effective_date,review_date,mandatory,active,created_by)
  values(p_org,'Keeping Children Safe in Education 2026 – Part One','Safeguarding','2026','All staff should read the current KCSIE Part One in full and follow the school or college safeguarding policies and procedures.','https://www.gov.uk/government/publications/keeping-children-safe-in-education--2',date '2026-09-01',date '2027-07-01',true,true,p_creator)
  on conflict (organisation_id,title,version) do nothing;

  select id into v_new_staff_program from public.onboarding_programmes where organisation_id=p_org and title='New staff induction' limit 1;
  if v_new_staff_program is not null then
    insert into public.onboarding_assignments(programme_id,user_id,assigned_by,status)
    select v_new_staff_program,m.user_id,null,'active'
    from public.organisation_memberships m
    where m.organisation_id=p_org and m.active
    on conflict (programme_id,user_id) do nothing;
  end if;
end;
$$;

create or replace function private.assign_default_onboarding_from_membership()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare v_program uuid;
begin
  if new.active then
    select id into v_program from public.onboarding_programmes where organisation_id=new.organisation_id and title='New staff induction' and active limit 1;
    if v_program is not null then
      insert into public.onboarding_assignments(programme_id,user_id,assigned_by,status)
      values(v_program,new.user_id,null,'active')
      on conflict (programme_id,user_id) do nothing;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.assign_default_onboarding_from_membership() from public,anon,authenticated;

drop trigger if exists organisation_membership_default_onboarding on public.organisation_memberships;
create trigger organisation_membership_default_onboarding
after insert or update of active on public.organisation_memberships
for each row execute function private.assign_default_onboarding_from_membership();
