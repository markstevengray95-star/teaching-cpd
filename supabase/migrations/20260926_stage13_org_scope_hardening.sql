-- Organisation scoping, membership/profile consistency and QA audit hardening.
create or replace function private.sync_membership_profile() returns trigger language plpgsql security definer set search_path='' as $$begin if new.active then update public.staff_profiles set organisation_id=new.organisation_id,site_id=new.site_id,updated_at=now() where id=new.user_id;end if;return new;end;$$;
drop trigger if exists sync_membership_profile on public.organisation_memberships;
create trigger sync_membership_profile after insert or update of site_id,active on public.organisation_memberships for each row execute function private.sync_membership_profile();

create or replace function private.protect_staff_profile_scope() returns trigger language plpgsql security definer set search_path='' as $$begin
 if (select auth.uid())=old.id then
  if new.role is distinct from old.role then raise exception 'Role cannot be changed from the staff profile';end if;
  if (new.organisation_id is distinct from old.organisation_id or new.site_id is distinct from old.site_id) and new.organisation_id is not null and not exists(select 1 from public.organisation_memberships m where m.user_id=old.id and m.organisation_id=new.organisation_id and m.active and (new.site_id is null or m.site_id=new.site_id)) then raise exception 'Organisation and site must match an active membership';end if;
 end if;return new;end;$$;
drop trigger if exists protect_staff_profile_scope on public.staff_profiles;
create trigger protect_staff_profile_scope before update on public.staff_profiles for each row execute function private.protect_staff_profile_scope();

drop policy if exists "members view own org memberships" on public.organisation_memberships;
create policy "members view own or org admin memberships" on public.organisation_memberships for select to authenticated using(user_id=(select auth.uid()) or private.is_org_admin(organisation_id));

-- Existing cross-staff tables become organisation scoped.
drop policy if exists "profiles select own or cpd admin" on public.staff_profiles;
drop policy if exists "profiles select own or org cpd admin" on public.staff_profiles;
create policy "profiles select own or org cpd admin" on public.staff_profiles for select to authenticated using(id=(select auth.uid()) or (private.is_cpd_admin() and organisation_id is not null and organisation_id=private.current_org_id()));

drop policy if exists "staff view own assignments" on public.cpd_assignments;drop policy if exists "staff view own or org assignments" on public.cpd_assignments;
create policy "staff view own or org assignments" on public.cpd_assignments for select to authenticated using(assigned_to=(select auth.uid()) or (private.is_cpd_admin() and organisation_id=private.current_org_id()));
drop policy if exists "cpd admins insert assignments" on public.cpd_assignments;drop policy if exists "org cpd admins insert assignments" on public.cpd_assignments;
create policy "org cpd admins insert assignments" on public.cpd_assignments for insert to authenticated with check(private.is_cpd_admin() and assigned_by=(select auth.uid()) and organisation_id=private.current_org_id());
drop policy if exists "cpd admins update assignments" on public.cpd_assignments;drop policy if exists "org cpd admins update assignments" on public.cpd_assignments;
create policy "org cpd admins update assignments" on public.cpd_assignments for update to authenticated using(private.is_cpd_admin() and organisation_id=private.current_org_id()) with check(private.is_cpd_admin() and organisation_id=private.current_org_id());
drop policy if exists "cpd admins delete assignments" on public.cpd_assignments;drop policy if exists "org cpd admins delete assignments" on public.cpd_assignments;
create policy "org cpd admins delete assignments" on public.cpd_assignments for delete to authenticated using(private.is_cpd_admin() and organisation_id=private.current_org_id());

drop policy if exists "staff view active requirements" on public.training_requirements;drop policy if exists "staff view org active requirements" on public.training_requirements;
create policy "staff view org active requirements" on public.training_requirements for select to authenticated using(organisation_id=private.current_org_id() and (active or private.is_cpd_admin()));
drop policy if exists "cpd admins insert requirements" on public.training_requirements;drop policy if exists "org cpd admins insert requirements" on public.training_requirements;
create policy "org cpd admins insert requirements" on public.training_requirements for insert to authenticated with check(private.is_cpd_admin() and created_by=(select auth.uid()) and organisation_id=private.current_org_id());
drop policy if exists "cpd admins update requirements" on public.training_requirements;drop policy if exists "org cpd admins update requirements" on public.training_requirements;
create policy "org cpd admins update requirements" on public.training_requirements for update to authenticated using(private.is_cpd_admin() and organisation_id=private.current_org_id()) with check(private.is_cpd_admin() and organisation_id=private.current_org_id());
drop policy if exists "cpd admins delete requirements" on public.training_requirements;drop policy if exists "org cpd admins delete requirements" on public.training_requirements;
create policy "org cpd admins delete requirements" on public.training_requirements for delete to authenticated using(private.is_cpd_admin() and organisation_id=private.current_org_id());

