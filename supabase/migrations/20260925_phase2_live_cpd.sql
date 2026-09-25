create extension if not exists pgcrypto;
create schema if not exists private;

create table if not exists public.staff_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'Staff' check (role in ('Staff','Department Lead','CPD Lead','Admin')),
  department text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null,
  completed_modules text[] not null default '{}',
  reflections jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

create table if not exists public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  join_code text not null unique,
  exit_code text not null unique,
  title text not null,
  presenter_id uuid not null references auth.users(id) on delete cascade,
  presenter_name text not null default '',
  location text not null default '',
  description text not null default '',
  objectives text[] not null default '{}',
  starts_at timestamptz not null,
  ends_at timestamptz,
  status text not null default 'draft' check (status in ('draft','live','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists live_sessions_join_code_idx on public.live_sessions(join_code);
create index if not exists live_sessions_presenter_idx on public.live_sessions(presenter_id, starts_at desc);

create table if not exists public.live_activities (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  sort_order integer not null default 0,
  activity_type text not null check (activity_type in ('poll','multiple_choice','rating','short_answer','scenario','reflection','exit_ticket')),
  title text not null,
  prompt text not null,
  options jsonb not null default '[]'::jsonb,
  required boolean not null default true,
  is_open boolean not null default false,
  created_at timestamptz not null default now(),
  unique(session_id, sort_order)
);

create table if not exists public.live_participants (
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null default '',
  checked_in_at timestamptz not null default now(),
  checked_out_at timestamptz,
  status text not null default 'checked_in' check (status in ('checked_in','participated','activities_complete','reflection_complete','completed')),
  final_reflection text,
  updated_at timestamptz not null default now(),
  primary key(session_id, user_id)
);

create table if not exists public.live_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  activity_id uuid not null references public.live_activities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  response jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(activity_id, user_id)
);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.staff_profiles (id, full_name, role, department)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'Staff',
    coalesce(new.raw_user_meta_data ->> 'department', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public;
revoke all on function private.set_updated_at() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

drop trigger if exists staff_profiles_updated_at on public.staff_profiles;
create trigger staff_profiles_updated_at before update on public.staff_profiles
for each row execute function private.set_updated_at();

drop trigger if exists course_progress_updated_at on public.course_progress;
create trigger course_progress_updated_at before update on public.course_progress
for each row execute function private.set_updated_at();

drop trigger if exists live_sessions_updated_at on public.live_sessions;
create trigger live_sessions_updated_at before update on public.live_sessions
for each row execute function private.set_updated_at();

drop trigger if exists live_participants_updated_at on public.live_participants;
create trigger live_participants_updated_at before update on public.live_participants
for each row execute function private.set_updated_at();

drop trigger if exists live_responses_updated_at on public.live_responses;
create trigger live_responses_updated_at before update on public.live_responses
for each row execute function private.set_updated_at();

alter table public.staff_profiles enable row level security;
alter table public.course_progress enable row level security;
alter table public.live_sessions enable row level security;
alter table public.live_activities enable row level security;
alter table public.live_participants enable row level security;
alter table public.live_responses enable row level security;

create policy "profiles_select_own" on public.staff_profiles for select to authenticated
using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.staff_profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "progress_select_own" on public.course_progress for select to authenticated
using ((select auth.uid()) = user_id);
create policy "progress_insert_own" on public.course_progress for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "progress_update_own" on public.course_progress for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "progress_delete_own" on public.course_progress for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "sessions_select_live_or_owned" on public.live_sessions for select to authenticated
using (status = 'live' or presenter_id = (select auth.uid()));
create policy "sessions_insert_owned" on public.live_sessions for insert to authenticated
with check (presenter_id = (select auth.uid()));
create policy "sessions_update_owned" on public.live_sessions for update to authenticated
using (presenter_id = (select auth.uid()))
with check (presenter_id = (select auth.uid()));
create policy "sessions_delete_owned" on public.live_sessions for delete to authenticated
using (presenter_id = (select auth.uid()));

create policy "activities_select_live_or_owned" on public.live_activities for select to authenticated
using (exists (
  select 1 from public.live_sessions s
  where s.id = session_id and (s.status = 'live' or s.presenter_id = (select auth.uid()))
));
create policy "activities_insert_owned_session" on public.live_activities for insert to authenticated
with check (exists (
  select 1 from public.live_sessions s where s.id = session_id and s.presenter_id = (select auth.uid())
));
create policy "activities_update_owned_session" on public.live_activities for update to authenticated
using (exists (
  select 1 from public.live_sessions s where s.id = session_id and s.presenter_id = (select auth.uid())
))
with check (exists (
  select 1 from public.live_sessions s where s.id = session_id and s.presenter_id = (select auth.uid())
));
create policy "activities_delete_owned_session" on public.live_activities for delete to authenticated
using (exists (
  select 1 from public.live_sessions s where s.id = session_id and s.presenter_id = (select auth.uid())
));

create policy "participants_select_self_or_presenter" on public.live_participants for select to authenticated
using (
  user_id = (select auth.uid()) or exists (
    select 1 from public.live_sessions s where s.id = session_id and s.presenter_id = (select auth.uid())
  )
);
create policy "participants_insert_self_live" on public.live_participants for insert to authenticated
with check (
  user_id = (select auth.uid()) and exists (
    select 1 from public.live_sessions s where s.id = session_id and s.status = 'live'
  )
);
create policy "participants_update_self_or_presenter" on public.live_participants for update to authenticated
using (
  user_id = (select auth.uid()) or exists (
    select 1 from public.live_sessions s where s.id = session_id and s.presenter_id = (select auth.uid())
  )
)
with check (
  user_id = (select auth.uid()) or exists (
    select 1 from public.live_sessions s where s.id = session_id and s.presenter_id = (select auth.uid())
  )
);

create policy "responses_select_self_or_presenter" on public.live_responses for select to authenticated
using (
  user_id = (select auth.uid()) or exists (
    select 1 from public.live_sessions s where s.id = session_id and s.presenter_id = (select auth.uid())
  )
);
create policy "responses_insert_self" on public.live_responses for insert to authenticated
with check (user_id = (select auth.uid()));
create policy "responses_update_self" on public.live_responses for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

alter publication supabase_realtime add table public.live_sessions;
alter publication supabase_realtime add table public.live_activities;
alter publication supabase_realtime add table public.live_participants;
alter publication supabase_realtime add table public.live_responses;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.staff_profiles to authenticated;
grant select, insert, update, delete on public.course_progress to authenticated;
grant select, insert, update, delete on public.live_sessions to authenticated;
grant select, insert, update, delete on public.live_activities to authenticated;
grant select, insert, update, delete on public.live_participants to authenticated;
grant select, insert, update, delete on public.live_responses to authenticated;
