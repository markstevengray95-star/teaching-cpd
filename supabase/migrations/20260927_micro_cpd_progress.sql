create table if not exists public.micro_cpd_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organisation_id uuid references public.organisations(id) on delete set null default private.current_org_id(),
  unit_id text not null,
  reflection text not null default '',
  completed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, unit_id)
);

create index if not exists micro_cpd_progress_user_idx on public.micro_cpd_progress(user_id);
create index if not exists micro_cpd_progress_org_idx on public.micro_cpd_progress(organisation_id);

alter table public.micro_cpd_progress enable row level security;
revoke all on table public.micro_cpd_progress from anon;
grant select,insert,update,delete on table public.micro_cpd_progress to authenticated;

create policy "staff read own micro cpd" on public.micro_cpd_progress for select to authenticated using (user_id=(select auth.uid()));
create policy "staff insert own micro cpd" on public.micro_cpd_progress for insert to authenticated with check (user_id=(select auth.uid()) and (organisation_id is null or organisation_id=private.current_org_id()));
create policy "staff update own micro cpd" on public.micro_cpd_progress for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy "staff delete own micro cpd" on public.micro_cpd_progress for delete to authenticated using (user_id=(select auth.uid()));