drop policy if exists "authenticated view cpd calendar" on public.cpd_calendar_events;drop policy if exists "members view org cpd calendar" on public.cpd_calendar_events;
create policy "members view org cpd calendar" on public.cpd_calendar_events for select to authenticated using(organisation_id=private.current_org_id());
drop policy if exists "cpd admins insert calendar" on public.cpd_calendar_events;drop policy if exists "org cpd admins insert calendar" on public.cpd_calendar_events;
create policy "org cpd admins insert calendar" on public.cpd_calendar_events for insert to authenticated with check(private.is_cpd_admin() and created_by=(select auth.uid()) and organisation_id=private.current_org_id());
drop policy if exists "cpd admins update calendar" on public.cpd_calendar_events;drop policy if exists "org cpd admins update calendar" on public.cpd_calendar_events;
create policy "org cpd admins update calendar" on public.cpd_calendar_events for update to authenticated using(private.is_cpd_admin() and organisation_id=private.current_org_id()) with check(private.is_cpd_admin() and organisation_id=private.current_org_id());
drop policy if exists "cpd admins delete calendar" on public.cpd_calendar_events;drop policy if exists "org cpd admins delete calendar" on public.cpd_calendar_events;
create policy "org cpd admins delete calendar" on public.cpd_calendar_events for delete to authenticated using(private.is_cpd_admin() and organisation_id=private.current_org_id());

-- Custom course catalogue cannot leak across organisations.
drop policy if exists "staff view published custom courses" on public.custom_courses;drop policy if exists "staff view org published custom courses" on public.custom_courses;
create policy "staff view org published custom courses" on public.custom_courses for select to authenticated using(organisation_id=private.current_org_id() and (status='published' or private.is_cpd_admin()));
drop policy if exists "cpd admins insert custom courses" on public.custom_courses;drop policy if exists "org admins insert custom courses" on public.custom_courses;
create policy "org admins insert custom courses" on public.custom_courses for insert to authenticated with check(private.is_cpd_admin() and created_by=(select auth.uid()) and organisation_id=private.current_org_id());
drop policy if exists "cpd admins update custom courses" on public.custom_courses;drop policy if exists "org admins update custom courses" on public.custom_courses;
create policy "org admins update custom courses" on public.custom_courses for update to authenticated using(private.is_cpd_admin() and organisation_id=private.current_org_id()) with check(private.is_cpd_admin() and organisation_id=private.current_org_id());
drop policy if exists "cpd admins delete custom courses" on public.custom_courses;drop policy if exists "org admins delete custom courses" on public.custom_courses;
create policy "org admins delete custom courses" on public.custom_courses for delete to authenticated using(private.is_cpd_admin() and organisation_id=private.current_org_id());

drop policy if exists "staff view published course versions" on public.custom_course_versions;drop policy if exists "staff view org published course versions" on public.custom_course_versions;
create policy "staff view org published course versions" on public.custom_course_versions for select to authenticated using(exists(select 1 from public.custom_courses c where c.id=course_id and c.organisation_id=private.current_org_id() and (status='published' or private.is_cpd_admin())));
drop policy if exists "cpd admins insert course versions" on public.custom_course_versions;drop policy if exists "org admins insert course versions" on public.custom_course_versions;
create policy "org admins insert course versions" on public.custom_course_versions for insert to authenticated with check(created_by=(select auth.uid()) and exists(select 1 from public.custom_courses c where c.id=course_id and c.organisation_id=private.current_org_id() and private.is_cpd_admin()));
drop policy if exists "cpd admins update course versions" on public.custom_course_versions;drop policy if exists "org admins update course versions" on public.custom_course_versions;
create policy "org admins update course versions" on public.custom_course_versions for update to authenticated using(exists(select 1 from public.custom_courses c where c.id=course_id and c.organisation_id=private.current_org_id() and private.is_cpd_admin())) with check(exists(select 1 from public.custom_courses c where c.id=course_id and c.organisation_id=private.current_org_id() and private.is_cpd_admin()));
drop policy if exists "cpd admins delete course versions" on public.custom_course_versions;drop policy if exists "org admins delete course versions" on public.custom_course_versions;
create policy "org admins delete course versions" on public.custom_course_versions for delete to authenticated using(exists(select 1 from public.custom_courses c where c.id=course_id and c.organisation_id=private.current_org_id() and private.is_cpd_admin()));

