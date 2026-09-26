create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.check_in_live_session_impl(p_code text, p_display_name text default '')
returns table(session_id uuid, title text, presenter_name text, location text, description text, objectives text[], starts_at timestamptz, status text)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_uid uuid := auth.uid();
  v_session public.live_sessions%rowtype;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  select * into v_session
  from public.live_sessions s
  where s.join_code = upper(trim(p_code))
    and s.status = 'live'
    and (s.join_code_expires_at is null or s.join_code_expires_at > now())
  limit 1;
  if v_session.id is null then raise exception 'This join code is invalid or has expired'; end if;

  insert into public.live_participants(session_id,user_id,display_name,checked_in_at,status,updated_at)
  values(v_session.id,v_uid,left(coalesce(p_display_name,''),120),now(),'checked_in',now())
  on conflict(session_id,user_id) do update
    set display_name = case when excluded.display_name <> '' then excluded.display_name else public.live_participants.display_name end,
        updated_at = now();

  return query select v_session.id,v_session.title,v_session.presenter_name,v_session.location,v_session.description,v_session.objectives,v_session.starts_at,v_session.status;
end;
$$;

create or replace function private.complete_live_session_exit_impl(p_code text, p_reflection text default '')
returns boolean
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_uid uuid := auth.uid();
  v_session_id uuid;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  select s.id into v_session_id
  from public.live_sessions s
  where s.exit_code = upper(trim(p_code))
    and s.status in ('live','closed')
    and (s.exit_code_expires_at is null or s.exit_code_expires_at > now())
  limit 1;
  if v_session_id is null then raise exception 'This exit code is invalid or has expired'; end if;

  update public.live_participants p
  set checked_out_at=now(), final_reflection=left(coalesce(p_reflection,''),5000), status='completed', updated_at=now()
  where p.session_id=v_session_id and p.user_id=v_uid;
  if not found then raise exception 'You are not checked into this session'; end if;
  return true;
end;
$$;

revoke all on function private.check_in_live_session_impl(text,text) from public, anon;
revoke all on function private.complete_live_session_exit_impl(text,text) from public, anon;
grant execute on function private.check_in_live_session_impl(text,text) to authenticated;
grant execute on function private.complete_live_session_exit_impl(text,text) to authenticated;

create or replace function public.check_in_live_session(p_code text, p_display_name text default '')
returns table(session_id uuid, title text, presenter_name text, location text, description text, objectives text[], starts_at timestamptz, status text)
language sql
security invoker
set search_path = public, private
as $$ select * from private.check_in_live_session_impl(p_code,p_display_name); $$;

create or replace function public.complete_live_session_exit(p_code text, p_reflection text default '')
returns boolean
language sql
security invoker
set search_path = public, private
as $$ select private.complete_live_session_exit_impl(p_code,p_reflection); $$;

revoke all on function public.check_in_live_session(text,text) from public, anon;
revoke all on function public.complete_live_session_exit(text,text) from public, anon;
grant execute on function public.check_in_live_session(text,text) to authenticated;
grant execute on function public.complete_live_session_exit(text,text) to authenticated;
