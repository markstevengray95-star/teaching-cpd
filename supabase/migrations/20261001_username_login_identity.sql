-- Unique, normalized usernames used as an optional sign-in alias.
-- Password verification remains in Supabase Auth; usernames never store passwords.

update public.staff_development_profiles
set username = lower(btrim(username)), updated_at = now()
where username is not null
  and btrim(username) <> ''
  and username <> lower(btrim(username));

create unique index if not exists staff_development_profiles_username_lower_unique
  on public.staff_development_profiles (lower(username))
  where username is not null and btrim(username) <> '';

alter table public.staff_development_profiles
  drop constraint if exists staff_development_profiles_username_format_check;

alter table public.staff_development_profiles
  add constraint staff_development_profiles_username_format_check
  check (
    username is null
    or (
      username = lower(btrim(username))
      and username ~ '^[a-z0-9][a-z0-9._-]{2,31}$'
    )
  );
