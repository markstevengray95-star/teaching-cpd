-- Prevent ordinary authenticated users from promoting their own legacy
-- Staff Development profile role while preserving service-role/platform-owner writes.

create or replace function private.protect_staff_development_platform_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_privileged boolean := false;
begin
  v_privileged := current_user in ('postgres', 'service_role')
    or exists (
      select 1
      from public.platform_admins pa
      where pa.user_id = (select auth.uid())
    );

  if tg_op = 'INSERT' then
    if coalesce(new.platform_role, 'user') <> 'user' and not v_privileged then
      raise exception 'Platform role cannot be assigned by this account';
    end if;
  elsif new.platform_role is distinct from old.platform_role and not v_privileged then
    raise exception 'Platform role cannot be changed by this account';
  end if;

  return new;
end;
$$;

revoke all on function private.protect_staff_development_platform_role() from public;

drop trigger if exists staff_development_profiles_protect_platform_role on public.staff_development_profiles;
create trigger staff_development_profiles_protect_platform_role
before insert or update on public.staff_development_profiles
for each row execute function private.protect_staff_development_platform_role();