drop policy if exists "staff view blocks for published versions" on public.custom_course_blocks;drop policy if exists "staff view org published blocks" on public.custom_course_blocks;
create policy "staff view org published blocks" on public.custom_course_blocks for select to authenticated using(exists(select 1 from public.custom_course_versions v join public.custom_courses c on c.id=v.course_id where v.id=version_id and c.organisation_id=private.current_org_id() and (v.status='published' or private.is_cpd_admin())));
drop policy if exists "cpd admins insert course blocks" on public.custom_course_blocks;drop policy if exists "org admins insert course blocks" on public.custom_course_blocks;
create policy "org admins insert course blocks" on public.custom_course_blocks for insert to authenticated with check(exists(select 1 from public.custom_course_versions v join public.custom_courses c on c.id=v.course_id where v.id=version_id and c.organisation_id=private.current_org_id() and private.is_cpd_admin()));
drop policy if exists "cpd admins update course blocks" on public.custom_course_blocks;drop policy if exists "org admins update course blocks" on public.custom_course_blocks;
create policy "org admins update course blocks" on public.custom_course_blocks for update to authenticated using(exists(select 1 from public.custom_course_versions v join public.custom_courses c on c.id=v.course_id where v.id=version_id and c.organisation_id=private.current_org_id() and private.is_cpd_admin())) with check(exists(select 1 from public.custom_course_versions v join public.custom_courses c on c.id=v.course_id where v.id=version_id and c.organisation_id=private.current_org_id() and private.is_cpd_admin()));
drop policy if exists "cpd admins delete course blocks" on public.custom_course_blocks;drop policy if exists "org admins delete course blocks" on public.custom_course_blocks;
create policy "org admins delete course blocks" on public.custom_course_blocks for delete to authenticated using(exists(select 1 from public.custom_course_versions v join public.custom_courses c on c.id=v.course_id where v.id=version_id and c.organisation_id=private.current_org_id() and private.is_cpd_admin()));

-- Training records are cross-staff only inside the admin's organisation.
drop policy if exists "staff view own training records" on public.training_records;drop policy if exists "staff view own or org training records" on public.training_records;
create policy "staff view own or org training records" on public.training_records for select to authenticated using(user_id=(select auth.uid()) or exists(select 1 from public.training_requirements r where r.id=requirement_id and r.organisation_id=private.current_org_id() and private.is_cpd_admin()));
drop policy if exists "cpd admins insert training records" on public.training_records;drop policy if exists "org admins insert training records" on public.training_records;
create policy "org admins insert training records" on public.training_records for insert to authenticated with check(exists(select 1 from public.training_requirements r where r.id=requirement_id and r.organisation_id=private.current_org_id() and private.is_cpd_admin()) and exists(select 1 from public.staff_profiles sp where sp.id=user_id and sp.organisation_id=private.current_org_id()));
drop policy if exists "cpd admins update training records" on public.training_records;drop policy if exists "org admins update training records" on public.training_records;
create policy "org admins update training records" on public.training_records for update to authenticated using(exists(select 1 from public.training_requirements r where r.id=requirement_id and r.organisation_id=private.current_org_id() and private.is_cpd_admin())) with check(exists(select 1 from public.training_requirements r where r.id=requirement_id and r.organisation_id=private.current_org_id() and private.is_cpd_admin()));
drop policy if exists "cpd admins delete training records" on public.training_records;drop policy if exists "org admins delete training records" on public.training_records;
create policy "org admins delete training records" on public.training_records for delete to authenticated using(exists(select 1 from public.training_requirements r where r.id=requirement_id and r.organisation_id=private.current_org_id() and private.is_cpd_admin()));

create or replace function private.audit_cpd_change() returns trigger language plpgsql security definer set search_path='' as $$
declare v_org uuid;v_id text;v_summary jsonb;v_row jsonb;v_plan uuid;begin
 v_row:=case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end;v_id:=coalesce(v_row->>'id','');v_summary:=jsonb_build_object('title',coalesce(v_row->>'title',''));
 if nullif(v_row->>'organisation_id','') is not null then v_org:=(v_row->>'organisation_id')::uuid;
 elsif tg_table_name='annual_cpd_actions' and nullif(v_row->>'plan_id','') is not null then v_plan:=(v_row->>'plan_id')::uuid;select organisation_id into v_org from public.annual_cpd_plans where id=v_plan;
 else v_org:=private.current_org_id();end if;
 insert into public.cpd_audit_log(organisation_id,actor_id,entity_type,entity_id,action,summary) values(v_org,auth.uid(),tg_table_name,v_id,lower(tg_op),v_summary);
 return case when tg_op='DELETE' then old else new end;end;$$;

drop trigger if exists audit_annual_plans on public.annual_cpd_plans;create trigger audit_annual_plans after insert or update or delete on public.annual_cpd_plans for each row execute function private.audit_cpd_change();
drop trigger if exists audit_annual_actions on public.annual_cpd_actions;create trigger audit_annual_actions after insert or update or delete on public.annual_cpd_actions for each row execute function private.audit_cpd_change();
drop trigger if exists audit_quality_reviews on public.course_quality_reviews;create trigger audit_quality_reviews after insert or update or delete on public.course_quality_reviews for each row execute function private.audit_cpd_change();
drop trigger if exists audit_training_requirements on public.training_requirements;create trigger audit_training_requirements after insert or update or delete on public.training_requirements for each row execute function private.audit_cpd_change();
drop trigger if exists audit_custom_courses on public.custom_courses;create trigger audit_custom_courses after insert or update or delete on public.custom_courses for each row execute function private.audit_cpd_change();
drop trigger if exists audit_assignments on public.cpd_assignments;create trigger audit_assignments after insert or update or delete on public.cpd_assignments for each row execute function private.audit_cpd_change();
drop trigger if exists audit_calendar on public.cpd_calendar_events;create trigger audit_calendar after insert or update or delete on public.cpd_calendar_events for each row execute function private.audit_cpd_change();
