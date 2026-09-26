alter table public.live_sessions
  add column if not exists join_code_expires_at timestamptz,
  add column if not exists exit_code_expires_at timestamptz,
  add column if not exists join_code_rotated_at timestamptz,
  add column if not exists exit_code_rotated_at timestamptz;

alter table public.live_activities
  add column if not exists response_mode text not null default 'named' check (response_mode in ('named','anonymous')),
  add column if not exists confidence_phase text not null default 'none' check (confidence_phase in ('none','pre','post'));

drop policy if exists sessions_select_live_owned_or_participant on public.live_sessions;
create policy sessions_select_owned_or_participant on public.live_sessions
for select to authenticated
using (
  presenter_id = (select auth.uid())
  or exists (
    select 1 from public.live_participants p
    where p.session_id = live_sessions.id and p.user_id = (select auth.uid())
  )
);

revoke insert on table public.live_participants from authenticated;

create or replace function public.check_in_live_session(p_code text, p_display_name text default '')
returns table(session_id uuid, title text, presenter_name text, location text, description text, objectives text[], starts_at timestamptz, status text)
language plpgsql
security definer
set search_path = public
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

create or replace function public.complete_live_session_exit(p_code text, p_reflection text default '')
returns boolean
language plpgsql
security definer
set search_path = public
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

revoke all on function public.check_in_live_session(text,text) from public;
grant execute on function public.check_in_live_session(text,text) to authenticated;
revoke all on function public.complete_live_session_exit(text,text) from public;
grant execute on function public.complete_live_session_exit(text,text) to authenticated;

create table if not exists public.external_cpd_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  provider text not null default '',
  occurred_on date not null default current_date,
  cpd_hours numeric(6,2) not null default 0 check (cpd_hours >= 0 and cpd_hours <= 999.99),
  category text not null default 'External CPD',
  notes text not null default '',
  evidence_path text,
  source text not null default 'manual' check (source in ('manual','csv_import')),
  verification_status text not null default 'self_recorded' check (verification_status in ('self_recorded','verified')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.external_cpd_records enable row level security;
create index if not exists external_cpd_records_user_date_idx on public.external_cpd_records(user_id,occurred_on desc);
create policy external_cpd_records_select_own on public.external_cpd_records for select to authenticated using ((select auth.uid())=user_id);
create policy external_cpd_records_insert_own on public.external_cpd_records for insert to authenticated with check ((select auth.uid())=user_id);
create policy external_cpd_records_update_own on public.external_cpd_records for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy external_cpd_records_delete_own on public.external_cpd_records for delete to authenticated using ((select auth.uid())=user_id);
grant select,insert,update,delete on public.external_cpd_records to authenticated;
revoke all on public.external_cpd_records from anon;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('cpd-evidence','cpd-evidence',false,10485760,array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=10485760,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists cpd_evidence_select_own on storage.objects;
drop policy if exists cpd_evidence_insert_own on storage.objects;
drop policy if exists cpd_evidence_update_own on storage.objects;
drop policy if exists cpd_evidence_delete_own on storage.objects;
create policy cpd_evidence_select_own on storage.objects for select to authenticated using (bucket_id='cpd-evidence' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy cpd_evidence_insert_own on storage.objects for insert to authenticated with check (bucket_id='cpd-evidence' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy cpd_evidence_update_own on storage.objects for update to authenticated using (bucket_id='cpd-evidence' and (storage.foldername(name))[1]=(select auth.uid())::text) with check (bucket_id='cpd-evidence' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy cpd_evidence_delete_own on storage.objects for delete to authenticated using (bucket_id='cpd-evidence' and (storage.foldername(name))[1]=(select auth.uid())::text);
