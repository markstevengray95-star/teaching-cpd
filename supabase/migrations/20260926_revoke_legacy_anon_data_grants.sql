-- Harden the original Phase 2 tables: live CPD requires authentication and no direct anon table access.
revoke all on public.course_progress,
  public.live_sessions,
  public.live_activities,
  public.live_participants,
  public.live_responses
from anon;
