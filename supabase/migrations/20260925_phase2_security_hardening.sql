-- Phase 2 security hardening. Apply after 20260925_phase2_live_cpd.sql.

-- Staff may edit their own name/department, but never their authorization role.
revoke insert, update, delete on public.staff_profiles from authenticated;
grant select on public.staff_profiles to authenticated;
grant update(full_name, department) on public.staff_profiles to authenticated;

-- Only leadership roles can create live CPD sessions.
drop policy if exists "sessions_insert_owned" on public.live_sessions;
create policy "sessions_insert_leader_owned" on public.live_sessions for insert to authenticated
with check (
  presenter_id = (select auth.uid())
  and exists (
    select 1 from public.staff_profiles p
    where p.id = (select auth.uid())
      and p.role in ('Department Lead','CPD Lead','Admin')
  )
);

-- Prevent ownership/identity columns being changed after rows are created.
create or replace function private.prevent_live_session_identity_change()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.id <> old.id or new.presenter_id <> old.presenter_id or new.join_code <> old.join_code or new.exit_code <> old.exit_code then
    raise exception 'Session identity fields cannot be changed';
  end if;
  return new;
end;
$$;

create or replace function private.prevent_participant_identity_change()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.session_id <> old.session_id or new.user_id <> old.user_id then
    raise exception 'Participant identity fields cannot be changed';
  end if;
  return new;
end;
$$;

create or replace function private.prevent_response_identity_change()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.id <> old.id or new.session_id <> old.session_id or new.activity_id <> old.activity_id or new.user_id <> old.user_id then
    raise exception 'Response identity fields cannot be changed';
  end if;
  return new;
end;
$$;

revoke all on function private.prevent_live_session_identity_change() from public;
revoke all on function private.prevent_participant_identity_change() from public;
revoke all on function private.prevent_response_identity_change() from public;

drop trigger if exists live_sessions_identity_guard on public.live_sessions;
create trigger live_sessions_identity_guard before update on public.live_sessions
for each row execute function private.prevent_live_session_identity_change();

drop trigger if exists live_participants_identity_guard on public.live_participants;
create trigger live_participants_identity_guard before update on public.live_participants
for each row execute function private.prevent_participant_identity_change();

drop trigger if exists live_responses_identity_guard on public.live_responses;
create trigger live_responses_identity_guard before update on public.live_responses
for each row execute function private.prevent_response_identity_change();

-- Responses must belong to the signed-in participant and the selected activity/session.
drop policy if exists "responses_insert_self" on public.live_responses;
create policy "responses_insert_participant" on public.live_responses for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.live_participants p
    where p.session_id = session_id and p.user_id = (select auth.uid())
  )
  and exists (
    select 1 from public.live_activities a
    join public.live_sessions s on s.id = a.session_id
    where a.id = activity_id and a.session_id = session_id and s.status = 'live'
  )
);

drop policy if exists "responses_update_self" on public.live_responses;
create policy "responses_update_participant" on public.live_responses for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.live_participants p
    where p.session_id = session_id and p.user_id = (select auth.uid())
  )
);
