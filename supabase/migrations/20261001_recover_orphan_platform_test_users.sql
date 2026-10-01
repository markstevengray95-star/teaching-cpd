-- Recover test-only Auth users left behind by an interrupted provisioning run.
-- This helper is callable only by service_role and only returns users already
-- marked as platform_test_user in immutable app metadata.

create or replace function public.lookup_platform_test_user_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path=''
as $$
  select u.id
  from auth.users u
  where lower(u.email)=lower(trim(p_email))
    and coalesce(u.raw_app_meta_data->>'platform_test_user','false')='true'
  limit 1;
$$;

revoke all on function public.lookup_platform_test_user_by_email(text) from public, anon, authenticated;
grant execute on function public.lookup_platform_test_user_by_email(text) to service_role;
