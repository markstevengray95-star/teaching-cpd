-- Phases 40-41: upgrade the professional portfolio and coaching cycle.
-- Existing records are preserved. RLS remains owner-scoped on these personal development tables.

alter table public.portfolio_entries
  add column if not exists impact_summary text not null default '',
  add column if not exists next_step text not null default '',
  add column if not exists standards text[] not null default '{}',
  add column if not exists related_target_id uuid references public.development_targets(id) on delete set null,
  add column if not exists related_coaching_cycle_id uuid references public.coaching_cycles(id) on delete set null;

create index if not exists portfolio_entries_target_idx
  on public.portfolio_entries(user_id, related_target_id)
  where related_target_id is not null;

create index if not exists portfolio_entries_coaching_idx
  on public.portfolio_entries(user_id, related_coaching_cycle_id)
  where related_coaching_cycle_id is not null;

alter table public.coaching_cycles
  add column if not exists cycle_type text not null default 'coaching',
  add column if not exists success_criteria text not null default '',
  add column if not exists linked_target_id uuid references public.development_targets(id) on delete set null,
  add column if not exists linked_course_id text,
  add column if not exists linked_pathway_id text,
  add column if not exists completion_summary text not null default '';

create index if not exists coaching_cycles_target_idx
  on public.coaching_cycles(user_id, linked_target_id)
  where linked_target_id is not null;

alter table public.coaching_checkins
  add column if not exists agenda text not null default '',
  add column if not exists wins text not null default '',
  add column if not exists barriers text not null default '',
  add column if not exists action_commitment text not null default '',
  add column if not exists progress smallint check (progress is null or (progress between 1 and 5));
