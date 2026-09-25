create index if not exists live_participants_user_idx on public.live_participants(user_id);
create index if not exists live_responses_session_idx on public.live_responses(session_id);
create index if not exists live_responses_user_idx on public.live_responses(user_id);
