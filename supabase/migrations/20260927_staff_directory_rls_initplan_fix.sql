drop policy if exists "staff read own directory row" on public.organisation_staff_directory;
create policy "staff read own directory row" on public.organisation_staff_directory
for select to authenticated
using (
  organisation_id = private.current_org_id()
  and (
    email = (select lower(u.email::text) from auth.users u where u.id = (select auth.uid()))
    or private.is_org_admin(organisation_id)
  )
);
