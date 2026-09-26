alter table public.portfolio_entries
  add column if not exists evidence_path text;
