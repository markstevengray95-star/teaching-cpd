drop policy if exists "org admins insert directory rows" on public.organisation_staff_directory;
drop policy if exists "org admins update directory rows" on public.organisation_staff_directory;
drop policy if exists "org admins delete directory rows" on public.organisation_staff_directory;

create policy "school admins insert directory rows" on public.organisation_staff_directory
for insert to authenticated
with check (
  private.is_school_admin(organisation_id)
  and created_by=(select auth.uid())
  and exists(
    select 1 from public.organisation_domains d
    where d.organisation_id=organisation_staff_directory.organisation_id
      and d.domain=split_part(organisation_staff_directory.email,'@',2)
      and d.status in ('pending','verified')
  )
);

create policy "school admins update directory rows" on public.organisation_staff_directory
for update to authenticated
using (private.is_school_admin(organisation_id))
with check (
  private.is_school_admin(organisation_id)
  and exists(
    select 1 from public.organisation_domains d
    where d.organisation_id=organisation_staff_directory.organisation_id
      and d.domain=split_part(organisation_staff_directory.email,'@',2)
      and d.status in ('pending','verified')
  )
);

create policy "school admins delete directory rows" on public.organisation_staff_directory
for delete to authenticated
using (private.is_school_admin(organisation_id));
