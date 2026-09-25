create table if not exists public.pathway_enrolments (
  user_id uuid not null references auth.users(id) on delete cascade,
  pathway_id text not null,
  selected_courses text[] not null default '{}',
  status text not null default 'active' check (status in ('active','completed','paused')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, pathway_id)
);

create table if not exists public.portfolio_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  evidence_type text not null default 'reflection' check (evidence_type in ('reflection','course','live_cpd','external_cpd','classroom_evidence','coaching','other')),
  course_id text,
  external_link text,
  cpd_hours numeric(6,2) not null default 0 check (cpd_hours >= 0 and cpd_hours <= 999.99),
  occurred_on date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.action_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  action text not null,
  context text not null default '',
  intended_outcome text not null default '',
  evidence_plan text not null default '',
  course_id text,
  session_id uuid references public.live_sessions(id) on delete set null,
  start_date date not null default current_date,
  review_date date,
  status text not null default 'planned' check (status in ('planned','in_progress','review_due','completed','abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.action_followups (
  id uuid primary key default gen_random_uuid(),
  action_plan_id uuid not null references public.action_plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  outcome text not null,
  evidence_summary text not null default '',
  impact_rating integer check (impact_rating between 1 and 5),
  next_action text not null default '',
  reviewed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists portfolio_entries_user_date_idx on public.portfolio_entries(user_id, occurred_on desc);
create index if not exists action_plans_user_review_idx on public.action_plans(user_id, review_date);
create index if not exists action_plans_session_idx on public.action_plans(session_id);
create index if not exists action_followups_user_idx on public.action_followups(user_id, reviewed_at desc);
create index if not exists action_followups_plan_idx on public.action_followups(action_plan_id);

alter table public.pathway_enrolments enable row level security;
alter table public.portfolio_entries enable row level security;
alter table public.action_plans enable row level security;
alter table public.action_followups enable row level security;

revoke all on public.pathway_enrolments from anon, authenticated;
revoke all on public.portfolio_entries from anon, authenticated;
revoke all on public.action_plans from anon, authenticated;
revoke all on public.action_followups from anon, authenticated;

grant select, insert, update, delete on public.pathway_enrolments to authenticated;
grant select, insert, update, delete on public.portfolio_entries to authenticated;
grant select, insert, update, delete on public.action_plans to authenticated;
grant select, insert, update, delete on public.action_followups to authenticated;

create policy "pathways_select_own" on public.pathway_enrolments for select to authenticated
using ((select auth.uid()) = user_id);
create policy "pathways_insert_own" on public.pathway_enrolments for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "pathways_update_own" on public.pathway_enrolments for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "pathways_delete_own" on public.pathway_enrolments for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "portfolio_select_own" on public.portfolio_entries for select to authenticated
using ((select auth.uid()) = user_id);
create policy "portfolio_insert_own" on public.portfolio_entries for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "portfolio_update_own" on public.portfolio_entries for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "portfolio_delete_own" on public.portfolio_entries for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "actions_select_own" on public.action_plans for select to authenticated
using ((select auth.uid()) = user_id);
create policy "actions_insert_own" on public.action_plans for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "actions_update_own" on public.action_plans for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "actions_delete_own" on public.action_plans for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "followups_select_own" on public.action_followups for select to authenticated
using ((select auth.uid()) = user_id);
create policy "followups_insert_own" on public.action_followups for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.action_plans p
    where p.id = action_plan_id and p.user_id = (select auth.uid())
  )
);
create policy "followups_update_own" on public.action_followups for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.action_plans p
    where p.id = action_plan_id and p.user_id = (select auth.uid())
  )
);
create policy "followups_delete_own" on public.action_followups for delete to authenticated
using ((select auth.uid()) = user_id);

drop trigger if exists pathway_enrolments_updated_at on public.pathway_enrolments;
create trigger pathway_enrolments_updated_at before update on public.pathway_enrolments
for each row execute function private.set_updated_at();

drop trigger if exists portfolio_entries_updated_at on public.portfolio_entries;
create trigger portfolio_entries_updated_at before update on public.portfolio_entries
for each row execute function private.set_updated_at();

drop trigger if exists action_plans_updated_at on public.action_plans;
create trigger action_plans_updated_at before update on public.action_plans
for each row execute function private.set_updated_at();
