create table if not exists public.needs_audits (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  responses jsonb not null default '{}'::jsonb, domain_scores jsonb not null default '{}'::jsonb,
  priority_domains text[] not null default '{}', recommended_courses text[] not null default '{}',
  recommended_pathways text[] not null default '{}', summary text not null default '',
  submitted_at timestamptz not null default now(), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists needs_audits_user_submitted_idx on public.needs_audits(user_id, submitted_at desc);
create table if not exists public.development_targets (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, description text not null default '', success_criteria text not null default '',
  linked_course_id text, linked_pathway_id text, review_date date,
  status text not null default 'active' check (status in ('active','review_due','completed','paused')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists development_targets_user_status_idx on public.development_targets(user_id, status);
create index if not exists development_targets_review_idx on public.development_targets(user_id, review_date);
create table if not exists public.coaching_cycles (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, focus text not null default '', coach_name text not null default '', start_date date not null default current_date,
  review_date date, status text not null default 'active' check (status in ('active','completed','paused')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists coaching_cycles_user_status_idx on public.coaching_cycles(user_id, status);
create table if not exists public.coaching_checkins (
  id uuid primary key default gen_random_uuid(), cycle_id uuid not null references public.coaching_cycles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, checkin_date date not null default current_date,
  evidence text not null default '', reflection text not null default '', next_step text not null default '',
  confidence integer check (confidence between 1 and 5), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists coaching_checkins_cycle_date_idx on public.coaching_checkins(cycle_id, checkin_date desc);
create index if not exists coaching_checkins_user_idx on public.coaching_checkins(user_id);
create table if not exists public.smart_coach_plans (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Personal CPD plan', summary text not null default '', recommendations jsonb not null default '[]'::jsonb,
  source_snapshot jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create index if not exists smart_coach_plans_user_created_idx on public.smart_coach_plans(user_id, created_at desc);
alter table public.needs_audits enable row level security; alter table public.development_targets enable row level security;
alter table public.coaching_cycles enable row level security; alter table public.coaching_checkins enable row level security; alter table public.smart_coach_plans enable row level security;
revoke all on public.needs_audits, public.development_targets, public.coaching_cycles, public.coaching_checkins, public.smart_coach_plans from anon;
revoke all on public.needs_audits, public.development_targets, public.coaching_cycles, public.coaching_checkins, public.smart_coach_plans from authenticated;
grant select, insert, update, delete on public.needs_audits, public.development_targets, public.coaching_cycles, public.coaching_checkins, public.smart_coach_plans to authenticated;
create policy needs_audits_select_own on public.needs_audits for select to authenticated using ((select auth.uid()) = user_id);
create policy needs_audits_insert_own on public.needs_audits for insert to authenticated with check ((select auth.uid()) = user_id);
create policy needs_audits_update_own on public.needs_audits for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy needs_audits_delete_own on public.needs_audits for delete to authenticated using ((select auth.uid()) = user_id);
create policy development_targets_select_own on public.development_targets for select to authenticated using ((select auth.uid()) = user_id);
create policy development_targets_insert_own on public.development_targets for insert to authenticated with check ((select auth.uid()) = user_id);
create policy development_targets_update_own on public.development_targets for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy development_targets_delete_own on public.development_targets for delete to authenticated using ((select auth.uid()) = user_id);
create policy coaching_cycles_select_own on public.coaching_cycles for select to authenticated using ((select auth.uid()) = user_id);
create policy coaching_cycles_insert_own on public.coaching_cycles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy coaching_cycles_update_own on public.coaching_cycles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy coaching_cycles_delete_own on public.coaching_cycles for delete to authenticated using ((select auth.uid()) = user_id);
create policy coaching_checkins_select_own on public.coaching_checkins for select to authenticated using ((select auth.uid()) = user_id);
create policy coaching_checkins_insert_own on public.coaching_checkins for insert to authenticated with check ((select auth.uid()) = user_id and exists (select 1 from public.coaching_cycles c where c.id = cycle_id and c.user_id = (select auth.uid())));
create policy coaching_checkins_update_own on public.coaching_checkins for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id and exists (select 1 from public.coaching_cycles c where c.id = cycle_id and c.user_id = (select auth.uid())));
create policy coaching_checkins_delete_own on public.coaching_checkins for delete to authenticated using ((select auth.uid()) = user_id);
create policy smart_coach_plans_select_own on public.smart_coach_plans for select to authenticated using ((select auth.uid()) = user_id);
create policy smart_coach_plans_insert_own on public.smart_coach_plans for insert to authenticated with check ((select auth.uid()) = user_id);
create policy smart_coach_plans_update_own on public.smart_coach_plans for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy smart_coach_plans_delete_own on public.smart_coach_plans for delete to authenticated using ((select auth.uid()) = user_id);
