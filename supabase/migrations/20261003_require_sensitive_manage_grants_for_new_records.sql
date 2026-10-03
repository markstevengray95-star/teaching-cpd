drop policy if exists sd_interventions_insert on public.staff_development_interventions;
create policy sd_interventions_insert
on public.staff_development_interventions for insert to authenticated
with check (
  created_by = (select auth.uid())
  and organization_id is not null
  and private.staff_development_has_area_access(organization_id, 'interventions', true)
);

drop policy if exists sd_checkins_insert on public.staff_development_checkins;
create policy sd_checkins_insert
on public.staff_development_checkins for insert to authenticated
with check (
  created_by = (select auth.uid())
  and organization_id is not null
  and private.staff_development_has_area_access(organization_id, 'pastoral', true)
);
