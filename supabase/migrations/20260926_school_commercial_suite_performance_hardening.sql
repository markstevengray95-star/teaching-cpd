create index if not exists appraisal_objectives_created_by_idx on public.appraisal_objectives(created_by);
create index if not exists appraisal_objectives_user_idx on public.appraisal_objectives(user_id);
create index if not exists course_standard_links_created_by_idx on public.course_standard_links(created_by);
create index if not exists course_standard_links_standard_idx on public.course_standard_links(standard_code);
create index if not exists cpd_budgets_created_by_idx on public.cpd_budgets(created_by);
create index if not exists cpd_expenses_created_by_idx on public.cpd_expenses(created_by);
create index if not exists inset_days_created_by_idx on public.inset_days(created_by);
create index if not exists inset_days_site_idx on public.inset_days(site_id);
create index if not exists inset_sessions_live_session_idx on public.inset_sessions(live_session_id);
create index if not exists onboarding_assignments_assigned_by_idx on public.onboarding_assignments(assigned_by);
create index if not exists onboarding_programmes_created_by_idx on public.onboarding_programmes(created_by);
create index if not exists school_policies_created_by_idx on public.school_policies(created_by);
create index if not exists school_resource_library_created_by_idx on public.school_resource_library(created_by);

drop policy if exists "org admins manage policies" on public.school_policies;
create policy "org admins insert policies" on public.school_policies for insert to authenticated with check (private.is_org_admin(organisation_id));
create policy "org admins update policies" on public.school_policies for update to authenticated using (private.is_org_admin(organisation_id)) with check (private.is_org_admin(organisation_id));
create policy "org admins delete policies" on public.school_policies for delete to authenticated using (private.is_org_admin(organisation_id));

drop policy if exists "org admins manage course standards" on public.course_standard_links;
create policy "org admins insert course standards" on public.course_standard_links for insert to authenticated with check (private.is_org_admin(organisation_id));
create policy "org admins delete course standards" on public.course_standard_links for delete to authenticated using (private.is_org_admin(organisation_id));

drop policy if exists "org admins manage inset days" on public.inset_days;
create policy "org admins insert inset days" on public.inset_days for insert to authenticated with check (private.is_org_admin(organisation_id));
create policy "org admins update inset days" on public.inset_days for update to authenticated using (private.is_org_admin(organisation_id)) with check (private.is_org_admin(organisation_id));
create policy "org admins delete inset days" on public.inset_days for delete to authenticated using (private.is_org_admin(organisation_id));

drop policy if exists "org admins manage inset sessions" on public.inset_sessions;
create policy "org admins insert inset sessions" on public.inset_sessions for insert to authenticated with check (exists(select 1 from public.inset_days d where d.id=inset_day_id and private.is_org_admin(d.organisation_id)));
create policy "org admins update inset sessions" on public.inset_sessions for update to authenticated using (exists(select 1 from public.inset_days d where d.id=inset_day_id and private.is_org_admin(d.organisation_id))) with check (exists(select 1 from public.inset_days d where d.id=inset_day_id and private.is_org_admin(d.organisation_id)));
create policy "org admins delete inset sessions" on public.inset_sessions for delete to authenticated using (exists(select 1 from public.inset_days d where d.id=inset_day_id and private.is_org_admin(d.organisation_id)));

drop policy if exists "org admins manage onboarding programmes" on public.onboarding_programmes;
create policy "org admins insert onboarding programmes" on public.onboarding_programmes for insert to authenticated with check (private.is_org_admin(organisation_id));
create policy "org admins update onboarding programmes" on public.onboarding_programmes for update to authenticated using (private.is_org_admin(organisation_id)) with check (private.is_org_admin(organisation_id));
create policy "org admins delete onboarding programmes" on public.onboarding_programmes for delete to authenticated using (private.is_org_admin(organisation_id));

drop policy if exists "org admins manage resources" on public.school_resource_library;
create policy "org admins insert resources" on public.school_resource_library for insert to authenticated with check (private.is_org_admin(organisation_id));
create policy "org admins update resources" on public.school_resource_library for update to authenticated using (private.is_org_admin(organisation_id)) with check (private.is_org_admin(organisation_id));
create policy "org admins delete resources" on public.school_resource_library for delete to authenticated using (private.is_org_admin(organisation_id));
