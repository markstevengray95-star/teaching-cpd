-- Allow staff who participated in a session to review it after the session closes.

drop policy if exists sessions_select_live_or_owned on public.live_sessions;
create policy sessions_select_live_owned_or_participant on public.live_sessions for select to authenticated
using (
  status = 'live'
  or presenter_id = (select auth.uid())
  or exists (
    select 1 from public.live_participants p
    where p.session_id = live_sessions.id
      and p.user_id = (select auth.uid())
  )
);

drop policy if exists activities_select_live_or_owned on public.live_activities;
create policy activities_select_live_owned_or_participant on public.live_activities for select to authenticated
using (
  exists (
    select 1 from public.live_sessions s
    where s.id = live_activities.session_id
      and (
        s.status = 'live'
        or s.presenter_id = (select auth.uid())
        or exists (
          select 1 from public.live_participants p
          where p.session_id = s.id
            and p.user_id = (select auth.uid())
        )
      )
  )
);
