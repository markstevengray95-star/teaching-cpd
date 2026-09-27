create policy "platform admins read initial school admins" on public.organisation_initial_admins
for select to authenticated
using (exists (select 1 from public.platform_admins pa where pa.user_id = (select auth.uid())));
