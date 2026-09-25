create index if not exists cpd_assignments_assigned_by_idx on public.cpd_assignments(assigned_by);
create index if not exists cpd_calendar_events_created_by_idx on public.cpd_calendar_events(created_by);
create index if not exists custom_course_versions_created_by_idx on public.custom_course_versions(created_by);
create index if not exists custom_courses_created_by_idx on public.custom_courses(created_by);
create index if not exists custom_courses_current_version_idx on public.custom_courses(current_version_id);
create index if not exists training_records_requirement_idx on public.training_records(requirement_id);
create index if not exists training_records_verified_by_idx on public.training_records(verified_by);
create index if not exists training_requirements_created_by_idx on public.training_requirements(created_by);

drop policy if exists "cpd admins can view staff directory" on public.staff_profiles;
drop policy if exists profiles_select_own on public.staff_profiles;
create policy "profiles select own or cpd admin"
on public.staff_profiles for select
to authenticated
using ((select auth.uid()) = id or (select private.is_cpd_admin()));
